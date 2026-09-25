import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  Calendar, 
  FolderLock, 
  LogOut, 
  User as UserIcon, 
  Menu, 
  X,
  Compass,
  Info,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { DashboardTab, AppView } from '../types';

export type { AppView };

interface NavbarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  dashboardTab: DashboardTab;
  setDashboardTab: (tab: DashboardTab) => void;
  onNavigateAuth: (mode?: 'login' | 'signup' | 'admin') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  dashboardTab,
  setDashboardTab,
  onNavigateAuth,
}) => {
  const { currentUser, profile, isAdmin, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#202020]/90 backdrop-blur-md border-b border-[#383838]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          id="nav-brand-logo"
          onClick={() => {
            if (isAdmin) {
              setActiveView('admin');
            } else {
              setActiveView('home');
            }
          }}
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
                {isAdmin ? 'ADMIN' : 'PRO'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 -mt-0.5 hidden sm:block">
              {isAdmin ? 'Operations & Venues Console' : 'Party Rooms & Event Media Vault'}
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {isAdmin ? (
            /* Admin is strictly isolated: cannot access user pages while in admin session */
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrator Portal Active — User Pages Isolated</span>
            </div>
          ) : (
            /* User / Guest Navigation Links */
            <>
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
                      setActiveView('mem-vault');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                      activeView === 'mem-vault'
                        ? 'bg-rose-500 text-white shadow-md font-bold'
                        : 'text-gray-300 hover:text-white hover:bg-[#323232]'
                    }`}
                  >
                    <FolderLock className="w-3.5 h-3.5" />
                    Event Vault
                  </button>
                </div>
              )}

              {/* About Celebrato */}
              <button
                id="nav-about-btn"
                onClick={() => setActiveView('about')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                  activeView === 'about'
                    ? 'bg-[#323232] text-white font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-[#282828]'
                }`}
              >
                <Info className="w-4 h-4 text-amber-400" />
                <span>About</span>
              </button>

              {/* Contact Concierge */}
              <button
                id="nav-contact-btn"
                onClick={() => setActiveView('contact')}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1.5 ${
                  activeView === 'contact'
                    ? 'bg-[#323232] text-white font-semibold'
                    : 'text-gray-300 hover:text-white hover:bg-[#282828]'
                }`}
              >
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Contact</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Action / Auth */}
        <div className="flex items-center gap-3">
          {isAdmin ? (
            /* Admin Active Session - Clean, minimal, mobile-friendly without signout button */
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold font-outfit tracking-wide">
                  <span className="hidden sm:inline">Admin </span>Console
                </span>
              </div>
            </div>
          ) : currentUser ? (
            /* User Active Session - Clean header profile shortcut */
            <div className="flex items-center gap-2 sm:gap-3">
              <div 
                onClick={() => {
                  setActiveView('dashboard');
                  setDashboardTab('bookings');
                }}
                className="cursor-pointer flex items-center gap-2 group pl-1"
              >
                <div className="w-8 sm:w-9 h-8 sm:h-9 rounded-xl bg-[#282828] border border-[#3e3e3e] overflow-hidden flex items-center justify-center text-xs sm:text-sm font-bold text-amber-400">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                  ) : (
                    profile?.displayName?.charAt(0).toUpperCase() || 'P'
                  )}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-sm font-bold text-gray-200 max-w-[130px] truncate group-hover:text-amber-300">
                    {profile?.displayName || 'Party Host'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    Host Account
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Logged Out - Show Host Sign In & Admin Login */
            <div className="hidden sm:flex items-center gap-2">
              <button
                id="nav-admin-login-btn"
                onClick={() => onNavigateAuth('admin')}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-[#282828] hover:bg-[#323232] border border-[#3e3e3e] hover:border-amber-500/40 text-gray-300 hover:text-amber-400 transition flex items-center gap-1.5 cursor-pointer"
                title="Administrator Portal"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login</span>
              </button>

              <button
                id="nav-login-trigger-btn"
                onClick={() => onNavigateAuth('login')}
                className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition shadow-lg shadow-amber-500/20 active:scale-[0.98] cursor-pointer"
              >
                Host Sign In
              </button>
            </div>
          )}

          {/* Mobile menu trigger - Only shown for non-admin users */}
          {!isAdmin && (
            <button
              id="nav-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#282828] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer - Only for non-admin users */}
      {mobileMenuOpen && !isAdmin && (
        <div id="nav-mobile-drawer" className="md:hidden px-4 pt-2 pb-6 bg-[#202020] border-b border-[#383838] space-y-3">
          {/* User / Guest Mobile Drawer */}
          <>
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
                      setActiveView('mem-vault');
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
                      activeView === 'mem-vault' ? 'bg-rose-500 text-white font-bold' : 'text-gray-300'
                    }`}
                  >
                    <FolderLock className="w-5 h-5" />
                    Party Media Vault
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  setActiveView('about');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
                  activeView === 'about' ? 'bg-[#323232] text-white font-bold' : 'text-gray-300'
                }`}
              >
                <Info className="w-5 h-5 text-amber-400" />
                About Celebrato
              </button>

              <button
                onClick={() => {
                  setActiveView('contact');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 ${
                  activeView === 'contact' ? 'bg-[#323232] text-white font-bold' : 'text-gray-300'
                }`}
              >
                <Mail className="w-5 h-5 text-amber-400" />
                Contact Concierge
              </button>

              {/* Authentication Actions in Mobile Drawer */}
              {!currentUser ? (
                <div className="pt-3 border-t border-[#333] space-y-2">
                  <button
                    id="nav-mobile-admin-login-btn"
                    onClick={() => {
                      onNavigateAuth('admin');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-4 text-center text-sm font-bold rounded-xl bg-[#282828] hover:bg-[#323232] text-amber-400 border border-[#3e3e3e] flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Admin Login</span>
                  </button>
                  <button
                    id="nav-mobile-signin-btn"
                    onClick={() => {
                      onNavigateAuth('login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-4 text-center text-sm font-bold rounded-xl bg-[#282828] hover:bg-[#323232] text-white border border-[#3e3e3e] flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-amber-400" />
                    <span>Host Sign In</span>
                  </button>
                  <button
                    id="nav-mobile-signup-btn"
                    onClick={() => {
                      onNavigateAuth('signup');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 px-4 text-center text-sm font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-[#333] flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#282828] text-amber-400 flex items-center justify-center font-bold text-xs border border-[#3e3e3e]">
                      {profile?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-white truncate max-w-[150px]">
                        {profile?.displayName || 'Party Host'}
                      </div>
                      <div className="text-gray-400 truncate max-w-[150px] text-[11px]">
                        {currentUser?.email}
                      </div>
                    </div>
                  </div>
                  <button
                    id="nav-mobile-signout-btn"
                    onClick={async () => {
                      await signOut();
                      setActiveView('home');
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-bold px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </>
        </div>
      )}
    </header>
  );
};
