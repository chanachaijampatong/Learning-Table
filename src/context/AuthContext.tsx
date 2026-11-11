"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  doc, 
  getDoc, 
  setDoc 
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";
import { UserProfile, UserRole } from "@/types/database";

// Predefined Demo Accounts
export const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@learningtable.ac.th",
    password: "Password123!",
    role: "ADMIN" as UserRole,
    displayName: "ฝ่ายวิชาการ (Admin)",
    description: "สิทธิ์เต็ม 100%: จัดการข้อมูล, สั่งรัน AI, สลับคาบเรียน, พิมพ์แบบฟอร์ม A4",
  },
  teacher: {
    email: "teacher@learningtable.ac.th",
    password: "Password123!",
    role: "TEACHER" as UserRole,
    displayName: "อ.ปริญญา ชัยชนะ",
    linkedTeacherId: "TCH_PARINYA",
    description: "สิทธิ์ครูผู้สอน: ดูเฉพาะตารางสอนตนเอง, พิมพ์ตารางราชการ A4 แนวนอน",
  },
  student: {
    email: "student@learningtable.ac.th",
    password: "Password123!",
    role: "STUDENT" as UserRole,
    displayName: "นักศึกษา (กลุ่ม สปT.1/2)",
    linkedGroupId: "GRP_IT_1_2",
    description: "สิทธิ์นักศึกษา: ดูเฉพาะตารางเรียนประจำห้องตนเอง (ซ่อนเมนูแอดมิน)",
  },
};

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  role: UserRole;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerWithEmail: (
    email: string, 
    pass: string, 
    displayName: string, 
    role: UserRole,
    linkedId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  quickDemoLogin: (accountKey: "admin" | "teacher" | "student") => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<UserRole>("ADMIN");
  const [loading, setLoading] = useState(true);

  // Sync profile & local role
  useEffect(() => {
    // Check localStorage for quick role fallback
    const savedRole = localStorage.getItem("learning_table_role") as UserRole;
    if (savedRole) setRole(savedRole);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const profile = snap.data() as UserProfile;
            setUserProfile(profile);
            setRole(profile.role);
            localStorage.setItem("learning_table_role", profile.role);
          } else {
            // Default profile if not in Firestore
            const fallback: UserProfile = {
              id: user.uid,
              email: user.email || "",
              displayName: user.displayName || user.email?.split("@")[0] || "User",
              role: savedRole || "ADMIN",
              isActive: true,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            setUserProfile(fallback);
          }
        } catch (e) {
          console.warn("Firestore user fetch skipped:", e);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Standard Login
  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      if (snap.exists()) {
        const prof = snap.data() as UserProfile;
        setUserProfile(prof);
        setRole(prof.role);
        localStorage.setItem("learning_table_role", prof.role);
      }
      window.dispatchEvent(new Event("roleChanged"));
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }
  };

  // Register
  const registerWithEmail = async (
    email: string, 
    pass: string, 
    displayName: string, 
    userRole: UserRole,
    linkedId?: string
  ) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        id: cred.user.uid,
        email,
        displayName,
        role: userRole,
        linkedTeacherId: userRole === "TEACHER" ? linkedId : undefined,
        linkedGroupId: userRole === "STUDENT" ? linkedId : undefined,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await setDoc(doc(db, "users", cred.user.uid), profile);
      setUserProfile(profile);
      setRole(userRole);
      localStorage.setItem("learning_table_role", userRole);
      window.dispatchEvent(new Event("roleChanged"));
      return { success: true };
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || "เกิดข้อผิดพลาดในการลงทะเบียน" };
    }
  };

  // 1-Click Quick Demo Login
  const quickDemoLogin = async (accountKey: "admin" | "teacher" | "student") => {
    const acc = DEMO_ACCOUNTS[accountKey];
    setRole(acc.role);
    localStorage.setItem("learning_table_role", acc.role);

    // Mock local profile for instant testing without network blocks
    setUserProfile({
      id: `DEMO_${accountKey.toUpperCase()}`,
      email: acc.email,
      displayName: acc.displayName,
      role: acc.role,
      linkedTeacherId: "linkedTeacherId" in acc ? (acc as any).linkedTeacherId : undefined,
      linkedGroupId: "linkedGroupId" in acc ? (acc as any).linkedGroupId : undefined,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    window.dispatchEvent(new Event("roleChanged"));
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn("Sign out fallback:", err);
    }
    setCurrentUser(null);
    setUserProfile(null);
    setRole("STUDENT"); // Reset to lowest role
    localStorage.removeItem("learning_table_role");
    window.dispatchEvent(new Event("roleChanged"));
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        role,
        loading,
        loginWithEmail,
        registerWithEmail,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
