import React, { useState, useRef } from 'react';
import { Room } from '../../types';
import { 
  ArrowLeft, 
  Save, 
  Sparkles, 
  Check, 
  Plus, 
  Upload, 
  Play, 
  Video, 
  Image as ImageIcon,
  DollarSign,
  Users,
  Clock,
  Building,
  Volume2
} from 'lucide-react';

interface AdminRoomEditorProps {
  room?: Room | null;
  onBack: () => void;
  onSave: (room: Room) => Promise<void>;
}

export const AdminRoomEditor: React.FC<AdminRoomEditorProps> = ({
  room,
  onBack,
  onSave,
}) => {
  const isNew = !room;

  // Form states
  const [formData, setFormData] = useState<Partial<Room>>({
    id: room?.id || `room-${Date.now().toString().slice(-6)}`,
    name: room?.name || '',
    theme: room?.theme || 'Laser Glow & Sound',
    description: room?.description || '',
    capacity: room?.capacity ?? 35,
    pricePerHour: room?.pricePerHour ?? 1999,
    minHours: room?.minHours ?? 2,
    pictures: room?.pictures && room.pictures.length > 0 
      ? [...room.pictures] 
      : ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'],
    videoUrl: room?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    soundLightingSpecs: room?.soundLightingSpecs || '4000W High Fidelity Sound + RGB Laser Projector',
    amenities: room?.amenities ? [...room.amenities] : ['Laser Lighting', 'Surround Sound', 'Bar Counter', 'DJ Station'],
    active: room?.active ?? true,
  });

  const [amenityInput, setAmenityInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const photoFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

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

  const handleAddAmenity = () => {
    const val = amenityInput.trim();
    if (!val) return;
    const current = formData.amenities || [];
    if (!current.includes(val)) {
      setFormData({
        ...formData,
        amenities: [...current, val],
      });
    }
    setAmenityInput('');
  };

  const handleRemoveAmenity = (indexToRemove: number) => {
    const current = formData.amenities || [];
    setFormData({
      ...formData,
      amenities: current.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setErrorMsg('Please enter a room name.');
      return;
    }
    if (!formData.pricePerHour || formData.pricePerHour <= 0) {
      setErrorMsg('Please enter a valid hourly price.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    try {
      const roomToSave: Room = {
        id: formData.id || `room-${Date.now()}`,
        name: formData.name.trim(),
        theme: formData.theme || 'Party Suite',
        description: formData.description?.trim() || 'Exclusive party celebration room equipped with premium sound, lights, and lounge seating.',
        capacity: Number(formData.capacity) || 30,
        pricePerHour: Number(formData.pricePerHour) || 1999,
        minHours: Number(formData.minHours) || 2,
        pictures: formData.pictures && formData.pictures.length > 0 ? formData.pictures : ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80'],
        videoUrl: formData.videoUrl || '',
        soundLightingSpecs: formData.soundLightingSpecs || '3000W Sound Rig + Dynamic RGB Lasers',
        amenities: formData.amenities || ['Laser Lighting', 'Surround Sound'],
        active: formData.active ?? true,
      };

      await onSave(roomToSave);
      onBack();
    } catch (err) {
      console.error('Failed to save room', err);
      setErrorMsg('Failed to save room changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="admin-room-editor-page" className="max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-[#202020] border border-[#383838] shadow-xl space-y-4">
        {/* Top Row: Back button icon on left (NOT yellow), Actions on right */}
        <div className="flex items-center justify-between gap-3">
          <button
            id="admin-room-editor-back-btn"
            type="button"
            onClick={onBack}
            className="p-2.5 sm:p-3 rounded-2xl bg-[#282828] hover:bg-[#323232] active:bg-[#3d3d3d] text-gray-200 hover:text-white border border-[#3d3d3d] transition active:scale-95 shrink-0 shadow-md cursor-pointer flex items-center justify-center group"
            title="Return to Party Suites"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-200 group-hover:text-white transition" />
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="px-3.5 py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-300 hover:text-white border border-[#383838] text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-4 sm:px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition active:scale-95 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Room...' : isNew ? 'Create Suite' : 'Save Suite Changes'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Separate Line for Title & Subtitle */}
        <div className="pt-2 border-t border-[#303030]/70 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              {isNew ? 'New Party Suite Creation' : 'Party Suite Editor'}
            </span>
            <span className="font-mono text-xs text-gray-400">
              {formData.id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
            {isNew ? 'Add New Celebration Suite' : `Edit Suite: ${formData.name || room?.name}`}
          </h1>
          <p className="text-xs text-gray-400 leading-relaxed">
            Update hourly rental rate, capacity, theme, audio/laser specifications, photo gallery, and perks points.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Core Info */}
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                <Building className="w-4 h-4 text-amber-400" />
                Suite Details & Theme
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                    Suite Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Neon Horizon Laser Club"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-sm text-white font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                      Theme / Style *
                    </label>
                    <select
                      value={formData.theme || 'Laser Glow & Sound'}
                      onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Laser Glow & Sound">Laser Glow & Sound</option>
                      <option value="Neon Club & DJ">Neon Club & DJ</option>
                      <option value="VIP Private Cinema">VIP Private Cinema</option>
                      <option value="Retro Arcade & Gaming">Retro Arcade & Gaming</option>
                      <option value="Disco Luxe Lounge">Disco Luxe Lounge</option>
                      <option value="Acoustic Chillout">Acoustic Chillout</option>
                      <option value="Grand Celebration Hall">Grand Celebration Hall</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                      Minimum Booking Duration
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={formData.minHours ?? 2}
                        onChange={(e) => setFormData({ ...formData, minHours: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                      <span className="absolute right-3 top-2.5 text-xs text-gray-400">Hours</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                    Suite Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the atmosphere, equipment, acoustics, and suitability for birthdays, parties, or movie screenings..."
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-3.5 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 leading-relaxed"
                  />
                </div>
              </div>
            </div>

            {/* Audio & Laser Specifications */}
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                Sound Rig & Dynamic Lighting Specifications
              </h3>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                  Audio & Laser Lighting Equipment Specs
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4000W High Fidelity Sound + RGB Laser Projector + Fog Machine"
                  value={formData.soundLightingSpecs || ''}
                  onChange={(e) => setFormData({ ...formData, soundLightingSpecs: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Amenities & Perks Points */}
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Amenities & Perks Points ({(formData.amenities || []).length})
                </h3>
              </div>

              {/* Tag Chips */}
              <div className="flex flex-wrap gap-2 p-3 bg-[#181818] rounded-2xl border border-[#333333] min-h-[50px]">
                {(formData.amenities || []).map((amenity, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#252525] border border-[#3e3e3e] text-xs text-gray-200"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{amenity}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAmenity(idx)}
                      className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center text-xs ml-1 transition"
                      title={`Remove ${amenity}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(formData.amenities || []).length === 0 && (
                  <span className="text-xs text-gray-500 italic p-1">No perks added yet. Add some below!</span>
                )}
              </div>

              {/* Add Amenity Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. VIP Leather Sofas, Fog Machine, Karaoke Mic..."
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAmenity();
                    }
                  }}
                  className="flex-1 px-3.5 py-2 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 transition shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Point</span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing & Media Sidebar (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Rates & Capacity Card */}
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Hourly Rate & Capacity
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                    Hourly Price (₹/hr) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-sm font-bold text-amber-400">₹</span>
                    <input
                      type="number"
                      required
                      min="500"
                      value={formData.pricePerHour ?? 1999}
                      onChange={(e) => setFormData({ ...formData, pricePerHour: Number(e.target.value) })}
                      className="w-full pl-8 pr-4 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-lg font-black text-amber-400 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-300 mb-1.5">
                    Max Guest Capacity *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="5"
                      max="150"
                      value={formData.capacity ?? 35}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="w-full pl-4 pr-16 py-2.5 bg-[#181818] border border-[#383838] rounded-xl text-sm font-bold text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs text-gray-400">Guests</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#181818] border border-[#333333] flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-medium">Room Active & Available</span>
                  <input
                    type="checkbox"
                    checked={formData.active ?? true}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Photo Gallery & Preview */}
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                Suite Cover Photo
              </h3>

              {/* Preview */}
              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-[#181818] border border-[#383838]">
                {formData.pictures && formData.pictures[0] ? (
                  <img
                    src={formData.pictures[0]}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                    No photo uploaded
                  </div>
                )}
              </div>

              {/* File upload trigger */}
              <input
                ref={photoFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(e, (url) => {
                    setFormData({ ...formData, pictures: [url] });
                  })
                }
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => photoFileRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-200 border border-[#383838] text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-400" />
                  <span>Upload Local Photo</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                  Or Paste Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.pictures?.[0] || ''}
                  onChange={(e) => setFormData({ ...formData, pictures: [e.target.value] })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Video Walkthrough Preview */}
            <div className="p-6 rounded-3xl bg-[#202020] border border-[#383838] space-y-4 shadow-lg">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#333333] pb-2 flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                1080p Video Walkthrough
              </h3>

              {formData.videoUrl && (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-[#383838] aspect-video">
                  <video
                    src={formData.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              {/* Video upload trigger */}
              <input
                ref={videoFileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) =>
                  handleFileUpload(e, (url) => {
                    setFormData({ ...formData, videoUrl: url });
                  })
                }
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => videoFileRef.current?.click()}
                  className="w-full py-2 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-200 border border-[#383838] text-xs font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-rose-400" />
                  <span>Upload Local Video Tour</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                  Or Paste Video URL (MP4 / WebM)
                </label>
                <input
                  type="url"
                  placeholder="https://domain.com/walkthrough.mp4"
                  value={formData.videoUrl || ''}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#181818] border border-[#383838] rounded-xl text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Bottom Form Actions */}
            <div className="p-4 rounded-3xl bg-[#202020] border border-[#383838] flex items-center justify-end gap-3 shadow-lg">
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2.5 rounded-xl bg-[#282828] hover:bg-[#323232] text-gray-300 font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 transition active:scale-95 shadow-lg shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : isNew ? 'Create Party Suite' : 'Save Suite Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
