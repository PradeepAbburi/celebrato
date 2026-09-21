import React from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Music, 
  Video, 
  FolderLock, 
  Users, 
  Award, 
  Zap, 
  PartyPopper,
  Calendar,
  CheckCircle2,
  Clock,
  HeartHandshake
} from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
  onExploreRooms: () => void;
  onContact: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, onExploreRooms, onContact }) => {
  return (
    <div id="about-page" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
      
      {/* Return Button */}
      <div>
        <button
          id="about-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition group"
        >
          <div className="p-2 rounded-xl bg-[#282828] border border-[#383838] group-hover:bg-[#323232] group-hover:border-amber-500/40 transition">
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </div>
          <span className="hidden sm:inline">Back to Party Rooms</span>
          <span className="sm:hidden">Back</span>
        </button>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-3xl bg-radial-[at_top] from-amber-950/40 via-[#282828] to-[#202020] border border-[#383838] p-6 sm:p-12 text-center overflow-hidden space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mx-auto">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          The Story of Celebrato
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight font-outfit max-w-3xl mx-auto leading-tight">
          Where Celebrations Become Legendary Moments.
        </h1>

        <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
          We built Celebrato to eliminate the stress of booking night clubs, dreary banquet halls, or cramped hotel rooms. Enjoy acoustically tuned, ultra-modern private suites with turnkey DJ rigs, responsive laser light shows, and our signature shared <strong>Event Media Vault</strong>.
        </p>

        {/* Quick CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onExploreRooms}
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Explore Room Catalog</span>
            <span className="sm:hidden">Browse Rooms</span>
          </button>
          <button
            onClick={onContact}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#282828] hover:bg-[#323232] text-white font-bold text-sm border border-[#3e3e3e] transition"
          >
            Talk to Concierge
          </button>
        </div>
      </div>

      {/* 4 Pillars of Excellence */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white font-outfit">The Celebrato Advantage</h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Everything your celebration needs, curated by nightlife engineers and party hosts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-[#282828] border border-[#383838] space-y-3 hover:border-amber-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-outfit">Hourly Freedom</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Book by the hour (2h to 6h+) with automatic tiered discounts. Pay only for the celebration time you want without 24-hour venue buyouts.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#282828] border border-[#383838] space-y-3 hover:border-rose-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-outfit">Video Previews</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Every room features an actual 4K walkthrough video with real lighting & acoustics so you experience the room before reserving.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#282828] border border-[#383838] space-y-3 hover:border-violet-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
              <FolderLock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-outfit">Event Media Vault</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Guests scan a room QR code and directly drop high-res videos and photos into one private shared folder. No more lost phone memories!
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#282828] border border-[#383838] space-y-3 hover:border-emerald-500/30 transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white font-outfit">100% Private</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Acoustically soundproofed suites with private bar counters, dedicated bathrooms, and on-call audio engineers at your fingertips.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#242424] border border-[#383838] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div>
          <div className="text-3xl sm:text-4xl font-black text-amber-400 font-outfit">450+</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Parties & Events Hosted</div>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-rose-400 font-outfit">98.4%</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">5-Star Host Satisfaction</div>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-violet-400 font-outfit">14,000+</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Memories in Media Vaults</div>
        </div>
        <div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-400 font-outfit">24/7</div>
          <div className="text-xs text-gray-400 mt-1 font-medium">Host Concierge</div>
        </div>
      </div>

      {/* Bottom Callout */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-[#282828] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-black text-white font-outfit">Ready to Host an Unforgettable Night?</h3>
          <p className="text-xs sm:text-sm text-gray-300">Browse available dates, select customized lighting and balloons, and claim your party room now.</p>
        </div>
        <button
          onClick={onExploreRooms}
          className="shrink-0 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm transition shadow-lg shadow-amber-500/20"
        >
          Browse Available Rooms
        </button>
      </div>

    </div>
  );
};
