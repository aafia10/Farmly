"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthUser, UserRole } from "@/types";
import { supabase } from "@/lib/supabase";
import { backendClient } from "@/lib/api/backendClient";

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
  signup: (userData: AuthUser, password?: string) => Promise<{ success: boolean; error?: string }>;
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
        localStorage.setItem("farmly_token", "demo_farmer");
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
    const cleanId = identifier.trim().toLowerCase();

    // 1. Attempt Backend API Login
    try {
      const res = await backendClient.login({
        email: cleanId,
        password: password || undefined,
        role: roleHint,
      });

      if (res && res.token && res.user) {
        localStorage.setItem("farmly_token", res.token);
        setUser(res.user);
        localStorage.setItem("farmly_session", JSON.stringify(res.user));
        const userRole = (res.user.role || "farmer") as UserRole;
        const target = DEMO_CREDENTIALS[userRole]?.dashboard || "/dashboard";
        router.push(target);
        return { success: true };
      }
    } catch (apiErr: any) {
      console.warn("Backend auth login notice:", apiErr?.message);
    }

    // 2. Direct Supabase Auth (for registered real users if backend is bypassed)
    if (password) {
      try {
        const { data: supaAuth, error: supaErr } = await supabase.auth.signInWithPassword({
          email: cleanId,
          password,
        });

        if (supaAuth?.session && supaAuth.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .or(`user_id.eq.${supaAuth.user.id},id.eq.${supaAuth.user.id},email.eq.${cleanId}`)
            .maybeSingle();

          const realRole = (profile?.user_type || profile?.role || supaAuth.user.user_metadata?.role || roleHint || "farmer") as UserRole;
          const realUser: AuthUser = {
            id: profile?.id || supaAuth.user.id,
            fullName: profile?.full_name || supaAuth.user.user_metadata?.full_name || cleanId.split("@")[0],
            email: profile?.email || cleanId,
            mobile: profile?.phone || supaAuth.user.user_metadata?.mobile || "",
            role: realRole,
            state: profile?.state || "Maharashtra",
            district: profile?.district || "Nashik",
            preferredLanguage: profile?.preferred_language || "mr",
            organization: profile?.organization || "",
          };

          localStorage.setItem("farmly_token", supaAuth.session.access_token);
          setUser(realUser);
          localStorage.setItem("farmly_session", JSON.stringify(realUser));
          const target = DEMO_CREDENTIALS[realRole]?.dashboard || "/dashboard";
          router.push(target);
          return { success: true };
        }
      } catch (directAuthErr: any) {
        console.warn("Direct Supabase login attempt notice:", directAuthErr?.message);
      }
    }

    // 3. Check against demo accounts
    for (const [key, demo] of Object.entries(DEMO_CREDENTIALS)) {
      const matchEmail = demo.email.toLowerCase() === cleanId;
      const matchMobile = demo.user.mobile === cleanId;
      const matchRole = roleHint ? key === roleHint : false;

      if (matchEmail || matchMobile || (matchRole && !password)) {
        if (password && password !== demo.pass) {
          return { success: false, error: "Invalid password. (For demo accounts, password is 'Farmly@123')" };
        }

        // Attempt direct Supabase Auth login
        try {
          const { data } = await supabase.auth.signInWithPassword({
            email: demo.email,
            password: password || demo.pass,
          });
          if (data?.session?.access_token) {
            localStorage.setItem("farmly_token", data.session.access_token);
          } else {
            localStorage.setItem("farmly_token", `demo_${key}`);
          }
        } catch {
          localStorage.setItem("farmly_token", `demo_${key}`);
        }

        setUser(demo.user);
        localStorage.setItem("farmly_session", JSON.stringify(demo.user));
        router.push(demo.dashboard);
        return { success: true };
      }
    }

    // 4. Dynamic mock login fallback
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

    localStorage.setItem("farmly_token", `demo_${selectedRole}`);
    setUser(dynamicUser);
    localStorage.setItem("farmly_session", JSON.stringify(dynamicUser));
    const target = DEMO_CREDENTIALS[selectedRole]?.dashboard || "/dashboard";
    router.push(target);
    return { success: true };
  };

  const signup = async (userData: AuthUser, password?: string): Promise<{ success: boolean; error?: string }> => {
    let authCreated = false;
    let registeredToken: string | null = null;
    let registeredUser: AuthUser = userData;
    let lastError: string | null = null;

    // 1. Primary: Register via Express Backend REST API
    try {
      const res = await backendClient.signup({
        email: userData.email,
        password: password || "Farmly@123",
        fullName: userData.fullName,
        mobile: userData.mobile,
        role: userData.role,
        state: userData.state,
        district: userData.district,
        preferredLanguage: userData.preferredLanguage,
        organization: userData.organization,
      });

      if (res && res.token) {
        registeredToken = res.token;
        if (res.user) {
          registeredUser = { ...userData, ...res.user };
        }
        authCreated = true;
      }
    } catch (apiErr: any) {
      console.warn("Backend signup API notice:", apiErr?.message);
      lastError = apiErr?.message || "Backend registration error";
    }

    // 2. Direct Supabase Auth Fallback (if backend endpoint was unreachable from browser)
    if (!authCreated && password) {
      try {
        const { data: supaAuth, error: supaErr } = await supabase.auth.signUp({
          email: userData.email,
          password: password,
          options: {
            data: {
              full_name: userData.fullName,
              mobile: userData.mobile || "",
              role: userData.role,
            },
          },
        });

        if (supaAuth?.user) {
          authCreated = true;
          registeredToken = supaAuth.session?.access_token || `demo_${userData.role}`;
          registeredUser = {
            ...userData,
            id: supaAuth.user.id,
          };

          // Upsert into public.profiles directly from browser client
          await supabase.from("profiles").upsert({
            id: supaAuth.user.id,
            user_id: supaAuth.user.id,
            full_name: userData.fullName,
            email: userData.email,
            phone: userData.mobile || null,
            user_type: userData.role,
            state: userData.state || "Maharashtra",
            district: userData.district || "Nashik",
            preferred_language: userData.preferredLanguage || "en",
            organization: userData.organization || null,
          }, { onConflict: "id" });

          if (userData.role === "farmer") {
            const fId = `FM-${Date.now().toString().slice(-6)}`;
            await supabase.from("farmers").upsert({
              id: fId,
              profile_id: supaAuth.user.id,
              name: userData.fullName,
              mobile: userData.mobile || "9876500000",
              village: userData.district || "Nashik",
              district: userData.district || "Nashik",
              state: userData.state || "Maharashtra",
              farming_category: "Crops",
              consent: true,
              verification_level: "Field Verified",
              status: "Active",
            }, { onConflict: "id" });
          }
        } else if (supaErr) {
          console.error("Direct Supabase Auth notice:", supaErr.message);
          lastError = supaErr.message;
        }
      } catch (directErr: any) {
        console.error("Direct Supabase signup error:", directErr);
        lastError = directErr.message || "Database registration error";
      }
    }

    if (!authCreated) {
      return {
        success: false,
        error: lastError || "Failed to create account in Supabase database. Please check your network and try again.",
      };
    }

    // Clear previous demo cache from localStorage so newly registered user starts with 0 data
    [
      "crop_avail",
      "lots",
      "evidence",
      "offers",
      "payments",
      "disputes",
      "transactions",
      "notifications",
      "activities",
      "arrivals",
      "quality",
      "admin_alerts",
    ].forEach((k) => {
      try {
        localStorage.removeItem(`farmly_${k}`);
      } catch {}
    });

    // Save active session
    localStorage.setItem("farmly_token", registeredToken || `demo_${registeredUser.role}`);
    setUser(registeredUser);
    localStorage.setItem("farmly_session", JSON.stringify(registeredUser));

    const target = DEMO_CREDENTIALS[registeredUser.role]?.dashboard || "/dashboard";
    router.push(target);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("farmly_session");
      localStorage.removeItem("farmly_token");
      [
        "crop_avail",
        "lots",
        "evidence",
        "offers",
        "payments",
        "disputes",
        "transactions",
        "notifications",
        "activities",
        "arrivals",
        "quality",
        "admin_alerts",
      ].forEach((k) => localStorage.removeItem(`farmly_${k}`));
    } catch {}
    supabase.auth.signOut().catch(() => {});
    router.push("/login");
  };

  const quickDemoLogin = (roleToSelect: UserRole) => {
    backendClient.login({ role: roleToSelect }).then((res) => {
      if (res?.token && res?.user) {
        localStorage.setItem("farmly_token", res.token);
        setUser(res.user);
        localStorage.setItem("farmly_session", JSON.stringify(res.user));
        router.push(DEMO_CREDENTIALS[roleToSelect]?.dashboard || "/dashboard");
        return;
      }
    }).catch(() => {});

    const demo = DEMO_CREDENTIALS[roleToSelect];
    if (demo) {
      localStorage.setItem("farmly_token", `demo_${roleToSelect}`);
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
