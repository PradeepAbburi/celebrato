import React, { useState } from 'react';
import { Booking } from '../types';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  Printer, 
  MessageSquare, 
  Mail, 
  Tag, 
  Sparkles,
  DollarSign,
  FileText,
  Save,
  Building,
  Download,
  FileDown,
  ExternalLink
} from 'lucide-react';
import { 
  downloadReceiptPdf,
  downloadAndPrepareReceiptForWhatsApp, 
  getWhatsAppReceiptShareUrl 
} from '../utils/generateReceiptPdf';

interface AdminBookingDetailsProps {
  booking: Booking;
  onBack: () => void;
  onStatusChange: (bookingId: string, status: Booking['status']) => Promise<void>;
  onUpdateNotes?: (bookingId: string, notes: string) => Promise<void>;
}

export const AdminBookingDetails: React.FC<AdminBookingDetailsProps> = ({
  booking,
  onBack,
  onStatusChange,
  onUpdateNotes,
}) => {
  const [currentStatus, setCurrentStatus] = useState<Booking['status']>(booking.status);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [adminNotes, setAdminNotes] = useState(booking.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  
  // PDF Receipt download state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfDownloadFeedback, setPdfDownloadFeedback] = useState<{ filename: string; sharedDirectly: boolean } | null>(null);

  const handleStatusSelect = async (newStatus: Booking['status']) => {
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(booking.id, newStatus);
      setCurrentStatus(newStatus);
      setSaveSuccessMsg(`Status updated to ${newStatus}`);
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!onUpdateNotes) return;
    setIsSavingNotes(true);
    try {
      await onUpdateNotes(booking.id, adminNotes);
      setSaveSuccessMsg('Admin notes saved successfully');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // 1. Download directly to user's system
      const filename = downloadReceiptPdf(booking);

      // 2. Simultaneously open WhatsApp with host prefilled details
      const waUrl = getWhatsAppReceiptShareUrl(booking);
      window.open(waUrl, '_blank');

      setPdfDownloadFeedback({
        filename,
        sharedDirectly: true,
      });

      // Auto clear feedback banner after 9 seconds
      setTimeout(() => {
        setPdfDownloadFeedback(null);
      }, 9000);
    } catch (err) {
      console.error('Failed to generate or download receipt PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadAndOpenWhatsApp = () => {
    handleDownloadPdf();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="admin-booking-details-page" className="space-y-6 animate-fadeIn pb-16 text-left">
      {/* Top Header Card: Back button icon on top, booking name under back button on separate line */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#202020] border border-[#383838] shadow-xl space-y-4">
        {/* Top Row: ONLY back button icon on the top left (NOT yellow), and Quick Actions on the right */}
        <div className="flex items-center justify-between gap-3">
          {/* Clean Back Button - ONLY icon, NOT yellow */}
          <button
            id="admin-booking-details-back-btn"
            onClick={onBack}
            className="p-2.5 sm:p-3 rounded-2xl bg-[#282828] hover:bg-[#323232] active:bg-[#3d3d3d] text-gray-200 hover:text-white border border-[#3d3d3d] transition active:scale-95 shrink-0 shadow-md cursor-pointer flex items-center justify-center group"
            title="Return to Bookings List"
            aria-label="Back to Bookings"
          >
            <ArrowLeft className="w-5 h-5 text-gray-200 group-hover:text-white transition" />
          </button>

          {/* Top Right Quick Actions: Download Receipt PDF, WhatsApp, Status Selector */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Download Receipt PDF Button */}
            <button
              id="admin-download-receipt-pdf-btn"
              onClick={() => handleDownloadPdf()}
              disabled={isGeneratingPdf}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/40 transition text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm disabled:opacity-50"
              title="Download official receipt as PDF to send to host via WhatsApp"
            >
              <Download className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{isGeneratingPdf ? 'Generating...' : 'Download Receipt PDF'}</span>
            </button>

            {/* WhatsApp Send Action */}
            <button
              id="admin-whatsapp-receipt-btn"
              onClick={handleDownloadAndOpenWhatsApp}
              className="px-3 sm:px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition text-xs font-bold flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
              title="Download PDF and open WhatsApp to send to customer"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Send on WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            {/* Status Selector Dropdown */}
            <div className="flex items-center gap-1.5 bg-[#181818] p-1 rounded-xl border border-[#383838]">
              <span className="text-[11px] text-gray-400 font-semibold px-2 hidden sm:inline">Status:</span>
              <select
                value={currentStatus}
                disabled={isUpdatingStatus}
                onChange={(e) => handleStatusSelect(e.target.value as Booking['status'])}
                className="px-2.5 py-1 bg-[#252525] border border-[#3e3e3e] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="confirmed">Confirmed</option>
                <option value="checked-in">Checked In</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-300 hover:text-white border border-[#383838] transition text-xs font-bold hidden md:flex items-center gap-1.5"
              title="Print Slip"
            >
              <Printer className="w-4 h-4 text-gray-300" />
            </button>
          </div>
        </div>

        {/* SEPARATE LINE UNDER THE BACK BUTTON: Booking Name & Details */}
        <div className="pt-2 border-t border-[#303030]/70 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white/10 text-gray-200 border border-white/15">
              #{booking.shareCode || booking.id.slice(-6).toUpperCase()}
            </span>
            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider ${
              currentStatus === 'confirmed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : currentStatus === 'checked-in'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : currentStatus === 'completed'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {currentStatus}
            </span>
            <span className="text-xs text-gray-400">
              • Host: <strong className="text-white font-semibold">{booking.userName}</strong>
            </span>
          </div>

          {/* Booking Name cleanly on a separate line */}
          <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight leading-tight">
            {booking.eventName || `${booking.userName}'s Celebration`}
          </h1>

          <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap pt-0.5">
            <span className="flex items-center gap-1 text-gray-300 font-medium">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> {booking.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-300 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> {booking.timeSlot} ({booking.durationHours} hrs)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-300 font-medium">
              <Building className="w-3.5 h-3.5 text-amber-400" /> {booking.roomName}
            </span>
          </div>
        </div>
      </div>

      {/* PDF Download Feedback Banner */}
      {pdfDownloadFeedback && (
        <div className="p-4 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-white">Receipt PDF Downloaded ({pdfDownloadFeedback.filename})</p>
              <p className="text-[11px] text-gray-300">
                The itemized PDF receipt is ready. You can attach it to WhatsApp for host {booking.userName}.
              </p>
            </div>
          </div>
          <a
            href={getWhatsAppReceiptShareUrl(booking)}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 transition shadow-md"
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-950" />
            <span>Open WhatsApp Chat</span>
            <ExternalLink className="w-3 h-3 text-slate-950" />
          </a>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* Two-Column Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Room & Host Info (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Party Suite Information Card */}
          <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#383838] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit">
                <Building className="w-4 h-4 text-amber-400" />
                Reserved Celebration Suite
              </h3>
              <span className="text-xs text-amber-400 font-mono font-bold bg-[#181818] px-2.5 py-1 rounded-lg border border-[#383838]">
                Room ID: {booking.roomId}
              </span>
            </div>

            <div className="relative h-48 w-full rounded-2xl overflow-hidden bg-[#181818] border border-[#383838]">
              <img
                src={booking.roomImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'}
                alt={booking.roomName}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                <div>
                  <h4 className="text-xl font-black text-white font-outfit">
                    {booking.roomName}
                  </h4>
                  <p className="text-xs text-amber-300 font-medium">
                    Private party celebration room
                  </p>
                </div>
              </div>
            </div>

            {/* Schedule Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-400" /> Date
                </span>
                <p className="text-sm font-black text-white">{booking.date}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" /> Time Slot
                </span>
                <p className="text-sm font-black text-white">{booking.timeSlot}</p>
                <span className="text-[10px] text-gray-400 font-mono">({booking.durationHours} Hours)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold uppercase text-gray-400 flex items-center gap-1">
                  <Users className="w-3 h-3 text-amber-400" /> Guest Count
                </span>
                <p className="text-sm font-black text-white">{booking.guestsCount} Guests</p>
              </div>
            </div>
          </div>

          {/* Host & Customer Information Card */}
          <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit border-b border-[#383838] pb-3">
              <Users className="w-4 h-4 text-amber-400" />
              Party Host & Customer Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Host Full Name</span>
                <p className="text-sm font-bold text-white">{booking.userName}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Email Address</span>
                <p className="text-sm font-medium text-amber-400 truncate">{booking.userEmail}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Phone Number</span>
                <p className="text-sm font-mono text-gray-200">
                  {booking.userPhone || 'Not provided'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] space-y-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Host User UID</span>
                <p className="text-xs font-mono text-gray-400 truncate">
                  {booking.userId || 'Guest Checkout'}
                </p>
              </div>
            </div>
          </div>

          {/* Internal Admin Operations Notes */}
          <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#383838] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit">
                <FileText className="w-4 h-4 text-amber-400" />
                Administrative & Venue Internal Notes
              </h3>
              {onUpdateNotes && (
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingNotes ? 'Saving...' : 'Save Notes'}</span>
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter special venue setup notes, catering requests, custom lighting or security instructions..."
              className="w-full p-3.5 bg-[#181818] border border-[#383838] rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
            <p className="text-[11px] text-gray-500 italic">
              These notes are private and only visible to administrators and venue managers.
            </p>
          </div>
        </div>

        {/* Right Column: Add-Ons & Financial Invoice Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Selected Add-Ons Card */}
          <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#383838] pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit">
                <Tag className="w-4 h-4 text-amber-400" />
                Selected Add-Ons & Enhancements
              </h3>
              <span className="px-2 py-0.5 rounded-md bg-[#181818] border border-[#383838] text-xs font-mono text-gray-300">
                {booking.addOns?.length || 0} Items
              </span>
            </div>

            {booking.addOns && booking.addOns.length > 0 ? (
              <div className="space-y-2.5">
                {booking.addOns.map((addon, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#181818] border border-[#303030] flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>{addon.name}</span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        ₹{addon.price.toLocaleString('en-IN')} × {addon.quantity}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-black text-amber-400 font-outfit">
                        ₹{(addon.price * addon.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                ))}

                <div className="pt-2 border-t border-[#383838] flex items-center justify-between text-xs font-bold text-gray-300 px-1">
                  <span>Add-Ons Subtotal:</span>
                  <span className="text-amber-400 font-outfit text-sm">
                    ₹{(booking.addOnsTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-[#181818] rounded-2xl border border-[#303030] space-y-1">
                <Tag className="w-8 h-8 text-gray-600 mx-auto" />
                <p className="text-xs text-gray-400 font-medium">No Add-Ons Attached</p>
                <p className="text-[11px] text-gray-500">Host booked the standalone party suite.</p>
              </div>
            )}
          </div>

          {/* Complete Financial & Payment Summary */}
          <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
            <h3 className="text-base font-bold text-white flex items-center gap-2 font-outfit border-b border-[#383838] pb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Financial Invoice & Payment Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 text-gray-300">
                <span>Base Suite Rent ({booking.durationHours} Hours):</span>
                <span className="font-mono text-white">
                  ₹{(booking.basePrice || 0).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 text-gray-300">
                <span>Party Add-Ons Total:</span>
                <span className="font-mono text-white">
                  ₹{(booking.addOnsTotal || 0).toLocaleString('en-IN')}
                </span>
              </div>

              {Boolean(booking.discount && booking.discount > 0) && (
                <div className="flex items-center justify-between py-1 text-emerald-400">
                  <span>Promotional Discount:</span>
                  <span className="font-mono">-₹{booking.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Total Due / Paid */}
              <div className="pt-3 border-t border-[#383838] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase text-gray-400 block">Total Amount</span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Payment Verified
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-amber-400 font-outfit">
                    ₹{booking.finalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Official PDF Receipt & WhatsApp Dispatch Box */}
            <div className="p-4 rounded-2xl bg-[#1b1b1b] border border-blue-500/30 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <FileDown className="w-4 h-4 text-blue-400" />
                    Official PDF Receipt & Tax Invoice
                  </h4>
                  <p className="text-[11px] text-gray-400">
                    Generate and download the formatted PDF receipt to send to {booking.userName} via WhatsApp.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Ready
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  id="admin-financial-download-pdf-btn"
                  onClick={() => handleDownloadPdf()}
                  disabled={isGeneratingPdf}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGeneratingPdf ? 'Generating...' : 'Download PDF'}</span>
                </button>

                <button
                  id="admin-financial-whatsapp-btn"
                  onClick={handleDownloadAndOpenWhatsApp}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send on WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Verification Metadata Box */}
            <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#383838] text-[11px] text-gray-400 space-y-1 font-mono">
              <div className="flex justify-between">
                <span>Share Code:</span>
                <span className="text-white font-bold">{booking.shareCode}</span>
              </div>
              <div className="flex justify-between">
                <span>Booking ID:</span>
                <span className="text-gray-300 truncate max-w-[170px]">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Booked At:</span>
                <span className="text-gray-300">
                  {booking.createdAt ? new Date(booking.createdAt).toLocaleString('en-IN') : 'Confirmed'}
                </span>
              </div>
            </div>

            {/* Return Back Button */}
            <button
              onClick={onBack}
              className="w-full py-3 rounded-2xl bg-[#282828] hover:bg-[#323232] text-gray-300 hover:text-white border border-[#383838] text-xs font-bold transition flex items-center justify-center gap-2 active:scale-98"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Bookings Overview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
