import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Booking, VaultMedia, DashboardTab } from '../types';
import { 
  subscribeUserBookings, 
  subscribeVaultMedia, 
  addMediaToVault, 
  cheerVaultMedia, 
  deleteVaultMedia 
} from '../services/partyDataService';
import { 
  Calendar, 
  FolderLock, 
  Clock, 
  Users, 
  Sparkles, 
  Plus, 
  Share2, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Play, 
  Heart, 
  Trash2, 
  Upload, 
  X, 
  ExternalLink, 
  Check, 
  Gift, 
  Layers,
  Search,
  Filter,
  Download
} from 'lucide-react';

interface UserDashboardProps {
  initialTab?: DashboardTab;
  onNavigateHome: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  initialTab = 'bookings',
  onNavigateHome,
}) => {
  const { currentUser, profile, isAdmin } = useAuth();

  // Master Toggle State
  const [activeTab, setActiveTab] = useState<DashboardTab>(initialTab);

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsFilter, setBookingsFilter] = useState<'upcoming' | 'past'>('upcoming');

  // Vault state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [vaultMedia, setVaultMedia] = useState<VaultMedia[]>([]);
  const [mediaFilter, setMediaFilter] = useState<'all' | 'image' | 'video'>('all');
  const [lightboxItem, setLightboxItem] = useState<VaultMedia | null>(null);

  // Friend party code join state
  const [friendCodeInput, setFriendCodeInput] = useState('');
  const [customJoinedEventName, setCustomJoinedEventName] = useState<string | null>(null);

  // Upload modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image');
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync tab with props
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Subscribe to user bookings in real-time
  useEffect(() => {
    if (!currentUser) return;
    const unsub = subscribeUserBookings(currentUser.uid, (data) => {
      setBookings(data);
      if (data.length > 0 && !selectedBookingId) {
        setSelectedBookingId(data[0].id);
      }
    });
    return () => unsub();
  }, [currentUser]);

  // Subscribe to real-time vault media for selected booking
  useEffect(() => {
    const unsub = subscribeVaultMedia(selectedBookingId, (mediaList) => {
      setVaultMedia(mediaList);
    });
    return () => unsub();
  }, [selectedBookingId]);

  // Split bookings into upcoming vs past
  const nowStr = new Date().toISOString().split('T')[0];
  const upcomingBookings = bookings.filter((b) => b.date >= nowStr && b.status !== 'cancelled');
  const pastBookings = bookings.filter((b) => b.date < nowStr || b.status === 'completed' || b.status === 'cancelled');

  const selectedBooking = bookings.find((b) => b.id === selectedBookingId) || (bookings.length > 0 ? bookings[0] : null);

  const activeEventTitle = selectedBooking 
    ? selectedBooking.eventName 
    : (customJoinedEventName || 'Party Squad Celebration');

  const activeEventCode = selectedBooking?.shareCode || friendCodeInput || 'PARTY-VIP';

  // Handle local media file upload (image or video converted to dataURL)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    setUploadType(isVid ? 'video' : 'image');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaUrlInput(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !mediaUrlInput.trim()) return;

    setUploading(true);
    try {
      await addMediaToVault({
        bookingId: selectedBookingId || 'shared_party_event',
        eventName: activeEventTitle,
        mediaType: uploadType,
        url: mediaUrlInput.trim(),
        title: uploadTitle.trim() || (uploadType === 'video' ? 'Party Video Drop' : 'Party Snap'),
        caption: uploadCaption.trim(),
        uploadedByUid: currentUser.uid,
        uploadedByName: currentUser.displayName || profile?.displayName || 'Party Friend',
        likesCount: 1,
        createdAt: new Date().toISOString(),
      });

      setIsUploadOpen(false);
      setUploadTitle('');
      setUploadCaption('');
      setMediaUrlInput('');
    } catch (err) {
      console.error('Failed to upload media to vault:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleCheer = async (media: VaultMedia) => {
    await cheerVaultMedia(media.id, media.likesCount || 0);
  };

  const handleDelete = async (mediaId: string) => {
    if (confirm('Delete this party memory from the vault?')) {
      await deleteVaultMedia(mediaId);
      if (lightboxItem?.id === mediaId) setLightboxItem(null);
    }
  };

  const copyPartyShareLink = (code: string) => {
    const shareText = `Join our party vault! Enter code ${code} on Celebrato to upload pictures and videos into our event folder!`;
    navigator.clipboard.writeText(shareText);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // Filter media
  const filteredMedia = vaultMedia.filter((item) => {
    if (mediaFilter === 'all') return true;
    return item.mediaType === mediaFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Profile Overview */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#282828] border border-[#383838] shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-[#202020] rounded-[14px] flex items-center justify-center text-2xl font-black text-amber-400">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="avatar" className="w-full h-full object-cover rounded-[14px]" />
              ) : (
                profile?.displayName?.charAt(0) || 'P'
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white font-outfit">
                {profile?.displayName || 'Party Host'}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-500/30">
                VIP Host
              </span>
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {currentUser?.email || 'Logged in via Party Pass'}
            </p>
          </div>
        </div>

        {/* VIP Party Concierge Action Card */}
        <div className="flex items-center gap-4 bg-[#202020] px-5 py-3.5 rounded-2xl border border-[#383838]">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Celebrato VIP Access
            </div>
            <div className="text-sm font-bold text-white font-outfit">
              Explore Hourly Packages
            </div>
          </div>
          <button
            onClick={onNavigateHome}
            className="ml-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition shadow-md active:scale-95"
          >
            + Book Room
          </button>
        </div>
      </div>

      {/* MASTER TOGGLE (Mandated by user prompt) */}
      <div className="flex items-center justify-center">
        <div 
          id="dashboard-master-toggle"
          className="inline-flex p-1.5 bg-[#282828] border border-[#383838] rounded-2xl shadow-xl max-w-md w-full"
        >
          <button
            id="toggle-tab-bookings-btn"
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'bookings'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Party Bookings ({bookings.length})</span>
          </button>

          <button
            id="toggle-tab-vault-btn"
            onClick={() => setActiveTab('vault')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${
              activeTab === 'vault'
                ? 'bg-gradient-to-r from-rose-500 to-violet-600 text-white shadow-lg shadow-rose-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FolderLock className="w-4 h-4" />
            <span>Event Media Vault</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: BOOKINGS & PAST BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          {/* Sub-toggle: Upcoming vs Past */}
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                id="subfilter-upcoming-btn"
                onClick={() => setBookingsFilter('upcoming')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  bookingsFilter === 'upcoming'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active & Upcoming ({upcomingBookings.length})
              </button>
              <button
                id="subfilter-past-btn"
                onClick={() => setBookingsFilter('past')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition ${
                  bookingsFilter === 'past'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Past Bookings ({pastBookings.length})
              </button>
            </div>

            <button
              onClick={onNavigateHome}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Book New Room
            </button>
          </div>

          {/* Bookings List */}
          {(bookingsFilter === 'upcoming' ? upcomingBookings : pastBookings).length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-outfit">
                  No {bookingsFilter === 'upcoming' ? 'Active Bookings' : 'Past Bookings'} Found
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {bookingsFilter === 'upcoming'
                    ? 'Ready to celebrate? Browse our high-energy party rooms and customize with balloons, DJ gear, and lights!'
                    : 'Your completed party events will appear here with archived receipts and media links.'}
                </p>
              </div>
              <button
                onClick={onNavigateHome}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Explore Party Rooms
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(bookingsFilter === 'upcoming' ? upcomingBookings : pastBookings).map((booking) => (
                <div
                  key={booking.id}
                  id={`booking-card-${booking.id}`}
                  className="rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition shadow-xl"
                >
                  <div>
                    {/* Header Image with room name */}
                    <div className="relative h-44 w-full bg-slate-950">
                      <img
                        src={booking.roomImage || 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'}
                        alt={booking.roomName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/50" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs font-bold text-amber-400 border border-slate-700">
                          {booking.roomName}
                        </span>

                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          booking.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : booking.status === 'checked-in'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-700 text-slate-300'
                        }`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-xl font-black text-white font-outfit truncate">
                          {booking.eventName}
                        </h3>
                      </div>
                    </div>

                    {/* Booking Details */}
                    <div className="p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Date & Time</span>
                          <span className="font-semibold text-white">{booking.date}</span>
                          <span className="block text-[11px] text-slate-400 truncate">{booking.timeSlot}</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Guests & Duration</span>
                          <span className="font-semibold text-white">{booking.guestsCount} Guests</span>
                          <span className="block text-[11px] text-slate-400">{booking.durationHours} Hours reserved</span>
                        </div>
                      </div>

                      {/* Add-Ons summary */}
                      {booking.addOns && booking.addOns.length > 0 && (
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                            Selected Add-Ons & Enhancements
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {booking.addOns.map((addon, i) => (
                              <span
                                key={i}
                                className="px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-medium"
                              >
                                {addon.quantity > 1 ? `${addon.quantity}x ` : ''}{addon.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Share Code with friends */}
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            Event Vault Share Code
                          </span>
                          <span className="text-sm font-mono font-bold text-amber-400">
                            {booking.shareCode}
                          </span>
                        </div>
                        <button
                          onClick={() => copyPartyShareLink(booking.shareCode)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition flex items-center gap-1"
                        >
                          {copiedCode === booking.shareCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Share2 className="w-3.5 h-3.5" />
                              Invite Friends
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-3 border-t border-slate-800/80">
                    <div>
                      <span className="text-xs text-slate-400">Total Paid:</span>
                      <span className="text-lg font-black text-white font-outfit ml-1">${booking.finalPrice}</span>
                    </div>

                    {/* Direct toggle into this event's vault */}
                    <button
                      id={`open-vault-btn-${booking.id}`}
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        setActiveTab('vault');
                      }}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-xs transition shadow-lg shadow-rose-500/20 flex items-center gap-1.5"
                    >
                      <FolderLock className="w-4 h-4" />
                      Open Event Vault
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PARTY MEDIA VAULT (Collaborative event folders for pictures & videos) */}
      {activeTab === 'vault' && (
        <div className="space-y-6">
          
          {/* Vault Header Controls: Event Selector & Code Input */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1 border border-rose-500/20">
                  <FolderLock className="w-3.5 h-3.5" />
                  Collaborative Party Media Vault
                </div>
                <h3 className="text-2xl font-black text-white font-outfit">
                  {activeEventTitle}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All friends and party attendees can add photos & videos to this shared event folder in real-time.
                </p>
              </div>

              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <button
                  id="vault-add-media-trigger-btn"
                  onClick={() => setIsUploadOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-sm transition shadow-lg shadow-rose-500/25 flex items-center gap-2 active:scale-95"
                >
                  <Upload className="w-4 h-4" />
                  Add Pictures / Videos
                </button>
              </div>
            </div>

            {/* Event Folder Switcher & Friend Code Bar */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Event Picker (if user has multiple bookings) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Select Event Album Folder:
                </label>
                {bookings.length > 0 ? (
                  <select
                    id="vault-event-selector"
                    value={selectedBookingId || ''}
                    onChange={(e) => setSelectedBookingId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                  >
                    {bookings.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.eventName} ({b.date}) [{b.shareCode}]
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-slate-400 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                    No booked party found yet. Use a friend's code below to join their album!
                  </div>
                )}
              </div>

              {/* Enter friend's party code */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Or Join Friend's Party Album via Code:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="vault-friend-code-input"
                    type="text"
                    placeholder="e.g. PARTY-4821"
                    value={friendCodeInput}
                    onChange={(e) => setFriendCodeInput(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white uppercase placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
                  />
                  <button
                    onClick={() => {
                      if (friendCodeInput.trim()) {
                        setSelectedBookingId(`friend_${friendCodeInput.trim()}`);
                        setCustomJoinedEventName(`Party Event ${friendCodeInput.trim()}`);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition shrink-0"
                  >
                    Open Album
                  </button>
                </div>
              </div>
            </div>

            {/* Friend Invite Share Bar */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Share2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Share event code <strong className="font-mono text-amber-400 text-sm">{activeEventCode}</strong> with guests so they can dump photos & party clips!
                </span>
              </div>
              <button
                onClick={() => copyPartyShareLink(activeEventCode)}
                className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition text-xs font-semibold shrink-0"
              >
                {copiedCode === activeEventCode ? 'Link Copied!' : 'Copy Invite Link'}
              </button>
            </div>
          </div>

          {/* Media Filtering Tabs */}
          <div className="flex items-center justify-between">
            <div className="inline-flex p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setMediaFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition ${
                  mediaFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                All Media ({vaultMedia.length})
              </button>
              <button
                onClick={() => setMediaFilter('image')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  mediaFilter === 'image' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Pictures ({vaultMedia.filter((m) => m.mediaType === 'image').length})
              </button>
              <button
                onClick={() => setMediaFilter('video')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  mediaFilter === 'video' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                Videos ({vaultMedia.filter((m) => m.mediaType === 'video').length})
              </button>
            </div>

            <span className="text-xs text-slate-400">
              {filteredMedia.length} memories saved in real-time
            </span>
          </div>

          {/* Media Grid */}
          {filteredMedia.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
                <FolderLock className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white font-outfit">
                  Party Vault is Empty
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Be the first to drop party pictures, dancefloor videos, or candid group snaps into this event album!
                </p>
              </div>
              <button
                onClick={() => setIsUploadOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20"
              >
                Upload First Picture / Video
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {filteredMedia.map((media) => (
                <div
                  key={media.id}
                  id={`vault-media-${media.id}`}
                  onClick={() => setLightboxItem(media)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 hover:border-amber-400/50 transition cursor-pointer shadow-lg"
                >
                  {media.mediaType === 'video' ? (
                    <div className="w-full h-full relative">
                      <video
                        src={media.url}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition">
                        <div className="w-10 h-10 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={media.url}
                      alt={media.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  )}

                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity pointer-events-none" />

                  {/* Top badges */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-bold text-slate-200">
                      {media.mediaType === 'video' ? 'Video' : 'Photo'}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheer(media);
                      }}
                      className="px-2 py-0.5 rounded-full bg-black/70 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center gap-1 transition backdrop-blur-sm"
                    >
                      <Heart className="w-3 h-3 fill-rose-500 text-rose-500 hover:text-white" />
                      <span>{media.likesCount || 0}</span>
                    </button>
                  </div>

                  {/* Bottom details */}
                  <div className="absolute bottom-2 left-2 right-2 text-left">
                    <h5 className="text-xs font-bold text-white truncate drop-shadow">
                      {media.title}
                    </h5>
                    <p className="text-[10px] text-slate-300 truncate">
                      By {media.uploadedByName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INLINE MEDIA THEATER VIEWER (NO POPUP MODAL) */}
      {lightboxItem && (
        <div 
          id="vault-inline-theater"
          className="relative rounded-3xl bg-[#252525] border border-amber-500/40 p-6 shadow-2xl space-y-4 text-gray-100"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#383838]">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase">
                {lightboxItem.mediaType === 'video' ? 'Playing Video Clip' : 'Viewing Photo'}
              </span>
              <div>
                <h4 className="text-lg font-bold text-white font-outfit">
                  {lightboxItem.title}
                </h4>
                <p className="text-xs text-gray-400">
                  Shared by <strong className="text-amber-400">{lightboxItem.uploadedByName}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCheer(lightboxItem)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>{lightboxItem.likesCount || 0} Cheers</span>
              </button>

              {(lightboxItem.uploadedByUid === currentUser?.uid || isAdmin) && (
                <button
                  onClick={() => handleDelete(lightboxItem.id)}
                  title="Delete Memory"
                  className="p-2 text-gray-400 hover:text-rose-400 rounded-xl hover:bg-[#323232] transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => setLightboxItem(null)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#323232] transition"
                title="Close Theater"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Media Canvas */}
          <div className="max-h-[65vh] flex items-center justify-center bg-[#181818] rounded-2xl overflow-hidden border border-[#383838]">
            {lightboxItem.mediaType === 'video' ? (
              <video
                src={lightboxItem.url}
                controls
                autoPlay
                className="max-h-[63vh] w-auto mx-auto object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={lightboxItem.url}
                alt={lightboxItem.title}
                className="max-h-[63vh] w-auto mx-auto object-contain"
              />
            )}
          </div>

          {lightboxItem.caption && (
            <p className="text-xs text-gray-300 italic px-2">
              "{lightboxItem.caption}"
            </p>
          )}
        </div>
      )}

      {/* INLINE UPLOAD SECTION (NO POPUP MODAL) */}
      {isUploadOpen && (
        <div 
          id="vault-inline-upload-section"
          className="relative rounded-3xl bg-[#282828] border border-rose-500/40 p-6 sm:p-8 shadow-2xl space-y-6 text-gray-100"
        >
          <div className="flex items-center justify-between border-b border-[#383838] pb-4">
            <div>
              <h4 className="text-lg font-bold text-white font-outfit">
                Add Photos & Videos to Event Vault
              </h4>
              <p className="text-xs text-gray-400">
                Dropping media into <strong className="text-amber-400">{activeEventTitle}</strong>
              </p>
            </div>
            <button
              onClick={() => setIsUploadOpen(false)}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#323232]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {/* Media Type Toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#202020] rounded-xl border border-[#383838]">
              <button
                type="button"
                onClick={() => setUploadType('image')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  uploadType === 'image' ? 'bg-amber-500 text-slate-950' : 'text-gray-400'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Party Picture
              </button>
              <button
                type="button"
                onClick={() => setUploadType('video')}
                className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 ${
                  uploadType === 'video' ? 'bg-rose-500 text-white' : 'text-gray-400'
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                Party Video
              </button>
            </div>

            {/* Local File Picker or Drag Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#383838] hover:border-amber-400/80 rounded-2xl p-6 text-center bg-[#202020] cursor-pointer transition space-y-2 group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={uploadType === 'video' ? 'video/*' : 'image/*'}
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-[#2c2c2c] group-hover:bg-amber-500/20 text-gray-400 group-hover:text-amber-400 flex items-center justify-center mx-auto transition">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">
                  Click to select from your device or camera roll
                </p>
                <p className="text-[11px] text-gray-500">
                  Supports JPG, PNG, GIF, MP4, MOV
                </p>
              </div>
            </div>

            {/* Or Media URL Direct */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Or Paste Image / Video URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/party-video.mp4 or photo.jpg"
                value={mediaUrlInput}
                onChange={(e) => setMediaUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#202020] border border-[#383838] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Sample party clips presets */}
            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1.5">
                Or load demo party sample:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setUploadType('image');
                    setMediaUrlInput('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80');
                    setUploadTitle('Dancefloor Energy');
                  }}
                  className="px-2.5 py-1 rounded bg-[#323232] hover:bg-[#3d3d3d] text-[11px] text-gray-300"
                >
                  🎉 Dancefloor Snap
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadType('image');
                    setMediaUrlInput('https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80');
                    setUploadTitle('Balloon Garland Celebration');
                  }}
                  className="px-2.5 py-1 rounded bg-[#323232] hover:bg-[#3d3d3d] text-[11px] text-gray-300"
                >
                  🎈 Balloon Moment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadType('video');
                    setMediaUrlInput('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
                    setUploadTitle('Laser Strobe Drop Reel');
                  }}
                  className="px-2.5 py-1 rounded bg-[#323232] hover:bg-[#3d3d3d] text-[11px] text-rose-300"
                >
                  🎬 Laser Video Drop
                </button>
              </div>
            </div>

            {/* Title & Caption */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                Title / Memory Label
              </label>
              <input
                type="text"
                placeholder="e.g. Squad at the DJ Booth"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#202020] border border-[#383838] rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="px-5 py-3 rounded-xl bg-[#323232] hover:bg-[#3a3a3a] text-gray-300 text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                id="vault-upload-confirm-btn"
                type="submit"
                disabled={uploading || !mediaUrlInput.trim()}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-sm transition shadow-lg shadow-rose-500/20 active:scale-[0.99] disabled:opacity-50"
              >
                {uploading ? 'Saving to Vault...' : 'Add to Collaborative Event Vault'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
