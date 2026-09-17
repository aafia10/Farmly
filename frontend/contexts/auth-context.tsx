"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, UserRole } from "@/types";

export const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string; user: AuthUser; dashboard: string }> = {
  farmer: {
    email: "farmer@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/dashboard",
    user: {
      id: "FMR-MH-000421",
      fullName: "Ramesh Patil",
      email: "farmer@farmly.demo",
      mobile: "9876543210",
      role: "farmer",
      district: "Nashik",
      state: "Maharashtra",
      preferredLanguage: "mr",
      organization: "Sahyadri Farmers Producer Co-op",
    },
  },
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
      district: "Nashik",
      state: "Maharashtra",
      preferredLanguage: "mr",
      organization: "Sinnar FPO Field Assistance Desk",
    },
  },
  distributor: {
    email: "distributor@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/dashboard",
    user: {
      id: "usr_dist_01",
      fullName: "GreenHarvest Distributors",
      email: "distributor@farmly.demo",
      mobile: "9898012345",
      role: "distributor",
      district: "Nashik",
      state: "Maharashtra",
      preferredLanguage: "en",
      organization: "GreenHarvest Wholesale Logistics",
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
      district: "Mumbai",
      state: "Maharashtra",
      preferredLanguage: "en",
      organization: "Gramin Retail Agri-Outlets",
    },
  },
  fpo: {
    email: "fpo@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/fpo/dashboard",
    user: {
      id: "usr_fpo_01",
      fullName: "Sahyadri Farmers Producer Co-op",
      email: "fpo@farmly.demo",
      mobile: "9822011223",
      role: "fpo",
      district: "Nashik",
      state: "Maharashtra",
      preferredLanguage: "mr",
      organization: "Sahyadri Agro Federation",
    },
  },
  collection_center: {
    email: "collection@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/collection/dashboard",
    user: {
      id: "usr_coll_01",
      fullName: "Sinnar Mandi Collection Center",
      email: "collection@farmly.demo",
      mobile: "9850022334",
      role: "collection_center",
      district: "Nashik",
      state: "Maharashtra",
      preferredLanguage: "mr",
      organization: "Nashik APMC Aggregation Hub",
    },
  },
  quality_assessor: {
    email: "quality@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/quality/dashboard",
    user: {
      id: "usr_qa_01",
      fullName: "Suresh Deshmukh (FPO Assessor)",
      email: "quality@farmly.demo",
      mobile: "9860033445",
      role: "quality_assessor",
      district: "Nashik",
      state: "Maharashtra",
      preferredLanguage: "mr",
      organization: "Maharashtra Quality Certification Bureau",
    },
  },
  admin: {
    email: "admin@farmly.demo",
    pass: "Farmly@123",
    dashboard: "/admin/dashboard",
    user: {
      id: "usr_admin_01",
      fullName: "KisanSetu Platform Auditor",
      email: "admin@farmly.demo",
      mobile: "9890099887",
      role: "admin",
      district: "Pune",
      state: "Maharashtra",
      preferredLanguage: "en",
      organization: "Farmly National Audit Committee",
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
      } else {
        // Default to canonical Ramesh Patil
        setUser(DEMO_CREDENTIALS.farmer.user);
      }
    } catch {
      localStorage.removeItem("farmly_session");
    }
  }, []);

  const login = async (
    identifier: string,
    password?: string,
    roleHint?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 300));

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
      id: `FMR-${Date.now().toString().slice(-6)}`,
      fullName: cleanId.includes("@") ? cleanId.split("@")[0] : `User ${cleanId.slice(-4)}`,
      email: cleanId.includes("@") ? cleanId : `${cleanId}@farmly.demo`,
      mobile: cleanId.includes("@") ? "9876543210" : cleanId,
      role: selectedRole,
      district: "Nashik",
      state: "Maharashtra",
      preferredLanguage: "mr",
    };

    setUser(dynamicUser);
    localStorage.setItem("farmly_session", JSON.stringify(dynamicUser));
    const target = DEMO_CREDENTIALS[selectedRole]?.dashboard || "/dashboard";
    router.push(target);
    return { success: true };
  };

  const signup = async (userData: AuthUser): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 400));
    setUser(userData);
    localStorage.setItem("farmly_session", JSON.stringify(userData));

    const target = DEMO_CREDENTIALS[userData.role]?.dashboard || "/dashboard";
    router.push(target);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("farmly_session");
    router.push("/login");
  };

  const quickDemoLogin = (roleToSelect: UserRole) => {
    const demo = DEMO_CREDENTIALS[roleToSelect];
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
