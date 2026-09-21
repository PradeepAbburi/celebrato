import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { RoomCard } from './components/RoomCard';
import { RoomDetailsPage } from './components/RoomDetailsPage';
import { BookingPage } from './components/BookingPage';
import { AuthPage } from './components/AuthPage';
import { UserDashboard } from './components/UserDashboard';
import { AdminPanel } from './components/AdminPanel';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { BottomBar } from './components/BottomBar';
import { MemVaultPage } from './components/MemVaultPage';
import { ProfilePage } from './components/ProfilePage';
import { Room, Booking, DashboardTab, AppView } from './types';
import { subscribeRooms, ensureInitialRoomsSeeded } from './services/partyDataService';
import { 
  Sparkles, 
  Calendar, 
  FolderLock, 
  ShieldCheck, 
  Coins, 
  Users, 
  Flame, 
  Music, 
  SlidersHorizontal,
  ChevronRight,
  PartyPopper,
  CheckCircle,
  Video as VideoIcon,
  Clock
} from 'lucide-react';

function AppContent() {
  const { currentUser, isAdmin } = useAuth();

  // Navigation & Route states - purely page-based, no popups
  const [activeView, setActiveView] = useState<AppView>('home');
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('bookings');
  const [returnViewAfterAuth, setReturnViewAfterAuth] = useState<AppView>('home');

  // Selected room for dedicated RoomDetailsPage & BookingPage
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedPackageDuration, setSelectedPackageDuration] = useState<number | null>(null);
  // Pending room/duration to resume booking after login
  const [pendingBookRoom, setPendingBookRoom] = useState<Room | null>(null);
  const [pendingBookDuration, setPendingBookDuration] = useState<number | null>(null);

  // Sync route with URL (support /admin, /about, /contact)
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.includes('/admin') || hash === '#admin') {
        setActiveView('admin');
      } else if (path.includes('/about') || hash === '#about') {
        setActiveView('about');
      } else if (path.includes('/contact') || hash === '#contact') {
        setActiveView('contact');
      }
    };
    handleLocation();
    window.addEventListener('popstate', handleLocation);
    window.addEventListener('hashchange', handleLocation);
    return () => {
      window.removeEventListener('popstate', handleLocation);
      window.removeEventListener('hashchange', handleLocation);
    };
  }, []);

  const handleNavigateView = (view: AppView) => {
    setActiveView(view);
    if (view === 'admin') {
      window.history.pushState(null, '', '/admin');
    } else if (view === 'about') {
      window.history.pushState(null, '', '/about');
    } else if (view === 'contact') {
      window.history.pushState(null, '', '/contact');
    } else {
      window.history.pushState(null, '', '/');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Rooms Data
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [themeFilter, setThemeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'capacity'>('featured');

  // Seed default rooms & subscribe to Firestore
  useEffect(() => {
    ensureInitialRoomsSeeded();
    const unsub = subscribeRooms((data) => {
      setRooms(data);
      setLoadingRooms(false);
    });
    return () => unsub();
  }, []);

  // Filter & Sort Rooms
  const filteredRooms = rooms.filter((room) => {
    if (themeFilter === 'all') return true;
    return room.theme.toLowerCase().includes(themeFilter.toLowerCase());
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.pricePerHour - b.pricePerHour;
    if (sortBy === 'price-desc') return b.pricePerHour - a.pricePerHour;
    if (sortBy === 'capacity') return b.capacity - a.capacity;
    return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
  });

  // Action handlers for page navigation
  const handlePreviewRoom = (room: Room) => {
    setSelectedRoom(room);
    setActiveView('room-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookRoom = (room: Room, initialDuration?: number) => {
    if (!currentUser) {
      // Save pending booking intent, go to auth, come back here after login
      setPendingBookRoom(room);
      setPendingBookDuration(initialDuration || null);
      setReturnViewAfterAuth('booking');
      setActiveView('auth');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedRoom(room);
    setSelectedPackageDuration(initialDuration || null);
    setActiveView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const handleNavigateAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setReturnViewAfterAuth(activeView);
    setActiveView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = () => {
    if (returnViewAfterAuth === 'booking' && pendingBookRoom) {
      // Restore the pending booking after login
      setSelectedRoom(pendingBookRoom);
      setSelectedPackageDuration(pendingBookDuration);
      setPendingBookRoom(null);
      setPendingBookDuration(null);
      setActiveView('booking');
    } else {
      handleNavigateView(returnViewAfterAuth === 'booking' ? 'home' : 'dashboard');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookingSuccess = (_newBooking: Booking) => {
    setActiveView('dashboard');
    setDashboardTab('bookings');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#202020] text-gray-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={handleNavigateView}
        dashboardTab={dashboardTab}
        setDashboardTab={setDashboardTab}
        onNavigateAuth={handleNavigateAuth}
      />

      {/* Main Container - Renders dedicated pages with NO popups */}
      <main className="flex-1 pb-20 md:pb-12">
        
        {/* VIEW 1: ADMIN OPERATIONS DASHBOARD (/admin) */}
        {activeView === 'admin' && (
          <AdminPanel onNavigateHome={() => handleNavigateView('home')} />
        )}

        {/* VIEW 2: DEDICATED SEPARATE ROOM DETAILS PAGE (with video tour, pictures gallery, specs, hourly packages) */}
        {activeView === 'room-detail' && selectedRoom && (
          <RoomDetailsPage
            room={selectedRoom}
            onBack={() => handleNavigateView('home')}
            onBook={(room, duration) => handleBookRoom(room, duration)}
          />
        )}

        {/* VIEW 3: DEDICATED SEPARATE BOOKING PAGE (with hourly packages, add-ons, date & contact) */}
        {activeView === 'booking' && selectedRoom && (
          <BookingPage
            room={selectedRoom}
            initialHours={selectedPackageDuration || 3}
            onBack={() => {
              if (selectedRoom) {
                setActiveView('room-detail');
              } else {
                handleNavigateView('home');
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onBookingSuccess={handleBookingSuccess}
            onNavigateAuth={handleNavigateAuth}
            onNavigateVault={(_bookingId) => {
              handleNavigateView('mem-vault');
            }}
          />
        )}

        {/* VIEW 4: DEDICATED SEPARATE AUTHENTICATION PAGE */}
        {activeView === 'auth' && (
          <AuthPage
            defaultMode={authMode}
            onBack={() => handleNavigateView(returnViewAfterAuth || 'home')}
            onSuccess={handleAuthSuccess}
          />
        )}

        {/* VIEW 4b: DEDICATED MEMORY VAULT PAGE (Event Folders, Direct Camera & Gallery Drop) */}
        {activeView === 'mem-vault' && (
          <MemVaultPage
            onBackToHome={() => handleNavigateView('home')}
            onNavigateAuth={handleNavigateAuth}
          />
        )}

        {/* VIEW 4c: DEDICATED USER PROFILE PAGE */}
        {activeView === 'profile' && (
          <ProfilePage
            onNavigateView={handleNavigateView}
            setDashboardTab={setDashboardTab}
            onNavigateAuth={handleNavigateAuth}
          />
        )}

        {/* VIEW 5: USER DASHBOARD (Toggle between Past/Upcoming Bookings and Event Media Vault) */}
        {activeView === 'dashboard' && currentUser && (
          <UserDashboard
            initialTab={dashboardTab}
            onNavigateHome={() => handleNavigateView('home')}
          />
        )}

        {/* VIEW 5b: USER DASHBOARD REQUESTED BUT NOT SIGNED IN */}
        {activeView === 'dashboard' && !currentUser && (
          <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-xl">
              <FolderLock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white font-outfit">Host Account Required</h2>
              <p className="text-sm text-gray-400 max-w-md mx-auto">
                Sign in to view your party reservations and collaborate on shared event media vaults.
              </p>
            </div>
            <button
              onClick={() => handleNavigateAuth()}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20"
            >
              Sign In to Access Dashboard
            </button>
          </div>
        )}

        {/* VIEW 6: ABOUT CELEBRATO PAGE */}
        {activeView === 'about' && (
          <AboutPage
            onBack={() => handleNavigateView('home')}
            onExploreRooms={() => handleNavigateView('home')}
            onContact={() => handleNavigateView('contact')}
          />
        )}

        {/* VIEW 7: CONTACT CONCIERGE PAGE */}
        {activeView === 'contact' && (
          <ContactPage
            onBack={() => handleNavigateView('home')}
          />
        )}

        {/* VIEW 8: HOME EXPLORE PAGE - Party Rooms Catalog & Features */}
        {activeView === 'home' && (
          <div className="space-y-16 pb-20">
            
            {/* Hero Section - Hidden on mobile, shown on desktop */}
            <section className="hidden md:block relative overflow-hidden pt-14 pb-16 px-4 sm:px-6 lg:px-8 border-b border-[#383838] bg-radial-[at_top] from-amber-950/25 via-[#202020] to-[#202020]">
              {/* Ambient lighting */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-amber-500/10 via-rose-500/15 to-violet-600/10 rounded-full blur-3xl pointer-events-none" />

              <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#282828] border border-[#3e3e3e] text-amber-300 text-xs font-bold uppercase tracking-wider shadow-xl">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Private Suites • 1080p Video Tours • Shared Event Vaults
                </div>

                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight font-outfit leading-[1.08]">
                  Book Epic Party Rooms. <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-amber-200 bg-clip-text text-transparent">
                    Capture Every Memory.
                  </span>
                </h1>

                <p className="max-w-2xl mx-auto text-sm sm:text-base text-gray-300 leading-relaxed font-normal">
                  Private acoustically tuned celebration suites with pro DJ booths, synchronized laser lighting, and transparent hourly pricing. Scan a room QR code so everyone at the party can upload memories into one shared folder.
                </p>

                {/* Hero CTA & Quick Highlights */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href="#rooms-catalog"
                    className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm transition shadow-xl shadow-amber-500/25 active:scale-[0.99] flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="hidden sm:inline">Browse Party Rooms</span>
                    <span className="sm:hidden">Browse Rooms</span>
                  </a>

                  {currentUser ? (
                    <button
                      onClick={() => handleNavigateView('mem-vault')}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#282828] hover:bg-[#323232] text-white border border-[#3e3e3e] font-bold text-sm transition flex items-center justify-center gap-2"
                    >
                      <FolderLock className="w-4 h-4 text-rose-400" />
                      <span className="hidden sm:inline">Open My Party Vault</span>
                      <span className="sm:hidden">Party Vault</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavigateAuth()}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-[#282828] hover:bg-[#323232] text-white border border-[#3e3e3e] font-bold text-sm transition flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="hidden sm:inline">Host Sign In & Earn 500 Pts</span>
                      <span className="sm:hidden">Sign In / Register</span>
                    </button>
                  )}
                </div>

                {/* Feature Highlights Strip */}
                <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-gray-300">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#282828]/80 border border-[#383838]">
                    <VideoIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>4K Video Tours</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#282828]/80 border border-[#383838]">
                    <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
                    <span>Balloons & DJ Add-Ons</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#282828]/80 border border-[#383838]">
                    <FolderLock className="w-3.5 h-3.5 text-violet-400" />
                    <span>Collaborative Media Vault</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#282828]/80 border border-[#383838]">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>100% Private & Soundproof</span>
                  </div>
                </div>
              </div>
            </section>



            {/* PARTY ROOMS CATALOG */}
            <section id="rooms-catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pt-4 md:pt-0">
              
              {/* Header & Filter Controls - hidden on mobile */}
              <div className="hidden md:flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#383838] pb-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                    Signature Spaces
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-black text-white font-outfit">
                    Explore Party Rooms
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Click "Details" on any room to open its dedicated page with video tour, sound specs, and hourly package discounts.
                  </p>
                </div>

                {/* Theme Pills & Sort */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {/* Theme buttons */}
                  <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                    {[
                      { id: 'all', label: 'All Themes' },
                      { id: 'laser', label: '⚡ Cyber & Laser' },
                      { id: 'disco', label: '🪩 Retro Disco' },
                      { id: 'vip', label: '👑 Premium Lounge' },
                      { id: 'karaoke', label: '🎤 KTV Studio' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        id={`filter-theme-${tab.id}`}
                        onClick={() => setThemeFilter(tab.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                          themeFilter === tab.id
                            ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                            : 'bg-[#282828] text-gray-400 hover:text-white border border-[#383838]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Sort Dropdown */}
                  <select
                    id="rooms-sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-1.5 bg-[#282828] border border-[#383838] rounded-xl text-xs text-gray-300 focus:outline-none focus:border-amber-500"
                  >
                    <option value="featured">Featured Spaces</option>
                    <option value="price-asc">Lowest Price / hr</option>
                    <option value="price-desc">Highest Price / hr</option>
                    <option value="capacity">Largest Capacity</option>
                  </select>
                </div>
              </div>

              {/* Mobile-only compact header */}
              <div className="md:hidden space-y-1">
                <h2 className="text-xl font-black text-white font-outfit">
                  Explore Party Rooms
                </h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Private celebration suites with DJ booths, laser lighting & transparent hourly pricing. Tap any room for details.
                </p>
              </div>

              {/* Rooms Grid */}
              {loadingRooms ? (
                <div className="py-20 text-center space-y-3">
                  <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-gray-400">Loading party rooms from Firebase...</p>
                </div>
              ) : filteredRooms.length === 0 ? (
                <div className="py-20 text-center space-y-4 bg-[#282828] rounded-3xl border border-[#383838] p-8">
                  <Flame className="w-12 h-12 text-amber-500/50 mx-auto" />
                  <h3 className="text-xl font-bold text-white font-outfit">No Party Rooms Match Filter</h3>
                  <p className="text-xs text-gray-400">Try selecting "All Themes" to see our full catalog.</p>
                  <button
                    onClick={() => setThemeFilter('all')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Reset Filter
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {filteredRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      onPreview={handlePreviewRoom}
                      onBook={(r) => handleBookRoom(r)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* VALUE PROPOSITION: How Celebrato Works */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <div className="rounded-3xl bg-[#282828] border border-[#383838] p-8 sm:p-12 space-y-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="space-y-2 text-center max-w-2xl mx-auto">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    The Complete Party Experience
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white font-outfit">
                    Why Party Planners Love Celebrato
                  </h3>
                  <p className="text-xs text-gray-400">
                    From pre-booking video tours to post-event guest photo vaults, everything in one seamless platform.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  <div className="p-6 rounded-2xl bg-[#202020] border border-[#383838] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
                      <VideoIcon className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-white font-outfit">
                      1. Preview Before You Pay
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Watch complete HD walkthrough video tours and inspected pictures of sound rigs and laser lights before you book.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#202020] border border-[#383838] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
                      <PartyPopper className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-white font-outfit">
                      2. Custom Add-Ons & Packages
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Choose discounted 2h, 3h, 4h, or 6h packages, add luxury balloon arches, smoke machines, and DJ controllers with instant live cost breakdown.
                    </p>
                  </div>

                  <div className="p-6 rounded-2xl bg-[#202020] border border-[#383838] space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                      <FolderLock className="w-5 h-5" />
                    </div>
                    <h4 className="text-base font-bold text-white font-outfit">
                      3. Shared Event Media Vault
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      After booking, invite friends with your Party Share Code so everyone can upload high-res photos & dance clips into one shared vault!
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#383838] bg-[#1d1d1d] py-10 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-bold text-gray-200 font-outfit text-sm">CELEBRATO</span>
            <span>• Premium Party Rooms & Event Vault</span>
          </div>

          <div className="flex items-center gap-5 flex-wrap justify-center">
            <button
              onClick={() => handleNavigateView('about')}
              className="text-gray-400 hover:text-white transition"
            >
              About Celebrato
            </button>

            <button
              onClick={() => handleNavigateView('contact')}
              className="text-gray-400 hover:text-white transition"
            >
              Contact Concierge
            </button>

            <button
              onClick={() => handleNavigateView('admin')}
              className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile 4-Tab Bottom Bar: Explore, Bookings, Mem Vault, Profile - Hidden on Auth Page */}
      {activeView !== 'auth' && (
        <BottomBar
          activeView={activeView}
          setActiveView={handleNavigateView}
          dashboardTab={dashboardTab}
          setDashboardTab={setDashboardTab}
          onNavigateAuth={handleNavigateAuth}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
