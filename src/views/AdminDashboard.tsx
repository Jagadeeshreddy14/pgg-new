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
  Search,
  Filter,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  XCircle,
  Clock,
  Settings,
  Upload,
  Download,
  Info,
  ShieldCheck,
  Eye,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Check,
  X,
  Sparkles,
  UserPlus,
  Megaphone,
  ChevronDown
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import api from "../lib/api";
import { User as UserType, Room, Bed as BedType, Booking, RentInvoice, Complaint, Notice, MessMenu, LeaveRequest, VisitorRequest, HostelSettings } from "../types";
import { useToast } from "../context/ToastContext";
import HostelApplicationForm from "../components/HostelApplicationForm";

interface AdminDashboardProps {
  user: UserType;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "rooms" | "students" | "bookings" | "payments" | "notices" | "mess" | "settings">("dashboard");
  const [stats, setStats] = useState<any>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [beds, setBeds] = useState<BedType[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<RentInvoice[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [messMenu, setMessMenu] = useState<MessMenu[]>([]);
  const [settings, setSettings] = useState<HostelSettings | null>(null);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [selectedStudentForm, setSelectedStudentForm] = useState<UserType | null>(null);

  // Search/Filters
  const [roomFilter, setRoomFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");

  // Room Form State
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomNum, setRoomNum] = useState("");
  const [roomFloor, setRoomFloor] = useState("1");
  const [roomCap, setRoomCap] = useState("2");
  const [roomRent, setRoomRent] = useState("");
  const [roomDeposit, setRoomDeposit] = useState("5000");
  const [roomAc, setRoomAc] = useState(true);
  const [roomBath, setRoomBath] = useState(true);
  const [roomBalcony, setRoomBalcony] = useState(true);
  const [roomWifi, setRoomWifi] = useState(true);
  const [roomDesc, setRoomDesc] = useState("");

  // Payment Form States
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [billingMonth, setBillingMonth] = useState("July 2026");

  // Notice Form State
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeContent, setNoticeContent] = useState("");
  const [noticePinned, setNoticePinned] = useState(false);

  // Mess Form State (Day to update)
  const [selectedMessDay, setSelectedMessDay] = useState("Monday");
  const [messBreakfast, setMessBreakfast] = useState("");
  const [messLunch, setMessLunch] = useState("");
  const [messDinner, setMessDinner] = useState("");
  const [messSpecial, setMessSpecial] = useState("");

  // Complaint Staff Assignment
  const [assignedStaffMap, setAssignedStaffMap] = useState<{ [key: string]: string }>({});

  const { toast: triggerToast } = useToast();

  // AI Bed Allocation States
  const [aiAllocations, setAiAllocations] = useState<any[]>([]);
  const [isAIAllocating, setIsAIAllocating] = useState(false);
  const [showAIAllocationReport, setShowAIAllocationReport] = useState(false);
  const [aiAllocationMsg, setAiAllocationMsg] = useState("");

  // QuickActions States
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showRegisterStudentModal, setShowRegisterStudentModal] = useState(false);
  const [showSendNoticeModal, setShowSendNoticeModal] = useState(false);

  // Student Registration States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

  const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6", "#ec4899"];

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      const [
        statsData,
        roomsData,
        bedsData,
        studentsData,
        bookingsData,
        paymentsData,
        complaintsData,
        noticesData,
        messData,
        settingsData,
        feedData,
        leavesData,
        visData
      ] = await Promise.all([
        api.get("/stats"),
        api.get("/rooms"),
        api.get("/beds"),
        api.get("/students"),
        api.get("/bookings"),
        api.get("/payments"),
        api.get("/complaints"),
        api.get("/notices"),
        api.get("/mess"),
        api.get("/settings"),
        api.get("/mess/feedbacks"),
        api.get("/leaves"),
        api.get("/visitors")
      ]);

      setStats(statsData);
      setRooms(roomsData);
      setBeds(bedsData);
      setStudents(studentsData);
      setBookings(bookingsData);
      setPayments(paymentsData);
      setComplaints(complaintsData);
      setNotices(noticesData);
      setMessMenu(messData);
      setSettings(settingsData);
      setFeedbacks(feedData);
      setLeaves(leavesData);
      setVisitors(visData);

      // Pre-populate mess edit form if selected mess day changes
      const currentDay = messData.find((m: any) => m.id === selectedMessDay);
      if (currentDay) {
        setMessBreakfast(currentDay.breakfast || "");
        setMessLunch(currentDay.lunch || "");
        setMessDinner(currentDay.dinner || "");
        setMessSpecial(currentDay.specialMeal || "");
      }
    } catch (err: any) {
      showToast("Error synchronizing admin datastore.", true);
    }
  };

  const showToast = (msg: string, isError = false) => {
    triggerToast(msg, isError ? "error" : "success");
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regPhone) {
      showToast("All fields are required for student registration.", true);
      return;
    }

    try {
      await api.post("/auth/register", {
        name: regName,
        email: regEmail.toLowerCase(),
        password: regPassword,
        phone: regPhone,
      });
      showToast(`Student ${regName} registered successfully!`);
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegPhone("");
      setShowRegisterStudentModal(false);
      fetchAdminData();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Failed to register student.";
      showToast(errMsg, true);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomNum || !roomRent) {
      showToast("Room number and Rent per bed are required.", true);
      return;
    }

    try {
      await api.post("/rooms", {
        roomNumber: roomNum,
        floor: Number(roomFloor),
        capacity: Number(roomCap),
        isAc: roomAc,
        hasAttachedBathroom: roomBath,
        hasBalcony: roomBalcony,
        hasWifi: roomWifi,
        monthlyRent: Number(roomRent),
        deposit: Number(roomDeposit),
        description: roomDesc
      });
      showToast("Room created and Bed Nodes initialized successfully.");
      setRoomNum("");
      setRoomDesc("");
      setShowRoomModal(false);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this room and all its assigned Bed nodes? This cannot be undone.")) return;
    try {
      await api.delete(`/rooms/${roomId}`);
      showToast("Room deleted from active buildings.");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleBedVacate = async (bedId: string) => {
    if (!window.confirm("Are you sure you want to vacate this bed occupant?")) return;
    try {
      await api.post("/beds/vacate", { bedId });
      showToast("Occupant vacated successfully.");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleToggleBlockStudent = async (studentId: string, currentBlocked: boolean) => {
    try {
      await api.put(`/students/${studentId}/block`, { isBlocked: !currentBlocked });
      showToast(`Student credentials ${!currentBlocked ? "SUSPENDED" : "RE-ACTIVATED"}.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleVerifyDocuments = async (studentId: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/students/${studentId}/documents`, {
        documentStatus: status,
        documentNotes: status === "approved" ? "Documents meet standard guidelines." : "Documents are illegible or expired. Please upload high-res proofs."
      });
      showToast(`Student identification documentation ${status.toUpperCase()}.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleVerifyBooking = async (bookingId: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/bookings/${bookingId}/status`, { status });
      showToast(`Booking request ${status.toUpperCase()}. Bed node allocated.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleVerifyPayment = async (invoiceId: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/payments/${invoiceId}/verify`, {
        status,
        rejectReason: status === "rejected" ? rejectReason : ""
      });
      showToast(`Rent payment receipt verification ${status.toUpperCase()}.`);
      setRejectReason("");
      setShowRejectModal(null);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleGenerateMonthlyRent = async () => {
    try {
      const res = await api.post("/payments/generate-monthly", { month: billingMonth });
      showToast(res.message);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle || !noticeContent) {
      showToast("Title and content are required.", true);
      return;
    }

    try {
      await api.post("/notices", {
        title: noticeTitle,
        content: noticeContent,
        isPinned: noticePinned
      });
      showToast("Announcement published & pushed to all resident nodes.");
      setNoticeTitle("");
      setNoticeContent("");
      setNoticePinned(false);
      setShowSendNoticeModal(false);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleDeleteNotice = async (noticeId: string) => {
    try {
      await api.delete(`/notices/${noticeId}`);
      showToast("Announcement retracted.");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleUpdateMessMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.put(`/mess/${selectedMessDay}`, {
        breakfast: messBreakfast,
        lunch: messLunch,
        dinner: messDinner,
        specialMeal: messSpecial
      });
      showToast(`Mess menu for ${selectedMessDay} updated successfully.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      await api.put("/settings", settings);
      showToast("UPI Banking & Hostel Configurations updated.");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleAssignStaff = async (complaintId: string) => {
    const staffName = assignedStaffMap[complaintId];
    if (!staffName) return;
    try {
      await api.put(`/complaints/${complaintId}`, {
        staffAssigned: staffName,
        status: "in-progress",
        updateNote: `Technician assigned: ${staffName}`
      });
      showToast("Maintenance staff assigned & dispatched.");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleResolveComplaint = async (complaintId: string) => {
    try {
      await api.put(`/complaints/${complaintId}`, {
        status: "resolved",
        updateNote: "Resolution completed. Facility inspected."
      });
      showToast("Complaint marked as completed & resolved.");
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleLeaveAction = async (leaveId: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/leaves/${leaveId}`, { status });
      showToast(`Leave application ${status.toUpperCase()}.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleVisitorAction = async (visitorId: string, status: "approved" | "rejected") => {
    try {
      await api.put(`/visitors/${visitorId}`, { status });
      showToast(`Visitor registration request ${status.toUpperCase()}.`);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message, true);
    }
  };

  const handleRunAIAllocation = async () => {
    setIsAIAllocating(true);
    try {
      const res = await api.post("/beds/auto-allocate");
      setAiAllocations(res.allocations || []);
      setAiAllocationMsg(res.message || "");
      if (res.allocations && res.allocations.length > 0) {
        setShowAIAllocationReport(true);
        showToast(res.message || "AI Optimizer mapped compatible roommates!");
      } else {
        showToast("No pending bookings found to allocate.", true);
      }
    } catch (err: any) {
      showToast(err.message || "Failed to trigger AI Bed Optimizer.", true);
    } finally {
      setIsAIAllocating(false);
    }
  };

  const handleConfirmAIAllocation = async () => {
    try {
      const res = await api.post("/beds/auto-allocate/confirm", {
        allocations: aiAllocations
      });
      showToast(res.message || "Successfully confirmed AI allocations!");
      setShowAIAllocationReport(false);
      setAiAllocations([]);
      fetchAdminData();
    } catch (err: any) {
      showToast(err.message || "Failed to finalize AI allocations.", true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center font-display font-bold text-slate-950">
            SS
          </div>
          <div>
            <h2 className="font-display font-bold text-sm leading-tight text-white">Srinivasa Hostel</h2>
            <p className="text-[10px] tracking-wider text-amber-500 font-semibold uppercase">Warden Portal</p>
          </div>
        </div>

        {/* Warden Badge */}
        <div className="p-4 mx-4 my-4 rounded-2xl bg-slate-950/60 border border-slate-800/40 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-white truncate">Warden Office</h4>
            <p className="text-[10px] text-emerald-400 font-mono flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
              Online Node
            </p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 space-y-1.5 pb-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "dashboard" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Overview Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab("rooms")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "rooms" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Bed className="w-4 h-4" />
            <span>Rooms & Beds</span>
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "students" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Resident Directory</span>
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "bookings" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Booking Requests</span>
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "payments" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Rent roll & UPI</span>
          </button>
          <button
            onClick={() => setActiveTab("notices")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "notices" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notice Board</span>
          </button>
          <button
            onClick={() => setActiveTab("mess")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "mess" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Kitchen Mess</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeTab === "settings" ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Hostel Settings</span>
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

      {/* Main Panel View */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">

        {/* Global Admin Header with Quick Actions */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 mb-6 border-b border-slate-900 gap-4" id="admin-global-header">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-amber-500 animate-pulse" />
              <span className="text-[10px] tracking-wider text-slate-400 font-mono uppercase">
                Secure Warden Console
              </span>
            </div>
            <h2 className="text-xl font-bold font-display text-white mt-1">
              Welcome back, <span className="text-amber-500">{user.name}</span>
            </h2>
          </div>

          {/* Quick Actions Dropdown */}
          <div className="relative shrink-0" id="quick-actions-dropdown">
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 cursor-pointer shadow-lg active:scale-95 hover:shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Quick Actions</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-950 transition-transform ${showQuickActions ? "rotate-180" : ""}`} />
            </button>

            {showQuickActions && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowQuickActions(false)} 
                />
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="px-3 py-1.5 border-b border-slate-850 mb-1">
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Warden Operations</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowQuickActions(false);
                      setActiveTab("rooms");
                      setShowRoomModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center space-x-2.5 transition-all"
                  >
                    <Bed className="w-4 h-4 text-amber-500" />
                    <span>Add Room</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickActions(false);
                      setShowRegisterStudentModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center space-x-2.5 transition-all"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-500" />
                    <span>Register Student</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowQuickActions(false);
                      setShowSendNoticeModal(true);
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 flex items-center space-x-2.5 transition-all"
                  >
                    <Megaphone className="w-4 h-4 text-sky-500" />
                    <span>Send Notice</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === "dashboard" && stats && (
          <div className="space-y-8">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5" /> Warden Audit Control
              </span>
              <h1 className="font-display font-bold text-2xl text-white mt-1">Srinivasa Command Center</h1>
              <p className="text-xs text-slate-400">Review real-time occupancy counts, collection metrics, and maintenance states.</p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Total Residents</p>
                <h3 className="text-2xl font-bold font-display text-white mt-1">{stats.cards.totalStudents}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{stats.cards.activeStudents} actively checked-in</p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Bed Occupancy</p>
                <h3 className="text-2xl font-bold font-display text-white mt-1">{stats.cards.occupancyRate}%</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">{stats.cards.occupiedBeds} of {stats.cards.totalBeds} beds occupied</p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Monthly Revenue</p>
                <h3 className="text-2xl font-bold font-display text-emerald-400 mt-1">₹{stats.cards.monthlyRevenue.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Cleared & deposited dues</p>
              </div>

              <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Pending Collections</p>
                <h3 className="text-2xl font-bold font-display text-amber-400 mt-1">₹{stats.cards.pendingPayments.toLocaleString()}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Pending verification / unsubmitted</p>
              </div>

            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Chart 1: Revenue */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-widest">Revenue Collection Trend (INR)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.charts.monthlyRevenueChart}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Area type="monotone" dataKey="revenue" stroke="#f59e0b" fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Room Occupancy Status */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-widest">Building Room Allocation Breakdown</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.roomOccupancyChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Bar dataKey="occupied" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capacity" fill="#1e293b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Complaint Categories */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-widest">Maintenance Category Breakdown</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.charts.complaintAnalyticsChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Resident Growth */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="font-display font-semibold text-sm text-white mb-4 uppercase tracking-widest">Student Enrollment curve</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.charts.studentGrowthChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} />
                      <YAxis stroke="#64748b" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b" }} />
                      <Area type="monotone" dataKey="students" stroke="#10b981" fill="#10b981" fillOpacity={0.05} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: ROOMS & BEDS */}
        {activeTab === "rooms" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-bold text-2xl text-white">Beds & Rooms Manager</h1>
                <p className="text-xs text-slate-400">Initialize building rooms and control individual bed nodes.</p>
              </div>

              <button
                onClick={() => setShowRoomModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all flex items-center space-x-1.5 self-start cursor-pointer shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Initialize Room</span>
              </button>
            </div>

            {/* Room Form Dialog Modal */}
            {showRoomModal && (
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4">
                  <h3 className="font-display font-semibold text-lg text-white">Initialize Room</h3>
                  <form onSubmit={handleCreateRoom} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Room Number</label>
                        <input
                          type="text"
                          required
                          value={roomNum}
                          onChange={(e) => setRoomNum(e.target.value)}
                          placeholder="e.g. 101"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Floor Level</label>
                        <select
                          value={roomFloor}
                          onChange={(e) => setRoomFloor(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        >
                          <option value="1">Floor 1</option>
                          <option value="2">Floor 2</option>
                          <option value="3">Floor 3</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Bed Capacity</label>
                        <select
                          value={roomCap}
                          onChange={(e) => setRoomCap(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        >
                          <option value="1">Single Sharing</option>
                          <option value="2">Double Sharing</option>
                          <option value="3">Triple Sharing</option>
                          <option value="4">Four Sharing</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Monthly Rent per Bed</label>
                        <input
                          type="number"
                          required
                          value={roomRent}
                          onChange={(e) => setRoomRent(e.target.value)}
                          placeholder="Rent (INR)"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Security Deposit</label>
                        <input
                          type="number"
                          value={roomDeposit}
                          onChange={(e) => setRoomDeposit(e.target.value)}
                          placeholder="Deposit"
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                        />
                      </div>
                    </div>

                    {/* Checkbox Amenities */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                      <label className="flex items-center space-x-2 text-slate-300">
                        <input type="checkbox" checked={roomAc} onChange={(e) => setRoomAc(e.target.checked)} className="rounded border-slate-800" />
                        <span>Air Conditioning (AC)</span>
                      </label>
                      <label className="flex items-center space-x-2 text-slate-300">
                        <input type="checkbox" checked={roomBath} onChange={(e) => setRoomBath(e.target.checked)} className="rounded border-slate-800" />
                        <span>Attached Bathroom</span>
                      </label>
                      <label className="flex items-center space-x-2 text-slate-300">
                        <input type="checkbox" checked={roomBalcony} onChange={(e) => setRoomBalcony(e.target.checked)} className="rounded border-slate-800" />
                        <span>Balcony</span>
                      </label>
                      <label className="flex items-center space-x-2 text-slate-300">
                        <input type="checkbox" checked={roomWifi} onChange={(e) => setRoomWifi(e.target.checked)} className="rounded border-slate-800" />
                        <span>High-Speed Wi-Fi</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Room Description</label>
                      <textarea
                        value={roomDesc}
                        onChange={(e) => setRoomDesc(e.target.value)}
                        placeholder="Provide details about natural ventilation, furniture..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                        rows={2}
                      />
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRoomModal(false)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold"
                      >
                        Create Room
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* List active rooms and associated beds */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {rooms.map((room) => {
                const associatedBeds = beds.filter((b) => b.roomId === room.id);
                return (
                  <div key={room.id} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-display font-bold text-lg text-white">Room {room.roomNumber}</h3>
                        <p className="text-xs text-slate-400">Floor {room.floor}  |  ₹{room.monthlyRent}/bed</p>
                      </div>

                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        className="p-1.5 bg-slate-950 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Beds map */}
                    <div className="grid grid-cols-2 gap-3">
                      {associatedBeds.map((bed) => (
                        <div key={bed.id} className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                          bed.isOccupied ? "bg-amber-500/10 border-amber-500/30 text-amber-300" : "bg-slate-950/60 border-slate-800 text-slate-400"
                        }`}>
                          <div>
                            <p className="font-mono font-semibold">{bed.bedNumber}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                              {bed.isOccupied ? bed.occupantName : "Vacant bed space"}
                            </p>
                          </div>

                          {bed.isOccupied && (
                            <button
                              onClick={() => handleBedVacate(bed.id)}
                              className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500 hover:text-white transition-all text-[9px] font-bold rounded-lg text-rose-300 cursor-pointer"
                            >
                              Vacate
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: RESIDENTS DIRECTORY */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Resident Profiles Directory</h1>
              <p className="text-xs text-slate-400">Review student profiles, documents status, and block access credentials.</p>
            </div>

            {/* Filter Search */}
            <div className="flex max-w-sm">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by student name..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-850 rounded-xl text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Resident Directory List */}
            <div className="space-y-4">
              {students
                .filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                .map((student) => (
                  <div key={student.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-slate-850 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {student.profilePhoto ? (
                            <img src={student.profilePhoto} referrerPolicy="no-referrer" alt="profile" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-6 h-6 text-amber-500" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{student.name}</h3>
                          <p className="text-[10px] text-slate-400">Email: {student.email}  |  Phone: {student.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {student.hostelForm ? (
                          <button
                            onClick={() => setSelectedStudentForm(student)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Admission Form
                          </button>
                        ) : (
                          <span className="text-[10px] bg-slate-800 text-slate-500 px-2.5 py-1.5 rounded-xl font-medium">
                            Form Pending
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleBlockStudent(student.id, student.isBlocked)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                            student.isBlocked ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500" : "bg-rose-500/20 text-rose-400 hover:bg-rose-500"
                          }`}
                        >
                          {student.isBlocked ? "Re-activate" : "Block"}
                        </button>
                      </div>
                    </div>

                    {/* Document verification details */}
                    <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 text-xs text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-semibold text-slate-500">Identity Details</p>
                        <p>Aadhaar: <span className="font-mono text-white">{student.aadhaar || "No Proof Uploaded"}</span></p>
                        <p>PAN Card: <span className="font-mono text-white">{student.pan || "No Proof Uploaded"}</span></p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase font-semibold text-slate-500">Document Gating Audit</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            student.documentStatus === "approved" ? "bg-emerald-500/10 text-emerald-400" :
                            student.documentStatus === "rejected" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {student.documentStatus || "none"}
                          </span>

                          {student.documentStatus === "pending" && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleVerifyDocuments(student.id, "approved")}
                                className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold text-[10px] rounded hover:bg-emerald-400 transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyDocuments(student.id, "rejected")}
                                className="px-2 py-0.5 bg-rose-500 text-white font-bold text-[10px] rounded hover:bg-rose-450 transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: BOOKING REQUESTS */}
        {activeTab === "bookings" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Booking Requests Command</h1>
              <p className="text-xs text-slate-400">Review and verify registrations before bedroom allocation.</p>
            </div>

            {bookings.filter(b => b.status === "pending").length > 0 && (
              <div className="p-6 bg-gradient-to-r from-amber-500/20 via-slate-900 to-slate-900 border border-amber-500/30 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <h3 className="font-display font-semibold text-white text-base flex items-center">
                      <Sparkles className="w-5 h-5 text-amber-400 mr-2 animate-pulse" />
                      Smart AI Bed Allocation Optimizer
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xl">
                      There are currently <strong className="text-amber-400">{bookings.filter(b => b.status === "pending").length}</strong> pending booking requests. Run the AI allocation engine to automatically analyze roommate compatibility, sleep schedules, AC preferences, and friends requested to optimize bedroom assignments!
                    </p>
                  </div>
                  <button
                    onClick={handleRunAIAllocation}
                    disabled={isAIAllocating}
                    className="w-full md:w-auto shrink-0 px-6 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 text-slate-950 font-bold text-xs rounded-2xl flex items-center justify-center space-x-2 shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    {isAIAllocating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                        <span>Optimizing Placements...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950" />
                        <span>Run AI Auto-Allocation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {bookings.length === 0 ? (
                <p className="text-xs text-slate-500 py-6">No active booking requests registered.</p>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-display font-semibold text-white text-base">Booking #{booking.id.toUpperCase()}</h3>
                      <p className="text-xs text-slate-400 mt-1">Student: <strong className="text-white">{booking.studentName}</strong> ({booking.studentEmail})</p>
                      <p className="text-xs text-slate-400">Target Room: <strong className="text-amber-400">Room {booking.roomNumber}</strong>  |  Date: {booking.checkInDate}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          booking.status === "approved" || booking.status === "checked-in" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    {booking.status === "pending" && (
                      <div className="flex space-x-2 w-full md:w-auto">
                        <button
                          onClick={() => handleVerifyBooking(booking.id, "approved")}
                          className="flex-1 md:flex-initial px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Approve & Allocate
                        </button>
                        <button
                          onClick={() => handleVerifyBooking(booking.id, "rejected")}
                          className="flex-1 md:flex-initial px-4 py-2 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: RENT ROLL & UPI REVENUE VERIFICATION */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="font-display font-bold text-2xl text-white">Rent roll & UPI Ledger</h1>
                <p className="text-xs text-slate-400">Verify screenshots, match UTR numbers, and dispatch automatic invoices.</p>
              </div>

              {/* Automatic Rent Generator bar */}
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-2xl shrink-0">
                <input
                  type="text"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  placeholder="e.g. July 2026"
                  className="bg-slate-950 border border-slate-850 text-xs text-white p-1.5 rounded-lg w-28 text-center focus:outline-none"
                />
                <button
                  onClick={handleGenerateMonthlyRent}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg cursor-pointer"
                >
                  Generate Invoice Roll
                </button>
              </div>
            </div>

            {/* List outstanding student transactions */}
            <div className="space-y-4">
              {payments.length === 0 ? (
                <p className="text-xs text-slate-500 py-6">No rent ledger records.</p>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-semibold text-white">{p.studentName} - {p.month} Rent</h4>
                        <p className="text-xs text-slate-400">Allocated bed: {p.roomNumber}-{p.bedNumber}  |  Amount: <strong className="text-white">₹{p.amount}</strong></p>
                        <div className="mt-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            p.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                            p.status === "submitted" ? "bg-amber-500/10 text-amber-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {p.status}
                          </span>
                        </div>
                      </div>

                      {p.status === "submitted" && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleVerifyPayment(p.id, "approved")}
                            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setShowRejectModal(p.id)}
                            className="px-3.5 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expand verification file */}
                    {p.status === "submitted" && (
                      <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-850 text-xs text-slate-400 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase font-semibold text-slate-500">Banking Match</p>
                          <p>UTR Number: <span className="font-mono text-amber-300 font-semibold">{p.utrNumber}</span></p>
                          <p>Paid Date: <span className="text-white">{p.paidDate}</span></p>
                          <p>Remarks: <span className="text-slate-300 italic">"{p.remarks || "none"}"</span></p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase font-semibold text-slate-500 mb-1.5">Warden Receipt Upload</p>
                          {p.paymentScreenshot ? (
                            <div className="relative group w-28 h-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-900">
                              <img src={p.paymentScreenshot} alt="screenshot" className="w-full h-full object-cover" />
                              <a href={p.paymentScreenshot} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-4 h-4 text-white" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-mono">No Screenshot File</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Reject Payment modal reasoning */}
            {showRejectModal && (
              <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
                <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-sm w-full space-y-4">
                  <h3 className="font-display font-semibold text-white">Reject Rent Receipt</h3>
                  <p className="text-xs text-slate-400">Provide feedback explanation so the resident can re-upload correctly.</p>
                  <textarea
                    required
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., UTR code doesn't exist on banking registry or image is blurry..."
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-2.5 text-xs text-white"
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowRejectModal(null)}
                      className="flex-1 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleVerifyPayment(showRejectModal, "rejected")}
                      className="flex-1 py-2 bg-rose-500 hover:bg-rose-450 text-white rounded-xl text-xs font-bold"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: NOTICE BOARD EDITOR */}
        {activeTab === "notices" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Warden Notice Board</h1>
              <p className="text-xs text-slate-400">Publish or retract public announcements on the resident dashboard screens.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Post Announcement Form */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4">
                <h3 className="font-display font-semibold text-sm text-white">Create Notice</h3>
                <form onSubmit={handlePostNotice} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      value={noticeTitle}
                      onChange={(e) => setNoticeTitle(e.target.value)}
                      placeholder="e.g. Roof-top geysers maintenance hours"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Notice Description</label>
                    <textarea
                      required
                      value={noticeContent}
                      onChange={(e) => setNoticeContent(e.target.value)}
                      placeholder="Write detailed announcements..."
                      rows={5}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white leading-relaxed"
                    />
                  </div>

                  <label className="flex items-center space-x-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={noticePinned}
                      onChange={(e) => setNoticePinned(e.target.checked)}
                      className="rounded border-slate-800 text-amber-500"
                    />
                    <span>Pin notice to the top level position</span>
                  </label>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Publish Announcement
                  </button>
                </form>
              </div>

              {/* Active Notices list */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 font-display">Published board</h3>
                
                {notices.length === 0 ? (
                  <p className="text-xs text-slate-500">No public notices published.</p>
                ) : (
                  <div className="space-y-3">
                    {notices.map((n) => (
                      <div key={n.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center">
                            {n.isPinned && <span className="text-amber-400 mr-1">📌 [PINNED]</span>}
                            {n.title}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed mt-1">{n.content}</p>
                          <p className="text-[9px] text-slate-500 mt-2 font-mono">Dispatched by: {n.author}</p>
                        </div>

                        <button
                          onClick={() => handleDeleteNotice(n.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 7: KITCHEN MESS MANAGER */}
        {activeTab === "mess" && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Hygienic Mess Gating</h1>
              <p className="text-xs text-slate-400">Configure South Indian standard menus and check aggregate reviews.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Edit Day Menu form */}
              <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 space-y-4 h-fit">
                <h3 className="font-display font-semibold text-sm text-white">Edit Day Meal Plan</h3>
                
                <form onSubmit={handleUpdateMessMenu} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Target Week Day</label>
                    <select
                      value={selectedMessDay}
                      onChange={(e) => setSelectedMessDay(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Breakfast Plan</label>
                    <input
                      type="text"
                      required
                      value={messBreakfast}
                      onChange={(e) => setMessBreakfast(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Lunch Plan</label>
                    <input
                      type="text"
                      required
                      value={messLunch}
                      onChange={(e) => setMessLunch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Dinner Plan</label>
                    <input
                      type="text"
                      required
                      value={messDinner}
                      onChange={(e) => setMessDinner(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sunday / Holiday Special Meals</label>
                    <input
                      type="text"
                      value={messSpecial}
                      onChange={(e) => setMessSpecial(e.target.value)}
                      placeholder="e.g. Special Chicken Biryani"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Confirm Menu Save
                  </button>
                </form>
              </div>

              {/* Feedbacks Column */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-300 font-display">Resident Reviews</h3>

                {feedbacks.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6">No food reviews logged today.</p>
                ) : (
                  <div className="space-y-3">
                    {feedbacks.map((f) => (
                      <div key={f.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                        <div className="flex justify-between items-center text-xs">
                          <p className="font-semibold text-white">{f.studentName}</p>
                          <p className="font-mono text-amber-400">Rating: {f.rating}/5 ⭐</p>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1 italic">"{f.feedback}"</p>
                        <p className="text-[9px] text-slate-500 font-mono mt-2">Service: {f.mealType.toUpperCase()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 8: HOSTEL GENERAL SETTINGS */}
        {activeTab === "settings" && settings && (
          <div className="space-y-6">
            <div>
              <h1 className="font-display font-bold text-2xl text-white">Hostel general settings</h1>
              <p className="text-xs text-slate-400">Configure central hostel branding, address, rules, and UPI configurations.</p>
            </div>

            <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
              <form onSubmit={handleUpdateSettings} className="space-y-6">
                
                <div className="space-y-4 text-xs">
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider">Hostel Metadata</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Hostel Name</label>
                      <input
                        type="text"
                        required
                        value={settings.hostelName}
                        onChange={(e) => setSettings({ ...settings, hostelName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Contact Phone</label>
                      <input
                        type="tel"
                        required
                        value={settings.contactPhone}
                        onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">GCP/Hostel Physical Location</label>
                    <input
                      type="text"
                      required
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* UPI CONFIGURATIONS */}
                <div className="pt-6 border-t border-slate-800 space-y-4 text-xs">
                  <h3 className="font-display font-bold text-sm text-white uppercase tracking-wider flex items-center">
                    <CreditCard className="w-4 h-4 mr-2 text-amber-500" />
                    Central UPI Payments Merchant Gating
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Warden UPI ID</label>
                      <input
                        type="text"
                        required
                        value={settings.upiId}
                        onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                        placeholder="srisrinivasahostel@ibl"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Merchant Name</label>
                      <input
                        type="text"
                        required
                        value={settings.merchantName}
                        onChange={(e) => setSettings({ ...settings, merchantName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Account Holder Name</label>
                      <input
                        type="text"
                        required
                        value={settings.accountHolderName}
                        onChange={(e) => setSettings({ ...settings, accountHolderName: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">Default Payment Note</label>
                      <input
                        type="text"
                        required
                        value={settings.paymentNote}
                        onChange={(e) => setSettings({ ...settings, paymentNote: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Warden Gating Payment Instructions</label>
                    <textarea
                      value={settings.paymentInstructions}
                      onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
                  >
                    Save Hostel Config
                  </button>
                </div>

              </form>
            </div>
          </div>
        )}

      </main>

      {/* AI Allocation Report Modal */}
      {showAIAllocationReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-2xl w-full max-h-[85vh] flex flex-col space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">AI Optimization Mappings</h3>
                  <p className="text-[10px] text-slate-400">{aiAllocationMsg || "Optimal room allocations computed by Srinivasa AI."}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAIAllocationReport(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 flex-1 space-y-3">
              {aiAllocations.map((alloc, i) => (
                <div key={i} className="p-4 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-slate-400">Student Booking Request</p>
                    <p className="text-sm font-semibold text-white">{alloc.studentName}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded-lg border border-indigo-500/10">
                        Assigned Room {alloc.roomNumber} - Bed {alloc.bedNumber}
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-lg border border-emerald-500/10 flex items-center">
                        <Sparkles className="w-3 h-3 mr-0.5" /> {alloc.compatibilityScore}% Compatibility
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 italic mt-2">"{alloc.reasoning}"</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 pt-4 flex space-x-3">
              <button
                onClick={() => setShowAIAllocationReport(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
              >
                Cancel & Decline
              </button>
              <button
                onClick={handleConfirmAIAllocation}
                className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-lg hover:shadow-amber-500/10"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>Apply AI Allocations</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Student Dialog Modal */}
      {showRegisterStudentModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">Register Student</h3>
                  <p className="text-[10px] text-slate-400">Add a new resident profile record to the system.</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegisterStudentModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterStudent} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. rahul@college.edu"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRegisterStudentModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Register Resident</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Notice Dialog Modal */}
      {showSendNoticeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 max-w-md w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-sky-500/10 rounded-xl text-sky-400">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-white">Send Notice</h3>
                  <p className="text-[10px] text-slate-400">Post a new announcement to all resident nodes.</p>
                </div>
              </div>
              <button
                onClick={() => setShowSendNoticeModal(false)}
                className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePostNotice} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g. Maintenance hours announcement"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Notice Description</label>
                <textarea
                  required
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Write detailed announcements..."
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white leading-relaxed"
                />
              </div>

              <label className="flex items-center space-x-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={noticePinned}
                  onChange={(e) => setNoticePinned(e.target.checked)}
                  className="rounded border-slate-800 text-amber-500"
                />
                <span>Pin notice to the top level position</span>
              </label>

              <div className="border-t border-slate-800 pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowSendNoticeModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center space-x-2 shadow-lg"
                >
                  <Check className="w-4 h-4 text-slate-950" />
                  <span>Publish Notice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Hostel Form Overlay Modal */}
      {selectedStudentForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 max-w-4xl w-full p-6 space-y-4 shadow-2xl relative my-8 print:border-none print:shadow-none print:p-0 print:my-0 print:bg-white">
            <button
              onClick={() => setSelectedStudentForm(null)}
              className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer z-10 print:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[85vh] overflow-y-auto pr-2 print:max-h-none print:overflow-visible print:pr-0">
              <HostelApplicationForm
                user={selectedStudentForm}
                readOnly={true}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
