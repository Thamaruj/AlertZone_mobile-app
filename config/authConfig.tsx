import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import NetInfo from '@react-native-community/netinfo';

// ── Types ──
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  address?: string;
  province?: string;
  district?: string;
  localGovernmentArea?: string;
  nic?: string;
  role: 'citizen' | 'admin';
  status: 'active' | 'suspended';
  isVerified: boolean;
  avatarUrl?: string;
  contributionPoints?: number;
  reportsValidated?: number;
  notificationSound?: boolean;
  alertRadius?: string;
  createdAt: string;
  level:number;
  homeLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

interface AuthContextType {
  user: User | null;               // Firebase Auth user
  profile: UserProfile | null;     // Firestore profile data
  loading: boolean;                // true while checking auth state
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);  // start true — checking auth

  // Fetch Firestore profile for a given uid
  const fetchProfile = async (uid: string) => {
    try {
      // 1. Check network connection first
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        console.warn('⚠️ Device is offline. Skipping Firestore profile fetch.');
        return;
      }

      // 2. Race the document fetch against a generous 8-second timeout
      const getDocPromise = getDoc(doc(db, 'users', uid));
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Firestore profile fetch timeout')), 8000)
      );

      const snap = await Promise.race([getDocPromise, timeoutPromise]);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        console.warn('⚠️ No user document found in Firestore for uid:', uid);
      }
    } catch (e) {
      const netState = await NetInfo.fetch().catch(() => ({ isConnected: true }));
      if (!netState.isConnected) {
        console.warn('⚠️ profile fetch aborted: device is offline.');
      } else {
        console.error('❌ fetchProfile error or timeout:', e);
      }
    }
  };

  // Re-fetch profile (call this after editing profile)
  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }

      setLoading(false); // done checking
    });

    return unsubscribe; // cleanup on unmount
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use anywhere in the app
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}