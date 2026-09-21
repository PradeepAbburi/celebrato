import React, { useState } from 'react';
import { useAuth, ADMIN_EMAIL, ADMIN_PASSWORD } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Sparkles, 
  Mail, 
  Lock, 
  User as UserIcon, 
  ShieldCheck, 
  CheckCircle2,
  KeyRound,
  ArrowRight
} from 'lucide-react';

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
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInDemoGuest } = useAuth();
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setError(err.message || 'Authentication failed. Please check your credentials.');
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
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async (asAdmin: boolean = false) => {
    setError('');
    setLoading(true);
    try {
      await signInDemoGuest(asAdmin);
      onSuccess({ isAdmin: asAdmin });
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setIsSignUp(false);
    setEmail(ADMIN_EMAIL);
    setPassword(ADMIN_PASSWORD);
    setError('');
  };

  return (
    <div id="auth-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      
      {/* Back button */}
      <div>
        <button
          id="auth-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition group w-fit"
        >
          <div className="p-2 rounded-xl bg-[#282828] border border-[#383838] group-hover:bg-[#323232] group-hover:border-amber-500/40 transition">
            <ArrowLeft className="w-4 h-4 text-amber-400" />
          </div>
          <span>Return to Party Rooms</span>
        </button>
      </div>

      {/* Main Auth Container */}
      <div className="max-w-md mx-auto relative bg-[#282828] border border-[#383838] rounded-3xl p-6 sm:p-9 shadow-2xl space-y-6 overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Celebrato Party Portal
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-black text-white font-outfit">
            {isSignUp ? 'Create Host Account' : 'Sign In'}
          </h1>
          
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            {isSignUp 
              ? 'Join to book VIP party rooms, select packages, and access the Event Media Vault.' 
              : 'Log in to manage bookings, explore all hourly packages, or access Admin venue controls.'}
          </p>
        </div>

        {/* Unified Admin & User Note */}
        <div className="p-3 rounded-2xl bg-[#202020] border border-[#3a3a3a] text-[11px] text-gray-300 flex items-start justify-between gap-3">
          <div>
            <span className="font-bold text-amber-400">Unified Portal:</span> Admins & hosts log in right here. Admin credentials redirect directly to Venue Operations.
          </div>
          <button
            type="button"
            onClick={fillAdminCredentials}
            title="Auto-fill admin credentials"
            className="shrink-0 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-[10px] transition flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            Admin Autofill
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Google Auth Button */}
        <button
          id="google-signin-page-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#202020] hover:bg-[#252525] border border-[#3e3e3e] rounded-2xl text-white font-semibold text-sm transition active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.2 8.8 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.2-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.2-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
            />
          </svg>
          {isSignUp ? 'Sign Up with Google' : 'Sign In with Google'}
        </button>

        <div className="relative flex items-center justify-center my-2">
          <div className="border-t border-[#383838] w-full" />
          <span className="bg-[#282828] px-3 text-xs text-gray-500 uppercase tracking-wider">Or email & password</span>
          <div className="border-t border-[#383838] w-full" />
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  id="signup-name-field"
                  type="text"
                  required
                  placeholder="e.g. Leo Vance"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                id="auth-email-field"
                type="email"
                required
                placeholder="admin@partyhouse.com or your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                id="auth-password-field"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#202020] border border-[#383838] rounded-2xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            id="auth-submit-page-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-black text-sm rounded-2xl transition shadow-xl shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Authenticating...'
            ) : isSignUp ? (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 flex items-center justify-between text-xs text-gray-400">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account yet?"}</span>
          <button
            id="auth-toggle-page-mode-btn"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-amber-400 hover:text-amber-300 font-bold underline"
          >
            {isSignUp ? 'Sign In' : 'Create Free Account'}
          </button>
        </div>

        {/* Demo Fast Testing */}
        <div className="pt-4 border-t border-[#383838] space-y-2">
          <p className="text-[11px] text-gray-500 text-center uppercase tracking-wider font-bold">
            Quick Testing Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="demo-guest-page-btn"
              type="button"
              onClick={() => handleDemoSignIn(false)}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-[#202020] hover:bg-[#262626] text-gray-300 border border-[#383838] transition"
            >
              Guest Host Login
            </button>
            <button
              id="demo-admin-page-btn"
              type="button"
              onClick={() => handleDemoSignIn(true)}
              className="px-3 py-2.5 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};

