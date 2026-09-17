"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, UserRole } from "@/types";

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; user: AuthUser; dashboard: string }> = {
  helper: {
    email: "helper@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/helper/dashboard",
    user: {
      id: "usr_helper_01",
      fullName: "Priya Sharma",
      email: "helper@farmly.demo",
      mobile: "9876500001",
      role: "helper",
      district: "Anand",
      state: "Gujarat",
      preferredLanguage: "gu",
      organization: "Kheda District FPO Assistance Desk",
    },
  },
  farmer: {
    email: "farmer@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/dashboard",
    user: {
      id: "usr_farmer_01",
      fullName: "Ramesh Patel",
      email: "farmer@farmly.demo",
      mobile: "9876543210",
      role: "farmer",
      district: "Anand",
      state: "Gujarat",
      preferredLanguage: "gu",
      organization: "Kheda District Farmers Producer Co.",
    },
  },
  distributor: {
    email: "distributor@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/dashboard",
    user: {
      id: "usr_dist_01",
      fullName: "Kisan Logistics (Wholesale)",
      email: "distributor@farmly.demo",
      mobile: "9898012345",
      role: "distributor",
      district: "Vadodara",
      state: "Gujarat",
      preferredLanguage: "en",
      organization: "Western Agri-Logistics Network",
    },
  },
  retailer: {
    email: "retailer@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/dashboard",
    user: {
      id: "usr_ret_01",
      fullName: "Gramin Superstore",
      email: "retailer@farmly.demo",
      mobile: "9825098765",
      role: "retailer",
      district: "Ahmedabad",
      state: "Gujarat",
      preferredLanguage: "en",
      organization: "Gramin Retail Agri-Outlets",
    },
  },
};

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string, roleHint?: UserRole) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: AuthUser) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickDemoLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("farmly_session");
      if (saved) {
        setUser(JSON.parse(saved));
      }
    } catch {
      // Clear corrupt session
      localStorage.removeItem("farmly_session");
    }
  }, []);

  const login = async (
    identifier: string,
    password?: string,
    roleHint?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 400));

    const cleanId = identifier.trim().toLowerCase();

    // Check against demo accounts
    for (const [key, demo] of Object.entries(DEMO_CREDENTIALS)) {
      const matchEmail = demo.email.toLowerCase() === cleanId;
      const matchMobile = demo.user.mobile === cleanId;
      const matchRole = roleHint ? key === roleHint : true;

      if ((matchEmail || matchMobile) && matchRole) {
        if (password && password !== demo.pass) {
          return { success: false, error: "Invalid password. (For demo accounts, password is 'Farmly@123')" };
        }
        setUser(demo.user);
        localStorage.setItem("farmly_session", JSON.stringify(demo.user));
        router.push(demo.dashboard);
        return { success: true };
      }
    }

    // Dynamic mock login fallback
    const selectedRole: UserRole = roleHint || (cleanId.includes("helper") ? "helper" : "farmer");
    const dynamicUser: AuthUser = {
      id: `usr_${Date.now()}`,
      fullName: cleanId.includes("@") ? cleanId.split("@")[0] : `User ${cleanId.slice(-4)}`,
      email: cleanId.includes("@") ? cleanId : `${cleanId}@farmly.demo`,
      mobile: cleanId.includes("@") ? "9876543210" : cleanId,
      role: selectedRole,
      district: "Anand",
      state: "Gujarat",
      preferredLanguage: "en",
    };

    setUser(dynamicUser);
    localStorage.setItem("farmly_session", JSON.stringify(dynamicUser));
    const target = selectedRole === "helper" ? "/helper/dashboard" : "/dashboard";
    router.push(target);
    return { success: true };
  };

  const signup = async (userData: AuthUser): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 500));
    setUser(userData);
    localStorage.setItem("farmly_session", JSON.stringify(userData));

    const target = userData.role === "helper" ? "/helper/dashboard" : "/dashboard";
    router.push(target);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("farmly_session");
    router.push("/login");
  };

  const quickDemoLogin = (role: UserRole) => {
    const demo = DEMO_CREDENTIALS[role];
    if (demo) {
      setUser(demo.user);
      localStorage.setItem("farmly_session", JSON.stringify(demo.user));
      router.push(demo.dashboard);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: mounted ? user : null,
        role: user?.role || "farmer",
        isAuthenticated: Boolean(user),
        login,
        signup,
        logout,
        quickDemoLogin,
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
