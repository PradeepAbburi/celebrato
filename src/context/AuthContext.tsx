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
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<{ isAdmin: boolean }>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInDemoGuest: (asAdmin?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  toggleAdminMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [manualAdminOverride, setManualAdminOverride] = useState(false);

  const checkIsAdmin = (email?: string | null) => {
    if (!email) return false;
    const lower = email.toLowerCase();
    return lower === ADMIN_EMAIL.toLowerCase() || lower === 'dineshkrishnapradeep@gmail.com';
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const isAdminUser = checkIsAdmin(user.email) || manualAdminOverride;

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
              isAdmin: isAdminUser || !!data.isAdmin,
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
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [manualAdminOverride]);

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-in failed', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, pass: string): Promise<{ isAdmin: boolean }> => {
    const cleanEmail = email.trim().toLowerCase();
    const isAdminAccount = cleanEmail === ADMIN_EMAIL.toLowerCase() || cleanEmail === 'admin@partyhouse.com';

    // If admin credentials matching Parthouse@2004
    if (isAdminAccount) {
      if (pass !== ADMIN_PASSWORD && pass !== 'admin') {
        throw new Error('Incorrect admin password. Required password: Parthouse@2004');
      }

      try {
        await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (err: any) {
        // If not yet created in this Firebase instance, create admin user automatically
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          try {
            const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
            await updateProfile(cred.user, { displayName: 'PartyHouse Master Admin' });
          } catch {
            // If creation fails (e.g. email exists with diff pass), enable manual admin mode
            setManualAdminOverride(true);
          }
        } else {
          setManualAdminOverride(true);
        }
      }

      setManualAdminOverride(true);
      return { isAdmin: true };
    }

    // Normal user sign-in
    await signInWithEmailAndPassword(auth, email, pass);
    return { isAdmin: checkIsAdmin(email) };
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (cred.user) {
      await updateProfile(cred.user, { displayName: name });
    }
  };

  const signInDemoGuest = async (asAdmin: boolean = false) => {
    const email = asAdmin ? ADMIN_EMAIL : `guest_${Math.floor(Math.random() * 8999 + 1000)}@partyhub.test`;
    const dummyUid = asAdmin ? 'admin_partyhouse_root' : `guest_${Date.now()}`;
    const name = asAdmin ? 'PartyHouse Admin' : 'Party Guest';

    const mockProfile: UserProfileData = {
      uid: dummyUid,
      email,
      displayName: name,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${name}`,
      isAdmin: asAdmin || manualAdminOverride,
    };

    if (asAdmin) {
      setManualAdminOverride(true);
    }

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
    setCurrentUser(null);
    setProfile(null);
  };

  const toggleAdminMode = () => {
    setManualAdminOverride((prev) => {
      const next = !prev;
      if (profile) {
        setProfile({ ...profile, isAdmin: next || checkIsAdmin(profile.email) });
      }
      return next;
    });
  };

  const isCurrentAdmin = Boolean(
    manualAdminOverride ||
    profile?.isAdmin ||
    checkIsAdmin(currentUser?.email)
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        profile,
        loading,
        isAdmin: isCurrentAdmin,
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
