import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User as UserIcon, 
  Mail, 
  Calendar, 
  FolderLock, 
  LogOut, 
  Sparkles, 
  ArrowRight,
  Headphones
} from 'lucide-react';
import { AppView, DashboardTab, Booking } from '../types';
import { subscribeUserBookings } from '../services/partyDataService';

interface ProfilePageProps {
  onNavigateView: (view: AppView) => void;
  setDashboardTab: (tab: DashboardTab) => void;
  onNavigateAuth: (mode?: 'login' | 'signup') => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  onNavigateView,
  setDashboardTab,
  onNavigateAuth,
}) => {
  const { currentUser, profile, isAdmin, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Subscribe to user bookings in real time
  useEffect(() => {
    if (!currentUser) {
      setBookings([]);
      return;
    }
    const unsub = subscribeUserBookings(currentUser.uid, (data) => {
      setBookings(data);
    });
    return () => unsub();
  }, [currentUser]);

  const nowStr = new Date().toISOString().split('T')[0];
  const activeBookings = bookings.filter((b) => b.date >= nowStr && b.status !== 'cancelled');
  const pastBookings = bookings.filter((b) => b.date < nowStr || b.status === 'completed' || b.status === 'cancelled');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fadeIn">
      <div className="space-y-6">
          {/* Profile Header Card */}
          <div className="rounded-3xl bg-[#202020] border border-[#383838] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {currentUser ? (
              <div className="space-y-6 relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 sm:gap-5">
                    {/* Profile Picture */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-600 p-1 shadow-xl shadow-amber-500/20">
                        <div className="w-full h-full rounded-[22px] bg-[#181818] overflow-hidden flex items-center justify-center text-2xl font-black text-amber-400">
                          {profile?.photoURL ? (
                            <img 
                              src={profile.photoURL} 
                              alt={profile.displayName || 'Profile'} 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            (profile?.displayName?.charAt(0) || currentUser.email?.charAt(0) || 'P').toUpperCase()
                          )}
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-[#181818] flex items-center justify-center text-[10px] text-black font-bold">
                        ✓
                      </div>
                    </div>

                    {/* Host Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl sm:text-2xl font-black text-white font-outfit">
                          {profile?.displayName || 'Party Host'}
                        </h2>
                        {isAdmin && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold uppercase tracking-wider">
                            Admin
                          </span>
                        )}

                      </div>

                      <p className="text-sm text-gray-300 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{currentUser.email}</span>
                      </p>

                      <p className="text-xs text-amber-400/90 font-medium pt-0.5">
                        Member since {new Date(currentUser.metadata?.creationTime || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Sign Out Button */}
                  <button
                    id="profile-signout-btn"
                    onClick={signOut}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-[#282828] hover:bg-rose-500/20 text-gray-300 hover:text-rose-400 border border-[#3e3e3e] hover:border-rose-500/30 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>


              </div>
            ) : (
              /* Guest state */
              <div className="text-center py-8 space-y-5 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
                  <UserIcon className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-white font-outfit">Host Account Required</h2>
                  <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto">
                    Sign in to view your party reservations and manage collaborative media vaults.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => onNavigateAuth('login')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
                  >
                    Sign In to Host Profile
                  </button>
                  <button
                    onClick={() => onNavigateAuth('signup')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#282828] hover:bg-[#323232] text-white border border-[#3e3e3e] font-bold text-sm transition cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Access Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
              Host Shortcuts & Management
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                id="profile-goto-bookings"
                onClick={() => {
                  onNavigateView('dashboard');
                  setDashboardTab('bookings');
                }}
                className="p-5 rounded-3xl bg-[#202020] border border-[#383838] hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-outfit group-hover:text-amber-300 transition">
                      Active & Past Bookings
                    </h4>
                    <p className="text-xs text-gray-400">{activeBookings.length} upcoming • {pastBookings.length} past events</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div
                id="profile-goto-vault"
                onClick={() => onNavigateView('mem-vault')}
                className="p-5 rounded-3xl bg-[#202020] border border-[#383838] hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
                    <FolderLock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-outfit group-hover:text-rose-300 transition">
                      Party Mem Vault
                    </h4>
                    <p className="text-xs text-gray-400">Event folders, camera photo & video drops</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div
                onClick={() => onNavigateView('home')}
                className="p-5 rounded-3xl bg-[#202020] border border-[#383838] hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-violet-500/10 text-violet-400 group-hover:scale-105 transition-transform">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-outfit group-hover:text-violet-300 transition">
                      Explore Party Rooms
                    </h4>
                    <p className="text-xs text-gray-400">Browse rooms with 4K tour videos</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>

              <div
                onClick={() => onNavigateView('contact')}
                className="p-5 rounded-3xl bg-[#202020] border border-[#383838] hover:border-amber-500/50 transition cursor-pointer flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-105 transition-transform">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-outfit group-hover:text-emerald-300 transition">
                      Contact Concierge
                    </h4>
                    <p className="text-xs text-gray-400">Custom DJ packages, special requests & support</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};
