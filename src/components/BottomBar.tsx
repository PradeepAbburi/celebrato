import React from 'react';
import { 
  Compass, 
  Calendar, 
  FolderLock, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { AppView, DashboardTab } from '../types';
import { useAuth } from '../context/AuthContext';

interface BottomBarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  onNavigateAuth: (mode?: 'login' | 'signup') => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({
  activeView,
  setActiveView,
  dashboardTab,
  setDashboardTab,
  onNavigateAuth,
}) => {
  const { currentUser, profile } = useAuth();

  const handleExploreClick = () => {
    setActiveView('home');
    const catalogEl = document.getElementById('rooms-catalog');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBookingsClick = () => {
    setActiveView('dashboard');
    setDashboardTab('bookings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleMemVaultClick = () => {
    setActiveView('mem-vault');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProfileClick = () => {
    setActiveView('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isExploreActive = activeView === 'home' || activeView === 'room-detail' || activeView === 'booking';
  const isBookingsActive = activeView === 'dashboard' && dashboardTab === 'bookings';
  const isMemVaultActive = activeView === 'mem-vault' || (activeView === 'dashboard' && dashboardTab === 'vault');
  const isProfileActive = activeView === 'profile';

  return (
    <div 
      id="mobile-bottom-bar" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#161616]/95 backdrop-blur-xl border-t border-[#333333] px-2 py-1.5 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]"
      style={{ paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        
        {/* Tab 1: Explore (Rooms Catalog) */}
        <button
          id="mobile-tab-explore"
          type="button"
          onClick={handleExploreClick}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
            isExploreActive
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
          }`}
        >
          <Compass className={`w-5 h-5 transition-transform ${isExploreActive ? 'scale-110 text-amber-400' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Explore</span>
        </button>

        {/* Tab 2: Bookings (Active & Past) */}
        <button
          id="mobile-tab-bookings"
          type="button"
          onClick={handleBookingsClick}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
            isBookingsActive
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
          }`}
        >
          <Calendar className={`w-5 h-5 transition-transform ${isBookingsActive ? 'scale-110 text-amber-400' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Bookings</span>
        </button>

        {/* Tab 3: Mem Vault (Event Folders & Camera/Gallery Drop) */}
        <button
          id="mobile-tab-memvault"
          type="button"
          onClick={handleMemVaultClick}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
            isMemVaultActive
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
          }`}
        >
          <FolderLock className={`w-5 h-5 transition-transform ${isMemVaultActive ? 'scale-110 text-amber-400' : ''}`} />
          <span className="text-[10px] mt-1 tracking-tight font-medium">Mem Vault</span>
        </button>

        {/* Tab 4: Profile */}
        <button
          id="mobile-tab-profile"
          type="button"
          onClick={handleProfileClick}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-all cursor-pointer ${
            isProfileActive
              ? 'text-amber-400 font-black bg-amber-500/10 shadow-sm'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#252525]'
          }`}
        >
          {currentUser && profile?.photoURL ? (
            <div className={`w-5 h-5 rounded-full overflow-hidden border ${isProfileActive ? 'border-amber-400 scale-110' : 'border-gray-500'}`}>
              <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
            </div>
          ) : (
            <UserIcon className={`w-5 h-5 transition-transform ${isProfileActive ? 'scale-110 text-amber-400' : ''}`} />
          )}
          <span className="text-[10px] mt-1 tracking-tight font-medium">Profile</span>
        </button>

      </div>
    </div>
  );
};
