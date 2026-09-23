import React, { useState, useEffect, useRef } from 'react';
import { useAuth, BOOTSTRAP_ADMIN_EMAIL, ADMIN_PASSWORD } from '../context/AuthContext';
import { Room, Booking, AddOnItem, ContactMessage } from '../types';
import { 
  subscribeRooms, 
  subscribeAllBookings, 
  updateRoomDetails, 
  saveRoom, 
  deleteRoom, 
  updateBookingStatus,
  updateBookingNotes,
  subscribeContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  subscribeAddOns,
  saveAddOn,
  deleteAddOn
} from '../services/partyDataService';
import { AdminBookingDetails } from './AdminBookingDetails';
import { AdminAnalytics } from './AdminAnalytics';
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
  ExternalLink,
  Upload,
  X,
  Layers,
  Tag,
  LogOut,
  Check,
  Eye,
  BarChart3
} from 'lucide-react';

interface AdminPanelProps {
  onNavigateHome: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigateHome }) => {
  const { currentUser, profile, isAdmin, verifyAdminCode, toggleAdminMode, signOut } = useAuth();

  // Admin authentication passkey state
  const [adminPasscode, setAdminPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState('');

  // Active admin tab
  const [activeAdminTab, setActiveAdminTab] = useState<'bookings' | 'rooms_pricing' | 'addons' | 'analytics' | 'contacts'>('bookings');

  // Data states
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [addons, setAddons] = useState<AddOnItem[]>([]);
  const [contacts, setContacts] = useState<ContactMessage[]>([]);

  // Search & Filter contacts
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilterStatus, setContactFilterStatus] = useState<string>('all');

  // Search & Filter bookings
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState<string>('all');
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);

  // Room editing state
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomEditForm, setRoomEditForm] = useState<Partial<Room>>({});
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  
  // Amenities & Perks Points editing inputs
  const [editingAmenityInput, setEditingAmenityInput] = useState('');
  const [newRoomAmenityInput, setNewRoomAmenityInput] = useState('');

  // New room modal
  const [isNewRoomModalOpen, setIsNewRoomModalOpen] = useState(false);
  const [newRoomData, setNewRoomData] = useState<Partial<Room>>({
    name: '',
    theme: 'Laser Glow & Sound',
    description: '',
    capacity: 35,
    pricePerHour: 1999,
    pictures: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'],
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    amenities: ['Laser Lighting', 'Surround Sound', 'Bar Counter', 'DJ Station'],
    soundLightingSpecs: '4000W High Fidelity Sound + RGB Laser Projector',
    active: true,
    minHours: 2,
  });

  // Add-on editing & creation state
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [addonFormData, setAddonFormData] = useState<AddOnItem>({
    id: '',
    name: '',
    category: 'balloons',
    price: 999,
    imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
    description: '',
  });

  // File upload input refs
  const roomPhotoInputRef = useRef<HTMLInputElement>(null);
  const roomVideoInputRef = useRef<HTMLInputElement>(null);
  const newRoomPhotoRef = useRef<HTMLInputElement>(null);
  const newRoomVideoRef = useRef<HTMLInputElement>(null);
  const addonPhotoInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time rooms
  useEffect(() => {
    const unsub = subscribeRooms((data) => {
      setRooms(data);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time add-ons
  useEffect(() => {
    const unsub = subscribeAddOns((data) => {
      setAddons(data);
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

  // Analytics Metrics
  const totalRevenue = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked-in')
    .reduce((acc, curr) => acc + (curr.finalPrice || 0), 0);

  const totalConfirmedBookings = bookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'checked-in' || b.status === 'completed'
  ).length;

  const handlePasscodeUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      setPasscodeError('Active user session detected. You must log out of your user account before logging into the Admin Console.');
      return;
    }
    if (!adminPasscode.trim()) {
      setPasscodeError('Please enter your administrator access code.');
      return;
    }
    const result = verifyAdminCode(adminPasscode);
    if (result.success) {
      setPasscodeError('');
      setAdminPasscode('');
      setStatusFeedback('Admin verified successfully.');
      setTimeout(() => setStatusFeedback(null), 3000);
    } else {
      setPasscodeError(result.error || 'Access Denied: Invalid administrative code.');
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      setSelectedBookingForDetails((prev) => (prev && prev.id === bookingId ? { ...prev, status: newStatus } : prev));
      setStatusFeedback(`Booking status updated to ${newStatus}`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to update status', error);
      setStatusFeedback('Error updating status in Firebase.');
    }
  };

  const handleUpdateBookingNotes = async (bookingId: string, notes: string) => {
    try {
      await updateBookingNotes(bookingId, notes);
      setSelectedBookingForDetails((prev) => (prev && prev.id === bookingId ? { ...prev, notes } : prev));
      setStatusFeedback('Booking administrative notes saved.');
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to update notes', error);
      setStatusFeedback('Error saving notes to Firebase.');
    }
  };

  // Rooms CRUD
  const handleStartEditRoom = (room: Room) => {
    setEditingRoomId(room.id);
    setRoomEditForm({ ...room, amenities: [...(room.amenities || [])] });
    setEditingAmenityInput('');
  };

  const handleAddAmenityToEditRoom = () => {
    const val = editingAmenityInput.trim();
    if (!val) return;
    const current = roomEditForm.amenities || [];
    if (current.includes(val)) {
      setEditingAmenityInput('');
      return;
    }
    setRoomEditForm({
      ...roomEditForm,
      amenities: [...current, val]
    });
    setEditingAmenityInput('');
  };

  const handleRemoveAmenityFromEditRoom = (indexToRemove: number) => {
    const current = roomEditForm.amenities || [];
    setRoomEditForm({
      ...roomEditForm,
      amenities: current.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleAddAmenityToNewRoom = () => {
    const val = newRoomAmenityInput.trim();
    if (!val) return;
    const current = newRoomData.amenities || [];
    if (current.includes(val)) {
      setNewRoomAmenityInput('');
      return;
    }
    setNewRoomData({
      ...newRoomData,
      amenities: [...current, val]
    });
    setNewRoomAmenityInput('');
  };

  const handleRemoveAmenityFromNewRoom = (indexToRemove: number) => {
    const current = newRoomData.amenities || [];
    setNewRoomData({
      ...newRoomData,
      amenities: current.filter((_, idx) => idx !== indexToRemove)
    });
  };

  const handleSaveEditRoom = async (roomId: string) => {
    setIsSavingRoom(true);
    try {
      await updateRoomDetails(roomId, roomEditForm);
      setEditingRoomId(null);
      setStatusFeedback('Room details updated successfully!');
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to update room', error);
      alert('Error updating room in Firebase.');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this party room?')) return;
    try {
      await deleteRoom(roomId);
      setStatusFeedback('Room deleted.');
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to delete room', error);
    }
  };

  const handleCreateNewRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomData.name || !newRoomData.pricePerHour) return;

    const roomId = 'room-' + (newRoomData.name || 'custom').toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    const roomToSave: Room = {
      id: roomId,
      name: newRoomData.name || 'New Celebration Suite',
      theme: newRoomData.theme || 'Party Lounge',
      description: newRoomData.description || 'Exclusive private celebration suite equipped with high-fidelity sound, dynamic lighting, and party setup.',
      capacity: Number(newRoomData.capacity) || 30,
      pricePerHour: Number(newRoomData.pricePerHour) || 1999,
      pictures: newRoomData.pictures && newRoomData.pictures.length > 0 ? newRoomData.pictures : ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'],
      videoUrl: newRoomData.videoUrl || '',
      amenities: newRoomData.amenities || ['Dynamic Lighting', 'Sound System', 'Bar Counter'],
      soundLightingSpecs: newRoomData.soundLightingSpecs || '3000W Sound System + LED Ambience',
      active: true,
      minHours: Number(newRoomData.minHours) || 2,
    };

    try {
      await saveRoom(roomToSave);
      setIsNewRoomModalOpen(false);
      setStatusFeedback(`New party room "${roomToSave.name}" created!`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to create room', error);
    }
  };

  // Add-ons CRUD
  const handleOpenNewAddon = () => {
    setEditingAddonId(null);
    setAddonFormData({
      id: 'addon-' + Date.now().toString().slice(-6),
      name: '',
      category: 'balloons',
      price: 999,
      imageUrl: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80',
      description: '',
    });
    setIsAddonModalOpen(true);
  };

  const handleOpenEditAddon = (addon: AddOnItem) => {
    setEditingAddonId(addon.id);
    setAddonFormData({ ...addon });
    setIsAddonModalOpen(true);
  };

  const handleSaveAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addonFormData.name.trim()) return;

    try {
      await saveAddOn(addonFormData);
      setIsAddonModalOpen(false);
      setStatusFeedback(`Add-on "${addonFormData.name}" saved!`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save add-on:', error);
      alert('Error saving add-on.');
    }
  };

  const handleDeleteAddon = async (addonId: string, addonName: string) => {
    if (!window.confirm(`Delete add-on "${addonName}"?`)) return;
    try {
      await deleteAddOn(addonId);
      setStatusFeedback(`Add-on deleted.`);
      setTimeout(() => setStatusFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to delete add-on:', error);
    }
  };

  // Generic File Upload Handlers (FileReader base64)
  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    onComplete: (dataUrl: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onComplete(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus !== 'all' && b.status !== bookingFilterStatus) return false;
    if (bookingSearch.trim()) {
      const q = bookingSearch.toLowerCase();
      const matchName = (b.userName || '').toLowerCase().includes(q);
      const matchEmail = (b.userEmail || '').toLowerCase().includes(q);
      const matchCode = (b.shareCode || '').toLowerCase().includes(q);
      const matchRoom = (b.roomName || '').toLowerCase().includes(q);
      const matchEvent = (b.eventName || '').toLowerCase().includes(q);
      return matchName || matchEmail || matchCode || matchRoom || matchEvent;
    }
    return true;
  });

  // Non-authenticated Admin Gate
  if (!isAdmin) {
    return (
      <div id="admin-passcode-gate" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-left">
        <div className="max-w-md mx-auto p-8 rounded-3xl bg-[#202020] border border-[#383838] shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>

          <div className="text-center">
            <h2 className="text-2xl font-black text-white font-outfit">Celebrato Admin Console</h2>
            <p className="text-xs text-gray-400 mt-2 leading-relaxed">
              Administrative authorization required. Standard logged-in user accounts cannot access the admin console without the administrator security code.
            </p>
          </div>

          {currentUser ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left space-y-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Active User Account Detected</span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                You are currently logged in with user account <strong className="text-white">{currentUser.email || profile?.displayName}</strong>. Without logging out of your user account, you cannot access or log into the Administrator Console.
              </p>
              <button
                id="admin-gate-logout-user-btn"
                type="button"
                onClick={async () => {
                  await signOut();
                  setPasscodeError('');
                }}
                className="w-full py-2.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 shadow-md cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out of User Account to Continue</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handlePasscodeUnlock} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Administrator Security Code
                </label>
                <input
                  id="admin-passcode-input"
                  type="password"
                  autoComplete="off"
                  placeholder="Enter secret admin passkey"
                  value={adminPasscode}
                  onChange={(e) => {
                    setAdminPasscode(e.target.value);
                    setPasscodeError('');
                  }}
                  className="w-full px-4 py-3.5 bg-[#181818] border border-[#383838] rounded-xl text-white text-center font-mono tracking-wider focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              {passcodeError && (
                <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">{passcodeError}</p>
              )}

              <button
                id="admin-unlock-btn"
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition uppercase tracking-wider shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer"
              >
                Verify Code & Unlock Console
              </button>
            </form>
          )}

          <div className="pt-4 border-t border-[#383838] space-y-3">
            <div className="text-[11px] text-gray-400 bg-[#181818] p-3 rounded-xl border border-[#303030] text-left">
              <span className="font-bold text-amber-400 block mb-0.5">🔒 Strict Isolation Policy:</span>
              Users must log out before admin login. Admins cannot access user celebration pages without signing out first.
            </div>

            <button
              onClick={onNavigateHome}
              className="text-xs text-gray-400 hover:text-white transition block mx-auto font-medium cursor-pointer"
            >
              ← Return to Party Rooms
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Admin Dashboard
  return (
    <div id="admin-panel-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-[#202020] min-h-screen text-gray-200">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#383838] pb-6">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Administrator Portal
            </span>
            <span className="text-xs text-gray-400 font-mono">
              admin@celebrato.internal
            </span>
          </div>
          <h1 className="text-3xl font-black text-white font-outfit">
            Celebrato Operations & Venues Console
          </h1>
          <p className="text-xs text-gray-400">
            Real-time management of party bookings, suite inventory, add-on catalog, and venue analytics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsNewRoomModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Room</span>
          </button>

          <button
            onClick={handleOpenNewAddon}
            className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#323232] border border-[#383838] text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Add New Add-On</span>
          </button>

          <button
            id="admin-signout-btn"
            onClick={async () => {
              await signOut();
              onNavigateHome();
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-400 hover:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
            title="Sign Out of Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {statusFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span className="font-semibold">{statusFeedback}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#202020] border border-[#383838] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Revenue</span>
          <div className="text-2xl font-black text-white font-outfit">
            ₹{totalRevenue.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-400">Gross reservation sales</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#202020] border border-[#383838] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Confirmed Events</span>
          <div className="text-2xl font-black text-amber-400 font-outfit">
            {totalConfirmedBookings}
          </div>
          <span className="text-[11px] text-gray-400">Total party bookings</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#202020] border border-[#383838] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active Rooms</span>
          <div className="text-2xl font-black text-white font-outfit">
            {rooms.length}
          </div>
          <span className="text-[11px] text-gray-400">Party celebration suites</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#202020] border border-[#383838] space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Add-On Catalog</span>
          <div className="text-2xl font-black text-rose-400 font-outfit">
            {addons.length}
          </div>
          <span className="text-[11px] text-gray-400">Custom party items</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#383838] pb-2 overflow-x-auto modern-scrollbar">
        {[
          { id: 'bookings', label: 'Party Bookings', count: bookings.length },
          { id: 'analytics', label: 'Financial Analytics & Graph', count: '₹' + Math.round(totalRevenue/1000) + 'k' },
          { id: 'rooms_pricing', label: 'Rooms & Media', count: rooms.length },
          { id: 'addons', label: 'Add-Ons Catalog', count: addons.length },
          { id: 'contacts', label: 'Concierge Inquiries', count: contacts.length },
        ].map((tab) => (
          <button
            key={tab.id}
            id={`admin-tab-${tab.id}`}
            onClick={() => {
              setActiveAdminTab(tab.id as any);
              setSelectedBookingForDetails(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 ${
              activeAdminTab === tab.id
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-gray-400 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
              activeAdminTab === tab.id ? 'bg-slate-950/20 text-slate-950 font-black' : 'bg-[#282828] text-gray-300'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: PARTY BOOKINGS */}
      {activeAdminTab === 'bookings' && (
        <div>
          {/* Detailed Separate Page View when a booking is selected */}
          {selectedBookingForDetails ? (
            <AdminBookingDetails
              booking={selectedBookingForDetails}
              onBack={() => setSelectedBookingForDetails(null)}
              onStatusChange={handleStatusChange}
              onUpdateNotes={handleUpdateBookingNotes}
            />
          ) : (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    id="admin-booking-search-input"
                    type="text"
                    placeholder="Search host, email, code, room..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                  {['all', 'confirmed', 'checked-in', 'completed', 'cancelled'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setBookingFilterStatus(status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize whitespace-nowrap transition ${
                        bookingFilterStatus === status
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-[#282828] text-gray-400 hover:text-white border border-[#383838]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bookings Table / Cards */}
              {filteredBookings.length === 0 ? (
                <div className="p-12 text-center bg-[#202020] rounded-3xl border border-[#383838] text-gray-400 text-xs">
                  No bookings match your current filter.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBookings.map((b) => (
                    <div
                      key={b.id}
                      id={`admin-booking-row-${b.id}`}
                      onClick={() => setSelectedBookingForDetails(b)}
                      className="p-5 rounded-2xl bg-[#202020] border border-[#383838] hover:border-amber-500/50 hover:bg-[#222222] transition flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 cursor-pointer group"
                    >
                      {/* Event & Room Info */}
                      <div className="space-y-1 max-w-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400 bg-[#181818] px-2 py-0.5 rounded border border-[#383838]">
                            {b.shareCode}
                          </span>
                          <h4 className="text-base font-bold text-white truncate font-outfit group-hover:text-amber-300 transition">
                            {b.eventName}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          Room: <strong className="text-gray-200">{b.roomName}</strong> • Host: <strong className="text-gray-200">{b.userName}</strong> ({b.userEmail})
                        </p>
                        {b.userPhone && (
                          <p className="text-[11px] text-gray-500">Phone: {b.userPhone}</p>
                        )}
                      </div>

                      {/* Schedule & Guests */}
                      <div className="text-xs space-y-1">
                        <div className="text-gray-300 font-semibold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{b.date} ({b.timeSlot})</span>
                        </div>
                        <div className="text-gray-400 flex items-center gap-2">
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
                          ₹{b.finalPrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {b.durationHours}h reservation
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          b.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : b.status === 'checked-in'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : b.status === 'completed'
                            ? 'bg-[#282828] text-gray-300'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {b.status}
                        </span>

                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value as Booking['status'])}
                          className="px-2.5 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="confirmed">Confirmed</option>
                          <option value="checked-in">Checked In</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>

                        <button
                          id={`admin-view-booking-btn-${b.id}`}
                          type="button"
                          onClick={() => setSelectedBookingForDetails(b)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                          title="View all booking details, room and add-ons in dedicated page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FINANCIAL ANALYTICS & GRAPH */}
      {activeAdminTab === 'analytics' && (
        <AdminAnalytics bookings={bookings} rooms={rooms} addons={addons} />
      )}

      {/* TAB 2: ROOMS & PRICING CONTROL */}
      {activeAdminTab === 'rooms_pricing' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] flex items-center justify-between text-xs text-amber-300">
            <span className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              Adjust hourly rates (₹/hr), capacity, descriptions, images, and video tour links. Changes immediately sync in real-time.
            </span>
            <button
              onClick={() => setIsNewRoomModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shrink-0"
            >
              + Add Room
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map((room) => {
              const isEditing = editingRoomId === room.id;

              return (
                <div
                  key={room.id}
                  id={`admin-room-card-${room.id}`}
                  className="rounded-3xl bg-[#202020] border border-[#383838] overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {/* Header Image */}
                    <div className="relative h-48 w-full bg-[#181818]">
                      <img src={room.pictures[0]} alt={room.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#202020] via-transparent to-black/40" />
                      
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-[#202020]/90 text-amber-300 text-xs font-bold border border-[#383838]">
                          {room.theme}
                        </span>
                        {room.videoUrl && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center gap-1">
                            <Play className="w-2.5 h-2.5 fill-current" /> Video Tour Set
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
                              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                Hourly Price (₹/hr) *
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-2 text-xs text-gray-500">₹</span>
                                <input
                                  type="number"
                                  value={roomEditForm.pricePerHour ?? room.pricePerHour}
                                  onChange={(e) => setRoomEditForm({ ...roomEditForm, pricePerHour: Number(e.target.value) })}
                                  className="w-full pl-7 pr-3 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-sm text-white font-bold focus:outline-none focus:border-amber-500 font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                Guest Capacity
                              </label>
                              <input
                                type="number"
                                value={roomEditForm.capacity ?? room.capacity}
                                onChange={(e) => setRoomEditForm({ ...roomEditForm, capacity: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                Minimum Hours
                              </label>
                              <input
                                type="number"
                                value={roomEditForm.minHours ?? room.minHours ?? 2}
                                onChange={(e) => setRoomEditForm({ ...roomEditForm, minHours: Number(e.target.value) })}
                                className="w-full px-3 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                Room Name
                              </label>
                              <input
                                type="text"
                                value={roomEditForm.name ?? room.name}
                                onChange={(e) => setRoomEditForm({ ...roomEditForm, name: e.target.value })}
                                className="w-full px-3 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          {/* Image Upload Button & Pictures list */}
                          <div className="pt-2 border-t border-[#383838]">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold uppercase text-gray-400">Pictures</label>
                              <div className="flex items-center gap-2">
                                <input
                                  ref={roomPhotoInputRef}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, (dataUrl) => {
                                    setRoomEditForm({
                                      ...roomEditForm,
                                      pictures: [...(roomEditForm.pictures || room.pictures), dataUrl]
                                    });
                                  })}
                                />
                                <button
                                  type="button"
                                  onClick={() => roomPhotoInputRef.current?.click()}
                                  className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1 border border-amber-500/30"
                                >
                                  <Upload className="w-3 h-3" /> Upload Picture
                                </button>
                              </div>
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto py-1">
                              {(roomEditForm.pictures || room.pictures).map((pic, idx) => (
                                <div key={idx} className="relative w-14 h-14 rounded overflow-hidden shrink-0 border border-[#383838] group">
                                  <img src={pic} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const pics = (roomEditForm.pictures || room.pictures).filter((_, i) => i !== idx);
                                      setRoomEditForm({ ...roomEditForm, pictures: pics });
                                    }}
                                    className="absolute inset-0 bg-black/70 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100 transition"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Video Upload & URL */}
                          <div className="pt-2 border-t border-[#383838]">
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-bold uppercase text-gray-400">Video Tour MP4</label>
                              <div className="flex items-center gap-2">
                                <input
                                  ref={roomVideoInputRef}
                                  type="file"
                                  accept="video/*"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, (dataUrl) => {
                                    setRoomEditForm({ ...roomEditForm, videoUrl: dataUrl });
                                  })}
                                />
                                <button
                                  type="button"
                                  onClick={() => roomVideoInputRef.current?.click()}
                                  className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold flex items-center gap-1 border border-rose-500/30"
                                >
                                  <Upload className="w-3 h-3" /> Upload Video
                                </button>
                              </div>
                            </div>
                            <input
                              type="url"
                              placeholder="Or enter video MP4 URL..."
                              value={roomEditForm.videoUrl ?? room.videoUrl ?? ''}
                              onChange={(e) => setRoomEditForm({ ...roomEditForm, videoUrl: e.target.value })}
                              className="w-full px-3 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                              Sound & Light Specs
                            </label>
                            <input
                              type="text"
                              value={roomEditForm.soundLightingSpecs ?? room.soundLightingSpecs}
                              onChange={(e) => setRoomEditForm({ ...roomEditForm, soundLightingSpecs: e.target.value })}
                              className="w-full px-3 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          {/* Amenities & Perks Points Editor */}
                          <div className="pt-2 border-t border-[#383838] space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold uppercase text-gray-400 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Amenities & Perks Points ({(roomEditForm.amenities || room.amenities || []).length})
                              </label>
                            </div>

                            {/* Tag Chips */}
                            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-[#181818] rounded-xl border border-[#303030]">
                              {(roomEditForm.amenities || room.amenities || []).map((amenity, amIdx) => (
                                <span
                                  key={amIdx}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#252525] border border-[#3e3e3e] text-xs text-gray-200 group"
                                >
                                  <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                  <span>{amenity}</span>
                                  <button
                                    type="button"
                                    title={`Remove ${amenity}`}
                                    onClick={() => handleRemoveAmenityFromEditRoom(amIdx)}
                                    className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs ml-1 transition"
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                              {(roomEditForm.amenities || room.amenities || []).length === 0 && (
                                <p className="text-[11px] text-gray-500 italic p-1">No amenities or perks points added yet.</p>
                              )}
                            </div>

                            {/* Add Amenity Input */}
                            <div className="flex items-center gap-1.5 pt-1">
                              <input
                                type="text"
                                placeholder="Add amenity or perk (e.g. VIP Lounge, Laser Fog)..."
                                value={editingAmenityInput}
                                onChange={(e) => setEditingAmenityInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddAmenityToEditRoom();
                                  }
                                }}
                                className="flex-1 px-3 py-1.5 bg-[#181818] border border-[#383838] rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                              />
                              <button
                                type="button"
                                onClick={handleAddAmenityToEditRoom}
                                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-1 shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Point</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="p-3 rounded-xl bg-[#181818] border border-[#383838]">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                                Hourly Rate
                              </span>
                              <span className="text-lg font-black text-amber-400 font-outfit">
                                ₹{room.pricePerHour.toLocaleString('en-IN')}/hr
                              </span>
                            </div>

                            <div className="p-3 rounded-xl bg-[#181818] border border-[#383838]">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                                Max Capacity
                              </span>
                              <span className="text-lg font-black text-white font-outfit">
                                {room.capacity} Guests
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-gray-400 line-clamp-2">
                            {room.description}
                          </p>

                          <div className="text-[11px] text-gray-400 bg-[#181818] p-2.5 rounded-lg border border-[#383838] font-mono">
                            <strong className="text-gray-300">Audio/Lighting:</strong> {room.soundLightingSpecs}
                          </div>

                          {/* Amenities & Perks Preview */}
                          <div className="pt-1">
                            <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              Amenities & Perks ({room.amenities?.length || 0}):
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(room.amenities || []).map((am, amIdx) => (
                                <span key={amIdx} className="px-2 py-0.5 rounded-md bg-[#181818] border border-[#383838] text-[11px] text-gray-300 flex items-center gap-1">
                                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                                  <span>{am}</span>
                                </span>
                              ))}
                              {(!room.amenities || room.amenities.length === 0) && (
                                <span className="text-[11px] text-gray-500 italic">No amenities specified</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-[#181818] border-t border-[#383838] flex items-center justify-between">
                    {isEditing ? (
                      <div className="flex items-center gap-2 w-full justify-end">
                        <button
                          onClick={() => setEditingRoomId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          id={`admin-save-room-btn-${room.id}`}
                          onClick={() => handleSaveEditRoom(room.id)}
                          disabled={isSavingRoom}
                          className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save Changes
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          id={`admin-edit-room-btn-${room.id}`}
                          onClick={() => handleStartEditRoom(room)}
                          className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-xs font-bold text-white border border-[#383838] flex items-center gap-1.5 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          Edit Pricing & Details
                        </button>

                        <button
                          onClick={() => handleDeleteRoom(room.id)}
                          title="Delete room"
                          className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
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

      {/* TAB 3: ADD-ONS CRUD CATALOG */}
      {activeAdminTab === 'addons' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] flex items-center justify-between text-xs text-gray-300">
            <span>
              Manage party enhancement add-ons available to customers during booking. You can add, edit price in ₹, image, description, or delete any add-on.
            </span>
            <button
              onClick={handleOpenNewAddon}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Add-On</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addons.map((addon) => (
              <div
                key={addon.id}
                id={`admin-addon-card-${addon.id}`}
                className="rounded-3xl bg-[#202020] border border-[#383838] overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Addon Image */}
                  <div className="relative h-40 w-full bg-[#181818]">
                    {addon.imageUrl ? (
                      <img src={addon.imageUrl} alt={addon.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#202020] via-transparent to-black/30" />
                    
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded bg-[#202020]/90 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-[#383838]">
                      {addon.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-base font-bold text-white font-outfit">
                        {addon.name}
                      </h4>
                      <div className="text-right shrink-0">
                        <span className="text-xl font-black text-amber-400 font-outfit">
                          ₹{addon.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                      {addon.description}
                    </p>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-[#181818] border-t border-[#383838] flex items-center justify-between">
                  <button
                    onClick={() => handleOpenEditAddon(addon)}
                    className="px-3 py-1.5 rounded-lg bg-[#282828] hover:bg-[#323232] text-xs font-bold text-white border border-[#383838] flex items-center gap-1.5 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit Add-On</span>
                  </button>

                  <button
                    onClick={() => handleDeleteAddon(addon.id, addon.name)}
                    title="Delete Add-On"
                    className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CONTACT INQUIRIES */}
      {activeAdminTab === 'contacts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                id="admin-contact-search-input"
                type="text"
                placeholder="Search by name, email, phone..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
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
                      : 'bg-[#282828] text-gray-400 hover:text-white border border-[#383838]'
                  }`}
                >
                  {st} {st === 'all' ? `(${contacts.length})` : `(${contacts.filter(c => c.status === st).length})`}
                </button>
              ))}
            </div>
          </div>

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
                  return matchName || matchEmail || matchPhone || matchMsg;
                }
                return true;
              })
              .map((contact) => (
                <div
                  key={contact.id}
                  className="p-5 rounded-2xl bg-[#202020] border border-[#383838] hover:border-[#4d4d4d] transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#383838]">
                    <div>
                      <h4 className="text-base font-bold text-white font-outfit">{contact.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-amber-400" /> {contact.email}</span>
                        {contact.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-amber-400" /> {contact.phone}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={contact.status}
                        onChange={(e) => updateContactMessageStatus(contact.id, e.target.value as any)}
                        className="px-2.5 py-1 bg-[#181818] border border-[#383838] rounded-lg text-xs text-white"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      <button
                        onClick={() => deleteContactMessage(contact.id)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 bg-[#181818] p-3 rounded-xl border border-[#383838] leading-relaxed">
                    {contact.message}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* CREATE NEW ROOM MODAL */}
      {isNewRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#202020] border border-[#383838] rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-[#383838] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Add New Party Suite
                </h3>
                <p className="text-xs text-gray-400">Configure space specifications, pricing in ₹, photos and video tour.</p>
              </div>
              <button
                onClick={() => setIsNewRoomModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#282828]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRoom} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Room Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neon Cyber Sanctum"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Theme / Atmosphere *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyberpunk Laser Rave"
                    value={newRoomData.theme}
                    onChange={(e) => setNewRoomData({ ...newRoomData, theme: e.target.value })}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Hourly Price (₹/hr) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={newRoomData.pricePerHour}
                    onChange={(e) => setNewRoomData({ ...newRoomData, pricePerHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Capacity (Guests) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newRoomData.capacity}
                    onChange={(e) => setNewRoomData({ ...newRoomData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Min Hours *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={newRoomData.minHours || 2}
                    onChange={(e) => setNewRoomData({ ...newRoomData, minHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Room Description</label>
                <textarea
                  rows={3}
                  value={newRoomData.description}
                  onChange={(e) => setNewRoomData({ ...newRoomData, description: e.target.value })}
                  placeholder="Describe the vibes, gear, lighting..."
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Sound & Lighting Infrastructure</label>
                <input
                  type="text"
                  placeholder="e.g. 4000W JBL Array + RGB Strobe + Pioneer Mixers"
                  value={newRoomData.soundLightingSpecs}
                  onChange={(e) => setNewRoomData({ ...newRoomData, soundLightingSpecs: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Photo Upload & URL */}
              <div className="space-y-2 pt-2 border-t border-[#383838]">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-gray-400">Pictures (Upload or URL)</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={newRoomPhotoRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (dataUrl) => {
                        setNewRoomData({
                          ...newRoomData,
                          pictures: [...(newRoomData.pictures || []), dataUrl]
                        });
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => newRoomPhotoRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Picture</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto py-1">
                  {(newRoomData.pictures || []).map((pic, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-[#383838] group">
                      <img src={pic} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (newRoomData.pictures || []).filter((_, i) => i !== idx);
                          setNewRoomData({ ...newRoomData, pictures: updated });
                        }}
                        className="absolute inset-0 bg-black/70 flex items-center justify-center text-rose-400 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Tour Upload & URL */}
              <div className="space-y-2 pt-2 border-t border-[#383838]">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-gray-400">Video Tour MP4</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={newRoomVideoRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (dataUrl) => {
                        setNewRoomData({ ...newRoomData, videoUrl: dataUrl });
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => newRoomVideoRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 text-xs font-bold flex items-center gap-1.5 border border-rose-500/30"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Video</span>
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="Or enter video MP4 URL..."
                  value={newRoomData.videoUrl}
                  onChange={(e) => setNewRoomData({ ...newRoomData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Amenities & Perks Points for New Room */}
              <div className="space-y-2 pt-2 border-t border-[#383838]">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-gray-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Amenities & Perks Points ({(newRoomData.amenities || []).length})
                  </label>
                </div>

                <div className="flex flex-wrap gap-1.5 p-2 bg-[#181818] rounded-xl border border-[#303030] min-h-[44px]">
                  {(newRoomData.amenities || []).map((amenity, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#252525] border border-[#3e3e3e] text-gray-200 text-xs">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{amenity}</span>
                      <button
                        type="button"
                        title={`Remove ${amenity}`}
                        onClick={() => handleRemoveAmenityFromNewRoom(i)}
                        className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs ml-1 transition"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {(newRoomData.amenities || []).length === 0 && (
                    <p className="text-[11px] text-gray-500 italic py-1">No amenities or perks points added yet.</p>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add amenity or perk (e.g. Laser Strobe, Lounge Sofa, Bar)..."
                    value={newRoomAmenityInput}
                    onChange={(e) => setNewRoomAmenityInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAmenityToNewRoom();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAmenityToNewRoom}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shrink-0 flex items-center gap-1 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Point</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setIsNewRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE / EDIT ADD-ON MODAL */}
      {isAddonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#202020] border border-[#383838] rounded-3xl p-6 sm:p-8 max-w-lg w-full my-8 space-y-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-[#383838] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  {editingAddonId ? 'Edit Add-On Item' : 'Add New Party Add-On'}
                </h3>
                <p className="text-xs text-gray-400">Configure add-on name, category, price in ₹, image, and description.</p>
              </div>
              <button
                onClick={() => setIsAddonModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#282828]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Add-On Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deluxe Balloon Garland Arch"
                  value={addonFormData.name}
                  onChange={(e) => setAddonFormData({ ...addonFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Category *</label>
                  <select
                    value={addonFormData.category}
                    onChange={(e) => setAddonFormData({ ...addonFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="balloons">Balloons & Decor</option>
                    <option value="lighting">Lighting & FX</option>
                    <option value="music">DJ & Sound Gear</option>
                    <option value="food">Cakes & Refreshments</option>
                    <option value="entertainment">Entertainment & Booths</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input
                      type="number"
                      required
                      min={0}
                      value={addonFormData.price}
                      onChange={(e) => setAddonFormData({ ...addonFormData, price: Number(e.target.value) })}
                      className="w-full pl-7 pr-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Add-on Image Upload & URL */}
              <div className="space-y-2 pt-2 border-t border-[#383838]">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-gray-400">Add-On Image</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={addonPhotoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, (dataUrl) => {
                        setAddonFormData({ ...addonFormData, imageUrl: dataUrl });
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => addonPhotoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Image</span>
                    </button>
                  </div>
                </div>

                {addonFormData.imageUrl && (
                  <div className="relative h-28 w-full rounded-xl overflow-hidden border border-[#383838]">
                    <img src={addonFormData.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                <input
                  type="url"
                  placeholder="Or enter image URL..."
                  value={addonFormData.imageUrl || ''}
                  onChange={(e) => setAddonFormData({ ...addonFormData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide details on what is included..."
                  value={addonFormData.description}
                  onChange={(e) => setAddonFormData({ ...addonFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setIsAddonModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20"
                >
                  {editingAddonId ? 'Update Add-On' : 'Add to Catalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
