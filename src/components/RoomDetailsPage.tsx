import React, { useState } from 'react';
import { Room } from '../types';
import { getRoomHourlyPackages, RoomPackage } from '../utils/pricingPackages';
import { 
  ArrowLeft, 
  Play, 
  Image as ImageIcon, 
  Users, 
  Sparkles, 
  Volume2, 
  Check, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Video as VideoIcon
} from 'lucide-react';

interface RoomDetailsPageProps {
  room: Room;
  onBack: () => void;
  onBook: (room: Room, preselectedPackageHours?: number) => void;
}

type CarouselMediaItem = 
  | { type: 'image'; url: string; title: string }
  | { type: 'video'; url: string; title: string };

export const RoomDetailsPage: React.FC<RoomDetailsPageProps> = ({
  room,
  onBack,
  onBook,
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg-3h');

  // Unified Media list: photo[0], video (if available), then remaining photos
  const mediaItems: CarouselMediaItem[] = React.useMemo(() => {
    const items: CarouselMediaItem[] = [];
    if (room.pictures.length > 0) {
      items.push({ type: 'image', url: room.pictures[0], title: `${room.name} Main View` });
    }
    if (room.videoUrl) {
      items.push({ type: 'video', url: room.videoUrl, title: `${room.name} 1080p Video Tour & Lighting` });
    }
    for (let i = 1; i < room.pictures.length; i++) {
      items.push({ type: 'image', url: room.pictures[i], title: `${room.name} Interior Angle ${i + 1}` });
    }
    return items;
  }, [room]);

  const [activeMediaIdx, setActiveMediaIdx] = useState(0);

  const packages = getRoomHourlyPackages(room);
  const currentSelectedPkg = packages.find((p) => p.id === selectedPkgId) || packages[1];

  const nextSlide = () => {
    setActiveMediaIdx((prev) => (prev + 1) % mediaItems.length);
  };

  const prevSlide = () => {
    setActiveMediaIdx((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  };

  const activeItem = mediaItems[activeMediaIdx] || mediaItems[0];

  return (
    <div id="room-details-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#383838] pb-6">
        <button
          id="room-detail-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition group w-fit"
        >
          <div className="p-2 rounded-xl bg-[#282828] border border-[#383838] group-hover:bg-[#323232] group-hover:border-amber-500/40 transition">
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </div>
          <span>Back to Party Rooms Catalog</span>
        </button>

        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {room.theme}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-300 bg-[#282828] px-3 py-1.5 rounded-full border border-[#383838]">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Capacity: <strong className="text-white">{room.capacity} Guests</strong></span>
          </div>
        </div>
      </div>

      {/* Hero Title & Short Summary */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black text-white font-outfit tracking-tight">
            {room.name}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-3xl leading-relaxed">
            {room.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            id="room-page-quick-book-btn"
            onClick={() => onBook(room, currentSelectedPkg.hours)}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/20 active:scale-95 flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Book {currentSelectedPkg.name} • ${currentSelectedPkg.totalPrice}</span>
          </button>
        </div>
      </div>

      {/* UNIFIED MEDIA CAROUSEL: Photos and Videos in ONE Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono">
              Unified Room Carousel
            </span>
            <span className="text-xs text-gray-400">
              ({room.pictures.length} Photos {room.videoUrl ? '+ 1 HD Video Tour' : ''})
            </span>
          </div>

          <span className="text-xs text-gray-300 bg-[#282828] px-3 py-1 rounded-full border border-[#383838] font-mono">
            {activeItem.type === 'video' ? '▶ Video Tour' : '📷 Photo'} {activeMediaIdx + 1} of {mediaItems.length}
          </span>
        </div>

        {/* Carousel Slide Stage */}
        <div className="relative h-[280px] sm:h-[460px] lg:h-[540px] w-full rounded-3xl overflow-hidden bg-[#181818] border border-[#383838] group shadow-2xl">
          {activeItem.type === 'image' ? (
            <img
              src={activeItem.url}
              alt={activeItem.title}
              className="w-full h-full object-cover object-center transition duration-500"
            />
          ) : (
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
          )}

          {/* Prev / Next controls */}
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

          {/* Slide Tag Badge */}
          <div className="absolute bottom-4 left-4 z-20 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-xs font-semibold text-white border border-white/10 flex items-center gap-2">
            {activeItem.type === 'video' ? (
              <>
                <Play className="w-3.5 h-3.5 text-rose-400 fill-current" />
                <span className="text-rose-300 font-bold">1080p Video Walkthrough & Lighting Rig</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeItem.title}</span>
              </>
            )}
          </div>
        </div>

        {/* Unified Thumbnails Filmstrip */}
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
                    <img 
                      src={room.pictures[0]} 
                      alt="video thumbnail" 
                      className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60" 
                    />
                    <div className="relative z-10 w-7 h-7 rounded-full bg-rose-500/90 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                    <span className="relative z-10 text-[9px] font-black uppercase text-white tracking-wider mt-1 drop-shadow">
                      Video Tour
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* HOURLY CELEBRATION PACKAGES SECTION */}
      <section id="room-packages-section" className="space-y-6 pt-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#383838] pb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Curated Pricing Tiers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-outfit">
              Celebration Packages ({room.name})
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Select your preferred duration. Longer celebration packages include automatic bundle savings and priority gear setup!
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#282828] px-4 py-2 rounded-xl border border-[#383838]">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Standard Hourly Rate: <strong className="text-white">${room.pricePerHour}/hr</strong></span>
          </div>
        </div>

        {/* 4 Hourly Packages Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const isSelected = selectedPkgId === pkg.id;

            return (
              <div
                key={pkg.id}
                id={`package-card-${pkg.id}`}
                onClick={() => setSelectedPkgId(pkg.id)}
                className={`relative rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 border cursor-pointer ${
                  isSelected
                    ? 'bg-[#2e2e2e] border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/50 -translate-y-1'
                    : 'bg-[#282828] border-[#383838] hover:border-[#4d4d4d] hover:bg-[#2c2c2c]'
                }`}
              >
                {/* Popular or Top Badge */}
                {pkg.badge && (
                  <div className="absolute -top-3 left-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${
                      pkg.popular
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : pkg.discountPercent > 0
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : 'bg-[#383838] text-gray-200'
                    }`}>
                      {pkg.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4 pt-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-black text-white font-outfit">
                        {pkg.name}
                      </h3>
                      <div className="text-xs text-amber-400 font-semibold mt-0.5">
                        {pkg.hours} Hours Celebration
                      </div>
                    </div>

                    {pkg.discountPercent > 0 && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                        Save {pkg.discountPercent}%
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 leading-relaxed min-h-[36px]">
                    {pkg.tagline}
                  </p>

                  {/* Pricing Box */}
                  <div className="p-4 rounded-2xl bg-[#202020] border border-[#383838] space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white font-outfit">
                        ${pkg.totalPrice}
                      </span>
                      {pkg.savings > 0 && (
                        <span className="text-xs text-gray-500 line-through">
                          ${pkg.standardPrice}
                        </span>
                      )}
                    </div>

                    <div className="text-[11px] text-gray-400 flex items-center justify-between">
                      <span>Effective rate:</span>
                      <strong className="text-gray-200">${pkg.effectiveHourlyRate}/hr</strong>
                    </div>

                    {pkg.savings > 0 && (
                      <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 pt-1 border-t border-[#333333]">
                        <Check className="w-3.5 h-3.5" />
                        <span>Includes ${pkg.savings} package discount</span>
                      </div>
                    )}
                  </div>

                  {/* Perks Checklist */}
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                      Package Inclusions:
                    </span>
                    {pkg.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-gray-300">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-tight">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Direct Book CTA */}
                <div className="pt-6">
                  <button
                    id={`book-pkg-btn-${pkg.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onBook(room, pkg.hours);
                    }}
                    className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 active:scale-95 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-[#363636] hover:bg-[#404040] text-white border border-[#484848]'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book {pkg.hours}h Package</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ROOM SPECIFICATIONS & INCLUDED AMENITIES */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Left: Sound, Lights & Gear Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-[#282828] border border-[#383838] space-y-4">
            <h3 className="text-xl font-bold text-white font-outfit flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-amber-400" />
              Professional Sound & Lighting Infrastructure
            </h3>
            <p className="text-sm text-gray-300 font-mono bg-[#202020] p-4 rounded-2xl border border-[#383838]">
              {room.soundLightingSpecs}
            </p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every room is acoustically insulated and calibrated for maximum fidelity. Connect via Bluetooth 5.3, plug in DJ decks via dual balanced XLR inputs, or control lighting moods with our onboard iPad touch controller.
            </p>
          </div>

          {/* Included Amenities Grid */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#282828] border border-[#383838] space-y-4">
            <h3 className="text-xl font-bold text-white font-outfit">
              Included Amenities & Perks
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {room.amenities.map((amenity, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[#202020] border border-[#383838] text-xs text-gray-200">
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
        <div className="p-6 sm:p-8 rounded-3xl bg-[#282828] border border-[#383838] flex flex-col justify-between space-y-6 shadow-xl h-fit">
          <div className="space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
              Reservation Summary
            </span>

            <div>
              <h4 className="text-2xl font-black text-white font-outfit">
                {currentSelectedPkg.name}
              </h4>
              <div className="text-3xl font-black text-amber-400 font-outfit mt-1">
                ${currentSelectedPkg.totalPrice}
                <span className="text-xs text-gray-400 font-normal ml-1">/ {currentSelectedPkg.hours} hours</span>
              </div>
            </div>

            <div className="space-y-2 py-3 border-y border-[#383838] text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-400">Duration:</span>
                <strong className="text-white">{currentSelectedPkg.hours} Hours</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Guest Capacity:</span>
                <strong className="text-white">Up to {room.capacity} Guests</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Venue Add-Ons:</span>
                <strong className="text-amber-400">Selectable Next Step</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Cancellation:</span>
                <strong className="text-emerald-400">Free up to 48h prior</strong>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Add balloons, DJ gear, laser strobe enhancements, and invite your squad to your private Event Media Vault on the next step.
            </p>
          </div>

          <button
            id="room-page-main-book-btn"
            onClick={() => onBook(room, currentSelectedPkg.hours)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm tracking-wide transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-95"
          >
            <Calendar className="w-5 h-5" />
            <span>Proceed to Booking ({currentSelectedPkg.hours}h)</span>
          </button>
        </div>
      </section>

    </div>
  );
};

