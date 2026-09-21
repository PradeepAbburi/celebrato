import React, { useState } from 'react';
import { Room } from '../types';

import { Users, Sparkles, Play, Eye, Calendar, ArrowRight } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onPreview: (room: Room) => void;
  onBook: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onPreview, onBook }) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  

  return (
    <div 
      id={`room-card-${room.id}`}
      className="group relative bg-[#282828] border border-[#383838] hover:border-[#4f4f4f] rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 flex flex-col"
    >
      {/* Media Showcase */}
      <div 
        className="relative h-64 w-full overflow-hidden bg-[#1a1a1a] cursor-pointer"
        onClick={() => onPreview(room)}
      >
        <img 
          src={room.pictures[activePhotoIdx] || room.pictures[0]} 
          alt={room.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#282828] via-transparent to-black/50 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
          <span className="px-3 py-1 rounded-full bg-[#202020]/90 backdrop-blur-md border border-[#3e3e3e] text-amber-300 text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {room.theme}
          </span>

          {room.videoUrl && (
            <button
              id={`room-video-badge-${room.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onPreview(room);
              }}
              className="px-2.5 py-1 rounded-full bg-rose-500/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1 shadow-lg shadow-rose-500/30 transition hover:scale-105 active:scale-95"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Video Tour</span>
            </button>
          )}
        </div>

        {/* Multiple Photo Dots */}
        {room.pictures.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-1.5 z-10">
            {room.pictures.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  activePhotoIdx === idx ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/50 hover:bg-white'
                }`}
                aria-label={`View photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 
              onClick={() => onPreview(room)}
              className="text-xl font-bold text-white tracking-tight group-hover:text-amber-300 transition-colors cursor-pointer"
            >
              {room.name}
            </h3>
            <div className="flex items-center gap-1 text-gray-300 text-xs font-medium shrink-0 bg-[#323232] px-2.5 py-1 rounded-lg border border-[#404040]">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>Up to {room.capacity}</span>
            </div>
          </div>

          <p className="text-sm text-gray-400 line-clamp-2 mb-4 leading-relaxed">
            {room.description}
          </p>



          {/* Key Amenities */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {room.amenities.slice(0, 3).map((amenity, i) => (
              <span 
                key={i} 
                className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-[#303030] text-gray-300 border border-[#3e3e3e]"
              >
                {amenity}
              </span>
            ))}
            {room.amenities.length > 3 && (
              <span className="px-2 py-1 text-[11px] font-medium rounded-md bg-[#252525] text-gray-400">
                +{room.amenities.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing & Page Navigation Footer */}
        <div className="pt-4 border-t border-[#383838] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-white font-outfit">₹{room.pricePerHour}/hr</span>
            </div>
            <div className="text-[11px] text-amber-400 font-medium truncate">
              ${room.pricePerHour}/hr rate
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              id={`room-details-page-btn-${room.id}`}
              onClick={() => onPreview(room)}
              title="Open room details with video tour & packages"
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl bg-[#323232] hover:bg-[#3a3a3a] text-gray-200 hover:text-white border border-[#404040] transition text-xs font-bold flex items-center gap-1 active:scale-95"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Details</span>
              <span className="sm:hidden">Tour</span>
            </button>

            <button
              id={`room-book-page-btn-${room.id}`}
              onClick={() => onPreview(room)}
              title="View details and book this room"
              className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 flex items-center gap-1 active:scale-95"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Book Room</span>
              <span className="sm:hidden">Book</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
