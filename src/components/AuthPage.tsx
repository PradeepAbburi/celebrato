import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight, ArrowLeft,
  Video,
  FolderLock,
  ShieldCheck,
  Star
} from 'lucide-react';
import { formatAuthError } from '../utils/authErrors';

interface AuthPageProps {
  onBack: () => void;
  onSuccess: (meta?: { isAdmin?: boolean }) => void;
  defaultMode?: 'login' | 'signup';
}

export const AuthPage: React.FC<AuthPageProps> = ({
  onBack,
  onSuccess,
  defaultMode = 'login',
}) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signUpWithEmail(email, password, name);
        onSuccess({ isAdmin: false });
      } else {
        const result = await signInWithEmail(email, password);
        onSuccess({ isAdmin: result.isAdmin });
      }
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess({ isAdmin: false });
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user') return;
      setError(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="auth-page"
      className="fixed inset-0 z-50 flex bg-[#161616]"
    >
      {/* ── LEFT: Full-bleed atmosphere image ── */}
      <div className="hidden lg:block lg:w-1/2 xl:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1400&q=80"
          alt="Celebrato party atmosphere"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#161616]/10 via-transparent to-[#161616]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#161616]/80 via-transparent to-transparent" />

        {/* Brand badge */}
        <div className="absolute top-8 left-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 p-0.5 shadow-lg">
            <div className="w-full h-full bg-[#161616] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <span className="text-xl font-black text-white font-outfit tracking-tight">CELEBRATO</span>
        </div>

        {/* Bottom perks */}
        <div className="absolute bottom-10 left-8 right-8 space-y-3">
          <h2 className="text-3xl xl:text-4xl font-black text-white font-outfit leading-tight">
            Where Nightlife Meets<br />
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-amber-200 bg-clip-text text-transparent">
              Private Luxury Suites.
            </span>
          </h2>
          <p className="text-sm text-gray-300 max-w-md leading-relaxed">
            {isSignUp
              ? 'Join thousands of party hosts booking acoustically tuned rooms and sharing private photo vaults.'
              : 'Log in to view upcoming bookings, download guest media from your Event Vault, or manage venue operations.'}
          </p>

          <div className="flex flex-col gap-2 pt-2">
            {[
              { icon: <Video className="w-4 h-4" />, color: 'bg-amber-500/20 text-amber-400', title: '1080p Room Video Walkthroughs', sub: 'Inspect acoustics and lighting rigs before booking' },
              { icon: <FolderLock className="w-4 h-4" />, color: 'bg-violet-500/20 text-violet-400', title: 'Collaborative Party Media Vault', sub: 'Guests scan QR to drop photos into one shared folder' },
              { icon: <ShieldCheck className="w-4 h-4" />, color: 'bg-emerald-500/20 text-emerald-400', title: 'Tiered Hourly Discounts', sub: 'Up to 15% discount on extended 4h and 6h passes' },
            ].map((perk, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md">
                <div className={`p-2 rounded-xl shrink-0 ${perk.color}`}>{perk.icon}</div>
                <div className="text-xs">
                  <span className="font-bold text-white block">{perk.title}</span>
                  <span className="text-gray-400">{perk.sub}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <div className="flex text-amber-400">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-current" />)}
            </div>
            <span className="font-bold text-white text-xs">4.9/5</span>
            <span className="text-gray-400 text-xs">(450+ Parties)</span>
            <span className="ml-auto text-amber-400 font-semibold text-xs">100% Private Venues</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT: Auth Form ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex flex-col justify-center px-8 sm:px-14 xl:px-20 py-12 overflow-y-auto bg-[#1c1c1c]">

        <div className="max-w-sm w-full mx-auto space-y-6">
          {/* Header Bar with Back Button & Mobile Logo */}
          <div className="flex items-center justify-between pb-2">
            <button
              id="auth-back-btn"
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition px-3 py-2 rounded-xl bg-[#252525] hover:bg-[#2e2e2e] border border-[#383838] cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
              <span>Back</span>
            </button>

            {/* Mobile brand badge */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-violet-600 p-0.5 shadow-md">
                <div className="w-full h-full bg-[#1c1c1c] rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                </div>
              </div>
              <span className="text-sm font-black text-white font-outfit tracking-tight">CELEBRATO</span>
            </div>
          </div>
          {/* Title */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit tracking-tight">
              {isSignUp ? 'Create Host Account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-gray-400">
              {isSignUp
                ? 'Reserve party suites and manage your event media vault.'
                : 'Enter your credentials or continue with Google.'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Google */}
          <button
            id="google-signin-page-btn"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#282828] hover:bg-[#303030] border border-[#3e3e3e] rounded-2xl text-white font-semibold text-sm transition active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.8 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
              <path fill="#FBBC05" d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"/>
              <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"/>
            </svg>
            {isSignUp ? 'Sign Up with Google' : 'Continue with Google'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-[#333]" />
            <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">or email</span>
            <div className="flex-1 border-t border-[#333]" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Full Name *</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    id="signup-name-field"
                    type="text"
                    required
                    placeholder="e.g. Alex Kumar"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-[#242424] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email Address *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  id="auth-email-field"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#242424] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Password *</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  id="auth-password-field"
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#242424] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <button
              id="auth-submit-page-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? 'Processing...' : isSignUp ? (
                <>Create Account <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Sign In to Dashboard <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-1.5 text-sm text-gray-400 pt-1">
            <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
            <button
              id="auth-toggle-page-mode-btn"
              type="button"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
              className="text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
