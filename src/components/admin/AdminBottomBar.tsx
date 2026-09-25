import React from 'react';
import { 
  Calendar, 
  BarChart3, 
  Layers, 
  Tag, 
  MessageSquare, 
  LogOut,
  Sparkles,
  CheckCircle2,
  Clock,
  Radio
} from 'lucide-react';

export type AdminTabType = 'bookings' | 'analytics' | 'rooms_pricing' | 'addons' | 'contacts';
export type BookingSubPage = 'all' | 'confirmed' | 'checked-in' | 'completed' | 'cancelled' | 'calendar' | 'details';

interface AdminBottomBarProps {
  activeTab: AdminTabType;
  onSelectTab: (tab: AdminTabType) => void;
  activeBookingSubPage?: BookingSubPage;
  onSelectBookingSubPage?: (sub: BookingSubPage) => void;
  bookingsCount: number;
  liveCount: number;
  unreadContactsCount: number;
  onSignOut: () => void;
}

export const AdminBottomBar: React.FC<AdminBottomBarProps> = ({
  activeTab,
  onSelectTab,
  activeBookingSubPage = 'all',
  onSelectBookingSubPage,
  bookingsCount,
  liveCount,
  unreadContactsCount,
  onSignOut,
}) => {
  return (
    <nav
      id="admin-bottom-nav-bar"
      aria-label="Admin Navigation Console"
      className="fixed bottom-0 inset-x-0 z-50 bg-[#161616]/95 backdrop-blur-2xl border-t border-[#333333] shadow-[0_-12px_40px_rgba(0,0,0,0.85)] transition-all"
      style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Main Bottom Bar Items - Clean single-row layout without scroll on top */}
      <div className="max-w-5xl mx-auto px-2 sm:px-4 py-1.5 flex items-center justify-around gap-1 sm:gap-2">
        {/* Tab 1: Bookings */}
        <button
          id="admin-bottom-tab-bookings"
          type="button"
          onClick={() => onSelectTab('bookings')}
          className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-2xl transition-all cursor-pointer relative group ${
            activeTab === 'bookings'
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#222222]'
          }`}
          title="Party Bookings Management"
        >
          <div className="relative">
            <Calendar className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'bookings' ? 'scale-110 text-amber-400' : ''}`} />
            {bookingsCount > 0 && (
              <span className="absolute -top-1.5 -right-3 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[9px] font-mono font-black shadow-sm">
                {bookingsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight font-bold truncate">
            Bookings
          </span>
        </button>

        {/* Tab 2: Financial Analytics & Graphs */}
        <button
          id="admin-bottom-tab-analytics"
          type="button"
          onClick={() => onSelectTab('analytics')}
          className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-2xl transition-all cursor-pointer group ${
            activeTab === 'analytics'
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#222222]'
          }`}
          title="Financial Analytics & Reports"
        >
          <BarChart3 className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'analytics' ? 'scale-110 text-amber-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight font-bold truncate">
            Analytics
          </span>
        </button>

        {/* Tab 3: Rooms & Pricing */}
        <button
          id="admin-bottom-tab-rooms"
          type="button"
          onClick={() => onSelectTab('rooms_pricing')}
          className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-2xl transition-all cursor-pointer group ${
            activeTab === 'rooms_pricing'
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#222222]'
          }`}
          title="Party Rooms & Pricing Inventory"
        >
          <Layers className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'rooms_pricing' ? 'scale-110 text-amber-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight font-bold truncate">
            Rooms
          </span>
        </button>

        {/* Tab 4: Add-Ons Catalog */}
        <button
          id="admin-bottom-tab-addons"
          type="button"
          onClick={() => onSelectTab('addons')}
          className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-2xl transition-all cursor-pointer group ${
            activeTab === 'addons'
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#222222]'
          }`}
          title="Custom Party Add-Ons Catalog"
        >
          <Tag className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'addons' ? 'scale-110 text-amber-400' : ''}`} />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight font-bold truncate">
            Add-Ons
          </span>
        </button>

        {/* Tab 5: Concierge Inquiries */}
        <button
          id="admin-bottom-tab-contacts"
          type="button"
          onClick={() => onSelectTab('contacts')}
          className={`flex-1 flex flex-col items-center justify-center py-1 sm:py-1.5 px-1 rounded-2xl transition-all cursor-pointer relative group ${
            activeTab === 'contacts'
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#222222]'
          }`}
          title="Customer Inquiries & Concierge"
        >
          <div className="relative">
            <MessageSquare className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === 'contacts' ? 'scale-110 text-amber-400' : ''}`} />
            {unreadContactsCount > 0 && (
              <span className="absolute -top-1.5 -right-3 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-mono font-black shadow-sm">
                {unreadContactsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight font-bold truncate">
            Concierge
          </span>
        </button>

        {/* Sign Out Button */}
        <button
          id="admin-bottom-tab-signout"
          type="button"
          onClick={onSignOut}
          className="flex-none flex flex-col items-center justify-center py-1 sm:py-1.5 px-2.5 rounded-2xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all cursor-pointer group"
          title="Sign Out of Administrator Console"
        >
          <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
          <span className="text-[10px] sm:text-[11px] mt-1 tracking-tight font-bold truncate">
            Sign Out
          </span>
        </button>
      </div>
    </nav>
  );
};
