import { Request, Response, NextFunction } from "express";
import { supabase } from "../config/supabase";
import { AuthUser, UserRole } from "../types";

// Extend Express Request to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      token?: string;
    }
  }
}

// Fallback demo users mapping for testing & resilient offline auth
export const DEMO_USERS_MAP: Record<string, AuthUser> = {
  "e1000000-0000-0000-0000-000000000001": {
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
  "e1000000-0000-0000-0000-000000000002": {
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
  "e1000000-0000-0000-0000-000000000003": {
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
  "e1000000-0000-0000-0000-000000000004": {
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
  "e1000000-0000-0000-0000-000000000005": {
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
  "e1000000-0000-0000-0000-000000000006": {
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
  "e1000000-0000-0000-0000-000000000007": {
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
  "e1000000-0000-0000-0000-000000000008": {
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
};

export async function verifyAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    // Default fallback to farmer demo user if no token provided during dev
    req.user = DEMO_USERS_MAP["e1000000-0000-0000-0000-000000000001"];
    next();
    return;
  }

  const token = authHeader.split(" ")[1];
  req.token = token;

  // Check if token matches a demo user key or role prefix
  if (token.startsWith("demo_") || token.startsWith("simulated_")) {
    const roleKey = token.replace("demo_", "").replace("simulated_", "") as UserRole;
    const foundDemo = Object.values(DEMO_USERS_MAP).find((u) => u.role === roleKey);
    if (foundDemo) {
      req.user = foundDemo;
      next();
      return;
    }
  }

  try {
    const { data: { user: authUser }, error } = await supabase.auth.getUser(token);

    if (error || !authUser) {
      // If token verification with Supabase fails, check if we recognize the user id
      const fallbackUser = DEMO_USERS_MAP[token];
      if (fallbackUser) {
        req.user = fallbackUser;
        next();
        return;
      }

      res.status(401).json({
        success: false,
        message: "Invalid or expired authorization token",
        error: error?.message || "Unauthorized",
      });
      return;
    }

    // Fetch trusted user profile from public.profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .or(`user_id.eq.${authUser.id},id.eq.${authUser.id},email.eq.${authUser.email}`)
      .maybeSingle();

    const role = (profile?.user_type || profile?.role || authUser.user_metadata?.user_type || "farmer") as UserRole;

    req.user = {
      id: profile?.id || authUser.id,
      fullName: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
      email: profile?.email || authUser.email || "",
      mobile: profile?.phone || authUser.user_metadata?.mobile || "",
      role,
      state: profile?.state || authUser.user_metadata?.state,
      district: profile?.district || authUser.user_metadata?.district,
      preferredLanguage: profile?.preferred_language || authUser.user_metadata?.preferred_language || "en",
      organization: profile?.organization || authUser.user_metadata?.organization,
    };

    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Internal error during authentication",
      error: err.message,
    });
  }
}

export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.user = DEMO_USERS_MAP["e1000000-0000-0000-0000-000000000001"];
    next();
    return;
  }
  verifyAuth(req, res, next);
}
