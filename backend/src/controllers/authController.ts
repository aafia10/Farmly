import { Request, Response } from "express";
import { supabase } from "../config/supabase";
import { DEMO_USERS_MAP, demoAuthEnabled } from "../middleware/auth";
import { SUPPORTED_ROLES, isSupportedRole } from "../types";
import crypto from "crypto";

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const {
      email,
      password,
      fullName,
      mobile,
      role,
      state,
      district,
      preferredLanguage,
      organization,
    } = req.body;

    if (!email || !fullName) {
      res.status(400).json({ success: false, message: "Email and Full Name are required" });
      return;
    }

    const userType = (role || req.body.userType || "farmer").toString().toLowerCase();
    if (!isSupportedRole(userType)) {
      res.status(400).json({
        success: false,
        message: `Unsupported role '${userType}'. Choose one of: ${SUPPORTED_ROLES.join(", ")}.`,
      });
      return;
    }

    try {
      let authUserId: string | null = null;
      let accessToken: string | null = null;

      // Attempt Supabase Auth registration
      if (password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              mobile: mobile || "",
              role: userType,
              user_type: userType,
            },
          },
        });

        if (authData?.user) {
          authUserId = authData.user.id;
          accessToken = authData.session?.access_token || null;
        } else if (authError) {
          console.warn("[Signup] Supabase Auth notice:", authError.message);
        }
      }

      // Generate persistent UUID for profile if authUserId not returned
      const profileId = authUserId || crypto.randomUUID();

      // Check if profile exists by email or id to prevent onConflict 400 errors
      let resolvedProfileId = profileId;
      try {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (existingProfile?.id) {
          resolvedProfileId = existingProfile.id;
        }
      } catch {
        // Proceed with profileId
      }

      // Upsert into public.profiles by primary key id
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: resolvedProfileId,
          user_id: authUserId,
          full_name: fullName,
          email,
          phone: mobile || null,
          user_type: userType,
          state: state || "Maharashtra",
          district: district || "Nashik",
          preferred_language: preferredLanguage || "en",
          organization: organization || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" })
        .select()
        .single();

      if (profileError && !profile) {
        console.error("[Signup] Profile upsert error:", profileError);
      }

      // If registered as farmer, ensure an entry exists in public.farmers
      if (userType === "farmer") {
        try {
          let farmerId = `FM-${Date.now().toString().slice(-6)}`;
          if (mobile) {
            const { data: existingFarmer } = await supabase
              .from("farmers")
              .select("id")
              .eq("mobile", mobile)
              .maybeSingle();
            if (existingFarmer?.id) {
              farmerId = existingFarmer.id;
            }
          }

          await supabase.from("farmers").upsert({
            id: farmerId,
            profile_id: profile?.id || resolvedProfileId,
            name: fullName,
            mobile: mobile || "9876500000",
            village: district || "Nashik",
            district: district || "Nashik",
            state: state || "Maharashtra",
            farming_category: "Crops",
            consent: true,
            verification_level: "Field Verified",
            status: "Active",
            last_activity: new Date().toISOString(),
          }, { onConflict: "id" });
        } catch (e: any) {
          console.warn("[Signup] Farmer table sync notice:", e.message);
        }
      }

      const token = accessToken || `demo_${userType}`;
      const userPayload = {
        id: profile?.id || profileId,
        fullName,
        email,
        mobile: mobile || "",
        role: userType,
        state: state || "Maharashtra",
        district: district || "Nashik",
        preferredLanguage: preferredLanguage || "en",
        organization: organization || "",
      };

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          user: userPayload,
          token,
        },
      });
    } catch (err: any) {
      console.error("[Signup] Error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const rawIdentifier = (req.body.email || req.body.identifier || "").toString().trim().toLowerCase();
    const { password, role } = req.body;

    // Quick demo login flow (development only, supported roles only)
    if (role && (!rawIdentifier || !password)) {
      if (!demoAuthEnabled() || !isSupportedRole(role)) {
        res.status(403).json({ success: false, message: "Demo login is not available for this role." });
        return;
      }
      const demoUser = Object.values(DEMO_USERS_MAP).find((u) => u.role === role);
      if (demoUser) {
        res.json({
          success: true,
          message: "Demo login successful",
          data: {
            user: demoUser,
            token: `demo_${role}`,
          },
        });
        return;
      }
    }

    if (!rawIdentifier) {
      res.status(400).json({ success: false, message: "Email or identifier is required" });
      return;
    }

    const email = rawIdentifier;

    try {
      // 1. Try Supabase Auth signInWithPassword if password provided
      if (password) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authData?.session && authData?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .or(`id.eq.${authData.user.id},user_id.eq.${authData.user.id},email.eq.${email}`)
            .maybeSingle();

          const userPayload = {
            id: profile?.id || authData.user.id,
            fullName: profile?.full_name || authData.user.user_metadata?.full_name || email.split("@")[0],
            email,
            mobile: profile?.phone || authData.user.user_metadata?.mobile || "",
            role: profile?.user_type || profile?.role || authData.user.user_metadata?.role || "farmer",
            state: profile?.state || "Maharashtra",
            district: profile?.district || "Nashik",
            preferredLanguage: profile?.preferred_language || "en",
            organization: profile?.organization || "",
          };

          res.json({
            success: true,
            message: "Login successful",
            data: {
              user: userPayload,
              token: authData.session.access_token,
            },
          });
          return;
        }
      }

      // The fallbacks below skip password verification, so they only run in demo mode.
      if (!demoAuthEnabled()) {
        res.status(401).json({ success: false, message: "Invalid email or password" });
        return;
      }

      // 2. Resilient demo/profile fallback for pre-seeded users
      const demoMatch = Object.values(DEMO_USERS_MAP).find(
        (u) =>
          isSupportedRole(u.role) &&
          (u.email.toLowerCase() === email.toLowerCase() || (u.mobile && u.mobile === rawIdentifier))
      );
      if (demoMatch) {
        res.json({
          success: true,
          message: "Demo login successful",
          data: {
            user: demoMatch,
            token: `demo_${demoMatch.role}`,
          },
        });
        return;
      }

      // 3. Check public.profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .or(`email.eq.${email},phone.eq.${rawIdentifier}`)
        .maybeSingle();

      // Legacy-role accounts must sign in with their password; demo tokens only cover supported roles.
      if (profile && isSupportedRole(profile.user_type || profile.role)) {
        const userPayload = {
          id: profile.id,
          fullName: profile.full_name,
          email: profile.email,
          mobile: profile.phone || "",
          role: profile.user_type || profile.role || "farmer",
          state: profile.state || "Maharashtra",
          district: profile.district || "Nashik",
          preferredLanguage: profile.preferred_language || "en",
          organization: profile.organization || "",
        };

        res.json({
          success: true,
          message: "Login successful",
          data: {
            user: userPayload,
            token: `demo_${userPayload.role}`,
          },
        });
        return;
      }

      res.status(401).json({ success: false, message: "Invalid email or password" });
    } catch (err: any) {
      console.error("[Login] Error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async getMe(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .or(`id.eq.${req.user.id},user_id.eq.${req.user.id},email.eq.${req.user.email}`)
        .maybeSingle();

      if (profile) {
        res.json({
          success: true,
          data: {
            id: profile.id,
            fullName: profile.full_name,
            email: profile.email,
            mobile: profile.phone,
            role: profile.user_type || profile.role || req.user.role,
            state: profile.state,
            district: profile.district,
            preferredLanguage: profile.preferred_language,
            organization: profile.organization,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: req.user,
      });
    } catch (err: any) {
      res.json({
        success: true,
        data: req.user,
      });
    }
  },

  async updateProfile(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Not authenticated" });
      return;
    }

    const { fullName, mobile, state, district, preferredLanguage, organization } = req.body;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: mobile,
          state,
          district,
          preferred_language: preferredLanguage,
          organization,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${req.user.id},user_id.eq.${req.user.id},email.eq.${req.user.email}`)
        .select()
        .maybeSingle();

      if (error) {
        res.status(400).json({ success: false, message: error.message });
        return;
      }

      res.json({
        success: true,
        message: "Profile updated successfully",
        data: data || req.user,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};
