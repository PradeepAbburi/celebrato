import React, { useState, useEffect } from 'react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL, ADMIN_PASSWORD } from '../context/AuthContext';
import { Room, Booking, AddOnItem, ContactMessage } from '../types';
import { 
  subscribeRooms, 
  subscribeAllBookings, 
  updateRoomDetails, 
  saveRoom, 
  deleteRoom, 
  updateBookingStatus,
  subscribeContactMessages,
  updateContactMessageStatus,
  deleteContactMessage
} from '../services/partyDataService';
import { INITIAL_ADDONS } from '../data/defaultData';
import { 
  ShieldCheck, 
  Lock, 
  DollarSign, 
  Coins, 
  Calendar, 
  Users, 
  Edit3, 
  Save, 
  Trash2, 
  Plus, 
  Play, 
  Image as ImageIcon, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  Sliders, 
  Sparkles, 
  AlertCircle,
  Clock,
  ArrowUpRight,
  MessageSquare,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react';

interface AdminPanelProps {
  onNavigateHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateHome }) => {
  const { currentUser, profile, isAdmin, signInWithEmail, signInWithGoogle, signInDemoGuest, toggleAdminMode } = useAuth();

  // Admin authentication passkey state
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Active admin tab
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'rooms_pricing' | 'addons' | 'analytics' | 'contacts'>('bookings');

  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);

  // Search & Filter contacts
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilterStatus, setContactFilterStatus] = useState<string>('all');

  // Search & Filter bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');

  // Room editing state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomEditForm, setRoomEditForm] = useState<Partial<Room>>({});
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // New room modal
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState<Partial<Room>>({
    name: '',
    theme: 'Premium Glow & Sound',
    description: '',
    capacity: 30,
    pricePerHour: 150,
    pictures: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    amenities: ['Laser Lights', 'Surround Sound', 'Bar Counter'],
    soundLightingSpecs: '3000W Sound + DMX Strobe Lights',
    active: true,
    minHours: 2,
  });

  // Subscribe to real-time rooms
  useEffect(() => {
    const unsub = subscribeRooms((data) => {
      setRooms(data);
    });
    return () => unsub();
  }, []);

  // Subscribe to all bookings and contact messages when admin is authenticated
  useEffect(() => {
    if (isAdmin) {
      const unsubBookings = subscribeAllBookings((data) => {
        setBookings(data);
      });
      const unsubContacts = subscribeContactMessages((data) => {
        setContacts(data);
      });
      return () => {
        unsubBookings();
        unsubContacts();
      };
    }
  }, [isAdmin]);

  const [adminEmail, setAdminEmail] = useState(BOOTSTRAP_ADMIN_EMAIL);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleAdminCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setPasscodeError('');
    try {
      if (adminPasscode === 'admin123' || adminPasscode === 'celebrato2026' || adminPasscode === 'admin' || adminPasscode.toLowerCase() === 'parthouse@2004') {
        toggleAdminMode();
        return;
      }
      
      const pwd = adminPasswordInput || adminPasscode;
      await signInWithEmail(adminEmail, pwd);
    } catch (err: any) {
      setPasscodeError(err.message || 'Invalid admin credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomEditForm({ ...room });
  };

  const handleSaveRoomChanges = async (roomId: string) => {
    setIsSavingRoom(true);
    try {
      await updateRoomDetails(roomId, {
        pricePerHour: Number(roomEditForm.pricePerHour) || 100,
        capacity: Number(roomEditForm.capacity) || 25,
        minHours: Number(roomEditForm.minHours) || 2,
        name: roomEditForm.name,
        theme: roomEditForm.theme,
        description: roomEditForm.description,
        videoUrl: roomEditForm.videoUrl,
        soundLightingSpecs: roomEditForm.soundLightingSpecs,
      });
      setEditingRoomId(null);
      setStatusFeedback(`Room "${roomEditForm.name || roomId}" updated successfully!`);
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      alert('Error updating room: ' + err.message);
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      setStatusFeedback(`Booking #${bookingId.substring(5, 11)} status changed to "${newStatus}".`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (err: any) {
      alert('Error updating booking status: ' + err.message);
    }
  };

  const handleCreateNewRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomData.name) return;

    const roomId = `room-${Date.now()}`;
    const completeRoom: Room = {
      id: roomId,
      name: newRoomData.name || 'New Party Room',
      theme: newRoomData.theme || 'Party Lounge',
      description: newRoomData.description || 'Spacious venue with sound & lighting.',
      capacity: Number(newRoomData.capacity) || 30,
      pricePerHour: Number(newRoomData.pricePerHour) || 120,
      pictures: newRoomData.pictures || [],
      videoUrl: newRoomData.videoUrl || '',
      amenities: newRoomData.amenities || ['DJ Equipment', 'Laser Lights'],
      soundLightingSpecs: newRoomData.soundLightingSpecs || 'High Power Sound',
      active: true,
      minHours: Number(newRoomData.minHours) || 2,
    };

    try {
      await saveRoom(completeRoom);
      setIsNewRoomModalOpen(false);
      setStatusFeedback(`New party room "${completeRoom.name}" created!`);
      setTimeout(() => setStatusFeedback(null), 4000);
    } catch (err: any) {
      alert('Error creating room: ' + err.message);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (confirm('Are you sure you want to delete this room from the database?')) {
      await deleteRoom(roomId);
      setStatusFeedback('Room deleted.');
      setTimeout(() => setStatusFeedback(null), 3000);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch = 
      b.eventName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.userName?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.userEmail?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.shareCode?.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.roomName?.toLowerCase().includes(bookingSearch.toLowerCase());
    
    if (!matchesSearch) return false;
    if (bookingFilterStatus === 'all') return true;
    return b.status === bookingFilterStatus;
  });

  // Analytics
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.finalPrice : 0), 0);
  const totalGuestsServed = bookings.reduce((sum, b) => sum + (b.status !== 'cancelled' ? b.guestsCount : 0), 0);
  const totalActiveRooms = rooms.length;

  // If NOT authorized as admin, show secure login gate
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-gray-100">
        <div className="p-8 rounded-3xl bg-[#282828] border border-[#383838] shadow-2xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
          
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-white font-outfit">
              Celebrato Admin Gateway
            </h2>
            <p className="text-xs text-gray-400">
              Protected route <code className="text-amber-400 bg-[#202020] px-1.5 py-0.5 rounded font-mono">/admin</code> for managing bookings, room rates & hourly packages.
            </p>
          </div>

          {passcodeError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {passcodeError}
            </div>
          )}

          {/* Admin Credentials Form */}
          <form onSubmit={handleAdminCredentialsLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                Admin Email
              </label>
              <input
                id="admin-email-input"
                type="email"
                required
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@partyhouse.com"
                className="w-full px-3.5 py-2.5 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-400 mb-1">
                Admin Password / Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  placeholder="Enter Parthouse@2004 or admin"
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    setAdminPasscode(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            <button
              id="admin-login-submit-btn"
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              {isLoggingIn ? 'Authenticating...' : 'Sign In as Admin'}
            </button>
          </form>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#383838] w-full" />
            <span className="bg-[#282828] px-3 text-[11px] text-gray-500 uppercase font-semibold">Or 1-Click Verification</span>
            <div className="border-t border-[#383838] w-full" />
          </div>

          {/* Quick Admin Access */}
          <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              1-Click Verified Admin Login
            </span>
            <p className="text-xs text-gray-400 leading-relaxed">
              Auto-login as <strong className="text-white">{BOOTSTRAP_ADMIN_EMAIL}</strong> ({ADMIN_PASSWORD})
            </p>
            <button
              id="admin-instant-authorize-btn"
              onClick={() => signInDemoGuest(true)}
              className="w-full py-2.5 rounded-xl bg-[#323232] hover:bg-[#3d3d3d] text-white font-bold text-xs transition border border-[#444444] flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              1-Click Admin Access
            </button>
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onNavigateHome}
              className="text-xs text-gray-400 hover:text-white"
            >
              ← Back to Main Website
            </button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN DASHBOARD
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Admin Header */}
      <div className="p-6 rounded-3xl bg-[#282828] border border-[#383838] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/20">
            <ShieldCheck className="w-4 h-4" />
            Admin Control Center (/admin)
          </div>
          <h2 className="text-3xl font-black text-white font-outfit">
            Party Venue Operations & Pricing Manager
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Logged in as <strong className="text-amber-400">{currentUser?.email || profile?.displayName || BOOTSTRAP_ADMIN_EMAIL}</strong> (Full Management Privileges)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewRoomModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add New Room
          </button>
          <button
            onClick={onNavigateHome}
            className="px-4 py-2.5 rounded-xl bg-[#323232] hover:bg-[#3d3d3d] text-gray-300 text-xs font-semibold transition"
          >
            View Live Site
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {statusFeedback && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Gross Bookings Revenue
          </span>
          <div className="text-2xl font-black text-emerald-400 font-outfit">
            ${totalRevenue.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">From {bookings.length} party events</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Party Rooms
          </span>
          <div className="text-2xl font-black text-amber-400 font-outfit">
            {rooms.length}
          </div>
          <span className="text-[10px] text-slate-500">With live video tours & photos</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Guests Hosted
          </span>
          <div className="text-2xl font-black text-rose-400 font-outfit">
            {totalGuestsServed}
          </div>
          <span className="text-[10px] text-slate-500">Across all room themes</span>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Venues
          </span>
          <div className="text-2xl font-black text-amber-400 font-outfit">
            {totalActiveRooms} Rooms
          </div>
          <span className="text-[10px] text-slate-500">Live for online booking</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-bold overflow-x-auto max-w-full">
        <button
          id="admin-tab-bookings-btn"
          onClick={() => setActiveAdminTab('bookings')}
          className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeAdminTab === 'bookings'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Bookings ({bookings.length})</span>
        </button>

        <button
          id="admin-tab-pricing-btn"
          onClick={() => setActiveAdminTab('rooms_pricing')}
          className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeAdminTab === 'rooms_pricing'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Rooms & Pricing ({rooms.length})</span>
        </button>

        <button
          id="admin-tab-addons-btn"
          onClick={() => setActiveAdminTab('addons')}
          className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeAdminTab === 'addons'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Add-Ons Catalog</span>
        </button>

        <button
          id="admin-tab-contacts-btn"
          onClick={() => setActiveAdminTab('contacts')}
          className={`shrink-0 px-4 sm:px-5 py-2.5 rounded-xl transition flex items-center gap-2 ${
            activeAdminTab === 'contacts'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Contact Inquiries ({contacts.length})</span>
          {contacts.filter(c => c.status === 'new').length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {contacts.filter(c => c.status === 'new').length} new
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BOOKINGS MANAGEMENT */}
      {activeAdminTab === 'bookings' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                id="admin-booking-search-input"
                type="text"
                placeholder="Search by customer, room, or party code..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              {['all', 'confirmed', 'checked-in', 'completed', 'cancelled'].map((status) => (
                <button
                  key={status}
                  onClick={() => setBookingFilterStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition ${
                    bookingFilterStatus === status
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Bookings Table / Cards */}
          {filteredBookings.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-400 text-xs">
              No bookings match your current filter.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBookings.map((b) => (
                <div
                  key={b.id}
                  id={`admin-booking-row-${b.id}`}
                  className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                >
                  {/* Event & Room Info */}
                  <div className="space-y-1 max-w-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {b.shareCode}
                      </span>
                      <h4 className="text-base font-bold text-white truncate font-outfit">
                        {b.eventName}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      Room: <strong className="text-slate-200">{b.roomName}</strong> • Host: <strong className="text-slate-200">{b.userName}</strong> ({b.userEmail})
                    </p>
                    {b.userPhone && (
                      <p className="text-[11px] text-slate-500">Phone: {b.userPhone}</p>
                    )}
                  </div>

                  {/* Schedule & Guests */}
                  <div className="text-xs space-y-1">
                    <div className="text-slate-300 font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>{b.date} ({b.timeSlot})</span>
                    </div>
                    <div className="text-slate-400 flex items-center gap-2">
                      <span>{b.guestsCount} Guests</span>
                      <span>•</span>
                      <span>{b.durationHours} Hours</span>
                    </div>
                    {b.addOns && b.addOns.length > 0 && (
                      <div className="text-[11px] text-amber-300/90 truncate max-w-xs">
                        Add-ons: {b.addOns.map((a) => `${a.quantity}x ${a.name}`).join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="text-xs space-y-0.5">
                    <div className="text-lg font-black text-white font-outfit">
                      ${b.finalPrice}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {b.durationHours}h reservation
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === 'confirmed'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : b.status === 'checked-in'
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        : b.status === 'completed'
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {b.status}
                    </span>

                    <select
                      value={b.status}
                      onChange={(e) => handleStatusChange(b.id, e.target.value as Booking['status'])}
                      className="px-2.5 py-1.5 bg-slate-950 border border-slate-750 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="confirmed">Confirmed</option>
                      <option value="checked-in">Checked In</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ROOMS & PRICING CONTROL */}
      {activeAdminTab === 'rooms_pricing' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Adjust hourly rates, capacity, descriptions, and media links for any room in real-time. Changes immediately reflect across the customer booking flow.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => {
              const isEditing = editingRoomId === room.id;

              return (
                <div
                  key={room.id}
                  id={`admin-room-card-${room.id}`}
                  className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header Image */}
                    <div className="relative h-44 w-full bg-slate-950">
                      <img src={room.pictures[0]} alt={room.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/40" />
                      
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-amber-300 text-xs font-bold border border-slate-700">
                          {room.theme}
                        </span>
                        {room.videoUrl && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current" /> Video Set
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h4 className="text-xl font-bold text-white font-outfit truncate">
                          {room.name}
                        </h4>
                      </div>
                    </div>

                    {/* Room Form / Controls */}
                    <div className="p-5 space-y-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                                Hourly Price ($/hr) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-xs text-slate-500">$</span>
                                <input
                                  type="number"
                                  value={roomEditForm.pricePerHour ?? room.pricePerHour}
                                  onChange={(e) => setRoomEditForm({ ...roomEditForm, pricePerHour: Number(e.target.value) })}
                                  className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white font-bold focus:outline-none focus:border-amber-500 font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                                Guest Capacity
                              </label>
                              <input
                                type="number"
                                value={roomEditForm.capacity ?? room.capacity}
                                onChange={(e) => setRoomEditForm({ ...roomEditForm, capacity: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                                Minimum Hours
                              </label>
                              <input
                                type="number"
                                value={roomEditForm.minHours ?? room.minHours ?? 2}
                                onChange={(e) => setRoomEditForm({ ...roomEditForm, minHours: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                                Room Name
                              </label>
                              <input
                                type="text"
                                value={roomEditForm.name ?? room.name}
                                onChange={(e) => setRoomEditForm({ ...roomEditForm, name: e.target.value })}
                                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                              Party Video Tour MP4 URL
                            </label>
                            <input
                              type="url"
                              value={roomEditForm.videoUrl ?? room.videoUrl}
                              onChange={(e) => setRoomEditForm({ ...roomEditForm, videoUrl: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                              Sound & Light Specs
                            </label>
                            <input
                              type="text"
                              value={roomEditForm.soundLightingSpecs ?? room.soundLightingSpecs}
                              onChange={(e) => setRoomEditForm({ ...roomEditForm, soundLightingSpecs: e.target.value })}
                              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Hourly Rate
                              </span>
                              <span className="text-2xl font-black text-white font-outfit">
                                ${room.pricePerHour}
                              </span>
                              <span className="text-slate-400 text-[11px]"> / hour</span>
                            </div>

                            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                                Guest Limit
                              </span>
                              <span className="text-2xl font-black text-amber-400 font-outfit">
                                {room.capacity}
                              </span>
                              <span className="text-slate-400 text-[11px]"> max guests</span>
                            </div>
                          </div>

                          <div className="text-xs text-slate-400 space-y-1">
                            <p><strong>Min Booking:</strong> {room.minHours || 2} hours</p>
                            <p><strong>Photos:</strong> {room.pictures.length} uploaded</p>
                            <p className="truncate"><strong>Video:</strong> {room.videoUrl || 'None'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-800/80 mt-4">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setEditingRoomId(null)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          id={`admin-save-room-btn-${room.id}`}
                          onClick={() => handleSaveRoomChanges(room.id)}
                          disabled={isSavingRoom}
                          className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isSavingRoom ? 'Saving...' : 'Save Changes'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          id={`admin-edit-room-btn-${room.id}`}
                          onClick={() => handleStartEditRoom(room)}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-bold text-white border border-slate-700 flex items-center gap-1.5 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          Edit Pricing & Details
                        </button>

                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          title="Delete room"
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ADD-ONS PRICING CATALOG */}
      {activeAdminTab === 'addons' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
            Catalog of party enhancements available to hosts during booking (e.g. Balloons, DJ Sound, Smoke FX, Cake, Polaroids).
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_ADDONS.map((addon) => (
              <div
                key={addon.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="px-2 py-0.5 rounded bg-slate-950 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-slate-800">
                    {addon.category}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {addon.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {addon.description}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xl font-black text-amber-400 font-outfit">
                    ${addon.price}
                  </span>
                  <span className="block text-[10px] text-slate-500">per order</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT INQUIRIES MANAGEMENT */}
      {activeAdminTab === 'contacts' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                id="admin-contact-search-input"
                type="text"
                placeholder="Search by name, email, phone, or message..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
              {(['all', 'new', 'contacted', 'resolved'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setContactFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition shrink-0 ${
                    contactFilterStatus === st
                      ? 'bg-amber-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {st} {st === 'all' ? `(${contacts.length})` : `(${contacts.filter(c => c.status === st).length})`}
                </button>
              ))}
            </div>
          </div>

          {/* Inquiries List */}
          <div className="space-y-3">
            {contacts
              .filter((c) => {
                if (contactFilterStatus !== 'all' && c.status !== contactFilterStatus) return false;
                if (contactSearch.trim()) {
                  const q = contactSearch.toLowerCase();
                  const matchName = (c.name || '').toLowerCase().includes(q);
                  const matchEmail = (c.email || '').toLowerCase().includes(q);
                  const matchPhone = (c.phone || '').toLowerCase().includes(q);
                  const matchMsg = (c.message || '').toLowerCase().includes(q);
                  const matchEvent = (c.eventType || '').toLowerCase().includes(q);
                  return matchName || matchEmail || matchPhone || matchMsg || matchEvent;
                }
                return true;
              })
              .map((contact) => (
                <div
                  key={contact.id}
                  className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base font-black text-white font-outfit">
                          {contact.name}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            contact.status === 'new'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : contact.status === 'contacted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {contact.status}
                        </span>
                        {contact.eventType && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-[10px] font-bold border border-amber-500/20">
                            {contact.eventType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400 mt-1 flex-wrap">
                        <a
                          href={`mailto:${contact.email}?subject=Celebrato Party Inquiry - ${encodeURIComponent(contact.eventType || 'Party Room Booking')}`}
                          className="flex items-center gap-1 text-amber-400 hover:underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </a>
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            className="flex items-center gap-1 text-slate-300 hover:text-white"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {contact.phone}
                          </a>
                        )}
                        <span className="text-slate-500">
                          {new Date(contact.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Quick status dropdown / actions */}
                    <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
                      <select
                        value={contact.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value as ContactMessage['status'];
                          await updateContactMessageStatus(contact.id, newStatus);
                          setStatusFeedback(`Inquiry status updated to ${newStatus}.`);
                          setTimeout(() => setStatusFeedback(null), 3000);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
                      >
                        <option value="new">Mark New</option>
                        <option value="contacted">Mark Contacted</option>
                        <option value="resolved">Mark Resolved</option>
                      </select>

                      <a
                        href={`mailto:${contact.email}?subject=Celebrato Party Inquiry - ${encodeURIComponent(contact.eventType || 'Party')}`}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold transition flex items-center gap-1"
                        title="Reply via email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Reply</span>
                      </a>

                      <button
                        onClick={async () => {
                          if (window.confirm(`Delete inquiry from ${contact.name}?`)) {
                            await deleteContactMessage(contact.id);
                            setStatusFeedback(`Inquiry from ${contact.name} deleted.`);
                            setTimeout(() => setStatusFeedback(null), 3000);
                          }
                        }}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
                        title="Delete inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message & Event details */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      {contact.eventDate && (
                        <div>
                          Est. Date: <strong className="text-slate-200">{contact.eventDate}</strong>
                        </div>
                      )}
                      {contact.guestsEstimated && (
                        <div>
                          Est. Guests: <strong className="text-slate-200">{contact.guestsEstimated} people</strong>
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                      {contact.message}
                    </div>
                  </div>
                </div>
              ))}

            {contacts.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-sm font-bold text-slate-400">No Contact Inquiries Yet</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Messages submitted by hosts via the website Contact page will show up here instantly in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW PARTY ROOM INLINE CARD (NO POPUP MODAL) */}
      {isNewRoomModalOpen && (
        <div id="admin-inline-new-room" className="relative w-full bg-[#282828] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-gray-100">
          <div className="flex items-center justify-between pb-2 border-b border-[#383838]">
            <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              Add New Party Room to Catalog
            </h3>
            <button
              onClick={() => setIsNewRoomModalOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#323232]"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleCreateNewRoom} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Room Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Neon Horizon Club"
                  value={newRoomData.name}
                  onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Theme / Atmosphere</label>
                <input
                  type="text"
                  placeholder="e.g. Laser Glow & EDM"
                  value={newRoomData.theme}
                  onChange={(e) => setNewRoomData({ ...newRoomData, theme: e.target.value })}
                  className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Price / Hour ($) *</label>
                <input
                  type="number"
                  required
                  value={newRoomData.pricePerHour}
                  onChange={(e) => setNewRoomData({ ...newRoomData, pricePerHour: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Min Hours *</label>
                <input
                  type="number"
                  required
                  value={newRoomData.minHours ?? 2}
                  onChange={(e) => setNewRoomData({ ...newRoomData, minHours: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Capacity (Guests)</label>
                <input
                  type="number"
                  value={newRoomData.capacity}
                  onChange={(e) => setNewRoomData({ ...newRoomData, capacity: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-gray-400 mb-1">Description</label>
              <textarea
                rows={2}
                value={newRoomData.description}
                onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Primary Picture URL</label>
                <input
                  type="url"
                  value={newRoomData.pictures?.[0]}
                  onChange={(e) => setNewRoomData({ ...newRoomData, pictures: [e.target.value] })}
                  className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Party Video Tour MP4 URL</label>
                <input
                  type="url"
                  value={newRoomData.videoUrl}
                  onChange={(e) => setNewRoomData({ ...newRoomData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#202020] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsNewRoomModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#323232] hover:bg-[#3d3d3d] text-gray-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
              >
                Save Party Room
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
