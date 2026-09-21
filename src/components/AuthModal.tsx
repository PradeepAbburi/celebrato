import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Sparkles, Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultMode = 'login' }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, signInDemoGuest } = useAuth();
  const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        if (!name.trim()) throw new Error('Please enter your full name');
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      onClose();
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
      onClose();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        id="auth-modal-card"
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-100 overflow-hidden"
      >
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          id="auth-modal-close-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Celebrato Party Access
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {isSignUp ? 'Create Party Host Account' : 'Welcome to Celebrato'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isSignUp 
              ? 'Get 500 bonus loyalty points on sign up to redeem discounts.' 
              : 'Sign in to access your bookings, customize add-ons, and open party vaults.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* Google Auth Button */}
        <button
          id="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-white font-medium transition active:scale-[0.99] disabled:opacity-50 mb-4"
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
          Continue with Google
        </button>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-slate-800 w-full" />
          <span className="bg-slate-900 px-3 text-xs text-slate-500 uppercase tracking-wider">Or email login</span>
          <div className="border-t border-slate-800 w-full" />
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {isSignUp && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                <input
                  id="signup-name-input"
                  type="text"
                  required
                  placeholder="e.g. Alex Miller"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                id="auth-email-input"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                id="auth-password-input"
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-750 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Create Account & Claim 500 Pts' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <span>{isSignUp ? 'Already have an account?' : "Don't have an account yet?"}</span>
          <button
            id="auth-toggle-mode-btn"
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up Free'}
          </button>
        </div>

        {/* Quick Instant Demo Login for reviewers */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-500 mb-2 text-center uppercase tracking-wider font-semibold">
            Fast Preview & Demo Testing
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              id="demo-user-login-btn"
              type="button"
              onClick={() => handleDemoSignIn(false)}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              Demo Guest User
            </button>
            <button
              id="demo-admin-login-btn"
              type="button"
              onClick={() => handleDemoSignIn(true)}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition flex items-center justify-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Demo Admin (Dinesh)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
