// src/context/AuthContext.jsx
import React, { useContext, useState, useEffect, createContext } from 'react';
import { auth } from '../firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, // <-- Import this
  signOut 
} from 'firebase/auth';

const ADMIN_EMAIL = "admin@gmail.com"; 

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // For Admin Login
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // --- NEW: For Student Login ---
  async function loginWithRollNumber(rollNumber) {
    // We create a "fake" email address for the student using their roll number.
    // This allows us to store them in Firebase Auth just like a regular user.
    const studentEmail = `${rollNumber}@student.portal`;
    
    try {
      // 1. First, try to sign in the user. This will work if they have logged in before.
      return await signInWithEmailAndPassword(auth, studentEmail, rollNumber);
    } catch (error) {
      // 2. If sign-in fails with "user-not-found", it means this is their first time logging in.
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          // 3. Create a new account for them automatically.
          // The roll number is used as both the email part and the password.
          return await createUserWithEmailAndPassword(auth, studentEmail, rollNumber);
        } catch (creationError) {
          // Handle potential errors during account creation (e.g., network issues)
          console.error("Failed to create student account:", creationError);
          throw new Error("Could not create student account. Please try again.");
        }
      } else {
        // Handle other sign-in errors (e.g., wrong password, though unlikely here)
        console.error("Student sign-in error:", error);
        throw new Error("An error occurred during sign-in.");
      }
    }
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (user) {
        setUserRole(user.email === ADMIN_EMAIL ? 'admin' : 'user');
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    login,
    loginWithRollNumber, // <-- Expose the new function
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}