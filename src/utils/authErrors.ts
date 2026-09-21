/**
 * Translates Firebase Auth error codes and messages into clear, friendly user notifications.
 */
export function formatAuthError(error: unknown): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const err = error as { code?: string; message?: string };
  const code = err.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Incorrect email or password. Please verify your details or sign up if you do not have an account yet.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled before completing.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was cancelled.';
    case 'auth/popup-blocked':
      return 'The sign-in popup was blocked by your browser. Please allow popups for this site.';
    case 'auth/operation-not-allowed':
      return 'Email or Google authentication is not enabled in the Firebase Console. Please verify Authentication settings.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized in Firebase. Please add "localhost" to Firebase Auth > Settings > Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network connection issue. Please check your internet connection.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Access is temporarily disabled; please wait a moment or reset your password.';
    default:
      if (err.message && typeof err.message === 'string') {
        // Remove raw Firebase prefix e.g. "Firebase: Error (auth/...)"
        const cleanMsg = err.message.replace(/^Firebase:\s*(?:Error\s*)?/i, '').replace(/\s*\(auth\/[^)]+\)\.?$/i, '');
        if (cleanMsg.trim()) return cleanMsg.trim();
      }
      return 'Authentication failed. Please check your credentials and try again.';
  }
}
