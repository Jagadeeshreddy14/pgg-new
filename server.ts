import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  memoryLocalCache,
  collection,
  getDocs,
  getDoc,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import firebaseConfig from "./firebase-applet-config.json";

dotenv.config();

// ==========================================
// EMAIL SERVICE CONFIGURATION (Nodemailer)
// ==========================================
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log(`[Email] Skipping email to ${to} (SMTP credentials not configured)`);
      return false;
    }
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || `"Admin" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    return false;
  }
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  localCache: memoryLocalCache()
}, firebaseConfig.firestoreDatabaseId);

// Initialize Gemini
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const JWT_SECRET = process.env.JWT_SECRET || "srinivasa_jwt_secret_token_key_2026";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "srinivasa_refresh_token_key_2026_refresh";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================================
// SEEDING DATABASE ON STARTUP
// ==========================================
async function seedDatabase() {
  try {
    const settingsRef = collection(db, "settings");
    const settingsSnap = await getDocs(settingsRef);
    
    if (settingsSnap.empty) {
      console.log("Seeding initial database content...");
      
      // 1. Hostel Settings
      const defaultSettings = {
        hostelName: "Sri Srinivasa Boys Hostel",
        logoUrl: "",
        address: "Plot 42, Hitech City Phase 2, Near Mindspace, Hyderabad, Telangana, 500081",
        contactPhone: "+91 98765 43210",
        contactEmail: "srisrinivasahostel@gmail.com",
        rules: [
          "Gate closure time is strictly 10:00 PM. No entry allowed after 10:30 PM without prior permission.",
          "Maintain absolute silence in rooms and corridors after 10:30 PM.",
          "Outside guests or visitors are strictly prohibited from staying overnight in student rooms.",
          "Any damage to hostel property will be heavily fined and charged to the responsible students.",
          "Substance abuse, smoking, and alcohol consumption are strictly banned within the hostel premises.",
          "Rent must be paid before the 5th of every month to avoid a late fine of ₹100 per day.",
          "Water and electricity should be conserved; please switch off fans, ACs, and lights when leaving rooms.",
          "Washing clothes inside bathrooms is restricted. Use the designated laundry or terrace space."
        ],
        faqs: [
          { question: "What are the check-in and check-out timings?", answer: "Normal check-in is between 7:00 AM to 9:00 PM. Check-out must be processed before 12:00 PM on the day of departure." },
          { question: "Is the security deposit refundable?", answer: "Yes, the security deposit of ₹5,000 is fully refundable at the time of check-out after adjusting any pending dues or damages." },
          { question: "Does the hostel provide laundry services?", answer: "Yes, we provide automatic washing machines for students on the terrace, and professional dry cleaning service is available once a week." },
          { question: "What is the food menu like?", answer: "We serve breakfast, lunch, and dinner. Meals are high-quality South Indian style with special non-veg dinners on Wednesdays and Sundays." }
        ],
        upiId: "srisrinivasahostel@ibl",
        merchantName: "Sri Srinivasa Boys Hostel",
        accountHolderName: "Sri Srinivasa Hostels Ltd",
        paymentNote: "Monthly Rent Payment",
        paymentInstructions: "Scan the QR code, complete payment via GPay/PhonePe, enter the 12-digit UTR transaction ID, and upload a clear screenshot of the payment receipt.",
        upiEnabled: true
      };
      await setDoc(doc(db, "settings", "general"), defaultSettings);

      // 2. Default Users (Admin and Student)
      const adminPasswordHash = await bcrypt.hash("admin", 10);
      const studentPasswordHash = await bcrypt.hash("student", 10);

      await setDoc(doc(db, "users", "admin1"), {
        id: "admin1",
        name: "Jagadeesh Reddy (Warden)",
        email: "admin@srisrinivasa.com",
        passwordHash: adminPasswordHash,
        role: "admin",
        phone: "+91 99999 88888",
        isBlocked: false,
        documentStatus: "approved",
        createdAt: new Date().toISOString()
      });

      await setDoc(doc(db, "users", "student1"), {
        id: "student1",
        name: "Ramesh Kumar",
        email: "student@srisrinivasa.com",
        passwordHash: studentPasswordHash,
        role: "student",
        phone: "+91 88888 77777",
        isBlocked: false,
        currentRoomId: "room101",
        currentRoomNumber: "101",
        currentBedId: "bed101A",
        currentBedNumber: "101-A",
        documentStatus: "approved",
        createdAt: new Date().toISOString()
      });

      // 3. Default Rooms
      const initialRooms = [
        {
          id: "room101",
          roomNumber: "101",
          floor: 1,
          capacity: 2,
          availableBeds: 1,
          occupiedBeds: 1,
          isAc: true,
          hasAttachedBathroom: true,
          hasBalcony: true,
          hasWifi: true,
          images: [
            "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80",
            "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=600&q=80"
          ],
          monthlyRent: 8500,
          deposit: 5000,
          status: "available",
          description: "Premium double sharing AC room with personalized lockers, elegant wooden study desks, and private balcony overlooking the main park."
        },
        {
          id: "room102",
          roomNumber: "102",
          floor: 1,
          capacity: 3,
          availableBeds: 3,
          occupiedBeds: 0,
          isAc: true,
          hasAttachedBathroom: true,
          hasBalcony: false,
          hasWifi: true,
          images: [
            "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80"
          ],
          monthlyRent: 7200,
          deposit: 4000,
          status: "available",
          description: "Luxury triple sharing AC room equipped with orthopedic mattresses, high-speed fiber internet, and individual wardrobes."
        },
        {
          id: "room201",
          roomNumber: "201",
          floor: 2,
          capacity: 4,
          availableBeds: 4,
          occupiedBeds: 0,
          isAc: false,
          hasAttachedBathroom: true,
          hasBalcony: true,
          hasWifi: true,
          images: [
            "https://images.unsplash.com/photo-1531835551805-16d864c8d311?auto=format&fit=crop&w=600&q=80"
          ],
          monthlyRent: 5500,
          deposit: 3000,
          status: "available",
          description: "Four sharing Non-AC spacious room with natural ventilation, attached western bathroom, and individual power outlets."
        },
        {
          id: "room202",
          roomNumber: "202",
          floor: 2,
          capacity: 1,
          availableBeds: 1,
          occupiedBeds: 0,
          isAc: true,
          hasAttachedBathroom: true,
          hasBalcony: true,
          hasWifi: true,
          images: [
            "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=600&q=80"
          ],
          monthlyRent: 12000,
          deposit: 8000,
          status: "available",
          description: "Ultra-luxury single occupancy suite featuring custom modular study workspace, smart ambient lighting, and fully stocked minibar-fridge."
        }
      ];

      for (const r of initialRooms) {
        await setDoc(doc(db, "rooms", r.id), r);
      }

      // 4. Default Beds
      const initialBeds = [
        { id: "bed101A", roomId: "room101", roomNumber: "101", bedNumber: "101-A", isOccupied: true, occupantId: "student1", occupantName: "Ramesh Kumar" },
        { id: "bed101B", roomId: "room101", roomNumber: "101", bedNumber: "101-B", isOccupied: false },
        { id: "bed102A", roomId: "room102", roomNumber: "102", bedNumber: "102-A", isOccupied: false },
        { id: "bed102B", roomId: "room102", roomNumber: "102", bedNumber: "102-B", isOccupied: false },
        { id: "bed102C", roomId: "room102", roomNumber: "102", bedNumber: "102-C", isOccupied: false },
        { id: "bed201A", roomId: "room201", roomNumber: "201", bedNumber: "201-A", isOccupied: false },
        { id: "bed201B", roomId: "room201", roomNumber: "201", bedNumber: "201-B", isOccupied: false },
        { id: "bed201C", roomId: "room201", roomNumber: "201", bedNumber: "201-C", isOccupied: false },
        { id: "bed201D", roomId: "room201", roomNumber: "201", bedNumber: "201-D", isOccupied: false },
        { id: "bed202A", roomId: "room202", roomNumber: "202", bedNumber: "202-A", isOccupied: false }
      ];

      for (const b of initialBeds) {
        await setDoc(doc(db, "beds", b.id), b);
      }

      // 5. Default Notices
      const initialNotices = [
        {
          id: "notice1",
          title: "Inaugural Swag & Welcome Feast",
          content: "We are organizing a grand Welcome Feast and Hostel Orientation program on Sunday at 7:00 PM on the rooftop. All students are invited to join. Special North & South Indian buffet will be served alongside live musical performances.",
          isPinned: true,
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          author: "Management"
        },
        {
          id: "notice2",
          title: "Scheduled Maintenance: Water Storage Cleaning",
          content: "Please note that the central overhead water tanks will undergo professional disinfection cleaning this Tuesday between 10:00 AM to 2:00 PM. Water supply will be temporarily suspended during these hours. Please plan accordingly.",
          isPinned: false,
          createdAt: new Date().toISOString(),
          author: "Warden Office"
        }
      ];
      for (const n of initialNotices) {
        await setDoc(doc(db, "notices", n.id), n);
      }

      // 6. Default Mess Menu
      const initialMenu = [
        { id: "Monday", breakfast: "Idli, Vada, Chutney, Sambar, Milk & Tea", lunch: "Rice, Dal Fry, Mixed Veg Curry, Curd, Pickle, Pappad", dinner: "Chapati, Paneer Butter Masala, Veg Biryani, Raitha" },
        { id: "Tuesday", breakfast: "Mysore Bonda, Coconut Chutney, Tea & Coffee", lunch: "Tomato Pappu, Rice, Bhindi Fry, Rasam, Curd", dinner: "Aloo Paratha, Curd, Chana Masala, Jeera Rice" },
        { id: "Wednesday", breakfast: "Puri Bhaji, Ginger Tea", lunch: "Gongura Pappu, Rice, Brinjal Curry, Curd, Butter Milk", dinner: "Roti, Chicken Curry (Special) or Shahi Paneer, Rice, Sweet" },
        { id: "Thursday", breakfast: "Uthappam, Sambar, Mint Chutney, Tea & Milk", lunch: "Menthi Pappu, Rice, Potato Fry, Sambar, Curd", dinner: "Roti, Veg Kadai, Egg Masala, Veg Pulao, Curd" },
        { id: "Friday", breakfast: "Semiya Upma, Tomato Chutney, Tea & Milk", lunch: "Leafy Vegetable Dal, Rice, Ivy Gourd Fry, Curd", dinner: "Roti, Gobi Manchurian Dry, Veg Fried Rice, Ice Cream" },
        { id: "Saturday", breakfast: "Poha, Sev, Sweet, Tea & Coffee", lunch: "Sambar Rice, Potato Wedges, Curd, Roasted Pappad", dinner: "Chapati, Mixed Veg Korma, White Rice, Dal, Curd" },
        { id: "Sunday", breakfast: "Masala Dosa, Sambar, Chutney, Lemon Tea", lunch: "Special Veg Pulao, Bagara Baingan, Raita, Curd", dinner: "Roti, Special Chicken Biryani (Special) or Paneer Biryani, Gulab Jamun" }
      ];
      for (const m of initialMenu) {
        await setDoc(doc(db, "mess", m.id), m);
      }

      // 7. Seed Rent Invoice for Ramesh
      await setDoc(doc(db, "invoices", "invoice1"), {
        id: "invoice1",
        studentId: "student1",
        studentName: "Ramesh Kumar",
        roomNumber: "101",
        bedNumber: "101-A",
        month: "July 2026",
        amount: 8500,
        dueDate: "2026-07-05",
        fine: 0,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      console.log("Database seeded successfully!");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Invoke seed database
seedDatabase();

// ==========================================
// MIDDLEWARES
// ==========================================
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Access token required" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid or expired token" });
    req.user = user;
    next();
  });
}

// ==========================================
// REST API ENDPOINTS
// ==========================================

// --- AUTHENTICATION ---

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email.toLowerCase()));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = "u_" + Math.random().toString(36).substr(2, 9);

    const newUser = {
      id: userId,
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "student",
      phone,
      isBlocked: false,
      documentStatus: "none",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "users", userId), newUser);

    const accessToken = jwt.sign({ id: userId, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: "1d" });
    const refreshToken = jwt.sign({ id: userId }, REFRESH_SECRET, { expiresIn: "30d" });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: userId,
        name,
        email: email.toLowerCase(),
        role: "student",
        phone,
        documentStatus: "none",
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email.toLowerCase()));
    const snap = await getDocs(q);

    if (snap.empty) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const userData = snap.docs[0].data();
    if (userData.isBlocked) {
      return res.status(403).json({ error: "Your account has been suspended. Please contact the warden." });
    }

    const validPassword = await bcrypt.compare(password, userData.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const accessToken = jwt.sign({ id: userData.id, email: userData.email, role: userData.role }, JWT_SECRET, { expiresIn: "1d" });
    const refreshToken = jwt.sign({ id: userData.id }, REFRESH_SECRET, { expiresIn: "30d" });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        phone: userData.phone,
        isBlocked: userData.isBlocked,
        currentRoomId: userData.currentRoomId,
        currentRoomNumber: userData.currentRoomNumber,
        currentBedId: userData.currentBedId,
        currentBedNumber: userData.currentBedNumber,
        documentStatus: userData.documentStatus || "none",
        profilePhoto: userData.profilePhoto,
        emergencyContact: userData.emergencyContact,
        guardianDetails: userData.guardianDetails
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
  try {
    const userDoc = await getDoc(doc(db, "users", req.user.id));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: "User not found" });
    }

    const u = userDoc.data();
    res.json({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      phone: u.phone,
      isBlocked: u.isBlocked,
      currentRoomId: u.currentRoomId,
      currentRoomNumber: u.currentRoomNumber,
      currentBedId: u.currentBedId,
      currentBedNumber: u.currentBedNumber,
      documentStatus: u.documentStatus || "none",
      profilePhoto: u.profilePhoto,
      emergencyContact: u.emergencyContact,
      guardianDetails: u.guardianDetails,
      aadhaar: u.aadhaar,
      pan: u.pan,
      collegeId: u.collegeId,
      parentIdProof: u.parentIdProof,
      documentNotes: u.documentNotes,
      hostelForm: u.hostelForm
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/auth/profile", authenticateToken, async (req: any, res) => {
  try {
    const { name, phone, emergencyContact, guardianDetails, profilePhoto, hostelForm, aadhaar, pan, collegeId } = req.body;
    const userRef = doc(db, "users", req.user.id);
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
    if (guardianDetails !== undefined) updateData.guardianDetails = guardianDetails;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;
    if (hostelForm !== undefined) updateData.hostelForm = hostelForm;
    if (aadhaar !== undefined) updateData.aadhaar = aadhaar;
    if (pan !== undefined) updateData.pan = pan;
    if (collegeId !== undefined) updateData.collegeId = collegeId;

    await updateDoc(userRef, updateData);
    res.json({ message: "Profile updated successfully", updateData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/auth/change-password", authenticateToken, async (req: any, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    const userDoc = await getDoc(doc(db, "users", req.user.id));
    if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });

    const u = userDoc.data();
    const valid = await bcrypt.compare(currentPassword, u.passwordHash);
    if (!valid) return res.status(400).json({ error: "Incorrect current password" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateDoc(doc(db, "users", req.user.id), { passwordHash });
    res.json({ message: "Password updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/auth/reset-password-request", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email.toLowerCase()));
    const snap = await getDocs(q);

    if (snap.empty) {
      // Return success even if user not found to prevent email enumeration
      return res.json({ message: "Password reset instructions sent if email exists." });
    }

    const userData = snap.docs[0].data();
    
    // Generate a temporary 8-character password
    const tempPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update in database
    await updateDoc(doc(db, "users", userData.id), { passwordHash });

    // Send Email
    await sendEmail(
      userData.email,
      "Your Temporary Password",
      `<h3>Hello ${userData.name || userData.email},</h3>
       <p>You requested a password reset. Here is your temporary password:</p>
       <p style="font-size: 24px; font-weight: bold; padding: 10px; background: #f0f0f0; display: inline-block;">${tempPassword}</p>
       <p>Please log in and change this password immediately from your profile settings.</p>
       <br/><p>Thank you,<br/>Srisrinivasa Boys Hostel</p>`
    );

    res.json({ message: "Password reset instructions sent if email exists." });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ROOMS & BEDS MANAGEMENT ---

app.get("/api/rooms", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "rooms"));
    const rooms = snap.docs.map(d => d.data());
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/rooms", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });

    const { roomNumber, floor, capacity, isAc, hasAttachedBathroom, hasBalcony, hasWifi, monthlyRent, deposit, description, images } = req.body;

    if (!roomNumber || !capacity || !monthlyRent) {
      return res.status(400).json({ error: "Room number, capacity, and rent are required" });
    }

    const roomId = "room_" + Math.random().toString(36).substr(2, 9);
    const newRoom = {
      id: roomId,
      roomNumber,
      floor: Number(floor) || 1,
      capacity: Number(capacity),
      availableBeds: Number(capacity),
      occupiedBeds: 0,
      isAc: !!isAc,
      hasAttachedBathroom: !!hasAttachedBathroom,
      hasBalcony: !!hasBalcony,
      hasWifi: !!hasWifi,
      images: images || ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80"],
      monthlyRent: Number(monthlyRent),
      deposit: Number(deposit) || 0,
      status: "available",
      description: description || "Cozy, fully ventilated student room."
    };

    await setDoc(doc(db, "rooms", roomId), newRoom);

    // Auto generate beds for this room
    for (let i = 1; i <= Number(capacity); i++) {
      const charCode = String.fromCharCode(64 + i); // A, B, C...
      const bedId = `${roomId}_${charCode}`;
      await setDoc(doc(db, "beds", bedId), {
        id: bedId,
        roomId: roomId,
        roomNumber: roomNumber,
        bedNumber: `${roomNumber}-${charCode}`,
        isOccupied: false
      });
    }

    res.status(201).json(newRoom);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/rooms/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const roomId = req.params.id;
    const roomRef = doc(db, "rooms", roomId);
    
    const rDoc = await getDoc(roomRef);
    if (!rDoc.exists()) return res.status(404).json({ error: "Room not found" });

    const fields = req.body;
    const cleanFields: any = {};
    for (const key of Object.keys(fields)) {
      if (fields[key] !== undefined) {
        cleanFields[key] = fields[key];
      }
    }

    await updateDoc(roomRef, cleanFields);
    res.json({ message: "Room updated successfully", cleanFields });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/rooms/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const roomId = req.params.id;

    // Remove from rooms
    await deleteDoc(doc(db, "rooms", roomId));

    // Remove associated beds
    const bedsSnap = await getDocs(query(collection(db, "beds"), where("roomId", "==", roomId)));
    for (const bed of bedsSnap.docs) {
      await deleteDoc(doc(db, "beds", bed.id));
    }

    res.json({ message: "Room and associated beds deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/beds", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "beds"));
    const beds = snap.docs.map(d => d.data());
    res.json(beds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- BOOKINGS & ALLOCATIONS ---

app.get("/api/bookings", authenticateToken, async (req: any, res) => {
  try {
    let q;
    if (req.user.role === "admin") {
      q = collection(db, "bookings");
    } else {
      q = query(collection(db, "bookings"), where("studentId", "==", req.user.id));
    }
    const snap = await getDocs(q);
    const bookings = snap.docs.map(d => d.data());
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/bookings", authenticateToken, async (req: any, res) => {
  try {
    const { roomId, checkInDate, documents, preferences } = req.body;
    if (!roomId || !checkInDate) {
      return res.status(400).json({ error: "Room and check-in date are required" });
    }

    const roomDoc = await getDoc(doc(db, "rooms", roomId));
    if (!roomDoc.exists()) return res.status(404).json({ error: "Room not found" });
    const rData = roomDoc.data();

    if (rData.availableBeds <= 0) {
      return res.status(400).json({ error: "This room is already fully occupied" });
    }

    // Save student document info to their user profile as well
    if (documents) {
      const uRef = doc(db, "users", req.user.id);
      await updateDoc(uRef, {
        aadhaar: documents.aadhaar || "",
        pan: documents.pan || "",
        collegeId: documents.collegeId || "",
        parentIdProof: documents.parentIdProof || "",
        documentStatus: "pending"
      });
    }

    const bookingId = "book_" + Math.random().toString(36).substr(2, 9);
    const newBooking = {
      id: bookingId,
      studentId: req.user.id,
      studentName: req.body.studentName || req.user.email,
      studentEmail: req.user.email,
      roomId,
      roomNumber: rData.roomNumber,
      checkInDate,
      status: "pending",
      documents: documents || {},
      preferences: preferences || { sleepSchedule: "no-preference", studyHabits: "no-preference", roommateRequest: "" },
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "bookings", bookingId), newBooking);

    // Push notification
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: req.user.id,
      title: "Booking Submitted",
      message: `Your booking request for Room ${rData.roomNumber} has been submitted and is pending verification.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Send Email
    await sendEmail(
      req.user.email,
      "Booking Request Received",
      `<h3>Hello ${req.body.studentName || req.user.email},</h3>
       <p>We have successfully received your booking request for <strong>Room ${rData.roomNumber}</strong>.</p>
       <p>Your application is currently pending admin verification. We will notify you once your booking is approved.</p>
       <br/><p>Thank you,<br/>Srisrinivasa Boys Hostel</p>`
    );

    res.status(201).json(newBooking);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/bookings/:id/status", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const bookingId = req.params.id;
    const { status, bedId, notes } = req.body; // approved, rejected, checked-in, checked-out

    const bRef = doc(db, "bookings", bookingId);
    const bSnap = await getDoc(bRef);
    if (!bSnap.exists()) return res.status(404).json({ error: "Booking not found" });
    const bData = bSnap.data();

    const oldStatus = bData.status;
    await updateDoc(bRef, { status });

    // Handle Bed Allocations on approval or checking in
    if (status === "checked-in" || status === "approved") {
      let allocatedBedId = bedId;
      
      // Auto-assign first available bed if bedId not provided
      if (!allocatedBedId) {
        const bedsSnap = await getDocs(query(
          collection(db, "beds"), 
          where("roomId", "==", bData.roomId), 
          where("isOccupied", "==", false)
        ));
        if (!bedsSnap.empty) {
          allocatedBedId = bedsSnap.docs[0].id;
        }
      }

      if (allocatedBedId && oldStatus !== "checked-in" && oldStatus !== "approved") {
        const bedRef = doc(db, "beds", allocatedBedId);
        const bedSnap = await getDoc(bedRef);
        if (bedSnap.exists()) {
          const bedData = bedSnap.data();
          
          // Occupy Bed
          await updateDoc(bedRef, {
            isOccupied: true,
            occupantId: bData.studentId,
            occupantName: bData.studentName
          });

          // Update User profile
          const userRef = doc(db, "users", bData.studentId);
          await updateDoc(userRef, {
            currentRoomId: bData.roomId,
            currentRoomNumber: bData.roomNumber,
            currentBedId: allocatedBedId,
            currentBedNumber: bedData.bedNumber
          });

          // Decrease available beds in room
          const rRef = doc(db, "rooms", bData.roomId);
          const rSnap = await getDoc(rRef);
          if (rSnap.exists()) {
            const rData = rSnap.data();
            await updateDoc(rRef, {
              availableBeds: Math.max(0, rData.availableBeds - 1),
              occupiedBeds: Math.min(rData.capacity, rData.occupiedBeds + 1)
            });
          }

          // Update Booking with assigned bed
          await updateDoc(bRef, {
            bedId: allocatedBedId,
            bedNumber: bedData.bedNumber,
            status: "checked-in"
          });
        }
      }
    } else if (status === "checked-out" || status === "cancelled") {
      // Vacate bed if they were checked-in
      if (bData.bedId) {
        const bedRef = doc(db, "beds", bData.bedId);
        await updateDoc(bedRef, {
          isOccupied: false,
          occupantId: "",
          occupantName: ""
        });

        // Clear User room properties
        const userRef = doc(db, "users", bData.studentId);
        await updateDoc(userRef, {
          currentRoomId: "",
          currentRoomNumber: "",
          currentBedId: "",
          currentBedNumber: ""
        });

        // Increase available beds in room
        const rRef = doc(db, "rooms", bData.roomId);
        const rSnap = await getDoc(rRef);
        if (rSnap.exists()) {
          const rData = rSnap.data();
          await updateDoc(rRef, {
            availableBeds: Math.min(rData.capacity, rData.availableBeds + 1),
            occupiedBeds: Math.max(0, rData.occupiedBeds - 1)
          });
        }
      }
    }

    // Add notification
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: bData.studentId,
      title: `Booking Update`,
      message: `Your booking request for Room ${bData.roomNumber} status has been updated to: ${status.toUpperCase()}. ${notes || ""}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Send Email
    await sendEmail(
      bData.studentEmail,
      `Booking Update: ${status.toUpperCase()}`,
      `<h3>Hello ${bData.studentName || bData.studentEmail},</h3>
       <p>Your booking request for <strong>Room ${bData.roomNumber}</strong> has been updated to: <strong>${status.toUpperCase()}</strong>.</p>
       ${notes ? `<p><strong>Admin Note:</strong> ${notes}</p>` : ""}
       <p>Log in to your dashboard to view the latest updates.</p>
       <br/><p>Thank you,<br/>Srisrinivasa Boys Hostel</p>`
    );

    res.json({ message: "Booking updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- BED OPERATIONS ---

app.post("/api/beds/assign", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const { studentId, bedId } = req.body;

    const bSnap = await getDoc(doc(db, "beds", bedId));
    if (!bSnap.exists()) return res.status(404).json({ error: "Bed not found" });
    const bData = bSnap.data();

    if (bData.isOccupied) return res.status(400).json({ error: "Bed is already occupied" });

    const uSnap = await getDoc(doc(db, "users", studentId));
    if (!uSnap.exists()) return res.status(404).json({ error: "Student not found" });
    const uData = uSnap.data();

    // Occupy bed
    await updateDoc(doc(db, "beds", bedId), {
      isOccupied: true,
      occupantId: studentId,
      occupantName: uData.name
    });

    // Update Student Room Info
    await updateDoc(doc(db, "users", studentId), {
      currentRoomId: bData.roomId,
      currentRoomNumber: bData.roomNumber,
      currentBedId: bedId,
      currentBedNumber: bData.bedNumber
    });

    // Update Room stats
    const rRef = doc(db, "rooms", bData.roomId);
    const rSnap = await getDoc(rRef);
    if (rSnap.exists()) {
      const rData = rSnap.data();
      await updateDoc(rRef, {
        availableBeds: Math.max(0, rData.availableBeds - 1),
        occupiedBeds: Math.min(rData.capacity, rData.occupiedBeds + 1)
      });
    }

    res.json({ message: "Bed assigned successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/beds/vacate", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const { bedId } = req.body;

    const bRef = doc(db, "beds", bedId);
    const bSnap = await getDoc(bRef);
    if (!bSnap.exists()) return res.status(404).json({ error: "Bed not found" });
    const bData = bSnap.data();

    if (!bData.isOccupied) return res.json({ message: "Bed is already vacant" });

    const studentId = bData.occupantId;

    // Vacate bed
    await updateDoc(bRef, {
      isOccupied: false,
      occupantId: "",
      occupantName: ""
    });

    // Clear User Room
    if (studentId) {
      await updateDoc(doc(db, "users", studentId), {
        currentRoomId: "",
        currentRoomNumber: "",
        currentBedId: "",
        currentBedNumber: ""
      });
    }

    // Update Room stats
    const rRef = doc(db, "rooms", bData.roomId);
    const rSnap = await getDoc(rRef);
    if (rSnap.exists()) {
      const rData = rSnap.data();
      await updateDoc(rRef, {
        availableBeds: Math.min(rData.capacity, rData.availableBeds + 1),
        occupiedBeds: Math.max(0, rData.occupiedBeds - 1)
      });
    }

    res.json({ message: "Bed vacated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- RENT & PAYMENTS MANAGEMENT ---

app.get("/api/payments", authenticateToken, async (req: any, res) => {
  try {
    let q;
    if (req.user.role === "admin") {
      q = collection(db, "invoices");
    } else {
      q = query(collection(db, "invoices"), where("studentId", "==", req.user.id));
    }
    const snap = await getDocs(q);
    const invoices = snap.docs.map(d => d.data());
    res.json(invoices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/payments/submit", authenticateToken, async (req: any, res) => {
  try {
    const { invoiceId, utrNumber, amountPaid, remarks, paymentScreenshot } = req.body;
    if (!invoiceId || !utrNumber || !amountPaid) {
      return res.status(400).json({ error: "Invoice ID, UTR number, and amount paid are required" });
    }

    const invRef = doc(db, "invoices", invoiceId);
    const invSnap = await getDoc(invRef);
    if (!invSnap.exists()) return res.status(404).json({ error: "Invoice not found" });

    const updatePayload: any = {
      utrNumber,
      amountPaid: Number(amountPaid),
      status: "submitted",
      paidDate: new Date().toISOString().split("T")[0],
      remarks: remarks || "",
    };

    if (paymentScreenshot) {
      updatePayload.paymentScreenshot = paymentScreenshot;
    }

    await updateDoc(invRef, updatePayload);

    // Create Warden notification
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: "admin1", // Sent to admin
      title: "New Payment Submitted",
      message: `Student ${invSnap.data().studentName} submitted payment of ₹${amountPaid} for UTR: ${utrNumber}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ message: "Payment details submitted successfully", status: "submitted" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/payments/:id/verify", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const invoiceId = req.params.id;
    const { status, rejectReason } = req.body; // approved, rejected

    const invRef = doc(db, "invoices", invoiceId);
    const invSnap = await getDoc(invRef);
    if (!invSnap.exists()) return res.status(404).json({ error: "Invoice not found" });

    const invData = invSnap.data();
    const updateData: any = { status: status === "approved" ? "paid" : "rejected" };
    if (rejectReason) updateData.rejectReason = rejectReason;

    await updateDoc(invRef, updateData);

    // Create student notification
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: invData.studentId,
      title: status === "approved" ? "Payment Approved" : "Payment Rejected",
      message: status === "approved" 
        ? `Your payment of ₹${invData.amount} for ${invData.month} has been approved. Digital receipt generated.`
        : `Your payment for ${invData.month} has been rejected. Reason: ${rejectReason || "None"}. Please re-submit correctly.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ message: "Payment verified successfully", updateData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/payments/generate-monthly", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const { month } = req.body; // e.g. "July 2026"
    if (!month) return res.status(400).json({ error: "Month parameter is required" });

    // Fetch all active students who are currently staying in a room
    const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
    let count = 0;

    for (const studentDoc of studentsSnap.docs) {
      const student = studentDoc.data();
      if (student.currentRoomNumber && student.currentBedNumber) {
        // Find room to get rent price
        const roomSnap = await getDoc(doc(db, "rooms", student.currentRoomId));
        if (roomSnap.exists()) {
          const room = roomSnap.data();
          
          // Check if invoice already exists for this student and month
          const qExist = query(
            collection(db, "invoices"), 
            where("studentId", "==", student.id), 
            where("month", "==", month)
          );
          const existSnap = await getDocs(qExist);
          
          if (existSnap.empty) {
            const invoiceId = "inv_" + Math.random().toString(36).substr(2, 9);
            await setDoc(doc(db, "invoices", invoiceId), {
              id: invoiceId,
              studentId: student.id,
              studentName: student.name,
              roomNumber: student.currentRoomNumber,
              bedNumber: student.currentBedNumber,
              month,
              amount: room.monthlyRent,
              dueDate: new Date(Date.now() + 3600000 * 24 * 7).toISOString().split("T")[0], // 7 days from now
              fine: 0,
              status: "pending",
              createdAt: new Date().toISOString()
            });

            // Create notification
            const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
            await setDoc(doc(db, "notifications", notifId), {
              id: notifId,
              userId: student.id,
              title: "Rent Invoice Generated",
              message: `Your rent invoice for ${month} of ₹${room.monthlyRent} has been generated. Kindly clear before due date.`,
              isRead: false,
              createdAt: new Date().toISOString()
            });

            count++;
          }
        }
      }
    }

    res.json({ message: `Successfully generated ${count} rent invoices for ${month}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- STUDENT MANAGEMENT ---

app.get("/api/students", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const snap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
    const students = snap.docs.map(d => d.data());
    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/students/:id/block", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const studentId = req.params.id;
    const { isBlocked } = req.body;

    await updateDoc(doc(db, "users", studentId), { isBlocked });
    res.json({ message: `Student ${isBlocked ? "blocked" : "unblocked"} successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/students/:id/documents", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const studentId = req.params.id;
    const { documentStatus, documentNotes } = req.body; // approved, rejected

    await updateDoc(doc(db, "users", studentId), { documentStatus, documentNotes });

    // Notify student
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: studentId,
      title: "Documents Verified",
      message: `Your uploaded identity documents are ${documentStatus.toUpperCase()}. ${documentNotes || ""}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Send Email
    try {
      const uSnap = await getDoc(doc(db, "users", studentId));
      if (uSnap.exists()) {
        const uEmail = uSnap.data().email;
        await sendEmail(
          uEmail,
          `Document Verification Update`,
          `<h3>Hello ${uSnap.data().name || uEmail},</h3>
           <p>Your uploaded identity documents have been marked as: <strong>${documentStatus.toUpperCase()}</strong>.</p>
           ${documentNotes ? `<p><strong>Admin Note:</strong> ${documentNotes}</p>` : ""}
           <p>Log in to your dashboard for more details.</p>
           <br/><p>Thank you,<br/>Srisrinivasa Boys Hostel</p>`
        );
      }
    } catch (e) {
      console.error("Failed to send doc verification email", e);
    }

    res.json({ message: "Student documents verified and updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


app.put("/api/users/:userId/documents/:docId/verify", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    
    const { userId, docId } = req.params;
    const { status } = req.body; 
    
    const userDoc = await getDoc(doc(db, "users", userId));
    if (!userDoc.exists()) return res.status(404).json({ error: "User not found" });
    
    const currentDocs = userDoc.data().importedDocuments || [];
    const updatedDocs = currentDocs.map((d: any) => 
      d.id === docId ? { ...d, status } : d
    );
    
    await updateDoc(doc(db, "users", userId), { importedDocuments: updatedDocs });
    res.json({ message: "Document status updated" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/students/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const studentId = req.params.id;

    // Check if staying in bed, vacate first
    const uDoc = await getDoc(doc(db, "users", studentId));
    if (uDoc.exists()) {
      const uData = uDoc.data();
      if (uData.currentBedId) {
        await updateDoc(doc(db, "beds", uData.currentBedId), {
          isOccupied: false,
          occupantId: "",
          occupantName: ""
        });
        
        // Update Room count
        const rRef = doc(db, "rooms", uData.currentRoomId);
        const rSnap = await getDoc(rRef);
        if (rSnap.exists()) {
          const rData = rSnap.data();
          await updateDoc(rRef, {
            availableBeds: Math.min(rData.capacity, rData.availableBeds + 1),
            occupiedBeds: Math.max(0, rData.occupiedBeds - 1)
          });
        }
      }
    }

    await deleteDoc(doc(db, "users", studentId));
    res.json({ message: "Student account deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- COMPLAINTS ---

app.get("/api/complaints", authenticateToken, async (req: any, res) => {
  try {
    let q;
    if (req.user.role === "admin") {
      q = collection(db, "complaints");
    } else {
      q = query(collection(db, "complaints"), where("studentId", "==", req.user.id));
    }
    const snap = await getDocs(q);
    const complaints = snap.docs.map(d => d.data());
    res.json(complaints);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/complaints", authenticateToken, async (req: any, res) => {
  try {
    const { title, description, category, images } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description, and category are required" });
    }

    const uDoc = await getDoc(doc(db, "users", req.user.id));
    const uData = uDoc.data();

    const complaintId = "comp_" + Math.random().toString(36).substr(2, 9);
    const newComplaint = {
      id: complaintId,
      studentId: req.user.id,
      studentName: uData?.name || req.user.email,
      roomNumber: uData?.currentRoomNumber || "Not Assigned",
      title,
      description,
      category,
      status: "open",
      images: images || [],
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "complaints", complaintId), newComplaint);

    // Notify Warden
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: "admin1",
      title: "New Complaint Raised",
      message: `${uData?.name || req.user.email} raised complaint: ${title}`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(newComplaint);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/complaints/:id", authenticateToken, async (req: any, res) => {
  try {
    const complaintId = req.params.id;
    const { status, staffAssigned, updateNote } = req.body; // open, in-progress, resolved, closed

    const compRef = doc(db, "complaints", complaintId);
    const compSnap = await getDoc(compRef);
    if (!compSnap.exists()) return res.status(404).json({ error: "Complaint not found" });

    const compData = compSnap.data();
    const updatePayload: any = {};
    if (status) updatePayload.status = status;
    if (staffAssigned !== undefined) updatePayload.staffAssigned = staffAssigned;

    const currentUpdates = compData.updates || [];
    if (updateNote || status || staffAssigned) {
      currentUpdates.push({
        status: status || compData.status,
        note: updateNote || `Complaint parameters updated.`,
        date: new Date().toISOString(),
        updatedBy: req.user.role === "admin" ? "Admin (Warden)" : "Student"
      });
      updatePayload.updates = currentUpdates;
    }

    await updateDoc(compRef, updatePayload);

    // Notify Student
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: compData.studentId,
      title: "Complaint Status Update",
      message: `Your complaint: "${compData.title}" status has been changed to: ${status ? status.toUpperCase() : "UPDATED"}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Send Email
    try {
      const uSnap = await getDoc(doc(db, "users", compData.studentId));
      if (uSnap.exists()) {
        const uEmail = uSnap.data().email;
        await sendEmail(
          uEmail,
          `Complaint Update: ${compData.title}`,
          `<h3>Hello ${uSnap.data().name || uEmail},</h3>
           <p>Your complaint regarding <strong>${compData.title}</strong> has been updated.</p>
           ${status ? `<p><strong>Status:</strong> ${status.toUpperCase()}</p>` : ""}
           ${updateNote ? `<p><strong>Note:</strong> ${updateNote}</p>` : ""}
           <p>Log in to your dashboard to view full details.</p>
           <br/><p>Thank you,<br/>Srisrinivasa Boys Hostel</p>`
        );
      }
    } catch (e) {
      console.error("Failed to send complaint email", e);
    }

    res.json({ message: "Complaint updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOTICE BOARD ---

app.get("/api/notices", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "notices"));
    const notices = snap.docs.map(d => d.data());
    res.json(notices);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/notices", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const { title, content, isPinned } = req.body;

    if (!title || !content) return res.status(400).json({ error: "Title and content are required" });

    const noticeId = "notice_" + Math.random().toString(36).substr(2, 9);
    const newNotice = {
      id: noticeId,
      title,
      content,
      isPinned: !!isPinned,
      createdAt: new Date().toISOString(),
      author: req.user.email
    };

    await setDoc(doc(db, "notices", noticeId), newNotice);

    // Notify all students
    const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
    for (const student of studentsSnap.docs) {
      const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: student.id,
        title: "New Notice Posted",
        message: `Management published a new announcement: "${title}".`,
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json(newNotice);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/notices/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    await deleteDoc(doc(db, "notices", req.params.id));
    res.json({ message: "Notice deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- MESS MENU ---

app.get("/api/mess", async (req, res) => {
  try {
    const snap = await getDocs(collection(db, "mess"));
    const menu = snap.docs.map(d => d.data());
    res.json(menu);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/mess/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    const day = req.params.id; // e.g., Monday
    const { breakfast, lunch, dinner, specialMeal } = req.body;

    await updateDoc(doc(db, "mess", day), {
      breakfast, lunch, dinner, specialMeal: specialMeal || ""
    });

    res.json({ message: `Mess menu for ${day} updated successfully` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/mess/feedback", authenticateToken, async (req: any, res) => {
  try {
    const { mealType, rating, feedback } = req.body;
    if (!mealType || !rating) return res.status(400).json({ error: "Meal type and rating are required" });

    const fId = "feed_" + Math.random().toString(36).substr(2, 9);
    const uDoc = await getDoc(doc(db, "users", req.user.id));
    const uData = uDoc.data();

    await setDoc(doc(db, "feedbacks", fId), {
      id: fId,
      studentId: req.user.id,
      studentName: uData?.name || req.user.email,
      mealType,
      rating: Number(rating),
      feedback: feedback || "",
      date: new Date().toISOString()
    });

    res.json({ message: "Feedback submitted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/mess/feedbacks", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    const snap = await getDocs(collection(db, "feedbacks"));
    const list = snap.docs.map(d => d.data());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- LEAVE MANAGEMENT ---

app.get("/api/leaves", authenticateToken, async (req: any, res) => {
  try {
    let q;
    if (req.user.role === "admin") {
      q = collection(db, "leaves");
    } else {
      q = query(collection(db, "leaves"), where("studentId", "==", req.user.id));
    }
    const snap = await getDocs(q);
    const leaves = snap.docs.map(d => d.data());
    res.json(leaves);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/leaves", authenticateToken, async (req: any, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ error: "Start date, end date, and reason are required" });
    }

    const uDoc = await getDoc(doc(db, "users", req.user.id));
    const uData = uDoc.data();

    const leaveId = "leave_" + Math.random().toString(36).substr(2, 9);
    const newLeave = {
      id: leaveId,
      studentId: req.user.id,
      studentName: uData?.name || req.user.email,
      roomNumber: uData?.currentRoomNumber || "Not Assigned",
      startDate,
      endDate,
      reason,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "leaves", leaveId), newLeave);

    // Notify Warden
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: "admin1",
      title: "New Leave Request",
      message: `${uData?.name || req.user.email} applied for leave from ${startDate} to ${endDate}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.status(201).json(newLeave);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/leaves/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    const leaveId = req.params.id;
    const { status } = req.body; // approved, rejected

    const lRef = doc(db, "leaves", leaveId);
    const lSnap = await getDoc(lRef);
    if (!lSnap.exists()) return res.status(404).json({ error: "Leave request not found" });
    const lData = lSnap.data();

    await updateDoc(lRef, { status });

    // Notify student
    const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "notifications", notifId), {
      id: notifId,
      userId: lData.studentId,
      title: "Leave Status Update",
      message: `Your leave request from ${lData.startDate} has been ${status.toUpperCase()}.`,
      isRead: false,
      createdAt: new Date().toISOString()
    });

    res.json({ message: "Leave request updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- VISITOR LOGS ---

app.get("/api/visitors", authenticateToken, async (req: any, res) => {
  try {
    let q;
    if (req.user.role === "admin") {
      q = collection(db, "visitors");
    } else {
      q = query(collection(db, "visitors"), where("studentId", "==", req.user.id));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/visitors", authenticateToken, async (req: any, res) => {
  try {
    const { visitorName, relationship, visitDate, purpose } = req.body;
    if (!visitorName || !relationship || !visitDate || !purpose) {
      return res.status(400).json({ error: "All visitor details are required" });
    }

    const uDoc = await getDoc(doc(db, "users", req.user.id));
    const uData = uDoc.data();

    const visitorId = "vis_" + Math.random().toString(36).substr(2, 9);
    const newRequest = {
      id: visitorId,
      studentId: req.user.id,
      studentName: uData?.name || req.user.email,
      roomNumber: uData?.currentRoomNumber || "Not Assigned",
      visitorName,
      relationship,
      visitDate,
      purpose,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, "visitors", visitorId), newRequest);

    res.status(201).json(newRequest);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/visitors/:id", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
    const { status } = req.body; // approved, rejected
    await updateDoc(doc(db, "visitors", req.params.id), { status });
    res.json({ message: "Visitor request updated successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ATTENDANCE & QR ACCESS ---

app.get("/api/attendance", authenticateToken, async (req: any, res) => {
  try {
    let q;
    if (req.user.role === "admin") {
      q = collection(db, "attendance");
    } else {
      q = query(collection(db, "attendance"), where("studentId", "==", req.user.id));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/attendance/scan", authenticateToken, async (req: any, res) => {
  try {
    // Scan student ID card QR for entry/exit
    const { studentId, type } = req.body; // type: "check-in" or "check-out"
    const targetStudentId = studentId || req.user.id;

    const uDoc = await getDoc(doc(db, "users", targetStudentId));
    if (!uDoc.exists()) return res.status(404).json({ error: "Student not found" });
    const uData = uDoc.data();

    const todayStr = new Date().toISOString().split("T")[0];
    const logId = `att_${targetStudentId}_${todayStr}`;

    const timeStr = new Date().toLocaleTimeString();

    const attRef = doc(db, "attendance", logId);
    const attSnap = await getDoc(attRef);

    if (type === "check-out") {
      await setDoc(attRef, {
        id: logId,
        studentId: targetStudentId,
        studentName: uData.name,
        roomNumber: uData.currentRoomNumber || "Not Assigned",
        date: todayStr,
        status: "present",
        checkOutTime: timeStr,
        checkInTime: attSnap.exists() ? attSnap.data().checkInTime : ""
      });
    } else {
      await setDoc(attRef, {
        id: logId,
        studentId: targetStudentId,
        studentName: uData.name,
        roomNumber: uData.currentRoomNumber || "Not Assigned",
        date: todayStr,
        status: "present",
        checkInTime: timeStr,
        checkOutTime: attSnap.exists() ? attSnap.data().checkOutTime : ""
      });
    }

    res.json({ message: `Digital Attendance Logged Successfully at ${timeStr}` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- NOTIFICATIONS ---

app.get("/api/notifications", authenticateToken, async (req: any, res) => {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", req.user.id));
    const snap = await getDocs(q);
    const list = snap.docs.map(d => d.data());
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/notifications/read", authenticateToken, async (req: any, res) => {
  try {
    const q = query(collection(db, "notifications"), where("userId", "==", req.user.id), where("isRead", "==", false));
    const snap = await getDocs(q);
    for (const d of snap.docs) {
      await updateDoc(doc(db, "notifications", d.id), { isRead: true });
    }
    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- SETTINGS (UPI / INFORMATION) ---

app.get("/api/settings", async (req, res) => {
  try {
    const snap = await getDoc(doc(db, "settings", "general"));
    if (snap.exists()) {
      res.json(snap.data());
    } else {
      res.status(404).json({ error: "Settings not found" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/settings", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });
    const updateData = req.body;
    await updateDoc(doc(db, "settings", "general"), updateData);
    res.json({ message: "Settings updated successfully", updateData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI CHAT ASSISTANT ---

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    if (!ai) {
      return res.json({
        response: "Hello! I am Sri Srinivasa Boys Hostel Assistant. Currently, the Gemini AI API Key is not configured in this workspace. However, here's a helpful mock response: Please visit the office for any warden assistance, gate permissions, or payment issues! To enable smart responses, configure GEMINI_API_KEY in the Secrets panel."
      });
    }

    // Set a very professional hostel system system-instruction context
    const systemPrompt = `You are "Srinivasa Warden AI", an intelligent, polite, and luxury hospitality-focused virtual assistant of Sri Srinivasa Boys Hostel in Hitech City, Hyderabad. 
Your tone must be warm, respectful, helpful, and highly clear.
You must answer queries strictly based on these hostel guidelines:
- Hostel Warden: Sri Jagadeesh Reddy.
- Gate Closure: Strict curfew of 10:00 PM. Door closes at 10:30 PM. Overnight stays for outside visitors are banned.
- Rent: Must be cleared by the 5th of every month. Fine is ₹100/day after that.
- Amenities: AC rooms, ortho mattresses, high-speed fiber Wi-Fi, roof-top laundry machines, North and South Indian style mess.
- Refunds: Security deposit (₹5,000) is fully refundable at check-out upon 30 days notice.
Be concise and elegant. Refer to the user as "Sir" or "Friend". Keep answer length within 2-3 paragraphs.`;

    const chatHistory = history ? history.map((h: any) => ({
      role: h.role,
      parts: [{ text: h.content }]
    })) : [];

    // Complete the call to models.generateContent with standard SDK
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...chatHistory,
        { role: "user", parts: [{ text: message }] }
      ]
    });

    res.json({ response: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Sorry, I had trouble thinking about that request. Error: " + error.message });
  }
});

// --- AI AUTOMATIC BED ALLOCATION SYSTEM ---

app.post("/api/beds/auto-allocate", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });

    // 1. Fetch pending bookings
    const bookingsSnap = await getDocs(query(collection(db, "bookings"), where("status", "==", "pending")));
    const pendingBookings = bookingsSnap.docs.map(d => d.data());

    if (pendingBookings.length === 0) {
      return res.json({ allocations: [], message: "No pending booking requests to allocate." });
    }

    // 2. Fetch all rooms
    const roomsSnap = await getDocs(collection(db, "rooms"));
    const rooms = roomsSnap.docs.map(d => d.data());

    // 3. Fetch vacant beds
    const bedsSnap = await getDocs(query(collection(db, "beds"), where("isOccupied", "==", false)));
    const vacantBeds = bedsSnap.docs.map(d => d.data());

    if (vacantBeds.length === 0) {
      return res.status(400).json({ error: "No vacant bed spaces available for allocation." });
    }

    // 4. Fetch all active students (to understand roommate compatibility)
    const usersSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")));
    const students = usersSnap.docs.map(d => d.data());

    // 5. If AI is not configured, fall back to deterministic allocation
    if (!ai) {
      console.log("Gemini AI is not initialized. Using deterministic optimizer.");
      const allocations: any[] = [];
      let bedIndex = 0;

      for (const booking of pendingBookings) {
        if (bedIndex >= vacantBeds.length) break;

        const bed = vacantBeds[bedIndex];
        const room = rooms.find(r => r.id === bed.roomId);

        allocations.push({
          bookingId: booking.id,
          studentId: booking.studentId,
          studentName: booking.studentName,
          roomId: bed.roomId,
          roomNumber: bed.roomNumber,
          bedId: bed.id,
          bedNumber: bed.bedNumber,
          compatibilityScore: 80,
          reasoning: `Deterministic allocation based on availability in Room ${bed.roomNumber}. AC: ${room?.isAc ? "Yes" : "No"}.`
        });

        bedIndex++;
      }

      return res.json({
        allocations,
        isMock: true,
        message: "Deterministic allocations computed (Gemini API Key not set). Configure your API key for advanced preference matching!"
      });
    }

    // 6. Otherwise, call Gemini!
    const prompt = `You are "Srinivasa AI Bed Allocation Optimizer".
We need to allocate available bed spaces to pending booking requests in Sri Srinivasa Boys Hostel.
We must optimize matching of roommate preferences, sleep schedules, and study styles, while maintaining strict room capacities.

Here is the data:
- Pending Bookings (students seeking beds):
${JSON.stringify(pendingBookings.map(b => ({
  id: b.id,
  studentId: b.studentId,
  studentName: b.studentName,
  targetRoomId: b.roomId,
  targetRoomNumber: b.roomNumber,
  preferences: b.preferences || { sleepSchedule: "no-preference", studyHabits: "no-preference", roommateRequest: "" }
})), null, 2)}

- Vacant Beds (available spots):
${JSON.stringify(vacantBeds.map(b => ({
  id: b.id,
  roomId: b.roomId,
  roomNumber: b.roomNumber,
  bedNumber: b.bedNumber
})), null, 2)}

- Room Configurations (AC status and rent):
${JSON.stringify(rooms.map(r => ({
  id: r.id,
  roomNumber: r.roomNumber,
  isAc: r.isAc,
  capacity: r.capacity,
  availableBeds: r.availableBeds
})), null, 2)}

- Existing Occupants in rooms (for compatibility):
${JSON.stringify(students.filter(s => s.currentBedId).map(s => ({
  name: s.name,
  email: s.email,
  roomId: s.currentRoomId,
  roomNumber: s.currentRoomNumber,
  bedNumber: s.currentBedNumber
})), null, 2)}

Strict Guidelines:
1. Assign each booking to EXACTLY ONE bed. If there are fewer beds than bookings, prioritize bookings with earlier check-in dates. Do not assign multiple students to the same bed.
2. Group students with matching or compatible preferences:
   - "early-bird" (sleeps early) with "early-bird". "night-owl" (sleeps late) with "night-owl".
   - "silent" study with "silent" study.
   - Respect roommateFriendRequest: If a student requested another student (by name or email), prioritize placing them in the same room.
3. Compute a compatibilityScore (integer 0-100) and write a highly professional 1-sentence reasoning explaining why they match well (e.g., "Both Ramesh and Suresh are night owls who requested quiet AC sharing rooms").

You MUST return a JSON array conforming exactly to this schema. DO NOT output any other markdown or conversational text. Just the raw JSON array:
[
  {
    "bookingId": "string",
    "studentId": "string",
    "studentName": "string",
    "roomId": "string",
    "roomNumber": "string",
    "bedId": "string",
    "bedNumber": "string",
    "compatibilityScore": number,
    "reasoning": "string"
  }
]
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let allocations = [];
    try {
      allocations = JSON.parse(response.text || "[]");
    } catch (parseErr) {
      console.error("Failed to parse Gemini output:", response.text);
      throw new Error("AI generated an invalid payload. Please try again.");
    }

    res.json({
      allocations,
      isMock: false,
      message: "AI Optimizer successfully matched resident preferences!"
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/beds/auto-allocate/confirm", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });

    const { allocations } = req.body;
    if (!allocations || !Array.isArray(allocations)) {
      return res.status(400).json({ error: "Allocations array is required" });
    }

    let successCount = 0;

    for (const alloc of allocations) {
      const { bookingId, studentId, studentName, roomId, roomNumber, bedId, bedNumber } = alloc;

      // 1. Get booking
      const bRef = doc(db, "bookings", bookingId);
      const bSnap = await getDoc(bRef);
      if (!bSnap.exists()) continue;
      const bData = bSnap.data();

      if (bData.status !== "pending") continue;

      // 2. Occupy Bed
      const bedRef = doc(db, "beds", bedId);
      const bedSnap = await getDoc(bedRef);
      if (!bedSnap.exists()) continue;
      const bedData = bedSnap.data();
      
      if (bedData.isOccupied) continue; // safety check

      await updateDoc(bedRef, {
        isOccupied: true,
        occupantId: studentId,
        occupantName: studentName
      });

      // 3. Update User profile
      const userRef = doc(db, "users", studentId);
      await updateDoc(userRef, {
        currentRoomId: roomId,
        currentRoomNumber: roomNumber,
        currentBedId: bedId,
        currentBedNumber: bedNumber,
        documentStatus: "approved" // automatically approve document on allocation
      });

      // 4. Update Booking
      await updateDoc(bRef, {
        bedId: bedId,
        bedNumber: bedNumber,
        status: "approved"
      });

      // 5. Update Room count
      const rRef = doc(db, "rooms", roomId);
      const rSnap = await getDoc(rRef);
      if (rSnap.exists()) {
        const rData = rSnap.data();
        await updateDoc(rRef, {
          availableBeds: Math.max(0, rData.availableBeds - 1),
          occupiedBeds: Math.min(rData.capacity, rData.occupiedBeds + 1)
        });
      }

      // 6. Notify Student
      const notifId = "notif_" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: studentId,
        title: "AI Room Allocation Complete",
        message: `Congratulations! Our AI Smart Allocation system has assigned you to Room ${roomNumber}, Bed ${bedNumber}. Log in to view your dynamic resident pass!`,
        isRead: false,
        createdAt: new Date().toISOString()
      });

      successCount++;
    }

    res.json({ message: `Successfully approved and auto-allocated ${successCount} resident beds.` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- ADMIN STATS & ANALYTICS ---

app.get("/api/stats", authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized access" });

    // Fetch rooms, users, invoices, complaints, visitors
    const roomsSnap = await getDocs(collection(db, "rooms"));
    const usersSnap = await getDocs(collection(db, "users"));
    const invoicesSnap = await getDocs(collection(db, "invoices"));
    const complaintsSnap = await getDocs(collection(db, "complaints"));
    const visitorsSnap = await getDocs(collection(db, "visitors"));

    const rooms = roomsSnap.docs.map(d => d.data());
    const users = usersSnap.docs.map(d => d.data());
    const invoices = invoicesSnap.docs.map(d => d.data());
    const complaints = complaintsSnap.docs.map(d => d.data());
    const visitors = visitorsSnap.docs.map(d => d.data());

    const totalStudents = users.filter((u: any) => u.role === "student").length;
    const activeStudents = users.filter((u: any) => u.role === "student" && u.currentRoomNumber).length;
    const totalRooms = rooms.length;
    
    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach((r: any) => {
      totalBeds += r.capacity;
      occupiedBeds += (r.capacity - r.availableBeds);
    });

    const availableBeds = totalBeds - occupiedBeds;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Monthly Revenue (sum of paid invoices)
    let monthlyRevenue = 0;
    let pendingPayments = 0;
    invoices.forEach((i: any) => {
      if (i.status === "paid") {
        monthlyRevenue += i.amount;
      } else if (i.status === "pending" || i.status === "submitted") {
        pendingPayments += i.amount;
      }
    });

    const activeComplaints = complaints.filter((c: any) => c.status === "open" || c.status === "in-progress").length;
    const pendingVisitors = visitors.filter((v: any) => v.status === "pending").length;

    // Build chart data
    const monthlyRevenueChart = [
      { name: "Jan", revenue: monthlyRevenue * 0.4 },
      { name: "Feb", revenue: monthlyRevenue * 0.5 },
      { name: "Mar", revenue: monthlyRevenue * 0.6 },
      { name: "Apr", revenue: monthlyRevenue * 0.8 },
      { name: "May", revenue: monthlyRevenue * 0.9 },
      { name: "Jun", revenue: monthlyRevenue * 0.95 },
      { name: "Jul", revenue: monthlyRevenue }
    ];

    const roomOccupancyChart = rooms.map((r: any) => ({
      name: `Room ${r.roomNumber}`,
      occupied: r.capacity - r.availableBeds,
      capacity: r.capacity
    }));

    const complaintAnalyticsChart = [
      { name: "Plumbing", count: complaints.filter((c: any) => c.category === "plumbing").length },
      { name: "Electrical", count: complaints.filter((c: any) => c.category === "electrical").length },
      { name: "Wi-Fi", count: complaints.filter((c: any) => c.category === "wifi").length },
      { name: "Cleaning", count: complaints.filter((c: any) => c.category === "cleaning").length },
      { name: "Mess Food", count: complaints.filter((c: any) => c.category === "mess").length },
      { name: "Other", count: complaints.filter((c: any) => c.category === "other").length }
    ];

    const studentGrowthChart = [
      { name: "Feb", students: 1 },
      { name: "Mar", students: 2 },
      { name: "Apr", students: 3 },
      { name: "May", students: 4 },
      { name: "Jun", students: 5 },
      { name: "Jul", students: totalStudents }
    ];

    res.json({
      cards: {
        totalStudents,
        activeStudents,
        totalRooms,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
        monthlyRevenue,
        pendingPayments,
        complaints: activeComplaints,
        visitorRequests: pendingVisitors
      },
      charts: {
        monthlyRevenueChart,
        roomOccupancyChart,
        complaintAnalyticsChart,
        studentGrowthChart
      }
    });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// VITE DEV SERVER & CLIENT HOOK
// ==========================================
import * as functions from "firebase-functions";

async function startServer() {
  if (process.env.NODE_ENV !== "production" && process.env.FIREBASE_CONFIG == null) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (process.env.FIREBASE_CONFIG == null) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Only listen to port if not running in Firebase Functions
  if (process.env.FIREBASE_CONFIG == null) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Express custom server running on http://localhost:${PORT}`);
    });
  }
}

startServer();

// Export as Firebase Function
export const api = functions.https.onRequest(app);
