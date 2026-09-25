import React, { useState, useMemo } from 'react';
import { Booking, Room } from '../../types';
import { BookingSubPage } from './AdminBottomBar';
import { printBookingsReport } from '../../utils/printBookingsReport';
import { 
  Calendar, 
  CheckCircle2, 
  Radio, 
  Clock, 
  XCircle, 
  Search, 
  Filter, 
  Eye, 
  Printer, 
  Download, 
  ArrowLeft, 
  Users, 
  Sparkles, 
  Phone, 
  Mail, 
  MessageSquare, 
  ChevronRight, 
  Building, 
  TrendingUp, 
  AlertCircle,
  Play,
  Check,
  CalendarDays,
  ChevronLeft
} from 'lucide-react';

interface AdminBookingsManagerProps {
  bookings: Booking[];
  rooms: Room[];
  activeSubPage: BookingSubPage;
  onSelectSubPage: (page: BookingSubPage) => void;
  onStatusChange: (bookingId: string, status: Booking['status']) => Promise<void>;
  onUpdateNotes: (bookingId: string, notes: string) => Promise<void>;
  onSelectBooking: (booking: Booking) => void;
}

export const AdminBookingsManager: React.FC<AdminBookingsManagerProps> = ({
  bookings,
  rooms,
  activeSubPage,
  onSelectSubPage,
  onStatusChange,
  onUpdateNotes,
  onSelectBooking,
}) => {
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'price-desc' | 'price-asc'>('date-desc');

  // Calendar view selected date
  const [calendarDate, setCalendarDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Action feedback toast
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Groupings & Counts
  const confirmedBookings = useMemo(() => bookings.filter((b) => b.status === 'confirmed'), [bookings]);
  const liveBookings = useMemo(() => bookings.filter((b) => b.status === 'checked-in'), [bookings]);
  const completedBookings = useMemo(() => bookings.filter((b) => b.status === 'completed'), [bookings]);
  const cancelledBookings = useMemo(() => bookings.filter((b) => b.status === 'cancelled'), [bookings]);

  // Filtered bookings based on current sub-page
  const currentList = useMemo(() => {
    let list = bookings;
    if (activeSubPage === 'confirmed') list = confirmedBookings;
    else if (activeSubPage === 'checked-in') list = liveBookings;
    else if (activeSubPage === 'completed') list = completedBookings;
    else if (activeSubPage === 'cancelled') list = cancelledBookings;

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((b) => {
        const matchName = (b.userName || '').toLowerCase().includes(q);
        const matchEmail = (b.userEmail || '').toLowerCase().includes(q);
        const matchPhone = (b.userPhone || '').toLowerCase().includes(q);
        const matchCode = (b.shareCode || '').toLowerCase().includes(q);
        const matchRoom = (b.roomName || '').toLowerCase().includes(q);
        const matchEvent = (b.eventName || '').toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchCode || matchRoom || matchEvent;
      });
    }

    // Room filter
    if (selectedRoomFilter !== 'all') {
      list = list.filter((b) => b.roomId === selectedRoomFilter);
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === 'date-asc') return (a.date || '').localeCompare(b.date || '');
      if (sortBy === 'date-desc') return (b.date || '').localeCompare(a.date || '');
      if (sortBy === 'price-asc') return a.finalPrice - b.finalPrice;
      if (sortBy === 'price-desc') return b.finalPrice - a.finalPrice;
      return 0;
    });
  }, [bookings, confirmedBookings, liveBookings, completedBookings, cancelledBookings, activeSubPage, searchTerm, selectedRoomFilter, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ShareCode', 'EventName', 'Room', 'Date', 'TimeSlot', 'DurationHours', 'Guests', 'HostName', 'HostEmail', 'HostPhone', 'FinalPriceINR', 'Status'];
    const rows = currentList.map(b => [
      `"${b.shareCode || ''}"`,
      `"${(b.eventName || '').replace(/"/g, '""')}"`,
      `"${(b.roomName || '').replace(/"/g, '""')}"`,
      `"${b.date || ''}"`,
      `"${b.timeSlot || ''}"`,
      b.durationHours,
      b.guestsCount,
      `"${(b.userName || '').replace(/"/g, '""')}"`,
      `"${b.userEmail || ''}"`,
      `"${b.userPhone || ''}"`,
      b.finalPrice,
      `"${b.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Celebrato_Bookings_${activeSubPage}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showFeedback('Exported CSV successfully!');
  };

  // Quick Check-In handler
  const handleQuickCheckIn = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onStatusChange(b.id, 'checked-in');
      showFeedback(`Checked in "${b.eventName}" for ${b.userName}!`);
    } catch (err) {
      console.error(err);
      alert('Failed to check in.');
    }
  };

  // Quick Complete handler
  const handleQuickComplete = async (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await onStatusChange(b.id, 'completed');
      showFeedback(`Party "${b.eventName}" marked as completed!`);
    } catch (err) {
      console.error(err);
      alert('Failed to complete.');
    }
  };

  // Subpage metadata titles and summaries
  const pageMeta: Record<BookingSubPage, { title: string; subtitle: string; badge: string; color: string }> = {
    all: {
      title: 'All Party Bookings Master Ledger',
      subtitle: 'Complete central repository of all private suite reservations across all statuses.',
      badge: `${bookings.length} Total Reservations`,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    confirmed: {
      title: 'Confirmed & Upcoming Party Suites',
      subtitle: 'Scheduled reservations ready for host arrival. Verify guest count and execute 1-click check-in.',
      badge: `${confirmedBookings.length} Confirmed`,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    'checked-in': {
      title: 'Live Parties & Active Suite Monitor',
      subtitle: 'Parties currently underway inside Celebrato suites. Monitor durations and check out upon departure.',
      badge: `${liveBookings.length} Live In-House`,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    },
    completed: {
      title: 'Completed Celebrations Archive',
      subtitle: 'Historical archive of concluded parties, financial reconciliation, and host satisfaction.',
      badge: `${completedBookings.length} Concluded`,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    },
    cancelled: {
      title: 'Cancelled & Refunded Party Bookings',
      subtitle: 'Audit log of cancelled reservations, notes, and release of suite inventory.',
      badge: `${cancelledBookings.length} Cancelled`,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    },
    calendar: {
      title: 'Suite Schedule & Timetable Calendar',
      subtitle: 'Day-by-day room occupancy timeline. Easily detect overlaps, open hours, and room utilization.',
      badge: 'Visual Room Schedule',
      color: 'text-amber-300 bg-amber-500/10 border-amber-500/30'
    },
    details: {
      title: 'Reservation Inspector & Invoice',
      subtitle: 'Deep-dive booking details, breakdown of custom add-ons, host profile, and printable slip.',
      badge: 'Deep Inspection',
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    }
  };

  // Calculate Subpage Totals
  const subpageGrossRevenue = currentList.reduce((acc, b) => acc + (b.status !== 'cancelled' ? b.finalPrice : 0), 0);
  const subpageTotalGuests = currentList.reduce((acc, b) => acc + (b.guestsCount || 0), 0);

  return (
    <div id="admin-bookings-manager-container" className="space-y-6 text-left">
      
      {/* Toast Feedback */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{actionFeedback}</span>
        </div>
      )}

      {/* Sub-Pages Bar Header */}
      <div className="rounded-3xl bg-[#202020] border border-[#383838] p-5 sm:p-6 space-y-5 shadow-xl">
        
        {/* Navigation Pills between all separate bookings pages */}
        <div className="flex items-center justify-between gap-3 flex-wrap border-b border-[#333333] pb-4">
          <div className="flex items-center gap-2 overflow-x-auto modern-scrollbar pb-1">
            {[
              { id: 'all', label: 'All Bookings', count: bookings.length, icon: Calendar },
              { id: 'confirmed', label: 'Confirmed', count: confirmedBookings.length, icon: CheckCircle2 },
              { id: 'checked-in', label: 'Live Now', count: liveBookings.length, icon: Radio },
              { id: 'completed', label: 'Completed', count: completedBookings.length, icon: Clock },
              { id: 'cancelled', label: 'Cancelled', count: cancelledBookings.length, icon: XCircle },
              { id: 'calendar', label: 'Calendar Grid', icon: CalendarDays },
            ].map((tab) => {
              const isCurrent = activeSubPage === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`admin-bookings-tab-${tab.id}`}
                  onClick={() => onSelectSubPage(tab.id as BookingSubPage)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                      : 'text-gray-400 hover:text-white bg-[#181818] hover:bg-[#282828] border border-[#333333]'
                  }`}
                >
                  <tab.icon className={`w-3.5 h-3.5 ${tab.id === 'checked-in' && liveBookings.length > 0 && !isCurrent ? 'text-emerald-400 animate-pulse' : ''}`} />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isCurrent ? 'bg-slate-950/20 text-slate-950' : 'bg-[#252525] text-gray-300'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl bg-[#181818] hover:bg-[#282828] text-gray-300 hover:text-white border border-[#383838] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Download bookings as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={() => {
                printBookingsReport({
                  bookings: currentList,
                  title: pageMeta[activeSubPage]?.title || 'Bookings Total Data',
                  filterName: pageMeta[activeSubPage]?.badge || activeSubPage,
                  totalRevenue: subpageGrossRevenue,
                  totalGuests: subpageTotalGuests,
                });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#181818] hover:bg-[#282828] text-gray-300 hover:text-white border border-[#383838] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Print Total Bookings Data Report"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Print Total Data</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

        {/* Page Title & Stats Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider border ${pageMeta[activeSubPage]?.color || ''}`}>
                {pageMeta[activeSubPage]?.badge}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                {currentList.length} items shown
              </span>
            </div>
            <h2 className="text-2xl font-black text-white font-outfit">
              {pageMeta[activeSubPage]?.title}
            </h2>
            <p className="hidden sm:block text-xs text-gray-400 max-w-2xl leading-relaxed">
              {pageMeta[activeSubPage]?.subtitle}
            </p>
          </div>

          {/* Quick Metrics for this specific page - hidden on mobile UI */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#333333] space-y-0.5 min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Value</span>
              <div className="text-base font-black text-amber-400 font-outfit">
                ₹{subpageGrossRevenue.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-2xl bg-[#181818] border border-[#333333] space-y-0.5 min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-gray-400">Total Guests</span>
              <div className="text-base font-black text-white font-outfit">
                {subpageTotalGuests} Guests
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* RENDER VIEW: If CALENDAR VIEW */}
      {activeSubPage === 'calendar' ? (
        <div className="rounded-3xl bg-[#202020] border border-[#383838] p-6 space-y-6 shadow-xl">
          {/* Calendar Date Navigator */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#333333] pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const d = new Date(calendarDate);
                  d.setDate(d.getDate() - 1);
                  setCalendarDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 rounded-xl bg-[#181818] hover:bg-[#282828] text-gray-300 hover:text-white border border-[#383838]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={calendarDate}
                onChange={(e) => setCalendarDate(e.target.value)}
                className="px-3.5 py-1.5 bg-[#181818] border border-[#383838] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
              />

              <button
                onClick={() => {
                  const d = new Date(calendarDate);
                  d.setDate(d.getDate() + 1);
                  setCalendarDate(d.toISOString().split('T')[0]);
                }}
                className="p-2 rounded-xl bg-[#181818] hover:bg-[#282828] text-gray-300 hover:text-white border border-[#383838]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setCalendarDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold border border-amber-500/30"
              >
                Today
              </button>
            </div>

            <div className="text-xs text-gray-400">
              Schedule for <strong className="text-white font-medium">{new Date(calendarDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong>
            </div>
          </div>

          {/* Room Schedule Grid */}
          <div className="space-y-4">
            {rooms.map((room) => {
              const dayBookings = bookings.filter((b) => b.roomId === room.id && b.date === calendarDate && b.status !== 'cancelled');

              return (
                <div key={room.id} className="p-4 rounded-2xl bg-[#181818] border border-[#333333] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#282828] pb-2">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-amber-400" />
                      <h4 className="text-sm font-bold text-white font-outfit">{room.name}</h4>
                      <span className="text-[10px] text-gray-400 bg-[#252525] px-2 py-0.5 rounded">
                        Capacity: {room.capacity}
                      </span>
                    </div>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      {dayBookings.length} {dayBookings.length === 1 ? 'event' : 'events'} scheduled
                    </span>
                  </div>

                  {dayBookings.length === 0 ? (
                    <div className="p-4 rounded-xl bg-[#202020] border border-dashed border-[#333333] text-center text-xs text-gray-500">
                      No bookings scheduled on this date. Room is fully available!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {dayBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => onSelectBooking(b)}
                          className="p-3.5 rounded-xl bg-[#202020] border border-[#383838] hover:border-amber-500 transition cursor-pointer space-y-1.5 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-mono font-bold text-amber-400 bg-[#161616] px-1.5 py-0.5 rounded">
                              {b.shareCode}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'confirmed' ? 'bg-emerald-500/20 text-emerald-400' :
                              b.status === 'checked-in' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-300'
                            }`}>
                              {b.status}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                            {b.eventName}
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{b.timeSlot} ({b.durationHours} hrs)</span>
                          </div>
                          <div className="text-[11px] text-gray-400 flex items-center justify-between pt-1 border-t border-[#282828]">
                            <span>Host: {b.userName}</span>
                            <span className="font-bold text-white">₹{b.finalPrice}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* RENDER VIEW: STANDARD SEPARATE PAGES LIST (All, Confirmed, Checked-in, Completed, Cancelled) */
        <div className="space-y-4">
          
          {/* Controls: Search, Room Filter, Sort */}
          <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                id="admin-booking-search-input"
                type="text"
                placeholder="Search host, code, room, event name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              {/* Filter Room */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#181818] px-2.5 py-1.5 rounded-xl border border-[#383838]">
                <span>Room:</span>
                <select
                  value={selectedRoomFilter}
                  onChange={(e) => setSelectedRoomFilter(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-[#181818]">All Suites</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#181818]">
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#181818] px-2.5 py-1.5 rounded-xl border border-[#383838]">
                <span>Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="date-desc" className="bg-[#181818]">Date (Newest First)</option>
                  <option value="date-asc" className="bg-[#181818]">Date (Oldest First)</option>
                  <option value="price-desc" className="bg-[#181818]">Price (Highest First)</option>
                  <option value="price-asc" className="bg-[#181818]">Price (Lowest First)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bookings List Cards */}
          {currentList.length === 0 ? (
            <div className="p-12 text-center bg-[#202020] rounded-3xl border border-[#383838] space-y-3">
              <Calendar className="w-10 h-10 text-gray-600 mx-auto" />
              <h3 className="text-base font-bold text-white font-outfit">
                No Bookings in "{pageMeta[activeSubPage]?.title}"
              </h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No reservations match your current filters or this separate page category.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((b) => (
                <div
                  key={b.id}
                  id={`admin-booking-item-${b.id}`}
                  onClick={() => onSelectBooking(b)}
                  className="p-5 rounded-2xl bg-[#202020] border border-[#383838] hover:border-amber-500/50 hover:bg-[#222222] transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer group shadow-md"
                >
                  {/* Left: Share Code & Event Info */}
                  <div className="space-y-1.5 max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-amber-400 bg-[#161616] px-2 py-0.5 rounded border border-[#383838]">
                        {b.shareCode || b.id.slice(-6).toUpperCase()}
                      </span>
                      <h4 className="text-base font-bold text-white truncate font-outfit group-hover:text-amber-300 transition">
                        {b.eventName}
                      </h4>
                      {b.status === 'checked-in' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                          <Radio className="w-2.5 h-2.5" /> Live Now
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      Room: <strong className="text-gray-200">{b.roomName}</strong> • Host: <strong className="text-gray-200">{b.userName}</strong> ({b.userEmail})
                    </p>

                    {b.userPhone && (
                      <p className="text-[11px] text-gray-500 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-amber-400" />
                        <span>Phone: {b.userPhone}</span>
                      </p>
                    )}
                  </div>

                  {/* Middle: Schedule & Guests */}
                  <div className="text-xs space-y-1">
                    <div className="text-gray-300 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{b.date} ({b.timeSlot})</span>
                    </div>
                    <div className="text-gray-400 flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-500" />
                        {b.guestsCount} Guests
                      </span>
                      <span>•</span>
                      <span>{b.durationHours} Hours</span>
                    </div>
                    {b.addOns && b.addOns.length > 0 && (
                      <div className="text-[11px] text-amber-300/90 truncate max-w-xs">
                        {b.addOns.length} Add-on items included
                      </div>
                    )}
                  </div>

                  {/* Right: Price */}
                  <div className="text-xs space-y-0.5 min-w-[100px]">
                    <div className="text-xl font-black text-white font-outfit">
                      ₹{b.finalPrice.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {b.durationHours}h celebration
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : b.status === 'checked-in'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : b.status === 'completed'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {b.status}
                    </span>

                    {/* Quick Action Button depending on subpage / status */}
                    {b.status === 'confirmed' && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickCheckIn(b, e)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Quick Check-In Guests Now"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Check In</span>
                      </button>
                    )}

                    {b.status === 'checked-in' && (
                      <button
                        type="button"
                        onClick={(e) => handleQuickComplete(b, e)}
                        className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                        title="Mark Event Concluded & Check Out"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </button>
                    )}

                    <select
                      value={b.status}
                      onChange={(e) => onStatusChange(b.id, e.target.value as Booking['status'])}
                      className="px-2.5 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="checked-in">Checked In</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    <button
                      id={`admin-inspect-btn-${b.id}`}
                      type="button"
                      onClick={() => onSelectBooking(b)}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm"
                      title="Inspect full details, custom add-ons, notes, and print slip"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

    </div>
  );
};
