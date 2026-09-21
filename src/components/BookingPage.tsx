import React, { useState, useEffect } from 'react';
import { Room, Booking, AddOnItem, SelectedAddOn } from '../types';
import { useAuth } from '../context/AuthContext';
import { createBooking, subscribeAddOns } from '../services/partyDataService';
import confetti from 'canvas-confetti';
import {
  ArrowLeft, Calendar, CheckCircle2, Share2, FolderLock,
  Plus, Minus, Sparkles, ShoppingBag, Tag
} from 'lucide-react';

interface BookingPageProps {
  room: Room;
  initialHours?: number;
  onBack: () => void;
  onBookingSuccess: (newBooking: Booking) => void;
  onNavigateAuth: () => void;
  onNavigateVault: (bookingId: string) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  balloons:      'text-pink-400 bg-pink-500/10 border-pink-500/30',
  music:         'text-violet-400 bg-violet-500/10 border-violet-500/30',
  lighting:      'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  food:          'text-amber-400 bg-amber-500/10 border-amber-500/30',
  entertainment: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

export const BookingPage: React.FC<BookingPageProps> = ({
  room,
  onBack,
  onBookingSuccess,
  onNavigateAuth,
  onNavigateVault,
}) => {
  const { currentUser } = useAuth();

  // Form fields
  const [hostName, setHostName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [date, setDate] = useState(() => {
    const t = new Date();
    t.setDate(t.getDate() + 2);
    return t.toISOString().split('T')[0];
  });
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime]     = useState('22:00');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Add-ons
  const [availableAddOns, setAvailableAddOns] = useState<AddOnItem[]>([]);
  const [selectedAddOns, setSelectedAddOns]   = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const unsub = subscribeAddOns(setAvailableAddOns);
    return unsub;
  }, []);

  const toggleAddOn = (addon: AddOnItem) => {
    setSelectedAddOns(prev => {
      const next = new Map(prev);
      if (next.has(addon.id)) {
        next.delete(addon.id);
      } else {
        next.set(addon.id, 1);
      }
      return next;
    });
  };

  // Computed totals
  const durationHours = Math.max(
    0,
    (Number(endTime.split(':')[0]) + Number(endTime.split(':')[1]) / 60) -
    (Number(startTime.split(':')[0]) + Number(startTime.split(':')[1]) / 60)
  );
  const basePrice   = room.pricePerHour * Math.max(durationHours, 1);
  const addOnsTotal = availableAddOns
    .filter(a => selectedAddOns.has(a.id))
    .reduce((sum, a) => sum + a.price * (selectedAddOns.get(a.id) || 1), 0);
  const finalPrice  = basePrice + addOnsTotal;

  const buildSelectedAddOnsList = (): SelectedAddOn[] =>
    availableAddOns
      .filter(a => selectedAddOns.has(a.id))
      .map(a => ({
        id: a.id,
        name: a.name,
        price: a.price,
        quantity: selectedAddOns.get(a.id) || 1,
      }));

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) { onNavigateAuth(); return; }
    if (!hostName.trim()) { setError('Please provide your name.'); return; }
    if (!phone.trim())    { setError('Please provide a contact phone number.'); return; }

    setLoading(true);
    setError('');
    const shareCode = `PARTY-${Math.floor(1000 + Math.random() * 9000)}`;
    const addOnsList = buildSelectedAddOnsList();

    const newBookingData: Omit<Booking, 'id'> = {
      userId:       currentUser.uid,
      userEmail:    currentUser.email || 'guest@celebrato.app',
      userName:     hostName.trim(),
      userPhone:    phone.trim(),
      eventName:    hostName.trim(),
      roomId:       room.id,
      roomName:     room.name,
      roomImage:    room.pictures[0],
      date,
      timeSlot:     `${startTime} - ${endTime}`,
      durationHours,
      guestsCount:  0,
      basePrice,
      addOnsTotal,
      discount:     0,
      finalPrice,
      addOns:       addOnsList,
      status:       'confirmed',
      notes:        '',
      shareCode,
      createdAt:    new Date().toISOString(),
      updatedAt:    new Date().toISOString(),
    };

    try {
      const bookingId = await createBooking(newBookingData);
      const completeBooking: Booking = { ...newBookingData, id: bookingId };
      setCreatedBooking(completeBooking);
      onBookingSuccess(completeBooking);

      const whMessage = encodeURIComponent(
        `New booking:\nName: ${hostName}\nPhone: ${phone}\nRoom: ${room.name}\nDate: ${date}\nTime: ${startTime}-${endTime}\nAdd-Ons: ${addOnsList.map(a => a.name).join(', ') || 'None'}\nTotal: ₹${finalPrice}\nShare Code: ${shareCode}`
      );
      window.open(`https://wa.me/?text=${whMessage}`, '_blank');

      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981'],
      });
    } catch (err: any) {
      setError(err.message || 'Failed to complete booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="booking-page" className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <button
        id="booking-back-to-room-btn"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition group w-fit mb-4"
      >
        <div className="p-2 rounded-xl bg-[#282828] border border-[#383838] group-hover:bg-[#323232] group-hover:border-amber-500/40 transition">
          <ArrowLeft className="w-4 h-4 text-amber-400" />
        </div>
        <span>Back to {room.name}</span>
      </button>

      {createdBooking ? (
        /* ── Success View ── */
        <div id="booking-success-view" className="p-8 rounded-3xl bg-[#282828] border border-[#383838] shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white font-outfit">Booking Confirmed</h2>
            <p className="text-sm text-gray-300">
              Room <strong className="text-amber-400">{room.name}</strong> reserved for{' '}
              <strong className="text-white">{createdBooking.date}</strong> at{' '}
              <strong className="text-white">{createdBooking.timeSlot}</strong>
            </p>
          </div>
          {createdBooking.addOns.length > 0 && (
            <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Add-Ons Included</p>
              {createdBooking.addOns.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">{a.name}</span>
                  <span className="text-amber-400 font-bold">₹{a.price}</span>
                </div>
              ))}
            </div>
          )}
          <div className="p-6 rounded-2xl bg-[#202020] border border-[#383838] text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Share Code</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-[#282828] rounded-xl border border-[#3e3e3e]">
              <span className="text-2xl font-mono font-black text-amber-400 tracking-wider">{createdBooking.shareCode}</span>
              <button
                id="copy-party-code-btn"
                onClick={() => { navigator.clipboard.writeText(createdBooking.shareCode); alert(`Party Share Code ${createdBooking.shareCode} copied!`); }}
                className="px-4 py-2 rounded-xl bg-[#383838] hover:bg-[#424242] text-xs font-bold text-white transition flex items-center gap-2 active:scale-95"
              >
                <Share2 className="w-4 h-4 text-amber-400" /> Copy Code
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              id="success-open-vault-btn"
              onClick={() => onNavigateVault(createdBooking.id)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-95"
            >
              <FolderLock className="w-4 h-4" /> Open Event Media Vault
            </button>
            <button
              id="success-browse-more-btn"
              onClick={onBack}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#323232] hover:bg-[#3a3a3a] text-gray-200 hover:text-white font-semibold text-sm transition border border-[#404040]"
            >
              Return to Party Rooms
            </button>
          </div>
        </div>
      ) : (
        /* ── Booking Form ── */
        <form onSubmit={handleConfirmBooking} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">{error}</div>
          )}

          {/* Your Details */}
          <div className="p-6 rounded-3xl bg-[#282828] border border-[#383838]">
            <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-amber-400" /> Your Details
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Name *</label>
                <input
                  id="booking-name-field" type="text" required
                  placeholder="e.g. Alex Kumar"
                  value={hostName} onChange={e => setHostName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Phone *</label>
                <input
                  id="booking-phone-field" type="tel" required
                  placeholder="+91 98765 43210"
                  value={phone} onChange={e => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Date *</label>
                <input
                  id="booking-date-field" type="date" required
                  min={new Date().toISOString().split('T')[0]}
                  value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Start Time *</label>
                  <input
                    id="booking-start-time-field" type="time" required
                    value={startTime} onChange={e => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">End Time *</label>
                  <input
                    id="booking-end-time-field" type="time" required
                    value={endTime} onChange={e => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Add-Ons Section */}
          {availableAddOns.length > 0 && (
            <div className="rounded-3xl bg-[#282828] border border-[#383838] overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-[#383838] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" /> Party Add-Ons
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">Curated extras to elevate your celebration</p>
                </div>
                {selectedAddOns.size > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs font-black text-amber-300">
                    {selectedAddOns.size} added
                  </span>
                )}
              </div>

              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableAddOns.map(addon => {
                  const isSelected = selectedAddOns.has(addon.id);
                  const catColor = CATEGORY_COLORS[addon.category] || 'text-gray-400 bg-gray-500/10 border-gray-500/30';
                  return (
                    <div
                      key={addon.id}
                      className={`relative rounded-2xl border overflow-hidden transition-all duration-200 ${
                        isSelected
                          ? 'border-amber-500/60 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                          : 'border-[#333333] bg-[#1e1e1e] hover:border-[#484848]'
                      }`}
                    >
                      {/* Image */}
                      {addon.imageUrl && (
                        <div className="relative h-32 w-full overflow-hidden">
                          <img
                            src={addon.imageUrl}
                            alt={addon.name}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent" />
                          {/* Category badge */}
                          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold border ${catColor} capitalize`}>
                            {addon.category}
                          </span>
                          {/* Selected checkmark */}
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                              <CheckCircle2 className="w-4 h-4 text-slate-950" />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-3.5 space-y-2">
                        {!addon.imageUrl && (
                          <div className="flex items-start justify-between gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catColor} capitalize`}>
                              {addon.category}
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                          </div>
                        )}
                        <p className="text-sm font-bold text-white leading-snug">{addon.name}</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">{addon.description}</p>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1 text-amber-400 font-black text-base">
                            <Tag className="w-3.5 h-3.5" />
                            ₹{addon.price}
                          </div>
                          <button
                            type="button"
                            id={`addon-toggle-${addon.id}`}
                            onClick={() => toggleAddOn(addon)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-300'
                                : 'bg-[#323232] border border-[#484848] text-gray-200 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300'
                            }`}
                          >
                            {isSelected ? (
                              <><Minus className="w-3 h-3" /> Remove</>
                            ) : (
                              <><Plus className="w-3 h-3" /> Add</>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price Summary */}
          <div className="p-5 rounded-2xl bg-[#252525] border border-[#383838] space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Room ({durationHours > 0 ? `${durationHours.toFixed(1)}h` : 'base'}) × ₹{room.pricePerHour}/hr</span>
              <span className="text-white font-semibold">₹{basePrice.toFixed(0)}</span>
            </div>
            {addOnsTotal > 0 && (
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Add-Ons ({selectedAddOns.size})</span>
                <span className="text-amber-400 font-semibold">+ ₹{addOnsTotal}</span>
              </div>
            )}
            <div className="border-t border-[#383838] pt-2 flex items-center justify-between">
              <span className="text-sm font-bold text-white">Total</span>
              <span className="text-lg font-black text-amber-400">₹{finalPrice.toFixed(0)}</span>
            </div>
          </div>

          <button
            id="booking-confirm-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm tracking-wide transition shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            {loading ? 'Confirming Booking...' : `Confirm Booking • ₹${finalPrice.toFixed(0)}`}
          </button>
        </form>
      )}
    </div>
  );
};
