import { jsPDF } from "jspdf";
import { RentInvoice, HostelSettings } from "../types";

export function generateInvoicePDF(invoice: RentInvoice, settings: HostelSettings) {
  const doc = new jsPDF();
  
  // Luxury Dark/Gold Accent Palette
  const primaryColor = [11, 15, 25]; // Dark slate
  const secondaryColor = [197, 160, 89]; // Warm gold/brass
  const textColor = [55, 65, 81]; // Slate gray
  
  // Top Border Accent
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 8, "F");

  // Header Section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(settings.hostelName || "SRI SRINIVASA BOYS HOSTEL", 20, 25);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(settings.address || "Hitech City Phase 2, Near Mindspace, Hyderabad", 20, 32);
  doc.text(`Phone: ${settings.contactPhone || "+91 98765 43210"}  |  Email: ${settings.contactEmail || "srisrinivasahostel@gmail.com"}`, 20, 37);

  // Divider
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);

  // Document Type Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(invoice.status === "paid" ? "OFFICIAL RENT RECEIPT" : "RENT INVOICE", 20, 52);

  // Metadata Grid
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(17, 24, 39);
  doc.text("INVOICE DETAILS", 20, 62);
  doc.text("STUDENT DETAILS", 110, 62);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);

  // Invoice Details Column
  doc.text(`Invoice ID: #${invoice.id.toUpperCase()}`, 20, 69);
  doc.text(`Billing Month: ${invoice.month}`, 20, 75);
  doc.text(`Generated Date: ${invoice.createdAt ? invoice.createdAt.split("T")[0] : "N/A"}`, 20, 81);
  doc.text(`Payment Status: ${invoice.status.toUpperCase()}`, 20, 87);

  // Student Details Column
  doc.text(`Name: ${invoice.studentName}`, 110, 69);
  doc.text(`Room Assigned: Room ${invoice.roomNumber}`, 110, 75);
  doc.text(`Bed Allocated: Bed ${invoice.bedNumber}`, 110, 81);
  if (invoice.utrNumber) {
    doc.text(`UTR/Txn ID: ${invoice.utrNumber}`, 110, 87);
  }

  // Divider
  doc.line(20, 95, 190, 95);

  // Bill Breakdown Table Header
  doc.setFillColor(243, 244, 246);
  doc.rect(20, 100, 170, 8, "F");

  doc.setFont("Helvetica", "bold");
  doc.setTextColor(17, 24, 39);
  doc.text("Description", 25, 105);
  doc.text("Due Date", 100, 105);
  doc.text("Amount (INR)", 160, 105);

  // Bill Items
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  
  // Item 1: Rent
  doc.text(`Hostel Monthly Rent - ${invoice.month}`, 25, 116);
  doc.text(invoice.dueDate || "N/A", 100, 116);
  doc.text(`Rs. ${invoice.amount.toLocaleString()}.00`, 160, 116);

  // Item 2: Fine
  if (invoice.fine > 0) {
    doc.text("Late Payment Fine Accumulations", 25, 124);
    doc.text("-", 100, 124);
    doc.text(`Rs. ${invoice.fine.toLocaleString()}.00`, 160, 124);
  }

  // Summary section
  doc.line(20, 135, 190, 135);

  const totalAmount = invoice.amount + (invoice.fine || 0);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(17, 24, 39);
  doc.text("GRAND TOTAL:", 110, 145);
  doc.text(`Rs. ${totalAmount.toLocaleString()}.00`, 160, 145);

  // Footer / Instructions / Signatures
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text("Terms & Conditions:", 20, 175);
  doc.text("1. This is a computer-generated invoice and requires no physical signature.", 20, 180);
  doc.text("2. Please keep this receipt safe for your security deposit refund during check-out.", 20, 185);

  // Authorized Signatory
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("Jagadeesh Reddy", 150, 180);
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text("Authorized Warden", 150, 185);

  // Stamp / Decorative Badge
  if (invoice.status === "paid") {
    doc.setDrawColor(34, 197, 94);
    doc.setLineWidth(1);
    doc.rect(145, 48, 40, 10);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(34, 197, 94);
    doc.text("PAID & CLEARED", 148, 54);
  } else if (invoice.status === "submitted") {
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(1);
    doc.rect(145, 48, 40, 10);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(234, 179, 8);
    doc.text("VERIFY PENDING", 146, 54);
  }

  doc.save(`Invoice_${invoice.month.replace(" ", "_")}_${invoice.studentName.replace(" ", "_")}.pdf`);
}
