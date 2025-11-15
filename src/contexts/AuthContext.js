import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  const signUp = async (email, password, initialBalance = 0) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        createdAt: new Date().toISOString(),
        initialBalance: parseFloat(initialBalance),
        currentBalance: parseFloat(initialBalance)
      });
      
      console.log('Account created successfully!');
      return userCredential;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signIn = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Signed in successfully!');
      return userCredential;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      // Removed toast notification to prevent persistent popup
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const getUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  const updateUserBalance = async (newBalance) => {
    if (!currentUser) {
      console.error('Cannot update balance: no current user');
      return { success: false, error: 'No current user' };
    }

    try {
      console.log('Updating user balance to:', newBalance);
      const updatedProfile = {
        ...userProfile,
        currentBalance: parseFloat(newBalance),
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(doc(db, 'users', currentUser.uid), updatedProfile, { merge: true });
      
      // Update local state immediately
      setUserProfile(updatedProfile);
      console.log('Balance updated successfully to:', newBalance);
      
      return { success: true };
    } catch (error) {
      console.error('Error updating balance:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('Fetching user profile for:', user.uid);
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            console.log('User profile loaded:', userDoc.data());
            setUserProfile(userDoc.data());
          } else {
            console.log('No user profile found, creating default');
            setUserProfile({
              email: user.email,
              currentBalance: 0,
              initialBalance: 0
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Set a default profile even if there's an error
          setUserProfile({
            email: user.email,
            currentBalance: 0,
            initialBalance: 0
          });
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false');
      setLoading(false);
    }, 5000);

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const value = {
    currentUser,
    userProfile,
    signUp,
    signIn,
    logout,
    getUserData,
    updateUserBalance,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};