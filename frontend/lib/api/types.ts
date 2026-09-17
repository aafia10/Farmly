import { ApiResponse, AuthUser, UserRole } from "@/types";

export interface LoginPayload {
  identifier: string;
  password?: string;
  rememberMe?: boolean;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  mobile: string;
  password?: string;
  role: UserRole;
  acceptTerms: boolean;
}

export interface AuthSuccessData {
  user: AuthUser;
  tokenPlaceholder: string;
  isSimulated: boolean;
}

export type AuthApiResponse = ApiResponse<AuthSuccessData>;
