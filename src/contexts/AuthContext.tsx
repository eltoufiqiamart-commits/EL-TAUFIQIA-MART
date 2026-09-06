"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  role: "customer" | "seller" | "admin";
  avatarUrl: string | null;
}

interface SellerProfile {
  id: string;
  storeName: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  sellerProfile: SellerProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSellerProfile(data.sellerProfile || null);
      } else {
        setUser(null);
        setSellerProfile(null);
      }
    } catch {
      setUser(null);
      setSellerProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "خطأ في الاتصال" };
    }
  };

  const register = async (email: string, password: string, fullName: string, phone?: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, phone }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch {
      return { success: false, error: "خطأ في الاتصال" };
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setSellerProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, sellerProfile, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
