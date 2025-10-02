import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from './firebase';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { database } from './firebase';
import { ref, set, get } from 'firebase/database';
import { isAdmin as checkIsAdmin } from './adminConfig';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize or update user profile in database
  const initializeUserProfile = async (user) => {
    if (!user) return;

    const userRef = ref(database, `users/${user.uid}`);
    const snapshot = await get(userRef);

    if (!snapshot.exists()) {
      // Create new user profile
      await set(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Guest User',
        email: user.email || null,
        photoURL: user.photoURL || null,
        isAnonymous: user.isAnonymous,
        createdAt: Date.now(),
        stats: {
          makesOrMisses: {
            gamesPlayed: 0,
            totalPoints: 0,
            wins: 0,
            losses: 0
          },
          matchPlay: {
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            ties: 0
          },
          kingOfTheHill: {
            gamesPlayed: 0,
            highGameWins: 0,
            highTotalWins: 0
          },
          bracketPlay: {
            tournamentsPlayed: 0,
            championships: 0,
            runnerUps: 0
          }
        }
      });
    } else {
      // Update existing user info (in case display name or photo changed)
      const existingData = snapshot.val() || {};
      const updates = {
        displayName: user.displayName || existingData.displayName || 'Guest User',
        photoURL: user.photoURL || existingData.photoURL || null,
        email: user.email || existingData.email || null,
        lastLogin: Date.now()
      };
      await set(userRef, { ...existingData, ...updates });
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await initializeUserProfile(result.user);
      setIsGuest(false);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }

      await initializeUserProfile(result.user);
      setIsGuest(false);
      return result.user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await initializeUserProfile(result.user);
      setIsGuest(false);
      return result.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  // Continue as guest
  const continueAsGuest = async () => {
    try {
      const result = await signInAnonymously(auth);
      await initializeUserProfile(result.user);
      setIsGuest(true);
      return result.user;
    } catch (error) {
      console.error('Error signing in anonymously:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsGuest(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsGuest(user?.isAnonymous || false);
        setIsAdmin(checkIsAdmin(user));
        await initializeUserProfile(user);
        setLoading(false);
      } else {
        // Auto-sign in as guest if no user is logged in
        try {
          const result = await signInAnonymously(auth);
          setCurrentUser(result.user);
          setIsGuest(true);
          setIsAdmin(false);
          await initializeUserProfile(result.user);
        } catch (error) {
          console.error('Error auto-signing in as guest:', error);
        } finally {
          setLoading(false);
        }
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isGuest,
    isAdmin,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    continueAsGuest,
    signOut,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
