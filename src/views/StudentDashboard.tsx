import React, { useState, useEffect } from "react";
import {
  Home,
  Bed,
  CreditCard,
  FileText,
  AlertTriangle,
  Utensils,
  Calendar,
  User,
  LogOut,
  Bell,
  Copy,
  Check,
  Upload,
  Sparkles,
  Search,
  Filter,
  Download,
  Info,
  ChevronRight,
  Clock,
  Plus,
  ShieldCheck,
  Award,
  X,
  Wrench,
  Wifi,
  Droplet,
  Zap,
  Mail,
  Phone
} from "lucide-react";
import api from "../lib/api";
import { User as UserType, Room, Bed as BedType, Booking, RentInvoice, Complaint, Notice, MessMenu, LeaveRequest, VisitorRequest, HostelSettings } from "../types";
import { generateInvoicePDF } from "../lib/pdfHelper";
import { useToast } from "../context/ToastContext";
import HostelApplicationForm from "../components/HostelApplicationForm";

interface StudentDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export default function StudentDashboard({ user: initialUser, onLogout }: StudentDashboardProps) {
  const [user, setUser] = useState<UserType>(initialUser);
  const [activeTab, setActiveTab] = useState<"home" | "rooms" | "rent" | "complaints" | "mess" | "requests" | "profile" | "hostel-form">("home");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<RentInvoice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [messMenu, setMessMenu] = useState<MessMenu[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [settings, setSettings] = useState<HostelSettings | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Form State
  const [bookingDate, setBookingDate] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [docAadhaar, setDocAadhaar] = useState("");
  const [docPan, setDocPan] = useState("");
  const [docCollege, setDocCollege] = useState("");
  const [prefSleepSchedule, setPrefSleepSchedule] = useState<"early-bird" | "night-owl" | "no-preference">("no-preference");
  const [prefStudyHabits, setPrefStudyHabits] = useState<"silent" | "group" | "no-preference">("no-preference");
  const [prefRoommate, setPrefRoommate] = useState("");

  const [screenshot, setScreenshot] = useState("");
  const [utr, setUtr] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [payRemarks, setPayRemarks] = useState("");
  const [activeInvoice, setActiveInvoice] = useState<RentInvoice | null>(null);

  const [compTitle, setCompTitle] = useState("");
  const [compDesc, setCompDesc] = useState("");
  const [compCategory, setCompCategory] = useState<"plumbing" | "electrical" | "wifi" | "cleaning" | "mess" | "other">("plumbing");

  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveReason, setLeaveReason] = useState("");

  const [visName, setVisName] = useState("");
  const [visRelation, setVisRelation] = useState("");
  const [visDate, setVisDate] = useState("");
  const [visPurpose, setVisPurpose] = useState("");

  const [mealTypeFeedback, setMealTypeFeedback] = useState<"breakfast" | "lunch" | "dinner">("breakfast");
  const [mealRating, setMealRating] = useState("5");
  const [mealFeedbackMsg, setMealFeedbackMsg] = useState("");

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [showQuickComplaintModal, setShowQuickComplaintModal] = useState(false);

  const { toast: triggerToast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [roomsData, bookingsData, invoicesData, complaintsData, noticesData, messData, leavesData, visitorsData, settingsData, notifData, meData] = await Promise.all([
        api.get("/rooms"),
        api.get("/bookings"),
        api.get("/payments"),
        api.get("/complaints"),
        api.get("/notices"),
        api.get("/mess"),
        api.get("/leaves"),
        api.get("/visitors"),
        api.get("/settings"),
        api.get("/notifications"),
        api.get("/auth/me")
      ]);

      setRooms(roomsData);
      setBookings(bookingsData);
      setInvoices(invoicesData);
      setComplaints(complaintsData);
      setNotices(noticesData.sort((a: any, b: any) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)));
      setMessMenu(messData);
      setLeaves(leavesData);
      setVisitors(visitorsData);
      setSettings(settingsData);
      setNotifications(notifData);
      setUser(meData);
    } catch (err: any) {
      triggerToast("Failed to synchronize with server datastore.", "error");
    }
  };

  const showToast = (msg: string, isError = false) => {
    triggerToast(msg, isError ? "error" : "success");
  };

  // Profile update handler
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put("/auth/profile", {
        phone: user.phone,
        emergencyContact: user.emergencyContact,
        guardianDetails: user.guardianDetails,
        profilePhoto: user.profilePhoto
      });
      showToast("Profile credentials updated successfully.");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Booking submit handler
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !bookingDate) {
      showToast("Please select check-in date and room", true);
      return;
    }

    try {
      await api.post("/bookings", {
        roomId: selectedRoom.id,
        checkInDate: bookingDate,
        documents: {
          aadhaar: docAadhaar || "MOCKED_AADHAAR_INFO",
          pan: docPan || "MOCKED_PAN_INFO",
          collegeId: docCollege || "MOCKED_COLLEGE_ID"
        },
        preferences: {
          sleepSchedule: prefSleepSchedule,
          studyHabits: prefStudyHabits,
          roommateRequest: prefRoommate
        }
      });
      showToast("Booking application submitted successfully.");
      setSelectedRoom(null);
      // Reset preference values
      setPrefSleepSchedule("no-preference");
      setPrefStudyHabits("no-preference");
      setPrefRoommate("");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Payment Screenshot Simulation Upload (Standard Base64 conversion for mock file upload)
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Payment details submit handler
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInvoice || !utr || !amountPaid) {
      showToast("UTR transaction reference and amount paid are required.", true);
      return;
    }

    try {
      await api.post("/payments/submit", {
        invoiceId: activeInvoice.id,
        utrNumber: utr,
        amountPaid: Number(amountPaid),
        remarks: payRemarks,
        paymentScreenshot: screenshot || "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&w=600&q=80"
      });
      showToast("Payment details submitted for warden verification.");
      setUtr("");
      setAmountPaid("");
      setPayRemarks("");
      setScreenshot("");
      setActiveInvoice(null);
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Complaint submit handler
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle || !compDesc) {
      showToast("All fields are required.", true);
      return;
    }

    try {
      await api.post("/complaints", {
        title: compTitle,
        description: compDesc,
        category: compCategory
      });
      showToast("Complaint submitted. Maintenance staff will be dispatched.");
      setCompTitle("");
      setCompDesc("");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Leave application handler
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason) {
      showToast("All fields are required.", true);
      return;
    }

    try {
      await api.post("/leaves", {
        startDate: leaveStart,
        endDate: leaveEnd,
        reason: leaveReason
      });
      showToast("Leave request registered successfully.");
      setLeaveStart("");
      setLeaveEnd("");
      setLeaveReason("");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Visitor log request handler
  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visName || !visRelation || !visDate || !visPurpose) {
      showToast("All fields are required.", true);
      return;
    }

    try {
      await api.post("/visitors", {
        visitorName: visName,
        relationship: visRelation,
        visitDate: visDate,
        purpose: visPurpose
      });
      showToast("Visitor request submitted successfully.");
      setVisName("");
      setVisRelation("");
      setVisDate("");
      setVisPurpose("");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Dining Feedback handler
  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/mess/feedback", {
        mealType: mealTypeFeedback,
        rating: Number(mealRating),
        feedback: mealFeedbackMsg
      });
      showToast("Meal feedback recorded. Thank you for helping us improve!");
      setMealFeedbackMsg("");
      fetchInitialData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  // Auto trigger digital attendance logging
  const triggerSelfAttendance = async (type: "check-in" | "check-out") => {
    try {
      await api.post("/attendance/scan", { type });
      showToast(`Logged digital gate ${type === "check-in" ? "Check-In" : "Check-Out"} successfully.`);
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const copyToClipboard = (text: string, type: "upi" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "upi") {
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  const activeBooking = bookings.find(b => b.status === "pending" || b.status === "approved" || b.status === "checked-in");

  // Dynamic QR Code generation for UPI
  const generateUPIQRCode = (amount: number) => {
    if (!settings) return "";
    const payload = `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.merchantName)}&am=${amount}&cu=INR&tn=RentInvoice`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}`;
  };

  // Dynamic student ID card QR
  const studentQRValue = `student_id_${user.id}_${user.name}`;
  const studentIDQR = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(studentQRValue)}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-display font-bold text-slate-950">
            SS
          </div>
          <div>
            <h2 className="font-display font-bold text-sm leading-tight text-white">Srinivasa Hostel</h2>
            <p className="text-[10px] tracking-wider text-slate-500 font-semibold uppercase">Resident Node</p>
          </div>
        </div>

        {/* Resident Mini Badge */}
        <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-950/60 border border-slate-800/40 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <User className="w-5 h-5 text-amber-500" />
            )}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">{user.name}</h4>
            <p className="text-[10px] text-slate-400 font-mono truncate">
              {user.currentRoomNumber ? `Room ${user.currentRoomNumber} (Bed ${user.currentBedNumber})` : "Unassigned"}
            </p>
          </div>
        </div>

        {/* Nav list */}
        <nav className="flex-1 px-4 space-y-1.5 pb-6">
          <button
            onClick={() => setActiveTab("home")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "home" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "rooms" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>Browse Rooms</span>
          </button>
          <button
            onClick={() => setActiveTab("rent")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "rent" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments & Dues</span>
          </button>
          <button
            onClick={() => setActiveTab("complaints")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "complaints" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Complaints Board</span>
          </button>
          <button
            onClick={() => setActiveTab("mess")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "mess" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Mess & Dining</span>
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "requests" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Leaves & Visitors</span>
          </button>
          <button
            onClick={() => setActiveTab("hostel-form")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "hostel-form" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Admission Form</span>
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "profile" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>My Profile</span>
          </button>

          <div className="pt-6 mt-6 border-t border-slate-800">
            <button
              onClick={onLogout}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 bg-slate-950 p-6 md:p-8 overflow-y-auto">
        
        {/* TAB 1: HOME */}
        {activeTab === "home" && (
          <div className="space-y-6">
            {/* Personalized Header Block */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden" id="personalized-student-header">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 mr-1" /> Student Resident Portal
                </span>
                <h1 className="font-display font-bold text-2xl text-white mt-1">
                  Welcome to Hostel, <span className="text-amber-500">{user.name}</span>!
                </h1>
                <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Easily monitor your room booking status, complete rent payments securely, and file high-priority maintenance requests instantly.
                </p>
                
                {/* User Info Bar */}
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[11px] text-slate-400 font-mono">
                  <div className="flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-amber-500" />
                    <span>ID: {user.id.toUpperCase()}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>{user.phone || "No phone registered"}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-start md:items-end gap-1.5">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold tracking-wider uppercase flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active Resident Account
                </span>
                <span className="text-[10px] font-mono text-slate-500">2026 Academic Session</span>
              </div>
            </div>

            {/* Summary Cards Grid for Current Booking & Payment Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="summary-status-grid">
              
              {/* Card 1: Booking & Room Status */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                        <Bed className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">My Booking & Stay</h4>
                    </div>
                    {user.currentRoomNumber ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">Checked-In</span>
                    ) : activeBooking ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">Pending Approval</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">No Active Stay</span>
                    )}
                  </div>

                  <div className="py-2 space-y-1">
                    {user.currentRoomNumber ? (
                      <>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Allocated Room & Bed</p>
                        <h3 className="text-xl font-bold text-white">Room {user.currentRoomNumber}</h3>
                        <p className="text-xs text-amber-400 font-semibold">Bed Assignment: {user.currentBedNumber}</p>
                      </>
                    ) : activeBooking ? (
                      <>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Requested Allocation</p>
                        <h3 className="text-lg font-bold text-slate-300">Room Verification Pending</h3>
                        <p className="text-xs text-slate-400 mt-1">Requested check-in date: {activeBooking.checkInDate}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Hostel Stay</p>
                        <h3 className="text-lg font-bold text-slate-300">Room Assignment Pending</h3>
                        <p className="text-xs text-slate-400">Please choose a hostel room from the tab below to request an allocation.</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Roommates: Shared Bed Space</span>
                  <button
                    onClick={() => setActiveTab("rooms")}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <span>Browse Suites</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Payments & Dues Status */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-display">Outstanding Dues</h4>
                    </div>
                    {invoices.filter(i => i.status === "pending").length > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-bold">Unpaid Dues</span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">No Balance</span>
                    )}
                  </div>

                  <div className="py-2">
                    {invoices.filter(i => i.status === "pending").length > 0 ? (
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Total Outstanding Rent</p>
                        <h2 className="text-2xl font-bold font-display text-white mt-1">
                          ₹{invoices.filter(i => i.status === "pending")[0].amount.toLocaleString()}
                        </h2>
                        <p className="text-xs text-rose-400 font-medium mt-1 flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Next Due: {invoices.filter(i => i.status === "pending")[0].dueDate}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-500 uppercase font-mono">Current Account Balance</p>
                        <h2 className="text-2xl font-bold font-display text-emerald-400 mt-1">₹0.00</h2>
                        <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center">
                          <ShieldCheck className="w-4 h-4 mr-1 shrink-0" /> All hostel balances completely clear!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Automatic Invoicing Enabled</span>
                  <button
                    onClick={() => setActiveTab("rent")}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center space-x-1"
                  >
                    <span>Rent Ledger</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-950" />
                  </button>
                </div>
              </div>

            </div>

            {/* Easy-Access Menu for Complaints and Maintenance Requests */}
            <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-6" id="quick-maintenance-console">
              <div>
                <h3 className="font-display font-semibold text-base text-white flex items-center">
                  <Wrench className="w-5 h-5 text-amber-500 mr-2" />
                  Quick Maintenance & Assistance Console
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Instantly report plumbing leaks, electrical faults, Wi-Fi downtime, or housekeeping concerns without leaving this page.
                </p>
              </div>

              {/* Action Buttons Categories */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <button
                  onClick={() => {
                    setCompCategory("plumbing");
                    setShowQuickComplaintModal(true);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/20 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group shadow-inner"
                >
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Plumbing Leak</span>
                </button>

                <button
                  onClick={() => {
                    setCompCategory("electrical");
                    setShowQuickComplaintModal(true);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/20 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group shadow-inner"
                >
                  <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Zap className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Electrical Fault</span>
                </button>

                <button
                  onClick={() => {
                    setCompCategory("wifi");
                    setShowQuickComplaintModal(true);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/20 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group shadow-inner"
                >
                  <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Wifi className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Wi-Fi & Internet</span>
                </button>

                <button
                  onClick={() => {
                    setCompCategory("cleaning");
                    setShowQuickComplaintModal(true);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/20 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group shadow-inner"
                >
                  <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Housekeeping</span>
                </button>

                <button
                  onClick={() => {
                    setCompCategory("mess");
                    setShowQuickComplaintModal(true);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/20 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group shadow-inner"
                >
                  <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Mess & Food</span>
                </button>

                <button
                  onClick={() => {
                    setCompCategory("other");
                    setShowQuickComplaintModal(true);
                  }}
                  className="p-4 bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/20 text-slate-300 hover:text-white rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center text-center space-y-2 group shadow-inner"
                >
                  <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold">Other Services</span>
                </button>
              </div>

              {/* Subtitle / Tip bar */}
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 flex items-center space-x-3 text-xs text-slate-400">
                <Info className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Our warden logs tickets automatically and alerts certified on-campus technicians within 15 minutes of registration.</span>
              </div>
            </div>

            {/* Quick Complaint Form Modal */}
            {showQuickComplaintModal && (
              <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <div className="flex items-center space-x-2">
                      <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                        <Wrench className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-lg text-white">Raise Rapid Concern</h3>
                        <p className="text-[10px] text-slate-400">Selected Category: <span className="text-amber-500 font-bold uppercase">{compCategory}</span></p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowQuickComplaintModal(false)}
                      className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await handleComplaintSubmit(e);
                      setShowQuickComplaintModal(false);
                    }} 
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Issue Category</label>
                      <select
                        value={compCategory}
                        onChange={(e: any) => setCompCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white cursor-pointer"
                      >
                        <option value="plumbing">Plumbing / Water Leakage</option>
                        <option value="electrical">Electrical / Fan / AC repair</option>
                        <option value="wifi">High-speed Wi-Fi & LAN</option>
                        <option value="cleaning">Room or Bathroom Cleaning</option>
                        <option value="mess">Mess & Dining food feedback</option>
                        <option value="other">Other Maintenance / Service</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Brief Title / Concern</label>
                      <input
                        type="text"
                        required
                        value={compTitle}
                        onChange={(e) => setCompTitle(e.target.value)}
                        placeholder={
                          compCategory === "plumbing" ? "e.g. Washroom sink tap water leaking" :
                          compCategory === "electrical" ? "e.g. Ceiling fan speed control broken" :
                          compCategory === "wifi" ? "e.g. Connection dropping in Room 204" :
                          compCategory === "cleaning" ? "e.g. Dustbin in suite needs urgent clearing" :
                          compCategory === "mess" ? "e.g. Breakfast timing delay concern" :
                          "e.g. Cupboard lock key cylinder jammed"
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder:text-slate-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Elaborate Description & Suitable Timings</label>
                      <textarea
                        required
                        value={compDesc}
                        onChange={(e) => setCompDesc(e.target.value)}
                        placeholder="Explain the technical issue clearly and mention what times you will be present in the room for the technician visit..."
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white leading-relaxed placeholder:text-slate-600"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-4 flex space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowQuickComplaintModal(false)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-lg"
                      >
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>Register Ticket</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Latest Notice Board Widget */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Notice board list */}
              <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-sm text-white uppercase tracking-widest">Notice Board Announcements</h3>
                  <span className="text-[10px] text-slate-500 font-semibold">Latest updates</span>
                </div>

                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {notices.length === 0 ? (
                    <p className="text-xs text-slate-500">No public announcements available.</p>
                  ) : (
                    notices.map((n) => (
                      <div key={n.id} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-white flex items-center">
                            {n.isPinned && <span className="mr-1.5 text-amber-500">📌 Pinned:</span>}
                            {n.title}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-500">{n.createdAt ? n.createdAt.split("T")[0] : "N/A"}</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{n.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hostel Rules & Guidelines */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest font-display mb-4">Quick House Rules</h4>
                  <ul className="space-y-2.5 text-xs text-slate-400">
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 shrink-0" />
                      <span>Gate closes strictly at 10:00 PM.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 shrink-0" />
                      <span>Quiet hours after 10:30 PM.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 shrink-0" />
                      <span>No unauthorized overnight guests.</span>
                    </li>
                    <li className="flex items-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2 shrink-0" />
                      <span>Rent payment deadline is the 5th of each month.</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-800 mt-4 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Warden: Sri Jagadeesh Reddy</span>
                  <span>Active 2026 Session</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: ROOM BOOKINGS */}
        {activeTab === "rooms" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Browse Premium Accommodations</h1>
              <p className="text-xs text-slate-400">Discover and book modern shared or single suites.</p>
            </div>

            {activeBooking ? (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 text-xs inline-block">
                  <Info className="w-5 h-5 inline mr-1.5 shrink-0" />
                  Active Booking Found
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    Room {activeBooking.roomNumber} - Status: <span className="text-amber-400">{activeBooking.status.toUpperCase()}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Check-in Date Requested: {activeBooking.checkInDate}. Waiting for Warden verification of documents.
                  </p>
                </div>
                {activeBooking.status === "pending" && (
                  <p className="text-xs text-rose-400">You already have an active pending request. Please wait until approved.</p>
                )}
              </div>
            ) : null}

            {!activeBooking && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map((room) => (
                  <div key={room.id} className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 flex flex-col justify-between">
                    <div className="relative h-48 w-full bg-slate-950">
                      <img src={room.images[0]} referrerPolicy="no-referrer" alt={`Room ${room.roomNumber}`} className="w-full h-full object-cover" />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-amber-400">
                        {room.isAc ? "AC" : "Non-AC"}
                      </div>
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-display font-bold text-lg text-white">Room {room.roomNumber}</h3>
                          <p className="text-xs text-slate-400">Floor {room.floor}  |  {room.capacity} Sharing Beds</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase text-slate-500 tracking-wider">Rent Per Bed</p>
                          <p className="text-lg font-bold font-display text-white">₹{room.monthlyRent.toLocaleString()}<span className="text-xs font-normal text-slate-400">/mo</span></p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed truncate">{room.description}</p>

                      {/* Amenities checklist */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        {room.hasAttachedBathroom && (
                          <span className="px-2.5 py-1 bg-slate-950/60 border border-slate-800 text-[10px] rounded-lg text-slate-300">Attached Bath</span>
                        )}
                        {room.hasBalcony && (
                          <span className="px-2.5 py-1 bg-slate-950/60 border border-slate-800 text-[10px] rounded-lg text-slate-300">Balcony</span>
                        )}
                        {room.hasWifi && (
                          <span className="px-2.5 py-1 bg-slate-950/60 border border-slate-800 text-[10px] rounded-lg text-slate-300">Fiber Wi-Fi</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
                        <span>Deposit: ₹{room.deposit}</span>
                        <span className={`font-semibold ${room.availableBeds > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {room.availableBeds > 0 ? `${room.availableBeds} beds open` : "Fully Booked"}
                        </span>
                      </div>
                    </div>

                    <div className="px-6 pb-6 pt-2">
                      <button
                        onClick={() => setSelectedRoom(room)}
                        disabled={room.availableBeds <= 0}
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                      >
                        {room.availableBeds > 0 ? "Book Bed Space" : "Sold Out"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Booking Apply Modal dialog */}
            {selectedRoom && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4">
                  <h3 className="font-display font-semibold text-lg text-white">Book Space in Room {selectedRoom.roomNumber}</h3>
                  <p className="text-xs text-slate-400">Upload mock information to finalize digital allocation.</p>

                  <form onSubmit={handleBookingSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Check-in Date</label>
                      <input
                        type="date"
                        required
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Aadhaar Card Details (Simulated)</label>
                      <input
                        type="text"
                        required
                        value={docAadhaar}
                        onChange={(e) => setDocAadhaar(e.target.value)}
                        placeholder="12-digit Aadhaar Number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">PAN Card Details (Simulated)</label>
                      <input
                        type="text"
                        required
                        value={docPan}
                        onChange={(e) => setDocPan(e.target.value)}
                        placeholder="10-digit PAN Number"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-3 space-y-3">
                      <p className="text-xs font-bold text-amber-500 flex items-center">
                        <Sparkles className="w-3.5 h-3.5 mr-1" /> Student Preferences (For AI Bed Allocation)
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Sleep Schedule</label>
                          <select
                            value={prefSleepSchedule}
                            onChange={(e) => setPrefSleepSchedule(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                          >
                            <option value="no-preference">No Preference</option>
                            <option value="early-bird">Early Bird (Sleeps &lt;10 PM)</option>
                            <option value="night-owl">Night Owl (Sleeps &gt;12 AM)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">Study Style</label>
                          <select
                            value={prefStudyHabits}
                            onChange={(e) => setPrefStudyHabits(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white focus:outline-none"
                          >
                            <option value="no-preference">No Preference</option>
                            <option value="silent">Silent / High Focus</option>
                            <option value="group">Group / Interactive</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Roommate Friend Request (Optional Name/Email)</label>
                        <input
                          type="text"
                          value={prefRoommate}
                          onChange={(e) => setPrefRoommate(e.target.value)}
                          placeholder="e.g. Ramesh Kumar or friend@email.com"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none placeholder:text-slate-600"
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedRoom(null)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
                      >
                        Submit Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PAYMENTS & DUES */}
        {activeTab === "rent" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Monthly Rent & Payments Portal</h1>
              <p className="text-xs text-slate-400">Clear your hostel balances instantly via scanning our integrated dynamic UPI gateway.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Invoice listing & History */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 font-display">Invoices Summary</h3>
                
                {invoices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6">No billing logs found under your resident ID.</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <p className="text-xs font-semibold text-white">{inv.month} Rent Invoice</p>
                          <p className="text-[10px] text-slate-400">Generated: {inv.createdAt ? inv.createdAt.split("T")[0] : "N/A"}  |  Due: {inv.dueDate}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                              inv.status === "submitted" ? "bg-amber-500/10 text-amber-400" :
                              inv.status === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-blue-500/10 text-blue-400"
                            }`}>
                              {inv.status}
                            </span>
                            {inv.status === "rejected" && (
                              <span className="text-[10px] text-rose-300">Reason: {inv.rejectReason}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 w-full md:w-auto justify-between md:justify-end">
                          <p className="text-lg font-bold font-display text-white">₹{inv.amount.toLocaleString()}</p>
                          
                          <div className="flex space-x-1.5">
                            {inv.status === "pending" || inv.status === "rejected" ? (
                              <button
                                onClick={() => setActiveInvoice(inv)}
                                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
                              >
                                Pay Now
                              </button>
                            ) : null}

                            {inv.status === "paid" && (
                              <button
                                onClick={() => settings && generateInvoicePDF(inv, settings)}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all cursor-pointer flex items-center"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side: Quick Instructions Panel */}
              <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4">
                <h3 className="font-display font-semibold text-sm text-white">Important Billing Info</h3>
                <div className="space-y-3.5 text-xs text-slate-400 leading-relaxed">
                  <div className="flex items-start">
                    <Info className="w-4.5 h-4.5 text-amber-500 mr-2 shrink-0" />
                    <span>Hostel rent accumulates on the 1st of every month.</span>
                  </div>
                  <div className="flex items-start">
                    <Info className="w-4.5 h-4.5 text-amber-500 mr-2 shrink-0" />
                    <span>Late fees of ₹100 per day apply starting on the 6th.</span>
                  </div>
                  <div className="flex items-start">
                    <Info className="w-4.5 h-4.5 text-amber-500 mr-2 shrink-0" />
                    <span>Always double-check and enter the 12-digit UTR Transaction ID after making payment.</span>
                  </div>
                </div>
              </div>

            </div>

            {/* PAYMENT PROCESS DIALOG MODAL */}
            {activeInvoice && settings && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-lg w-full space-y-6 max-h-[90vh] overflow-y-auto">
                  
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <h3 className="font-display font-bold text-lg text-white">Scan & Complete Payment</h3>
                    <button
                      onClick={() => setActiveInvoice(null)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Left: Dynamic QR Generation */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800/60 text-center space-y-3">
                      <img
                        src={generateUPIQRCode(activeInvoice.amount)}
                        alt="UPI QR Code"
                        className="w-48 h-48 rounded-lg bg-white p-2"
                      />
                      <div>
                        <p className="text-[10px] text-slate-500">Scan using GPay, PhonePe, Paytm, or BHIM</p>
                        <p className="text-sm font-bold font-display text-white mt-1">Amount Due: ₹{activeInvoice.amount.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Right: UPI configuration metadata */}
                    <div className="space-y-4 text-xs">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">Merchant Details</p>
                        <p className="font-semibold text-white mt-0.5">{settings.merchantName}</p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold">UPI ID</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="font-mono bg-slate-950 px-2 py-1 rounded border border-slate-800 text-amber-300 text-[11px]">
                            {settings.upiId}
                          </span>
                          <button
                            onClick={() => copyToClipboard(settings.upiId, "upi")}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                          >
                            {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-slate-400 leading-relaxed text-[11px]">
                        <p className="font-semibold text-slate-300 mb-1">Instructions:</p>
                        {settings.paymentInstructions}
                      </div>
                    </div>

                  </div>

                  {/* Submission Form */}
                  <form onSubmit={handlePaymentSubmit} className="space-y-4 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-display">Provide Payment Receipts</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Amount Paid (INR)</label>
                        <input
                          type="number"
                          required
                          value={amountPaid}
                          onChange={(e) => setAmountPaid(e.target.value)}
                          placeholder="e.g., 8500"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">12-Digit UTR Number</label>
                        <input
                          type="text"
                          required
                          maxLength={12}
                          value={utr}
                          onChange={(e) => setUtr(e.target.value)}
                          placeholder="e.g. 614098234812"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Remarks / Note</label>
                      <input
                        type="text"
                        value={payRemarks}
                        onChange={(e) => setPayRemarks(e.target.value)}
                        placeholder="e.g. Cleared July room rent"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Payment Receipt Screenshot</label>
                      <div className="relative border border-dashed border-slate-700 rounded-xl p-4 bg-slate-950 text-center flex flex-col items-center justify-center space-y-1">
                        <Upload className="w-6 h-6 text-slate-500" />
                        <span className="text-xs text-slate-400">Drag & drop or click to choose file</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        {screenshot && <span className="text-emerald-400 text-[10px] font-semibold">Image selected successfully!</span>}
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setActiveInvoice(null)}
                        className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
                      >
                        Close Portal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                      >
                        Submit Verification File
                      </button>
                    </div>

                  </form>

                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Raise & Track Maintenance Concerns</h1>
              <p className="text-xs text-slate-400">File issues with plumbing, electricity, internet, or other facilities directly.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Side: Raise form */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
                <h3 className="font-display font-semibold text-sm text-white">File New Complaint</h3>
                
                <form onSubmit={handleComplaintSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Issue Category</label>
                    <select
                      value={compCategory}
                      onChange={(e: any) => setCompCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="plumbing">Plumbing / Water Leakage</option>
                      <option value="electrical">Electrical / Fan / AC repair</option>
                      <option value="wifi">High-speed Wi-Fi & LAN</option>
                      <option value="cleaning">Room or Bathroom Cleaning</option>
                      <option value="mess">Mess & Dining food feedback</option>
                      <option value="other">Other Maintenance / Service</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Brief Title</label>
                    <input
                      type="text"
                      required
                      value={compTitle}
                      onChange={(e) => setCompTitle(e.target.value)}
                      placeholder="e.g. Toilet tap continuously dripping"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Elaborate Description</label>
                    <textarea
                      required
                      value={compDesc}
                      onChange={(e) => setCompDesc(e.target.value)}
                      placeholder="Explain details of the malfunction and suitable timings for technician entry..."
                      rows={4}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95"
                  >
                    Register Complaint File
                  </button>
                </form>
              </div>

              {/* Right Side: Active/Resolved Listing */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 font-display">Active & Resolved Log</h3>

                {complaints.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6">You have not submitted any complaints.</p>
                ) : (
                  <div className="space-y-3">
                    {complaints.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-0.5 bg-slate-950 text-amber-400 text-[10px] font-semibold rounded-lg uppercase">
                              {c.category}
                            </span>
                            <h4 className="text-xs font-bold text-white">{c.title}</h4>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            c.status === "open" ? "bg-rose-500/10 text-rose-400" :
                            c.status === "in-progress" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                        {c.staffAssigned && (
                          <p className="text-[10px] font-medium text-slate-400 flex items-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-2" />
                            Assigned Staff: <strong className="text-slate-300 ml-1">{c.staffAssigned}</strong>
                          </p>
                        )}
                        {c.updates && c.updates.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                            <p className="font-semibold text-slate-300">Warden Updates:</p>
                            {c.updates.map((upd, i) => (
                              <p key={i} className="italic text-slate-400">
                                "{upd.note}" ({upd.date.split("T")[0]})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: MESS MENU & DINING FEEDBACK */}
        {activeTab === "mess" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Warden's Weekly Food Menu</h1>
              <p className="text-xs text-slate-400">Fresh, hygienic, and authentic meals prepared by certified local chefs.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Weekly menu listing */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 font-display">Weekly Food Calendar</h3>
                
                <div className="space-y-3.5">
                  {messMenu.map((day) => (
                    <div key={day.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center pb-1.5 border-b border-slate-850">
                        <h4 className="text-xs font-bold text-amber-400 font-display">{day.id}</h4>
                        {day.specialMeal && (
                          <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-300 text-[10px] font-bold rounded-full animate-pulse">
                            ✨ Special: {day.specialMeal}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-xs text-slate-400">
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-slate-500">Breakfast (7:30 - 9:00 AM)</p>
                          <p className="text-slate-300 mt-1 leading-relaxed">{day.breakfast}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-slate-500">Lunch (12:30 - 2:00 PM)</p>
                          <p className="text-slate-300 mt-1 leading-relaxed">{day.lunch}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-semibold text-slate-500">Dinner (7:30 - 9:30 PM)</p>
                          <p className="text-slate-300 mt-1 leading-relaxed">{day.dinner}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Food Feedback Panel */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 h-fit">
                <h3 className="font-display font-semibold text-sm text-white">Meal Rating & Feedback</h3>
                <p className="text-xs text-slate-400">Let the kitchen supervisors know how today's food tasted.</p>

                <form onSubmit={handleFeedbackSubmit} className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Meal Service Type</label>
                    <select
                      value={mealTypeFeedback}
                      onChange={(e: any) => setMealTypeFeedback(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Food Quality Rating</label>
                    <select
                      value={mealRating}
                      onChange={(e) => setMealRating(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ Excellent Tasty Food</option>
                      <option value="4">⭐⭐⭐⭐ Healthy & Satisfactory</option>
                      <option value="3">⭐⭐⭐ Neutral / Average</option>
                      <option value="2">⭐⭐ Needs Improvement</option>
                      <option value="1">⭐ Poor Quality / Bad Taste</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Supervisors Note</label>
                    <textarea
                      required
                      value={mealFeedbackMsg}
                      onChange={(e) => setMealFeedbackMsg(e.target.value)}
                      placeholder="Tell us what you liked or how we can improve salt, spice levels, or hygiene..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white leading-relaxed"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
                  >
                    Submit Feedback
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6: REQUESTS (LEAVES & VISITORS) */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Leaves & Visitor Entry Logs</h1>
              <p className="text-xs text-slate-400">File digital requests for home leave or register visitor arrivals securely.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Leave Applications column */}
              <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div>
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-widest">Submit Leave Request</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Required for security gating when staying outside overnight.</p>
                </div>

                <form onSubmit={handleLeaveSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        value={leaveStart}
                        onChange={(e) => setLeaveStart(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        value={leaveEnd}
                        onChange={(e) => setLeaveEnd(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Reason for Leave</label>
                    <input
                      type="text"
                      required
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="e.g. Traveling home for Diwali festivals"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all"
                  >
                    Apply Leave
                  </button>
                </form>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <p className="text-xs font-semibold text-slate-300">History Log</p>
                  {leaves.length === 0 ? (
                    <p className="text-[10px] text-slate-500">No leave requests found.</p>
                  ) : (
                    leaves.map((l) => (
                      <div key={l.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-white">{l.reason}</p>
                          <p className="text-[10px] text-slate-400">{l.startDate} to {l.endDate}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          l.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                          l.status === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Visitors Request column */}
              <div className="space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div>
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-widest">Register Visitor Log</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Pre-approve family or friend visits with gating staff.</p>
                </div>

                <form onSubmit={handleVisitorSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Visitor's Full Name</label>
                      <input
                        type="text"
                        required
                        value={visName}
                        onChange={(e) => setVisName(e.target.value)}
                        placeholder="e.g. Ramesh Reddy"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Relationship</label>
                      <input
                        type="text"
                        required
                        value={visRelation}
                        onChange={(e) => setVisRelation(e.target.value)}
                        placeholder="e.g. Father, Cousin, Friend"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Visit Date</label>
                      <input
                        type="date"
                        required
                        value={visDate}
                        onChange={(e) => setVisDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Purpose of Visit</label>
                      <input
                        type="text"
                        required
                        value={visPurpose}
                        onChange={(e) => setVisPurpose(e.target.value)}
                        placeholder="e.g. Deliver hometown luggage"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all"
                  >
                    Submit Request
                  </button>
                </form>

                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <p className="text-xs font-semibold text-slate-300">Visitor Logs</p>
                  {visitors.length === 0 ? (
                    <p className="text-[10px] text-slate-500">No visitor records registered.</p>
                  ) : (
                    visitors.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex justify-between items-center text-xs">
                        <div>
                          <p className="font-semibold text-white">{v.visitorName} ({v.relationship})</p>
                          <p className="text-[10px] text-slate-400">Date: {v.visitDate}  |  {v.purpose}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          v.status === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                          v.status === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {v.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 6.5: HOSTEL FORM */}
        {activeTab === "hostel-form" && (
          <HostelApplicationForm
            user={user}
            onFormSubmit={(updatedUser) => setUser(updatedUser)}
            showToast={(msg, isError) => triggerToast(msg, isError ? "error" : "success")}
          />
        )}

        {/* TAB 7: PROFILE */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">My Profile Credentials</h1>
              <p className="text-xs text-slate-400">Keep your emergency contacts and contact information updated.</p>
            </div>

            <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-800">
                  <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-amber-500 overflow-hidden flex items-center justify-center shrink-0">
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} referrerPolicy="no-referrer" alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div className="text-center sm:text-left space-y-2">
                    <h3 className="font-display font-bold text-lg text-white">{user.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">ID: {user.id}</p>
                    <input
                      type="text"
                      placeholder="Profile Photo URL"
                      value={user.profilePhoto || ""}
                      onChange={(e) => setUser({ ...user, profilePhoto: e.target.value })}
                      className="text-xs bg-slate-950 border border-slate-800 rounded-lg p-1.5 w-full max-w-sm text-slate-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Email Address (Non-editable)</label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-slate-500 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Primary Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={user.phone}
                      onChange={(e) => setUser({ ...user, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Emergency Contact Number</label>
                    <input
                      type="tel"
                      required
                      value={user.emergencyContact || ""}
                      onChange={(e) => setUser({ ...user, emergencyContact: e.target.value })}
                      placeholder="+91 99999 99999"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Guardian info */}
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Guardian/Parent Directory</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Guardian Name</label>
                      <input
                        type="text"
                        required
                        value={user.guardianDetails?.name || ""}
                        onChange={(e) => setUser({
                          ...user,
                          guardianDetails: {
                            name: e.target.value,
                            phone: user.guardianDetails?.phone || "",
                            relationship: user.guardianDetails?.relationship || ""
                          }
                        })}
                        placeholder="Parent name"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Relationship</label>
                      <input
                        type="text"
                        required
                        value={user.guardianDetails?.relationship || ""}
                        onChange={(e) => setUser({
                          ...user,
                          guardianDetails: {
                            name: user.guardianDetails?.name || "",
                            phone: user.guardianDetails?.phone || "",
                            relationship: e.target.value
                          }
                        })}
                        placeholder="e.g. Father / Mother"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Emergency Phone</label>
                      <input
                        type="tel"
                        required
                        value={user.guardianDetails?.phone || ""}
                        onChange={(e) => setUser({
                          ...user,
                          guardianDetails: {
                            name: user.guardianDetails?.name || "",
                            phone: e.target.value,
                            relationship: user.guardianDetails?.relationship || ""
                          }
                        })}
                        placeholder="+91 98888 88888"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
