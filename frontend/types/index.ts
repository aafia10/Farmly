import { type LucideIcon } from "lucide-react";

export type UserRole =
  | "farmer"
  | "buyer"
  | "distributor"
  | "retailer"
  | "service_provider";

export interface UserRoleOption {
  id: UserRole;
  label: string;
  description: string;
  icon: LucideIcon;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface TrustItem {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
  detail: string;
  icon: LucideIcon;
}

export interface PlatformFeature {
  id: string;
  title: string;
  description: string;
  badge: string;
  icon: LucideIcon;
}

export interface FarmingCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tag: string;
  icon: LucideIcon;
}

export interface WhyFarmlyPoint {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
}
