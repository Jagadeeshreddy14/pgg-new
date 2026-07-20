import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Printer, 
  ShieldCheck, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  User as UserIcon, 
  Users, 
  Building, 
  Signature, 
  Sparkles, 
  Heart, 
  Info, 
  Smartphone,
  MapPin,
  Calendar,
  Contact2
} from "lucide-react";
import { User, HostelForm } from "../types";
import api from "../lib/api";

interface HostelApplicationFormProps {
  user: User;
  onFormSubmit?: (updatedUser: User) => void;
  showToast?: (msg: string, isError?: boolean) => void;
  readOnly?: boolean;
}

export default function HostelApplicationForm({ 
  user, 
  onFormSubmit, 
  showToast, 
  readOnly = false 
}: HostelApplicationFormProps) {
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [viewMode, setViewMode] = useState<"step" | "print">(readOnly ? "print" : "step");

  // Step 1: Personal Details
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [cellPersonal, setCellPersonal] = useState("");
  
  // Step 2: Parent / Guardian
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [permanentAddress, setPermanentAddress] = useState("");
  const [phoneHouse, setPhoneHouse] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianRelation, setGuardianRelation] = useState("");

  // Step 3: Emergency Info
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");

  // Step 4: Occupation Details
  const [isEmployee, setIsEmployee] = useState(false);
  const [studentInstitution, setStudentInstitution] = useState("");
  const [studentInstAddress, setStudentInstAddress] = useState("");
  const [studentCourse, setStudentCourse] = useState("");
  const [studentTimings, setStudentTimings] = useState("");
  const [employeeCompany, setEmployeeCompany] = useState("");
  const [employeeCompAddress, setEmployeeCompAddress] = useState("");
  const [employeeDesignation, setEmployeeDesignation] = useState("");
  const [employeeTimings, setEmployeeTimings] = useState("");

  // Step 5: Rules & Agreement
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [signatureText, setSignatureText] = useState("");
  const [signatureStyle, setSignatureStyle] = useState("font-handwritten");

  // Form errors tracking for highlighting fields
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate existing data
  useEffect(() => {
    // Standard user fields
    setCellPersonal(user.phone || "");
    
    if (user.guardianDetails) {
      setGuardianName(user.guardianDetails.name || "");
      setGuardianPhone(user.guardianDetails.phone || "");
      setGuardianRelation(user.guardianDetails.relationship || "");
    }
    
    if (user.emergencyContact) {
      // Emergency contact is saved as a single string, parse it if possible
      const parts = user.emergencyContact.split(" - ");
      if (parts.length >= 2) {
        setEmergencyContactName(parts[0] || "");
        setEmergencyContactPhone(parts[1] || "");
        setEmergencyContactRelation(parts[2] || "Emergency");
      } else {
        setEmergencyContactName(user.emergencyContact);
      }
    }

    if (user.hostelForm) {
      const f = user.hostelForm;
      setDateOfJoining(f.dateOfJoining || "");
      setFatherName(f.fatherName || "");
      setMotherName(f.motherName || "");
      setPermanentAddress(f.permanentAddress || "");
      setPhoneHouse(f.phoneHouse || "");
      setCellPersonal(f.cellPersonal || user.phone || "");
      
      setGuardianName(f.guardianName || user.guardianDetails?.name || "");
      setGuardianPhone(f.guardianPhone || user.guardianDetails?.phone || "");
      setGuardianRelation(f.guardianRelation || user.guardianDetails?.relationship || "");
      
      setEmergencyContactName(f.emergencyContactName || "");
      setEmergencyContactPhone(f.emergencyContactPhone || "");
      setEmergencyContactRelation(f.emergencyContactRelation || "Emergency");

      setStudentInstitution(f.studentInstitution || "");
      setStudentInstAddress(f.studentInstAddress || "");
      setStudentCourse(f.studentCourse || "");
      setStudentTimings(f.studentTimings || "");

      setIsEmployee(f.isEmployee || false);
      setEmployeeCompany(f.employeeCompany || "");
      setEmployeeCompAddress(f.employeeCompAddress || "");
      setEmployeeDesignation(f.employeeDesignation || "");
      setEmployeeTimings(f.employeeTimings || "");

      setAgreedToRules(f.agreedToRules || false);
      setSignatureText(f.signature || "");
    }
  }, [user]);

  // Validation function for current step
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!dateOfJoining) newErrors.dateOfJoining = "Date of Joining is required.";
      if (!cellPersonal) {
        newErrors.cellPersonal = "Personal phone number is required.";
      } else if (!/^\d{10}$/.test(cellPersonal)) {
        newErrors.cellPersonal = "Must be a valid 10-digit number.";
      }
    }

    if (step === 2) {
      if (!fatherName.trim()) newErrors.fatherName = "Father's name is required.";
      if (!motherName.trim()) newErrors.motherName = "Mother's name is required.";
      if (!permanentAddress.trim()) newErrors.permanentAddress = "Permanent Address is required.";
      if (!phoneHouse.trim()) {
        newErrors.phoneHouse = "Landline / alternative contact is required.";
      } else if (!/^\d{10}$/.test(phoneHouse)) {
        newErrors.phoneHouse = "Must be a valid 10-digit number.";
      }
      if (!guardianName.trim()) newErrors.guardianName = "Guardian name is required.";
      if (!guardianPhone.trim()) {
        newErrors.guardianPhone = "Guardian phone is required.";
      } else if (!/^\d{10}$/.test(guardianPhone)) {
        newErrors.guardianPhone = "Must be a valid 10-digit number.";
      }
      if (!guardianRelation.trim()) newErrors.guardianRelation = "Guardian relationship is required.";
    }

    if (step === 3) {
      if (!emergencyContactName.trim()) newErrors.emergencyContactName = "Emergency contact name is required.";
      if (!emergencyContactPhone.trim()) {
        newErrors.emergencyContactPhone = "Emergency contact phone is required.";
      } else if (!/^\d{10}$/.test(emergencyContactPhone)) {
        newErrors.emergencyContactPhone = "Must be a valid 10-digit number.";
      }
      if (!emergencyContactRelation.trim()) newErrors.emergencyContactRelation = "Emergency contact relationship is required.";
    }

    if (step === 4) {
      if (!isEmployee) {
        if (!studentInstitution.trim()) newErrors.studentInstitution = "Name of Institution is required.";
        if (!studentInstAddress.trim()) newErrors.studentInstAddress = "Address of Institution is required.";
        if (!studentCourse.trim()) newErrors.studentCourse = "Course name is required.";
        if (!studentTimings.trim()) newErrors.studentTimings = "College Timings is required.";
      } else {
        if (!employeeCompany.trim()) newErrors.employeeCompany = "Company Name is required.";
        if (!employeeCompAddress.trim()) newErrors.employeeCompAddress = "Company Address is required.";
        if (!employeeDesignation.trim()) newErrors.employeeDesignation = "Designation is required.";
        if (!employeeTimings.trim()) newErrors.employeeTimings = "Office Timings is required.";
      }
    }

    if (step === 5) {
      if (!agreedToRules) newErrors.agreedToRules = "You must agree to the Hostel Rules.";
      if (!signatureText.trim()) newErrors.signatureText = "Digital signature is required.";
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Fire an informative error toast
      const firstErrorMessage = Object.values(newErrors)[0];
      showToast?.(firstErrorMessage, true);
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    if (!validateStep(5)) {
      return;
    }

    setLoading(true);
    try {
      const formPayload: HostelForm = {
        dateOfJoining,
        fatherName,
        motherName,
        permanentAddress,
        phoneHouse,
        cellPersonal,
        guardianName,
        guardianPhone,
        guardianRelation,
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        studentInstitution,
        studentInstAddress,
        studentCourse,
        studentTimings,
        isEmployee,
        employeeCompany,
        employeeCompAddress,
        employeeDesignation,
        employeeTimings,
        agreedToRules,
        signature: signatureText,
        submittedAt: new Date().toISOString()
      };

      // Save to server
      const res = await api.put("/auth/profile", {
        hostelForm: formPayload,
        // Sync guardian details to primary user fields
        guardianDetails: {
          name: guardianName,
          phone: guardianPhone,
          relationship: guardianRelation
        },
        // Sync emergency contact
        emergencyContact: `${emergencyContactName} - ${emergencyContactPhone} - ${emergencyContactRelation}`
      });

      showToast?.("Sri Srinivasa Hostel Application Form submitted & signed successfully!");
      
      if (res.updateData && onFormSubmit) {
        onFormSubmit({
          ...user,
          hostelForm: res.updateData.hostelForm,
          guardianDetails: {
            name: guardianName,
            phone: guardianPhone,
            relationship: guardianRelation
          },
          emergencyContact: `${emergencyContactName} - ${emergencyContactPhone} - ${emergencyContactRelation}`
        });
      }
      setViewMode("print");
    } catch (err: any) {
      showToast?.(err.message || "Failed to submit application form", true);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const stepsList = [
    { number: 1, label: "Personal Info", icon: UserIcon },
    { number: 2, label: "Guardian Details", icon: Users },
    { number: 3, label: "Emergency Contact", icon: Contact2 },
    { number: 4, label: "Occupation Details", icon: Building },
    { number: 5, label: "Rules & Signature", icon: Signature }
  ];

  const rules = [
    "Amount once paid will not be returned back or transferred.",
    "Guests are not allowed. Absent days will not be counted.",
    "Maintain Hostel rooms and premises neatly and cleanly, any damages happens the amount should be paid.",
    "Monthly fees should be paid within the date.",
    "Students Should Inform To The Hostel Management 15 Days Before Vacating The Hostel, Else Full Month Fee Will Be Collected (Your Bill Date).",
    "Smoking, Drinking, Ironing & Water heaters are strictly prohibited.",
    "Management is not responsible for Boarder's valuable items like Mobiles etc., They are kept at their own risk.",
    "Management reserves the right to cancel the admission Boarder at any point of time.",
    "Every Year Hostel Closed Two Festivals: a) Dasara 5 Days b) Sankranthi 5 Days (Only Accommodation No Food)."
  ];

  const progressPercentage = (activeStep / 5) * 100;

  return (
    <div className="space-y-6">
      
      {/* Top Controller Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-4 rounded-2xl print:hidden">
        <div>
          <h1 className="font-display font-black text-xl text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            Sri Srinivasa Boys Hostel Admission Form
          </h1>
          <p className="text-xs text-slate-400">
            Submit your official digitally signed paper form to the hostel wardens.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!readOnly && (
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800/80 flex">
              <button
                onClick={() => setViewMode("step")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === "step" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Interactive Steps
              </button>
              <button
                onClick={() => setViewMode("print")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  viewMode === "print" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Printed Form View
              </button>
            </div>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/10"
          >
            <Printer className="w-4 h-4" />
            Print physical form
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: STEP-BY-STEP PROGRESS-INDICATED FORM */}
      {viewMode === "step" && !readOnly && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 relative overflow-hidden print:hidden">
          
          {/* Header background accents */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

          {/* Stepper with progress bar */}
          <div className="space-y-4 relative z-10">
            {/* Horizontal steps line */}
            <div className="hidden md:flex items-center justify-between relative max-w-3xl mx-auto">
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-slate-800 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-[2px] bg-gradient-to-r from-amber-500 to-emerald-500 -translate-y-1/2 transition-all duration-500 ease-out z-0" 
                style={{ width: `${((activeStep - 1) / 4) * 100}%` }}
              />

              {stepsList.map((st) => {
                const StepIcon = st.icon;
                const isCompleted = activeStep > st.number;
                const isActive = activeStep === st.number;
                return (
                  <button
                    key={st.number}
                    onClick={() => {
                      // Allow navigating back or forward if validated
                      if (st.number < activeStep) {
                        setActiveStep(st.number);
                      } else {
                        // Check if previous step was valid
                        let canNavigate = true;
                        for (let s = 1; s < st.number; s++) {
                          if (!validateStep(s)) {
                            canNavigate = false;
                            break;
                          }
                        }
                        if (canNavigate) {
                          setActiveStep(st.number);
                        }
                      }
                    }}
                    className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none"
                  >
                    <div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted 
                          ? "bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/20" 
                          : isActive 
                            ? "bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 scale-110 font-bold" 
                            : "bg-slate-800 text-slate-400 ring-4 ring-transparent hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : <StepIcon className="w-5 h-5" />}
                    </div>
                    <span 
                      className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-all ${
                        isActive ? "text-amber-500" : isCompleted ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    >
                      {st.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mobile simplified progress indicator */}
            <div className="md:hidden flex items-center justify-between bg-slate-950/40 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-sm">
                  {activeStep}
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">
                    Step {activeStep} of 5
                  </span>
                  <span className="text-sm font-black text-white">
                    {stepsList[activeStep - 1].label}
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                {Math.round(progressPercentage)}%
              </span>
            </div>

            {/* Floating Top Mini Progress Line */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Form Card Content with visual validations */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-6 relative z-10 space-y-6">
            
            {/* STEP 1: Personal Info */}
            {activeStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-amber-500" />
                      Candidate Personal details
                    </h3>
                    <p className="text-xs text-slate-400">Provide basic identification & contact info.</p>
                  </div>
                  <span className="text-rose-500 text-xs font-bold font-sans">* Required fields</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pre-filled read-only Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Candidate Full Name</label>
                    <input
                      type="text"
                      disabled
                      value={user.name}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-not-allowed outline-none opacity-80"
                    />
                    <p className="text-[10px] text-slate-500">Auto-filled from registration account details.</p>
                  </div>

                  {/* Date of Joining */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Expected Date of Joining <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={dateOfJoining}
                        onChange={(e) => {
                          setDateOfJoining(e.target.value);
                          if (errors.dateOfJoining) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.dateOfJoining;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.dateOfJoining ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.dateOfJoining && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    {errors.dateOfJoining && <p className="text-[10px] text-rose-500 font-bold">{errors.dateOfJoining}</p>}
                  </div>

                  {/* Personal Mobile */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Personal Mobile Cell Number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={cellPersonal}
                        onChange={(e) => {
                          // Allow only numbers
                          const val = e.target.value.replace(/\D/g, "");
                          setCellPersonal(val);
                          if (errors.cellPersonal) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.cellPersonal;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.cellPersonal ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      <Smartphone className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    </div>
                    {errors.cellPersonal ? (
                      <p className="text-[10px] text-rose-500 font-bold">{errors.cellPersonal}</p>
                    ) : (
                      <p className="text-[10px] text-slate-500">Ensure this mobile is reachable for critical SMS/alerts.</p>
                    )}
                  </div>

                  {/* Profile Photo Display */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Avatar photo</label>
                    <div className="flex items-center space-x-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-800 flex-shrink-0">
                        {user.profilePhoto ? (
                          <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold text-sm bg-slate-800">
                            Photo
                          </div>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold text-slate-300 block">Digital Passport Photo</span>
                        <span className="text-[10px] text-slate-500">Update photo anytime via your primary Profile tab.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Parent & Guardian Details */}
            {activeStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-500" />
                      Parent & Guardian details
                    </h3>
                    <p className="text-xs text-slate-400">Guardian identity is required to complete hosteling verification.</p>
                  </div>
                  <span className="text-rose-500 text-xs font-bold font-sans">* Required fields</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Father Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Father's Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Father's full name"
                      value={fatherName}
                      onChange={(e) => {
                        setFatherName(e.target.value);
                        if (errors.fatherName) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.fatherName;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.fatherName ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    />
                    {errors.fatherName && <p className="text-[10px] text-rose-500 font-bold">{errors.fatherName}</p>}
                  </div>

                  {/* Mother Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Mother's Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Mother's full name"
                      value={motherName}
                      onChange={(e) => {
                        setMotherName(e.target.value);
                        if (errors.motherName) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.motherName;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.motherName ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    />
                    {errors.motherName && <p className="text-[10px] text-rose-500 font-bold">{errors.motherName}</p>}
                  </div>

                  {/* Landline / House phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Alternate House Phone / Landline <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Alternate 10-digit number"
                      value={phoneHouse}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setPhoneHouse(val);
                        if (errors.phoneHouse) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.phoneHouse;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.phoneHouse ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    />
                    {errors.phoneHouse && <p className="text-[10px] text-rose-500 font-bold">{errors.phoneHouse}</p>}
                  </div>

                  {/* Guardian Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Local Guardian Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Primary local guardian's name"
                      value={guardianName}
                      onChange={(e) => {
                        setGuardianName(e.target.value);
                        if (errors.guardianName) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.guardianName;
                            return copy;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.guardianName ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    />
                    {errors.guardianName && <p className="text-[10px] text-rose-500 font-bold">{errors.guardianName}</p>}
                  </div>

                  {/* Guardian Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Guardian Phone Number <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Guardian 10-digit mobile"
                      value={guardianPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setGuardianPhone(val);
                        if (errors.guardianPhone) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.guardianPhone;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.guardianPhone ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    />
                    {errors.guardianPhone && <p className="text-[10px] text-rose-500 font-bold">{errors.guardianPhone}</p>}
                  </div>

                  {/* Guardian Relation */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Guardian Relationship <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      value={guardianRelation}
                      onChange={(e) => {
                        setGuardianRelation(e.target.value);
                        if (errors.guardianRelation) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.guardianRelation;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.guardianRelation ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    >
                      <option value="">Select Relation</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Uncle">Uncle</option>
                      <option value="Aunt">Aunt</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Other">Other Relative</option>
                    </select>
                    {errors.guardianRelation && <p className="text-[10px] text-rose-500 font-bold">{errors.guardianRelation}</p>}
                  </div>

                  {/* Permanent Address */}
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Permanent Postal Address <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <textarea
                      rows={2}
                      placeholder="House No, Landmark, Street name, City, Pincode"
                      value={permanentAddress}
                      onChange={(e) => {
                        setPermanentAddress(e.target.value);
                        if (errors.permanentAddress) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.permanentAddress;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.permanentAddress ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all resize-none`}
                    />
                    {errors.permanentAddress && <p className="text-[10px] text-rose-500 font-bold">{errors.permanentAddress}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Emergency Info */}
            {activeStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Contact2 className="w-4 h-4 text-amber-500" />
                      Emergency Contacts
                    </h3>
                    <p className="text-xs text-slate-400">Critical contacts used strictly for warden escalation / health emergencies.</p>
                  </div>
                  <span className="text-rose-500 text-xs font-bold font-sans">* Required fields</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Emergency Contact Name */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Emergency Contact Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Emergency contact full name"
                      value={emergencyContactName}
                      onChange={(e) => {
                        setEmergencyContactName(e.target.value);
                        if (errors.emergencyContactName) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.emergencyContactName;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.emergencyContactName ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    />
                    {errors.emergencyContactName && <p className="text-[10px] text-rose-500 font-bold">{errors.emergencyContactName}</p>}
                  </div>

                  {/* Emergency Contact Phone */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Emergency Contact Phone <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="Emergency contact mobile"
                      value={emergencyContactPhone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setEmergencyContactPhone(val);
                        if (errors.emergencyContactPhone) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.emergencyContactPhone;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.emergencyContactPhone ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    />
                    {errors.emergencyContactPhone && <p className="text-[10px] text-rose-500 font-bold">{errors.emergencyContactPhone}</p>}
                  </div>

                  {/* Emergency Contact Relationship */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Relationship to Candidate <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <select
                      value={emergencyContactRelation}
                      onChange={(e) => {
                        setEmergencyContactRelation(e.target.value);
                        if (errors.emergencyContactRelation) {
                          setErrors((prev) => {
                            const copy = { ...prev };
                            delete copy.emergencyContactRelation;
                            return copy;
                          });
                        }
                      }}
                      className={`w-full px-4 py-3 bg-slate-900 border ${
                        errors.emergencyContactRelation ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                      } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                    >
                      <option value="">Select Relation</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Warden">Warden Representative</option>
                    </select>
                    {errors.emergencyContactRelation && <p className="text-[10px] text-rose-500 font-bold">{errors.emergencyContactRelation}</p>}
                  </div>
                </div>

                {/* Important notice badge */}
                <div className="flex gap-3 bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 text-xs text-rose-400 items-start">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <span className="font-bold block text-white">Emergency Disclosure Statement</span>
                    By listing this individual, you authorize Sri Srinivasa Boys Hostel management to communicate direct residency alerts, health status, or disciplinary queries in situations of critical emergency.
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Occupation / Academic Details */}
            {activeStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Building className="w-4 h-4 text-amber-500" />
                      Academic & Occupation Details
                    </h3>
                    <p className="text-xs text-slate-400">Specify if you are studying at a local college or working in an enterprise.</p>
                  </div>
                  <span className="text-rose-500 text-xs font-bold font-sans">* Required fields</span>
                </div>

                {/* Switcher Toggle tabs */}
                <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex max-w-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmployee(false);
                      setErrors({});
                    }}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      !isEmployee ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    I am a Student
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmployee(true);
                      setErrors({});
                    }}
                    className={`flex-1 py-2 text-center rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      isEmployee ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-300"
                    }`}
                  >
                    I am an Employee
                  </button>
                </div>

                {/* If Student Fields */}
                {!isEmployee ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Name of Institution / College <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Osmania University, JNTUH"
                        value={studentInstitution}
                        onChange={(e) => {
                          setStudentInstitution(e.target.value);
                          if (errors.studentInstitution) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.studentInstitution;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.studentInstitution ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.studentInstitution && <p className="text-[10px] text-rose-500 font-bold">{errors.studentInstitution}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Course / Branch Joined <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. B.Tech Computer Science"
                        value={studentCourse}
                        onChange={(e) => {
                          setStudentCourse(e.target.value);
                          if (errors.studentCourse) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.studentCourse;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.studentCourse ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.studentCourse && <p className="text-[10px] text-rose-500 font-bold">{errors.studentCourse}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        College Class Timings <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 9:00 AM to 4:30 PM"
                        value={studentTimings}
                        onChange={(e) => {
                          setStudentTimings(e.target.value);
                          if (errors.studentTimings) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.studentTimings;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.studentTimings ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.studentTimings && <p className="text-[10px] text-rose-500 font-bold">{errors.studentTimings}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Full Address of Institution <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="College campus physical location address"
                        value={studentInstAddress}
                        onChange={(e) => {
                          setStudentInstAddress(e.target.value);
                          if (errors.studentInstAddress) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.studentInstAddress;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.studentInstAddress ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.studentInstAddress && <p className="text-[10px] text-rose-500 font-bold">{errors.studentInstAddress}</p>}
                    </div>
                  </div>
                ) : (
                  /* If Employee Fields */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Name of Company / Employer <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TCS, Wipro, Microsoft"
                        value={employeeCompany}
                        onChange={(e) => {
                          setEmployeeCompany(e.target.value);
                          if (errors.employeeCompany) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.employeeCompany;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.employeeCompany ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.employeeCompany && <p className="text-[10px] text-rose-500 font-bold">{errors.employeeCompany}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Designation / Job Role <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Analyst, Software Engineer"
                        value={employeeDesignation}
                        onChange={(e) => {
                          setEmployeeDesignation(e.target.value);
                          if (errors.employeeDesignation) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.employeeDesignation;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.employeeDesignation ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.employeeDesignation && <p className="text-[10px] text-rose-500 font-bold">{errors.employeeDesignation}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Office Duty Timings <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 10:00 AM to 7:00 PM"
                        value={employeeTimings}
                        onChange={(e) => {
                          setEmployeeTimings(e.target.value);
                          if (errors.employeeTimings) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.employeeTimings;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.employeeTimings ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.employeeTimings && <p className="text-[10px] text-rose-500 font-bold">{errors.employeeTimings}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Full Address of Company <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Office branch location address"
                        value={employeeCompAddress}
                        onChange={(e) => {
                          setEmployeeCompAddress(e.target.value);
                          if (errors.employeeCompAddress) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.employeeCompAddress;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.employeeCompAddress ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-semibold outline-none transition-all`}
                      />
                      {errors.employeeCompAddress && <p className="text-[10px] text-rose-500 font-bold">{errors.employeeCompAddress}</p>}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: Rules Agreement & Digital Signature */}
            {activeStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Signature className="w-4 h-4 text-amber-500" />
                      Rules Agreement & Digital Signature
                    </h3>
                    <p className="text-xs text-slate-400">Accept regulations and electronically sign the binding document.</p>
                  </div>
                  <span className="text-rose-500 text-xs font-bold font-sans">* Required fields</span>
                </div>

                {/* 9 Golden Rules box */}
                <div className="bg-slate-950/80 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3.5 max-h-[250px] overflow-y-auto">
                  <span className="text-xs font-black text-white block tracking-wider uppercase border-b border-slate-800 pb-1.5">
                    Official Sri Srinivasa Boys Hostel Rules:
                  </span>
                  <div className="space-y-2 text-[11px] text-slate-400 leading-relaxed font-sans">
                    {rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="font-bold text-amber-500 text-xs shrink-0">{idx + 1}.</span>
                        <span>{rule}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Agreement Checkbox */}
                <div className="flex items-start gap-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/15">
                  <input
                    type="checkbox"
                    id="stepAgree"
                    checked={agreedToRules}
                    onChange={(e) => {
                      setAgreedToRules(e.target.checked);
                      if (errors.agreedToRules) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.agreedToRules;
                          return copy;
                        });
                      }
                    }}
                    className={`mt-0.5 rounded text-amber-500 focus:ring-amber-500 cursor-pointer h-4.5 w-4.5 ${
                      errors.agreedToRules ? "ring-2 ring-rose-500" : ""
                    }`}
                  />
                  <label htmlFor="stepAgree" className="text-xs text-slate-300 leading-normal cursor-pointer">
                    <span className="font-bold text-white block mb-0.5">I agree to Sri Srinivasa Boys Hostel Regulations</span>
                    I solemnly declare that the facts stated above are true to my knowledge and I strictly bind myself to adhere to the listed 9 regulations.
                  </label>
                </div>

                {/* Digital Signature with font customization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Signature Font Style:
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSignatureStyle("font-serif italic")}
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          signatureStyle.includes("serif") ? "bg-amber-500 text-slate-950 shadow-md" : "bg-slate-900 border border-slate-800 text-slate-400"
                        }`}
                      >
                        Elegant Serif
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignatureStyle("font-handwritten font-bold")}
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          signatureStyle.includes("handwritten") ? "bg-amber-500 text-slate-950 shadow-md" : "bg-slate-900 border border-slate-800 text-slate-400"
                        }`}
                      >
                        Handwritten Cursive
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Candidate Signature Name <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Type Full Name to Sign"
                        value={signatureText}
                        onChange={(e) => {
                          setSignatureText(e.target.value);
                          if (errors.signatureText) {
                            setErrors((prev) => {
                              const copy = { ...prev };
                              delete copy.signatureText;
                              return copy;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 bg-slate-900 border ${
                          errors.signatureText ? "border-rose-500" : "border-slate-800 focus:border-amber-500"
                        } text-white rounded-xl text-xs font-bold outline-none transition-all`}
                      />
                    </div>
                    {errors.signatureText && <p className="text-[10px] text-rose-500 font-bold">{errors.signatureText}</p>}
                  </div>
                </div>

                {/* Digital Signature Live Canvas Signature Display */}
                {signatureText && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-1">
                    <span className="text-[9px] text-slate-500 tracking-widest font-black uppercase">E-SIGNATURE PREVIEW</span>
                    <p className={`text-2xl text-amber-500 text-center ${signatureStyle} py-2 tracking-wide`}>
                      {signatureText}
                    </p>
                    <span className="text-[9px] text-slate-600 font-mono">Secured IP Verified Digital Seal</span>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Stepper Buttons footer */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800 relative z-10">
            <button
              onClick={handlePrev}
              disabled={activeStep === 1}
              className="px-4 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            {activeStep < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-xl shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                    Submit & Seal Form
                  </>
                )}
              </button>
            )}
          </div>

        </div>
      )}

      {/* VIEW MODE 2: PIXEL-PERFECT PHYSICAL COMPILATION FOR PRINT/READONLY */}
      {(viewMode === "print" || readOnly) && (
        <div className="max-w-4xl mx-auto bg-[#fdfbf7] text-[#1c2e4a] border-4 border-double border-[#2c3e50] shadow-2xl rounded-2xl p-6 sm:p-10 relative overflow-hidden font-serif print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
          
          {/* Watermark Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[90px] font-bold text-[#1c2e4a]/[0.03] uppercase tracking-widest pointer-events-none select-none font-sans rotate-12">
            Sri Srinivasa
          </div>

          {/* Official Seal Rubber Stamp (Approved Only) */}
          {user.documentStatus === "approved" && (
            <div className="absolute top-6 right-6 md:top-8 md:right-8 -rotate-12 select-none pointer-events-none z-10 print:right-2 print:top-2">
              <div className="border-4 border-double border-emerald-600/80 text-emerald-600 font-sans rounded-full w-24 h-24 flex flex-col items-center justify-center bg-white/95 shadow-md p-1 font-bold text-center leading-none">
                <span className="text-[6px] tracking-widest font-black uppercase text-emerald-700">SRI SRINIVASA</span>
                <span className="text-[11px] font-black tracking-wider uppercase text-emerald-600 my-0.5">APPROVED</span>
                <span className="text-[6px] font-bold text-emerald-600/80 leading-none">★ ADMISSION ★</span>
                <span className="text-[7px] text-emerald-700/60 font-mono mt-1 font-semibold">SEALED SECURE</span>
              </div>
            </div>
          )}

          {/* Printed Header */}
          <div className="border-b-2 border-dashed border-[#1c2e4a]/30 pb-6 text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-wider text-[#1e3a8a] font-sans">
              Sri Srinivasa Boys Hostel
            </h2>
            <p className="text-xs font-semibold tracking-wide font-sans text-slate-600">
              Cell : 9848490866, 7993445293, 8639047277
            </p>
            
            <div className="flex flex-col sm:flex-row justify-between items-center pt-4 gap-4">
              {/* Date of Joining */}
              <div className="flex items-center space-x-2 font-sans text-xs">
                <span className="font-bold uppercase tracking-wider text-[#1e3a8a]">Date of Joining:</span>
                <span className="border-b border-[#1c2e4a]/60 px-2 py-0.5 font-bold text-slate-800">
                  {dateOfJoining || "Pending"}
                </span>
              </div>
              
              <div className="border-2 border-dashed border-[#1c2e4a]/40 bg-[#1e3a8a]/5 px-6 py-2 rounded font-sans font-bold uppercase tracking-widest text-[#1e3a8a] text-sm">
                Admission Application
              </div>

              {/* Resident Image photo */}
              <div className="w-24 h-28 border-2 border-dashed border-[#1c2e4a]/50 flex flex-col items-center justify-center bg-white text-center p-2 rounded relative">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="Resident Photo" className="w-full h-full object-cover absolute inset-0 rounded" referrerPolicy="no-referrer" />
                ) : (
                  <>
                    <span className="text-[10px] font-sans font-bold text-[#1c2e4a]/60 uppercase tracking-wider">Photo</span>
                    <span className="text-[8px] font-sans text-slate-400 mt-1">None Provided</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Compilation Form Data display with classical design */}
          <div className="py-6 space-y-5 text-sm">
            
            {/* Sec 1: Personal Identification */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b border-[#1c2e4a]/20 pb-1.5 font-sans">
                I. Personal details
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Resident Name:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{user.name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Mobile Number:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-mono font-bold">{cellPersonal || user.phone || "Not filled"}</span>
                </div>
              </div>
            </div>

            {/* Sec 2: Family & Guardians */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b border-[#1c2e4a]/20 pb-1.5 font-sans">
                II. Parent & Guardian information
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Father's Name:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{fatherName || "Not filled"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Mother's Name:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{motherName || "Not filled"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">House Landline:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-mono font-bold">{phoneHouse || "Not filled"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Local Guardian Name:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{guardianName || "Not filled"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Guardian Relation:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{guardianRelation || "Not filled"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Guardian Contact:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-mono font-bold">{guardianPhone || "Not filled"}</span>
                </div>
                <div className="flex gap-2 md:col-span-2">
                  <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Permanent Address:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1">{permanentAddress || "Not filled"}</span>
                </div>
              </div>
            </div>

            {/* Sec 3: Emergency */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b border-[#1c2e4a]/20 pb-1.5 font-sans">
                III. Emergency Contacts (Escalations)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-24 uppercase text-[11px] shrink-0">Contact Name:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{emergencyContactName || "Not filled"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-24 uppercase text-[11px] shrink-0">Relation:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{emergencyContactRelation || "Not filled"}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-sans font-bold text-slate-500 w-24 uppercase text-[11px] shrink-0">Mobile Number:</span>
                  <span className="border-b border-dashed border-slate-300 flex-1 font-mono font-bold">{emergencyContactPhone || "Not filled"}</span>
                </div>
              </div>
            </div>

            {/* Sec 4: Work or College */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b border-[#1c2e4a]/20 pb-1.5 font-sans">
                IV. Academic / Professional context
              </h4>

              {!isEmployee ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Institution Name:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{studentInstitution || "Not filled"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Course Enrolled:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{studentCourse || "Not filled"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">College Timings:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1">{studentTimings || "Not filled"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">College Location:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1">{studentInstAddress || "Not filled"}</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Company Name:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{employeeCompany || "Not filled"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Job Designation:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1 font-bold">{employeeDesignation || "Not filled"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Office Timings:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1">{employeeTimings || "Not filled"}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-sans font-bold text-slate-500 w-36 uppercase text-[11px] shrink-0">Office Location:</span>
                    <span className="border-b border-dashed border-slate-300 flex-1">{employeeCompAddress || "Not filled"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Sec 5: Golden Rules Agreement summary */}
            <div className="space-y-2 pt-2 text-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-[#1e3a8a] border-b border-[#1c2e4a]/20 pb-1.5 font-sans">
                V. Rules, admissions & legal declaration
              </h4>
              <p className="font-sans text-slate-700 leading-relaxed italic">
                "I solemnly declare that all particulars filled above are true to my knowledge and I strictly bind myself to adhere to the listed 9 core rules of Sri Srinivasa Boys Hostel. I understand that failure to follow regulations can lead to immediate cancellation of my boarder admission."
              </p>
              <div className="flex gap-1.5 items-center text-emerald-700 font-sans font-bold pt-1.5">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Digitally Signed and Agreed to Rules of Admission</span>
              </div>
            </div>

            {/* Signatures block */}
            <div className="grid grid-cols-2 gap-12 pt-10 text-center font-sans text-xs">
              <div className="space-y-4 relative">
                <div className="h-12 flex items-center justify-center relative">
                  {user.documentStatus === "approved" ? (
                    <div className="relative rotate-6 border-2 border-emerald-600/80 text-emerald-700 font-sans px-3 py-1 text-[11px] rounded uppercase tracking-wider bg-emerald-500/5 shadow-sm font-black flex flex-col items-center justify-center select-none">
                      <span className="font-handwritten text-lg text-emerald-600 font-bold -mt-1 -mb-1 select-none leading-none">Ramesh Reddy</span>
                      <div className="text-[7px] text-center font-bold tracking-widest text-emerald-600/70 border-t border-emerald-600/40 w-full pt-0.5">SRI SRINIVASA HOSTEL</div>
                      <div className="text-[8px] text-emerald-700 font-extrabold tracking-widest leading-none mt-0.5">★ APPROVED ★</div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-300 rounded px-3 py-1.5 text-[10px] text-slate-400 font-sans uppercase font-bold tracking-widest bg-slate-50">
                      Awaiting Approval
                    </div>
                  )}
                </div>
                <div className="border-t border-[#1c2e4a] pt-1.5 font-bold uppercase tracking-wider text-slate-700 text-[10px]">
                  Sri Srinivasa Hostel Warden Signature
                </div>
              </div>

              <div className="space-y-4">
                <div className="h-12 flex items-end justify-center">
                  <span className={`text-xl font-bold text-[#1e3a8a] ${signatureStyle}`}>
                    {signatureText || user.name}
                  </span>
                </div>
                <div className="border-t border-[#1c2e4a] pt-1.5 font-bold uppercase tracking-wider text-slate-700 text-[10px]">
                  Candidate Signed Signature
                </div>
              </div>
            </div>

            {/* Form submission date */}
            {user.hostelForm?.submittedAt && (
              <p className="text-[10px] text-slate-400 font-mono text-center pt-8">
                Form digitally recorded at {new Date(user.hostelForm.submittedAt).toLocaleString()}
              </p>
            )}

          </div>

        </div>
      )}

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Playfair+Display:ital,wght@1,600&display=swap');
        .font-handwritten {
          font-family: 'Caveat', cursive, sans-serif;
        }
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

    </div>
  );
}
