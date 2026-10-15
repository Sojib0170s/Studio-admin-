import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, getBootstrapAdminEmails } from '../lib/firebase';
import { AdminUser } from '../types';

interface AuthContextType {
  user: User | null;
  adminUser: AdminUser | null;
  isLoading: boolean;
  isAdmin: boolean;
  authError: string | null;
  isConfigured: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  checkAdminPrivileges: (firebaseUser: User) => Promise<AdminUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const configured = isFirebaseConfigured();

  // Verification of admin status via zero-trust multi-tier evaluation
  const checkAdminPrivileges = useCallback(async (firebaseUser: User): Promise<AdminUser | null> => {
    try {
      // 1. Check Firebase Custom Claims (the gold standard for Firebase RBAC)
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const claims = tokenResult.claims;

      if (claims.admin === true || claims.role === 'admin') {
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
          photoURL: firebaseUser.photoURL || undefined,
          isAdmin: true,
          adminSource: 'custom_claim',
        };
      }

      // 2. Check server-provisioned document in /admins/{uid}
      if (db) {
        try {
          const adminDocRef = doc(db, 'admins', firebaseUser.uid);
          const adminDocSnap = await getDoc(adminDocRef);
          if (adminDocSnap.exists()) {
            return {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Admin',
              photoURL: firebaseUser.photoURL || undefined,
              isAdmin: true,
              adminSource: 'firestore_doc',
            };
          }
        } catch (docErr) {
          // Document query failed (e.g., permission-denied if user is not in admins collection)
          // Continues to check allowlist
        }
      }

      // 3. Check trusted server-managed allowlist from environment
      const userEmail = (firebaseUser.email || '').toLowerCase().trim();
      const allowlist = getBootstrapAdminEmails();

      if (userEmail && allowlist.includes(userEmail)) {
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || userEmail.split('@')[0],
          photoURL: firebaseUser.photoURL || undefined,
          isAdmin: true,
          adminSource: 'trusted_allowlist',
        };
      }

      // If neither custom claim, admin document, nor allowlist matched, user is an ordinary authenticated user
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        isAdmin: false,
        adminSource: 'trusted_allowlist',
      };
    } catch (err: any) {
      console.error('Error verifying admin privileges:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (!configured || !auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const verifiedAdmin = await checkAdminPrivileges(currentUser);
        setAdminUser(verifiedAdmin);
      } else {
        setAdminUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [configured, checkAdminPrivileges]);

  const loginWithGoogle = async () => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please configure Firebase credentials.');
    }
    setAuthError(null);
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const verifiedAdmin = await checkAdminPrivileges(result.user);
      setAdminUser(verifiedAdmin);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const message = err.code === 'auth/popup-closed-by-user'
        ? 'Sign-in popup was closed before completion.'
        : err.code === 'auth/unauthorized-domain'
        ? 'Domain unauthorized. Add this app host to Firebase Auth Authorized Domains.'
        : err.message || 'Failed to sign in with Google.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please configure Firebase credentials.');
    }
    setAuthError(null);
    setIsLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const verifiedAdmin = await checkAdminPrivileges(cred.user);
      setAdminUser(verifiedAdmin);
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      let message = 'Failed to sign in with email and password.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Access temporarily disabled due to many failed login attempts. Try again later.';
      } else if (err.message) {
        message = err.message;
      }
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string) => {
    if (!auth) {
      throw new Error('Firebase Auth is not initialized. Please configure Firebase credentials.');
    }
    setAuthError(null);
    setIsLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const verifiedAdmin = await checkAdminPrivileges(cred.user);
      setAdminUser(verifiedAdmin);
    } catch (err: any) {
      console.error('Registration Error:', err);
      let message = err.message || 'Failed to create account.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setUser(null);
      setAdminUser(null);
      setAuthError(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setAuthError(err.message || 'Failed to log out.');
    }
  };

  const clearError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        isLoading,
        isAdmin: adminUser?.isAdmin === true,
        authError,
        isConfigured: configured,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
        clearError,
        checkAdminPrivileges,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
