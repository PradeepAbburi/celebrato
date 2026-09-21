import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  FolderLock, 
  LogOut, 
  User as UserIcon, 
  Music2, 
  Menu, 
  X,
  Compass
} from 'lucide-react';
import { DashboardTab } from '../types';

export type AppView = 'home' | 'room-detail' | 'booking' | 'dashboard' | 'admin' | 'auth';

interface NavbarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  onNavigateAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  dashboardTab,
  setDashboardTab,
  onNavigateAuth,
}) => {
  const { currentUser, profile, isAdmin, signOut, toggleAdminMode } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#202020]/90 backdrop-blur-md border-b border-[#383838]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          id="nav-brand-logo"
          onClick={() => setActiveView('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#202020] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-outfit">
                CELEBRATO
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-gray-400 -mt-0.5 hidden sm:block">Party Rooms & Event Media Vault</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          <button
            id="nav-rooms-btn"
            onClick={() => setActiveView('home')}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              activeView === 'home'
                ? 'bg-[#323232] text-white font-semibold'
                : 'text-gray-300 hover:text-white hover:bg-[#282828]'
            }`}
          >
            <Compass className="w-4 h-4 text-amber-400" />
            Party Rooms
          </button>

          {/* User Dashboard Tab Toggle shortcut */}
          {currentUser && (
            <div className="flex items-center bg-[#282828] p-1 rounded-xl border border-[#383838]">
              <button
                id="nav-my-bookings-btn"
                onClick={() => {
                  setActiveView('dashboard');
                  setDashboardTab('bookings');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeView === 'dashboard' && dashboardTab === 'bookings'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-[#323232]'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                My Bookings
              </button>
              <button
                id="nav-media-vault-btn"
                onClick={() => {
                  setActiveView('dashboard');
                  setDashboardTab('vault');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                  activeView === 'dashboard' && dashboardTab === 'vault'
                    ? 'bg-rose-500 text-white shadow-md font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-[#323232]'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5" />
                Event Vault
              </button>
            </div>
          )}

          {/* Admin Panel Route */}
          <button
            id="nav-admin-panel-btn"
            onClick={() => setActiveView('admin')}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              activeView === 'admin'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                : 'text-gray-300 hover:text-amber-300 hover:bg-[#282828]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            Admin Panel
            {isAdmin && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Admin Active" />
            )}
          </button>
        </nav>

        {/* Right Action / Auth */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* User Avatar & Menu */}
              <div className="flex items-center gap-2 pl-2">
                <div 
                  onClick={() => {
                    setActiveView('dashboard');
                    setDashboardTab('bookings');
                  }}
                  className="cursor-pointer flex items-center gap-2 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#282828] border border-[#3e3e3e] overflow-hidden flex items-center justify-center text-sm font-bold text-amber-400">
                    {profile?.photoURL ? (
                      <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                    ) : (
                      profile?.displayName?.charAt(0).toUpperCase() || 'P'
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-200 hidden lg:inline max-w-[120px] truncate group-hover:text-amber-300">
                    {profile?.displayName || 'Party Host'}
                  </span>
                </div>

                <button
                  id="nav-logout-btn"
                  onClick={signOut}
                  title="Sign Out"
                  className="p-2 text-gray-400 hover:text-rose-400 hover:bg-[#282828] rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id="nav-login-trigger-btn"
                onClick={onNavigateAuth}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition shadow-lg shadow-amber-500/20 active:scale-[0.98]"
              >
                Host Sign In
              </button>
            </div>
          )}

          {/* Mobile menu trigger */}
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#282828]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="nav-mobile-drawer" className="md:hidden px-4 pt-2 pb-6 bg-[#202020] border-b border-[#383838] space-y-3">
          <button
            onClick={() => {
              setActiveView('home');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
              activeView === 'home' ? 'bg-[#323232] text-white' : 'text-gray-300'
            }`}
          >
            <Compass className="w-5 h-5 text-amber-400" />
            Party Rooms
          </button>

          {currentUser && (
            <>
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setDashboardTab('bookings');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
                  activeView === 'dashboard' && dashboardTab === 'bookings' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-gray-300'
                }`}
              >
                <Calendar className="w-5 h-5" />
                My Bookings & History
              </button>
              <button
                onClick={() => {
                  setActiveView('dashboard');
                  setDashboardTab('vault');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
                  activeView === 'dashboard' && dashboardTab === 'vault' ? 'bg-rose-500 text-white font-bold' : 'text-gray-300'
                }`}
              >
                <FolderLock className="w-5 h-5" />
                Party Media Vault
              </button>
            </>
          )}

          <button
            onClick={() => {
              setActiveView('admin');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
              activeView === 'admin' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-gray-300'
            }`}
          >
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Admin Panel (/admin)
          </button>

          {!currentUser && (
            <button
              onClick={() => {
                onNavigateAuth();
                setMobileMenuOpen(false);
              }}
              className="w-full py-3 text-center text-sm font-bold rounded-xl bg-amber-500 text-slate-950"
            >
              Sign In or Register
            </button>
          )}
        </div>
      )}
    </header>
  );
};
