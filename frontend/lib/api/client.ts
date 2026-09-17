import { AuthApiResponse, LoginPayload, SignupPayload } from "./types";

/**
 * Farmly API Client Abstraction.
 *
 * This client abstracts authentication and future backend services.
 * Currently runs in simulation mode for frontend UX validation.
 * When a real backend is available, the simulated delay and response can be
 * replaced with fetch calls to NEXT_PUBLIC_API_URL.
 */
export const apiClient = {
  /**
   * Simulated user login without external network request.
   */
  async login(payload: LoginPayload): Promise<AuthApiResponse> {
    // Artificial latency for authentic loading experience
    await new Promise((resolve) => setTimeout(resolve, 800));

    return {
      success: true,
      message: "Login successful! Welcome back to Farmly.",
      data: {
        user: {
          id: "usr_simulated_101",
          fullName: "Verified Farmer",
          email: payload.identifier.includes("@") ? payload.identifier : "farmer@farmly.demo",
          mobile: payload.identifier.includes("@") ? "+91 98765 43210" : payload.identifier,
          role: "farmer",
        },
        tokenPlaceholder: "simulated_jwt_token_placeholder",
        isSimulated: true,
      },
    };
  },

  /**
   * Simulated user signup without external network request.
   */
  async signup(payload: SignupPayload): Promise<AuthApiResponse> {
    // Artificial latency for authentic loading experience
    await new Promise((resolve) => setTimeout(resolve, 900));

    return {
      success: true,
      message: `Account created successfully for ${payload.fullName}! Welcome to the Farmly digital ecosystem.`,
      data: {
        user: {
          id: `usr_${Date.now()}`,
          fullName: payload.fullName,
          email: payload.email,
          mobile: payload.mobile,
          role: payload.role,
        },
        tokenPlaceholder: "simulated_jwt_token_placeholder",
        isSimulated: true,
      },
    };
  },
};
