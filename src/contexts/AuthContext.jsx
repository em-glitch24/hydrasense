// src/contexts/AuthContext.jsx - UPDATED WITH ADMIN SUPPORT
import React, { createContext, useContext, useState, useEffect } from "react";
// REMOVED: import { useNavigate } from "react-router-dom"; - Cannot use Router hooks in Context
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

// Create context with default value
const AuthContext = createContext({
  currentUser: null,
  userData: null,
  isAdmin: false,
  signup: async () => {},
  login: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  updateUserEmail: async () => {},
  updateUserPassword: async () => {},
});

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

// ===== IMPROVED: Generate unique 4-digit PIN using helper collection =====
async function generateUniquePin() {
  const maxAttempts = 100;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Generate random 4-digit PIN (1000-9999)
    const pin = Math.floor(1000 + Math.random() * 9000).toString();

    console.log(`🔢 Generated PIN candidate: ${pin} (Attempt ${attempt + 1})`);

    // Check if PIN exists in helper collection
    const pinDocRef = doc(db, "devicePins", pin);
    const pinDoc = await getDoc(pinDocRef);

    if (!pinDoc.exists()) {
      // PIN is unique! Reserve it
      await setDoc(pinDocRef, {
        reserved: true,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ PIN ${pin} is unique and reserved!`);
      return pin;
    }

    console.log(`⚠️ PIN ${pin} already exists, retrying...`);
  }

  console.error("❌ Failed to generate unique PIN after 100 attempts");
  throw new Error("Could not generate unique PIN. Please try again.");
}

// Auth Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name, deviceId) {
    try {
      console.log("🚀 Starting signup process...");

      // Create Firebase Auth user first
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      console.log("✅ Firebase Auth user created:", user.uid);

      // Generate unique 4-digit PIN
      const devicePin = await generateUniquePin();
      console.log(`🔑 Generated PIN for user: ${devicePin}`);

      // Create user document in Firestore with PIN
      await setDoc(doc(db, "users", user.uid), {
        email,
        name,
        deviceId,
        devicePin,
        emergencyContact: "",
        isAdmin: false,
        disabled: false,
        createdAt: new Date().toISOString(),
      });
      console.log("✅ User document created in Firestore");

      // Check if device document exists
      const deviceRef = doc(db, "devices", deviceId);
      const deviceDoc = await getDoc(deviceRef);

      if (!deviceDoc.exists()) {
        // Device doesn't exist, create it
        await setDoc(deviceRef, {
          deviceId: deviceId,
          userId: user.uid,
          lastUserId: user.uid,
          lastUserName: name,
          pairedAt: new Date().toISOString(),
          lastSeen: Date.now(),
          wifiConnected: false,
        });
        console.log("✅ Device document created:", deviceId);
      } else {
        // Device exists, update last user info
        await updateDoc(deviceRef, {
          lastUserId: user.uid,
          lastUserName: name,
          lastSeen: Date.now(),
        });
        console.log("✅ Device document updated with new user:", deviceId);
      }

      console.log("✅ PIN assigned:", devicePin);
      console.log("🎉 Signup completed successfully!");

      return user;
    } catch (error) {
      console.error("❌ Signup error:", error);

      // Provide user-friendly error messages
      if (error.code === "auth/email-already-in-use") {
        throw new Error("Email already in use. Please use a different email.");
      } else if (error.code === "auth/weak-password") {
        throw new Error(
          "Password is too weak. Please use a stronger password.",
        );
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address.");
      }

      throw error;
    }
  }

  async function login(email, password) {
    try {
      console.log("🔐 Attempting login...");
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Check if user is disabled
      const userDoc = await getDoc(doc(db, "users", result.user.uid));
      if (userDoc.exists() && userDoc.data().disabled === true) {
        await signOut(auth);
        throw new Error(
          "Account has been disabled. Please contact administrator.",
        );
      }

      console.log("✅ Login successful:", result.user.uid);
      return result;
    } catch (error) {
      console.error("❌ Login error:", error);

      if (error.code === "auth/user-not-found") {
        throw new Error("No account found with this email.");
      } else if (error.code === "auth/wrong-password") {
        throw new Error("Incorrect password.");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address.");
      }

      throw error;
    }
  }

  // Logout function - navigation handled by component
  async function logout() {
    try {
      console.log("👋 Logging out...");
      await signOut(auth);
      console.log("✅ Logout successful");
      return true;
    } catch (error) {
      console.error("❌ Logout error:", error);
      throw error;
    }
  }

  // Update user profile (name, emergency contact)
  async function updateUserProfile(updates) {
    if (!currentUser) throw new Error("No user logged in");

    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updates);

      // Update local state
      setUserData((prev) => ({ ...prev, ...updates }));

      console.log("✅ Profile updated:", updates);
      return true;
    } catch (error) {
      console.error("❌ Error updating profile:", error);
      throw error;
    }
  }

  // Update user email (requires re-authentication)
  async function updateUserEmail(newEmail, currentPassword) {
    if (!currentUser) throw new Error("No user logged in");

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update email in Firebase Auth
      await updateEmail(currentUser, newEmail);

      // Update email in Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, { email: newEmail });

      // Update local state
      setUserData((prev) => ({ ...prev, email: newEmail }));

      console.log("✅ Email updated successfully");
      return true;
    } catch (error) {
      console.error("❌ Error updating email:", error);

      if (error.code === "auth/wrong-password") {
        throw new Error("Current password is incorrect");
      } else if (error.code === "auth/email-already-in-use") {
        throw new Error("This email is already in use");
      } else if (error.code === "auth/invalid-email") {
        throw new Error("Invalid email address");
      }

      throw error;
    }
  }

  // Update user password (requires re-authentication)
  async function updateUserPassword(currentPassword, newPassword) {
    if (!currentUser) throw new Error("No user logged in");

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword,
      );
      await reauthenticateWithCredential(currentUser, credential);

      // Update password
      await updatePassword(currentUser, newPassword);

      console.log("✅ Password updated successfully");
      return true;
    } catch (error) {
      console.error("❌ Error updating password:", error);

      if (error.code === "auth/wrong-password") {
        throw new Error("Current password is incorrect");
      } else if (error.code === "auth/weak-password") {
        throw new Error("New password is too weak");
      }

      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setIsAdmin(data.isAdmin === true);
            console.log("✅ User data loaded:", {
              name: data.name,
              email: data.email,
              deviceId: data.deviceId,
              hasPin: !!data.devicePin,
              isAdmin: data.isAdmin === true,
              dailyWaterGoal: userDoc.data().dailyWaterGoal || 2500, // Default 2500ml
            });
          } else {
            console.warn("⚠️ User document not found in Firestore");
          }
        } catch (error) {
          console.error("❌ Error loading user data:", error);
        }
      } else {
        setUserData(null);
        setIsAdmin(false);
        console.log("👤 No user logged in");
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    isAdmin,
    signup,
    login,
    logout,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
