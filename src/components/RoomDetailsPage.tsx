import React, { useState, useRef } from 'react';
import { Room } from '../types';
import { useAuth } from '../context/AuthContext';
import { updateRoomDetails, deleteRoom, saveRoom } from '../services/partyDataService';
import { 
  ArrowLeft, 
  Play, 
  Users, 
  Sparkles, 
  Volume2, 
  Check, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Edit3,
  Trash2,
  Plus,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';

interface RoomDetailsPageProps {
  room: Room;
  onBack: () => void;
  onBook: (room: Room, durationHours?: number) => void;
  onRoomUpdated?: (updatedRoom: Room) => void;
}

type CarouselMediaItem = 
  | { type: 'image'; url: string; title: string }
  | { type: 'video'; url: string; title: string };

export const RoomDetailsPage: React.FC<RoomDetailsPageProps> = ({
  room: initialRoom,
  onBack,
  onBook,
  onRoomUpdated,
}) => {
  const { isAdmin } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<Room>(initialRoom);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  // Edit Room Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Room>({ ...initialRoom });
  const [newAmenityInput, setNewAmenityInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // File upload input refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Keep currentRoom in sync with initialRoom if prop changes
  React.useEffect(() => {
    setCurrentRoom(initialRoom);
    setEditFormData(initialRoom);
  }, [initialRoom]);

  // Unified Media list: photo[0], video (if available), then remaining photos
  const mediaItems: CarouselMediaItem[] = React.useMemo(() => {
    const items: CarouselMediaItem[] = [];
    if (currentRoom.pictures.length > 0) {
      items.push({ type: 'image', url: currentRoom.pictures[0], title: `${currentRoom.name} Main View` });
    }
    if (currentRoom.videoUrl) {
      items.push({ type: 'video', url: currentRoom.videoUrl, title: `${currentRoom.name} 1080p Video Tour & Lighting` });
    }
    for (let i = 1; i < currentRoom.pictures.length; i++) {
      items.push({ type: 'image', url: currentRoom.pictures[i], title: `${currentRoom.name} Interior Angle ${i + 1}` });
    }
    return items;
  }, [currentRoom]);

  const nextSlide = () => {
    setActiveMediaIdx((prev) => (prev + 1) % (mediaItems.length || 1));
  };

  const prevSlide = () => {
    setActiveMediaIdx((prev) => (prev - 1 + (mediaItems.length || 1)) % (mediaItems.length || 1));
  };

  const activeItem = mediaItems[activeMediaIdx] || mediaItems[0];

  // Handle Photo file selection and conversion to data URL
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditFormData((prev) => ({
          ...prev,
          pictures: [...prev.pictures, reader.result as string]
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Video file selection and conversion to data URL
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditFormData((prev) => ({
          ...prev,
          videoUrl: reader.result as string
        }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Handle Delete Room
  const handleDeleteCurrentRoom = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete "${currentRoom.name}"?`)) {
      return;
    }
    try {
      await deleteRoom(currentRoom.id);
      onBack();
    } catch (err) {
      console.error('Failed to delete room:', err);
      alert('Error deleting room. Please check admin permissions.');
    }
  };

  // Handle Save Edit Form
  const handleSaveRoomEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveRoom(editFormData);
      setCurrentRoom(editFormData);
      if (onRoomUpdated) onRoomUpdated(editFormData);
      setSaveSuccessMsg('Room updated successfully!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to save room:', err);
      alert('Failed to update room details.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="room-details-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Bar - Back Button + Admin Quick Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <button
          id="room-detail-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition group w-fit"
        >
          <div className="p-2 rounded-xl bg-[#202020] border border-[#383838] group-hover:bg-[#2c2c2c] group-hover:border-amber-500/40 transition">
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </div>
          <span className="text-xs sm:text-sm">Back to Party Rooms</span>
        </button>

        {/* Admin Controls on Room Page */}
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              id="room-page-edit-btn"
              onClick={() => {
                setEditFormData({ ...currentRoom });
                setIsEditModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-[#202020] hover:bg-[#2c2c2c] border border-amber-500/40 text-amber-400 text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Room Details</span>
            </button>

            <button
              id="room-page-delete-btn"
              onClick={handleDeleteCurrentRoom}
              className="px-3 py-2 rounded-xl bg-[#202020] hover:bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Room</span>
            </button>
          </div>
        )}
      </div>

      {/* MEDIA CAROUSEL - Placed directly under back button with no text overlays */}
      <section className="space-y-4">
        {/* Carousel Slide Stage */}
        <div className="relative h-[280px] sm:h-[460px] lg:h-[540px] w-full rounded-3xl overflow-hidden bg-[#181818] border border-[#383838] group shadow-2xl">
          {activeItem && activeItem.type === 'image' ? (
            <img
              src={activeItem.url}
              alt={currentRoom.name}
              className="w-full h-full object-cover object-center transition duration-500"
            />
          ) : activeItem && activeItem.type === 'video' ? (
            <div className="w-full h-full bg-black flex items-center justify-center relative">
              <video
                key={activeItem.url}
                src={activeItem.url}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-cover"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              No photos or videos added yet.
            </div>
          )}

          {/* Prev / Next navigation arrows */}
          {mediaItems.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                aria-label="Previous slide"
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition border border-white/20 active:scale-95 z-20"
              >
                <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
              <button
                onClick={nextSlide}
                aria-label="Next slide"
                className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition border border-white/20 active:scale-95 z-20"
              >
                <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
            </>
          )}
        </div>

        {/* Unified Thumbnails Filmstrip */}
        {mediaItems.length > 1 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 modern-scrollbar">
            {mediaItems.map((item, idx) => {
              const isCurrent = activeMediaIdx === idx;
              return (
                <button
                  key={idx}
                  id={`carousel-thumb-${idx}`}
                  onClick={() => setActiveMediaIdx(idx)}
                  className={`relative w-28 sm:w-32 h-18 sm:h-20 shrink-0 rounded-2xl overflow-hidden border-2 transition text-left group ${
                    isCurrent
                      ? 'border-amber-400 scale-105 shadow-lg shadow-amber-400/20 ring-2 ring-amber-400/30'
                      : 'border-[#383838] opacity-60 hover:opacity-100'
                  }`}
                >
                  {item.type === 'image' ? (
                    <img src={item.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#1c1c1c] flex flex-col items-center justify-center p-1 text-center relative">
                      {currentRoom.pictures[0] && (
                        <img 
                          src={currentRoom.pictures[0]} 
                          alt="video thumbnail" 
                          className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60" 
                        />
                      )}
                      <div className="relative z-10 w-7 h-7 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-lg">
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Room Title, Description & Quick Book */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              {currentRoom.theme}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-[#202020] px-3 py-1.5 rounded-full border border-[#383838]">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>Capacity: <strong className="text-white">{currentRoom.capacity} Guests</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-[#202020] px-3 py-1.5 rounded-full border border-[#383838]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Min booking: <strong className="text-white">{currentRoom.minHours || 2} Hours</strong></span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white font-outfit tracking-tight">
            {currentRoom.name}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            {currentRoom.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="room-page-quick-book-btn"
            onClick={() => onBook(currentRoom, currentRoom.minHours || 2)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/20 active:scale-95 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Room • ₹{currentRoom.pricePerHour.toLocaleString('en-IN')}/hr</span>
          </button>
        </div>
      </div>

      {/* ROOM SPECIFICATIONS & INCLUDED AMENITIES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left: Sound, Lights & Gear Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#202020] border border-[#383838] space-y-4">
            <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              Professional Sound & Lighting Infrastructure
            </h3>
            <p className="text-sm text-gray-300 font-mono bg-[#1a1a1a] p-4 rounded-2xl border border-[#383838]">
              {currentRoom.soundLightingSpecs}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every room is acoustically insulated and calibrated for maximum fidelity. Connect via Bluetooth 5.3, plug in DJ decks via dual balanced XLR inputs, or control lighting moods with our onboard iPad touch controller.
            </p>
          </div>

          {/* Included Amenities Grid */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#202020] border border-[#383838] space-y-4">
            <h3 className="text-xl font-bold text-white font-outfit">
              Included Amenities & Perks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentRoom.amenities.map((amenity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#1a1a1a] border border-[#383838] text-xs text-gray-200">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Booking Summary Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#202020] border border-[#383838] flex flex-col justify-between space-y-6 shadow-xl h-fit">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              Reservation Summary
            </span>

            <div>
              <h4 className="text-2xl font-black text-white font-outfit">
                {currentRoom.name}
              </h4>
              <div className="text-3xl font-black text-amber-400 font-outfit mt-1">
                ₹{currentRoom.pricePerHour.toLocaleString('en-IN')}
                <span className="text-xs text-gray-400 font-normal ml-1">/ hour</span>
              </div>
            </div>

            <div className="space-y-2.5 py-3 border-y border-[#383838] text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Hourly Rate:</span>
                <strong className="text-white">₹{currentRoom.pricePerHour.toLocaleString('en-IN')}/hr</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum Duration:</span>
                <strong className="text-white">{currentRoom.minHours || 2} Hours</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Minimum Total:</span>
                <strong className="text-amber-400 font-bold">
                  ₹{((currentRoom.minHours || 2) * currentRoom.pricePerHour).toLocaleString('en-IN')}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Guest Capacity:</span>
                <strong className="text-white">Up to {currentRoom.capacity} Guests</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sound & Lighting:</span>
                <strong className="text-amber-300">Full Equipment Included</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cancellation:</span>
                <strong className="text-emerald-400">Free up to 48h prior</strong>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Select your date, time slots, and choose customized add-ons (balloons, DJ gear, catering) on the next step.
            </p>
          </div>

          <button
            id="room-page-main-book-btn"
            onClick={() => onBook(currentRoom, currentRoom.minHours || 2)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm tracking-wide transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95"
          >
            <Calendar className="w-5 h-5" />
            <span>Proceed to Booking</span>
          </button>
        </div>
      </section>

      {/* EDIT ROOM MODAL (Admin Direct Control on Room Page) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#202020] border border-[#383838] rounded-3xl p-6 sm:p-8 max-w-2xl w-full my-8 space-y-6 shadow-2xl relative text-left">
            <div className="flex items-center justify-between border-b border-[#383838] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-amber-400" />
                  Edit Room: {currentRoom.name}
                </h3>
                <p className="text-xs text-gray-400">Update pricing, media, capacity, and room amenities.</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-[#2c2c2c] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveRoomEdits} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Room Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Theme / Atmosphere *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.theme}
                    onChange={(e) => setEditFormData({ ...editFormData, theme: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
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
                    value={editFormData.pricePerHour}
                    onChange={(e) => setEditFormData({ ...editFormData, pricePerHour: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Min Hours *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={editFormData.minHours || 2}
                    onChange={(e) => setEditFormData({ ...editFormData, minHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-gray-400 mb-1">Capacity (Guests) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-gray-400 mb-1">Sound & Lighting Infrastructure</label>
                <input
                  type="text"
                  value={editFormData.soundLightingSpecs}
                  onChange={(e) => setEditFormData({ ...editFormData, soundLightingSpecs: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Photos Management & Upload Button */}
              <div className="space-y-2 pt-2 border-t border-[#383838]">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-gray-400">Room Pictures ({editFormData.pictures.length})</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Picture</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {editFormData.pictures.map((pic, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden bg-[#181818] border border-[#383838] group">
                      <img src={pic} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editFormData.pictures.filter((_, i) => i !== idx);
                          setEditFormData({ ...editFormData, pictures: updated });
                        }}
                        className="absolute top-1 right-1 p-1 rounded-md bg-black/80 text-rose-400 hover:text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Video Tour Management & Upload Button */}
              <div className="space-y-2 pt-2 border-t border-[#383838]">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-gray-400">Video Tour MP4</label>
                  <div className="flex items-center gap-2">
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoUpload}
                    />
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Video</span>
                    </button>
                  </div>
                </div>
                <input
                  type="url"
                  placeholder="Or enter video MP4 URL..."
                  value={editFormData.videoUrl}
                  onChange={(e) => setEditFormData({ ...editFormData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Amenities Management */}
              <div className="space-y-2 pt-2 border-t border-[#383838]">
                <label className="font-bold uppercase text-gray-400 block">Amenities</label>
                <div className="flex flex-wrap gap-1.5">
                  {editFormData.amenities.map((am, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1a1a1a] border border-[#383838] text-gray-300 text-xs">
                      {am}
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editFormData.amenities.filter((_, idx) => idx !== i);
                          setEditFormData({ ...editFormData, amenities: updated });
                        }}
                        className="text-gray-500 hover:text-rose-400 ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Add amenity (e.g., Fog Machine)..."
                    value={newAmenityInput}
                    onChange={(e) => setNewAmenityInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#1a1a1a] border border-[#383838] rounded-xl text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAmenityInput.trim()) {
                        setEditFormData({
                          ...editFormData,
                          amenities: [...editFormData.amenities, newAmenityInput.trim()]
                        });
                        setNewAmenityInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#2c2c2c] hover:bg-[#383838] text-white font-semibold transition"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#383838]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#282828] hover:bg-[#333333] text-gray-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
