import React, { useState } from 'react';
import { Room, SelectedAddOn, Booking } from '../types';
import { INITIAL_ADDONS } from '../data/defaultData';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/partyDataService';
import { getRoomHourlyPackages } from '../utils/pricingPackages';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  Sparkles, 
  Calendar, 
  Clock, 
  Users, 
  Coins, 
  Plus, 
  Minus, 
  Check, 
  CheckCircle2, 
  Gift, 
  Share2, 
  FolderLock, 
  PartyPopper,
  PackageCheck,
  ShieldCheck,
  Phone,
  MessageSquare
} from 'lucide-react';

interface BookingPageProps {
  room: Room;
  initialHours?: number;
  onBack: () => void;
  onBookingSuccess: (newBooking: Booking) => void;
  onNavigateAuth: () => void;
  onNavigateVault: (bookingId: string) => void;
}

export const BookingPage: React.FC<BookingPageProps> = ({
  room,
  initialHours = 3,
  onBack,
  onBookingSuccess,
  onNavigateAuth,
  onNavigateVault,
}) => {
  const { currentUser, profile } = useAuth();
  const packages = getRoomHourlyPackages(room);

  // Selected Package Duration
  const [selectedHours, setSelectedHours] = useState<number>(initialHours);
  
  // Event details
  const [eventName, setEventName] = useState('');
  const [date, setDate] = useState(() => {
    const target = new Date();
    target.setDate(target.getDate() + 2);
    return target.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('19:00 - 22:00 (Prime Evening)');
  const [guestsCount, setGuestsCount] = useState(Math.min(25, room.capacity));
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // Selected Add-ons
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({
    'addon-balloons-arch': 1,
    'addon-smoke-laser': 1,
  });

  // Submission state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Matched package or custom calculation
  const matchedPackage = packages.find((p) => p.hours === selectedHours);
  const discountPercent = matchedPackage ? matchedPackage.discountPercent : (selectedHours >= 6 ? 15 : selectedHours >= 4 ? 10 : selectedHours >= 3 ? 5 : 0);
  const standardPrice = room.pricePerHour * selectedHours;
  const roomBasePrice = matchedPackage ? matchedPackage.totalPrice : Math.round(standardPrice * (1 - discountPercent / 100));

  const toggleAddOn = (addonId: string) => {
    setSelectedAddOns((prev) => {
      const current = prev[addonId] || 0;
      if (current > 0) {
        const copy = { ...prev };
        delete copy[addonId];
        return copy;
      } else {
        return { ...prev, [addonId]: 1 };
      }
    });
  };

  const updateAddOnQty = (addonId: string, delta: number) => {
    setSelectedAddOns((prev) => {
      const current = prev[addonId] || 0;
      const next = Math.max(1, current + delta);
      return { ...prev, [addonId]: next };
    });
  };

  // Calculate Addons total
  const addOnsList: SelectedAddOn[] = Object.entries(selectedAddOns).map(([id, qty]) => {
    const found = INITIAL_ADDONS.find((a) => a.id === id);
    return {
      id,
      name: found?.name || 'Party Add-on',
      price: found?.price || 0,
      quantity: qty,
    };
  });

  const addOnsTotal = addOnsList.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const finalTotal = Math.max(0, roomBasePrice + addOnsTotal);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onNavigateAuth();
      return;
    }

    if (!eventName.trim()) {
      setError('Please provide a party or event name (e.g. Maya’s 21st Birthday, Graduation Afterparty)');
      return;
    }

    setLoading(true);
    setError('');

    const shareCode = `PARTY-${Math.floor(1000 + Math.random() * 9000)}`;

    const newBookingData: Omit<Booking, 'id'> = {
      userId: currentUser.uid,
      userEmail: currentUser.email || 'guest@celebrato.app',
      userName: currentUser.displayName || profile?.displayName || 'Party Host',
      userPhone: phone,
      eventName: eventName.trim(),
      roomId: room.id,
      roomName: room.name,
      roomImage: room.pictures[0],
      date,
      timeSlot,
      durationHours: selectedHours,
      guestsCount,
      basePrice: roomBasePrice,
      addOnsTotal,
      discount: 0,
      finalPrice: finalTotal,
      addOns: addOnsList,
      status: 'confirmed',
      notes,
      shareCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const bookingId = await createBooking(newBookingData);
      const completeBooking: Booking = { ...newBookingData, id: bookingId };

      setCreatedBooking(completeBooking);
      onBookingSuccess(completeBooking);

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
    <div id="booking-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Breadcrumb Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#383838] pb-6">
        <button
          id="booking-back-to-room-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition group w-fit"
        >
          <div className="p-2 rounded-xl bg-[#282828] border border-[#383838] group-hover:bg-[#323232] group-hover:border-amber-500/40 transition">
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </div>
          <span>Back to {room.name}</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#282828] border border-[#383838] text-xs text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Reserving: <strong className="text-white">{room.name}</strong></span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
            ${room.pricePerHour}/hr base
          </span>
        </div>
      </div>

      {createdBooking ? (
        /* CONFIRMATION SUCCESS VIEW */
        <div id="booking-success-view" className="max-w-3xl mx-auto p-8 sm:p-12 rounded-3xl bg-[#282828] border border-[#383838] shadow-2xl text-center space-y-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-500/40">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              Booking Confirmed #{createdBooking.id.substring(0, 8)}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-white font-outfit">
              {createdBooking.eventName}
            </h2>
            <p className="text-sm text-gray-300">
              Reserved for <strong className="text-white">{createdBooking.date}</strong> ({createdBooking.timeSlot}) in <strong className="text-amber-400">{room.name}</strong>
            </p>
          </div>

          {/* Share Code Card for Friends & Media Vault */}
          <div className="p-6 rounded-2xl bg-[#202020] border border-[#383838] text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Collaborative Event Media Vault Share Code
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                Party Squad Access
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#282828] rounded-xl border border-[#3e3e3e]">
              <span className="text-2xl font-mono font-black text-amber-400 tracking-wider">
                {createdBooking.shareCode}
              </span>
              <button
                id="copy-party-code-btn"
                onClick={() => {
                  navigator.clipboard.writeText(createdBooking.shareCode);
                  alert(`Party Share Code ${createdBooking.shareCode} copied to clipboard! Share it with all your guests so they can upload event photos & videos into your vault.`);
                }}
                className="px-4 py-2 rounded-xl bg-[#383838] hover:bg-[#424242] text-xs font-bold text-white transition flex items-center gap-2 active:scale-95"
              >
                <Share2 className="w-4 h-4 text-amber-400" />
                Copy Code
              </button>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Send this code to your party guests. Anyone can enter it in the <strong>Event Media Vault</strong> to drop photos, video clips, and cheers into your shared album in real-time.
            </p>
          </div>

          {/* Reward Points Banner */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-bold">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>+{createdBooking.pointsEarned} Loyalty Points added to your account!</span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              id="success-open-vault-btn"
              onClick={() => onNavigateVault(createdBooking.id)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white font-bold text-sm transition shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 active:scale-95"
            >
              <FolderLock className="w-4 h-4" />
              <span>Open Event Media Vault</span>
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
        /* DEDICATED BOOKING FORM */
        <form onSubmit={handleConfirmBooking} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Booking Configuration (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header / Intro */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Step-by-Step Reservation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit">
                Customize Your Celebration
              </h1>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                Configure your hourly package, add party enhancers (balloons, lasers, DJ gear), and redeem host rewards.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            {/* STEP 1: HOURLY CELEBRATION PACKAGES SELECTION */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#282828] border border-[#383838] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-amber-400" />
                  1. Select Hourly Celebration Package
                </h3>
                <span className="text-xs text-amber-400 font-semibold">
                  {selectedHours} Hours Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {packages.map((pkg) => {
                  const isSelected = selectedHours === pkg.hours;

                  return (
                    <div
                      key={pkg.id}
                      onClick={() => setSelectedHours(pkg.hours)}
                      className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#333333] border-amber-500 shadow-md ring-1 ring-amber-500/40'
                          : 'bg-[#202020] border-[#383838] hover:border-[#4a4a4a]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-xs font-bold text-white">
                            {pkg.hours} Hours
                          </span>
                          {pkg.popular && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-black">
                              POPULAR
                            </span>
                          )}
                          {!pkg.popular && pkg.discountPercent > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">
                              -{pkg.discountPercent}%
                            </span>
                          )}
                        </div>
                        <div className="text-xl font-black text-white font-outfit">
                          ${pkg.totalPrice}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          ${pkg.effectiveHourlyRate}/hr
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-[#333333] flex items-center justify-between text-[10px] text-gray-400 font-semibold">
                        <span>{pkg.discountPercent > 0 ? `Save ${pkg.discountPercent}%` : 'Standard'}</span>
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 text-slate-950' : 'border border-[#444444]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Hours Selector if user wants more than 6 */}
              <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
                <span>Or select custom duration:</span>
                <div className="flex items-center gap-1.5">
                  {[2, 3, 4, 5, 6, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setSelectedHours(h)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold border transition ${
                        selectedHours === h
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-[#202020] border-[#383838] text-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* STEP 2: DATE & TIME SLOT */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#282828] border border-[#383838] space-y-4">
              <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                2. Party Date & Time Window
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Celebration Date *
                  </label>
                  <input
                    id="booking-date-field"
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Preferred Time Slot
                  </label>
                  <select
                    id="booking-timeslot-field"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="15:00 - 18:00 (Afternoon Chill)">15:00 - 18:00 (Afternoon Chill)</option>
                    <option value="19:00 - 22:00 (Prime Evening)">19:00 - 22:00 (Prime Evening)</option>
                    <option value="21:00 - 01:00 (Late Night Rave)">21:00 - 01:00 (Late Night Rave)</option>
                    <option value="23:00 - 03:00 (All-Night VIP)">23:00 - 03:00 (All-Night VIP)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* STEP 3: EVENT & HOST DETAILS */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#282828] border border-[#383838] space-y-4">
              <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-amber-400" />
                3. Event Name & Squad Size
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Party Event Name *
                  </label>
                  <input
                    id="booking-event-name-field"
                    type="text"
                    required
                    placeholder="e.g. Liam's 21st Birthday Bash"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Host Phone Number
                  </label>
                  <input
                    id="booking-phone-field"
                    type="tel"
                    placeholder="+1 (555) 321-9876"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Guest Count Slider */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold uppercase tracking-wider text-gray-400">
                    Expected Guests
                  </span>
                  <span className="font-bold text-amber-400">
                    {guestsCount} Guests (Room capacity: {room.capacity})
                  </span>
                </div>
                <input
                  id="booking-guests-range"
                  type="range"
                  min={5}
                  max={room.capacity}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-[#202020] h-2 rounded-lg cursor-pointer"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Special Instructions or Music Vibe
                </label>
                <textarea
                  id="booking-notes-field"
                  rows={2}
                  placeholder="e.g. Gold balloon themes, specific DJ connection cables needed, birthday banner on arrival..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#202020] border border-[#383838] rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* STEP 4: PARTY ADD-ONS & ENHANCEMENTS */}
            <div className="p-6 sm:p-7 rounded-3xl bg-[#282828] border border-[#383838] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white font-outfit flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    4. Party Add-Ons & Enhancements
                  </h3>
                  <p className="text-xs text-gray-400">
                    Pre-order balloon garlands, lasers, DJ gear, sparkler cakes & instant polaroids.
                  </p>
                </div>
                <span className="text-xs text-amber-400 font-bold">
                  Add-ons: ${addOnsTotal}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {INITIAL_ADDONS.map((addon) => {
                  const isSelected = !!selectedAddOns[addon.id];
                  const qty = selectedAddOns[addon.id] || 1;

                  return (
                    <div
                      key={addon.id}
                      id={`addon-card-${addon.id}`}
                      onClick={() => toggleAddOn(addon.id)}
                      className={`p-4 rounded-2xl border transition cursor-pointer select-none flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#313131] border-amber-500/60 shadow-md ring-1 ring-amber-500/20'
                          : 'bg-[#202020] border-[#383838] hover:border-[#4c4c4c]'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                              isSelected ? 'bg-amber-500 text-slate-950 border-amber-500' : 'border-[#4c4c4c]'
                            }`}>
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="text-xs font-bold text-white leading-tight">
                              {addon.name}
                            </span>
                          </div>
                          <span className="text-xs font-black text-amber-400 shrink-0 font-outfit">
                            +${addon.price}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-400 mt-2 line-clamp-2 leading-relaxed">
                          {addon.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div 
                          className="mt-3 pt-2.5 border-t border-[#3e3e3e] flex items-center justify-between"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[10px] uppercase font-bold text-gray-400">Quantity:</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateAddOnQty(addon.id, -1)}
                              className="w-6 h-6 rounded-lg bg-[#3e3e3e] hover:bg-[#4a4a4a] text-white flex items-center justify-center text-xs transition"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-bold text-white w-5 text-center">{qty}</span>
                            <button
                              type="button"
                              onClick={() => updateAddOnQty(addon.id, 1)}
                              className="w-6 h-6 rounded-lg bg-[#3e3e3e] hover:bg-[#4a4a4a] text-white flex items-center justify-center text-xs transition"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 5: EVENT COLLABORATION & VAULT PREVIEW */}
            <div className="p-6 rounded-3xl bg-[#282828] border border-[#383838] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                    Collaborative Event Media Vault Included
                  </h4>
                  <p className="text-xs text-gray-400">
                    A private cloud vault is automatically provisioned for you and your guests to share photos & HD videos.
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0">
                ✓ Included Free
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: STICKY RECEIPT & SUBMISSION */}
          <div className="space-y-6">
            <div className="sticky top-24 p-6 sm:p-8 rounded-3xl bg-[#282828] border border-[#383838] shadow-2xl space-y-6">
              
              {/* Room Card Thumbnail */}
              <div className="flex items-center gap-3 pb-4 border-b border-[#383838]">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-[#202020] shrink-0 border border-[#383838]">
                  <img src={room.pictures[0]} alt={room.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-outfit leading-snug">
                    {room.name}
                  </h4>
                  <p className="text-xs text-amber-400 font-semibold mt-0.5">
                    {selectedHours} Hours Celebration Package
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Max capacity: {room.capacity} Guests
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex justify-between">
                  <span className="text-gray-400">
                    {matchedPackage?.name || `${selectedHours}h Celebration`} ({selectedHours} hrs):
                  </span>
                  <span className="font-semibold text-white">${roomBasePrice}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-400 text-[11px]">
                    <span>Package Bundle Savings ({discountPercent}%):</span>
                    <span>-${standardPrice - roomBasePrice}</span>
                  </div>
                )}

                {addOnsTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Party Add-Ons ({addOnsList.length} items):</span>
                    <span className="font-semibold text-white">+${addOnsTotal}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-[#383838] flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">Total Booking Price:</span>
                  <span className="text-3xl font-black text-amber-400 font-outfit">
                    ${finalTotal}
                  </span>
                </div>

                <div className="text-right text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1 pt-1">
                  <span>Guaranteed best package pricing</span>
                </div>
              </div>

              {/* Guest / Auth Status */}
              {!currentUser && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Host Account Recommended</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Sign in to access your collaborative Event Media Vault and manage reservations!
                    </p>
                    <button
                      type="button"
                      onClick={onNavigateAuth}
                      className="mt-2 text-xs font-bold underline text-amber-400 hover:text-amber-300"
                    >
                      Sign In or Register Host Account
                    </button>
                  </div>
                </div>
              )}

              {/* Submit CTA */}
              <button
                id="booking-confirm-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm tracking-wide transition shadow-xl shadow-amber-500/25 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Confirming Party Reservation...'
                ) : !currentUser ? (
                  'Sign In & Confirm Booking'
                ) : (
                  `Confirm Reservation • $${finalTotal}`
                )}
              </button>

              <div className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Instant Confirmation & Real-time Firestore Sync</span>
              </div>
            </div>
          </div>

        </form>
      )}

    </div>
  );
};
