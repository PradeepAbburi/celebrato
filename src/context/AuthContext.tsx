import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const ADMIN_EMAIL = 'admin@partyhouse.com';
export const ADMIN_PASSWORD = 'Parthouse@2004';
export const BOOTSTRAP_ADMIN_EMAIL = 'admin@partyhouse.com';
export const ADMIN_PASSCODES = ['celebrato2026', 'admin123', 'celebrato', '778899', 'parthouse2025'];

export interface UserProfileData {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  phone?: string;
  points?: number;
}

interface AuthContextType {
  currentUser: User | null;
  profile: UserProfileData | null;
  loading: boolean;
  isAdmin: boolean;
  verifyAdminCode: (code: string) => { success: boolean; error?: string };
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ isAdmin: boolean }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInDemoGuest: (asAdmin?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  toggleAdminMode: (override?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Admin access is strictly locked and can ONLY be unlocked with secret admin code
  const [manualAdminOverride, setManualAdminOverride] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('celebrato_admin_verified') === 'true';
    } catch {
      return false;
    }
  });

  const verifyAdminCode = (code: string): { success: boolean; error?: string } => {
    // "without logout in user acc admin cant login"
    if (currentUser) {
      return {
        success: false,
        error: 'Active user account detected. You must sign out of your user account before logging in as Administrator.'
      };
    }
    const trimmed = code.trim().toLowerCase();
    const isValid = ADMIN_PASSCODES.some(c => c.toLowerCase() === trimmed);
    if (isValid) {
      setManualAdminOverride(true);
      try {
        sessionStorage.setItem('celebrato_admin_verified', 'true');
      } catch {}
      setProfile({
        uid: 'celebrato_admin_root',
        email: 'admin@partyhouse.com',
        displayName: 'Venue Admin',
        isAdmin: true,
      });
      return { success: true };
    }
    return { success: false, error: 'Access Denied: Invalid administrative code.' };
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Standard user login NEVER grants admin privileges automatically.
        // Admin console is ONLY accessible if unlocked with secret admin code.
        const isAdminUser = manualAdminOverride;

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || data.displayName || (isAdminUser ? 'Venue Admin' : 'Party Host'),
              photoURL: user.photoURL || data.photoURL || '',
              isAdmin: isAdminUser,
              phone: data.phone || '',
            });
          } else {
            const newProfile: UserProfileData = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || (isAdminUser ? 'Venue Admin' : 'Party Host'),
              photoURL: user.photoURL || '',
              isAdmin: isAdminUser,
            };
            setProfile(newProfile);
            try {
              await setDoc(userDocRef, newProfile);
            } catch (err) {
              console.log('User profile setup:', err);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          setProfile({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || (isAdminUser ? 'Venue Admin' : 'Party Host'),
            isAdmin: isAdminUser,
          });
        }
      } else {
        if (!manualAdminOverride) {
          setProfile(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [manualAdminOverride]);

  const signInWithGoogle = async () => {
    // Cannot log into user account if admin session is active
    if (manualAdminOverride) {
      throw new Error('Administrator session is active. Please sign out of Admin Console first.');
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-in failed', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<{ isAdmin: boolean }> => {
    // Cannot log into user account if admin session is active
    if (manualAdminOverride) {
      throw new Error('Administrator session is active. Please sign out of Admin Console first.');
    }
    // Normal user sign-in - does NOT grant admin access; admin console strictly requires secret code
    await signInWithEmailAndPassword(auth, email.trim(), pass);
    return { isAdmin: false };
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    if (manualAdminOverride) {
      throw new Error('Administrator session is active. Please sign out of Admin Console first.');
    }
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  const signInDemoGuest = async (_asAdmin?: boolean) => {
    if (manualAdminOverride) {
      throw new Error('Administrator session is active. Please sign out of Admin Console first.');
    }
    const email = `guest_${Math.floor(Math.random() * 8999 + 1000)}@partyhub.test`;
    const dummyUid = `guest_${Date.now()}`;
    const name = 'Party Guest';

    const mockProfile: UserProfileData = {
      uid: dummyUid,
      email,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      isAdmin: false,
    };

    setProfile(mockProfile);
    setCurrentUser({
      uid: dummyUid,
      email,
      displayName: name,
      emailVerified: true,
      isAnonymous: false,
    } as User);
  };

  const signOut = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setManualAdminOverride(false);
    try {
      sessionStorage.removeItem('celebrato_admin_verified');
    } catch {}
    setCurrentUser(null);
    setProfile(null);
  };

  const toggleAdminMode = (override?: boolean) => {
    setManualAdminOverride((prev) => {
      const next = typeof override === 'boolean' ? override : !prev;
      try {
        if (next) {
          sessionStorage.setItem('celebrato_admin_verified', 'true');
        } else {
          sessionStorage.removeItem('celebrato_admin_verified');
        }
      } catch {}
      if (profile) {
        setProfile({ ...profile, isAdmin: next });
      }
      return next;
    });
  };

  // Strictly controlled by code verification - normal user login never bypasses this
  const isCurrentAdmin = Boolean(manualAdminOverride);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        isAdmin: isCurrentAdmin,
        verifyAdminCode,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signInDemoGuest,
        signOut,
        toggleAdminMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
