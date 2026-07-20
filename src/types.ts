export type UserRole = "admin" | "student";

export interface HostelForm {
  dateOfJoining?: string;
  fatherName?: string;
  motherName?: string;
  permanentAddress?: string;
  phoneHouse?: string;
  cellPersonal?: string;
  studentInstitution?: string;
  studentInstAddress?: string;
  studentCourse?: string;
  studentTimings?: string;
  isEmployee?: boolean;
  employeeCompany?: string;
  employeeCompAddress?: string;
  employeeDesignation?: string;
  employeeTimings?: string;
  agreedToRules?: boolean;
  signature?: string;
  submittedAt?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface ImportedDocument {
  id: string;
  type: string;
  documentNumber: string;
  issuer: string;
  issueDate: string;
  status: "pending" | "verified" | "rejected" | "manual_review";
  importDate: string;
  documentUrl?: string;
}


export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  isBlocked: boolean;
  profilePhoto?: string;
  emergencyContact?: string;
  guardianDetails?: {
    name: string;
    phone: string;
    relationship: string;
  };
  currentRoomId?: string;
  currentRoomNumber?: string;
  currentBedId?: string;
  currentBedNumber?: string;
  
  // Legacy document fields
  aadhaar?: string;
  pan?: string;
  collegeId?: string;
  parentIdProof?: string;
  documentStatus: "pending" | "approved" | "rejected" | "none";
  documentSource?: "Manual" | "none";
  documentNotes?: string;
  
  importedDocuments?: ImportedDocument[];

  hostelForm?: HostelForm;
  createdAt: string;
}

export interface Room {
  id: string;
  buildingName?: string;
  roomNumber: string;
  floor: number;
  capacity: number;
  availableBeds: number;
  occupiedBeds: number;
  isAc: boolean;
  hasAttachedBathroom: boolean;
  hasBalcony: boolean;
  hasWifi: boolean;
  images: string[];
  monthlyRent: number;
  deposit: number;
  status: "available" | "full" | "maintenance";
  description: string;
}

export interface Bed {
  id: string;
  roomId: string;
  roomNumber: string;
  bedNumber: string;
  isOccupied: boolean;
  occupantId?: string;
  occupantName?: string;
}

export type BookingStatus = "pending" | "approved" | "rejected" | "cancelled" | "checked-in" | "checked-out";

export interface Booking {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  roomId: string;
  roomNumber: string;
  bedId?: string;
  bedNumber?: string;
  checkInDate: string;
  status: BookingStatus;
  documents?: {
    aadhaar?: string;
    pan?: string;
    collegeId?: string;
  };
  createdAt: string;
}

export type PaymentStatus = "pending" | "paid" | "submitted" | "approved" | "rejected";

export interface RentInvoice {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber: string;
  bedNumber: string;
  month: string; // e.g., "July 2026"
  amount: number;
  dueDate: string;
  fine: number;
  status: PaymentStatus;
  paymentScreenshot?: string;
  utrNumber?: string;
  paidDate?: string;
  remarks?: string;
  rejectReason?: string;
  createdAt: string;
}

export type ComplaintStatus = "open" | "in-progress" | "resolved" | "closed";

export interface Complaint {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber?: string;
  title: string;
  description: string;
  category: "plumbing" | "electrical" | "wifi" | "cleaning" | "mess" | "other";
  status: ComplaintStatus;
  images?: string[];
  staffAssigned?: string;
  createdAt: string;
  updates?: {
    status: ComplaintStatus;
    note: string;
    date: string;
    updatedBy: string;
  }[];
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  author: string;
}

export interface MessMenu {
  id: string; // Day of the week (e.g. "Monday")
  breakfast: string;
  lunch: string;
  dinner: string;
  specialMeal?: string;
}

export interface MealFeedback {
  id: string;
  studentId: string;
  studentName: string;
  mealType: "breakfast" | "lunch" | "dinner";
  rating: number;
  feedback: string;
  date: string;
}

export interface LeaveRequest {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber?: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface VisitorRequest {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber?: string;
  visitorName: string;
  relationship: string;
  visitDate: string;
  purpose: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface AttendanceLog {
  id: string;
  studentId: string;
  studentName: string;
  roomNumber?: string;
  date: string;
  status: "present" | "absent" | "late";
  checkInTime?: string;
  checkOutTime?: string;
}

export interface HostelSettings {
  hostelName: string;
  logoUrl?: string;
  address: string;
  contactPhone: string;
  contactEmail: string;
  rules: string[];
  faqs: { question: string; answer: string }[];
  upiId: string;
  merchantName: string;
  accountHolderName: string;
  paymentNote: string;
  paymentInstructions: string;
  upiEnabled: boolean;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
