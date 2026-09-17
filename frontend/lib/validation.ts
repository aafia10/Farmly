import { z } from "zod";

/**
 * Mobile number regex supporting 10-digit formats with optional international prefix.
 */
const phoneRegex = /^(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

/**
 * Validates either an email address or a valid mobile phone number.
 */
const emailOrPhoneValidator = z
  .string()
  .min(1, "Please enter your email or mobile number.")
  .refine(
    (val) => {
      const clean = val.trim();
      const isEmail = z.string().email().safeParse(clean).success;
      const isPhone = phoneRegex.test(clean) || /^\d{10}$/.test(clean.replace(/[\s-]/g, ""));
      return isEmail || isPhone;
    },
    {
      message: "Please enter a valid email address or 10-digit mobile number.",
    }
  );

/**
 * Login form validation schema.
 */
export const loginSchema = z.object({
  identifier: emailOrPhoneValidator,
  password: z
    .string()
    .min(1, "Please enter your password.")
    .min(6, "Password must be at least 6 characters long."),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * User roles allowed during registration.
 */
export const userRolesEnum = z.enum(
  ["farmer", "buyer", "distributor", "retailer", "service_provider"],
  {
    errorMap: () => ({ message: "Please select how you will use Farmly." }),
  }
);

/**
 * Signup form validation schema.
 */
export const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Please enter your full name.")
      .min(2, "Full name must be at least 2 characters.")
      .max(80, "Full name must be under 80 characters."),
    mobile: z
      .string()
      .trim()
      .min(1, "Please enter your mobile number.")
      .refine(
        (val) => {
          const digits = val.replace(/\D/g, "");
          return digits.length >= 10 && digits.length <= 13;
        },
        {
          message: "Please enter a valid 10-digit mobile number.",
        }
      ),
    email: z
      .string()
      .trim()
      .min(1, "Please enter your email address.")
      .email("Please enter a valid email address (e.g. name@domain.com)."),
    password: z
      .string()
      .min(1, "Please create a password.")
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Include at least one number or special character."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
    role: userRolesEnum,
    acceptTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must agree to the Terms of Service & Privacy Policy to continue.",
      }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type SignupFormData = z.infer<typeof signupSchema>;

/**
 * Evaluates password strength and returns score and criteria status.
 */
export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: "Too Weak" | "Weak" | "Fair" | "Strong";
  colorClass: string;
  checks: {
    length: boolean;
    hasUpper: boolean;
    hasLower: boolean;
    hasNumberOrSymbol: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumberOrSymbol: /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 1) {
    return { score, label: "Too Weak", colorClass: "bg-red-500", checks };
  }
  if (score === 2) {
    return { score, label: "Weak", colorClass: "bg-amber-500", checks };
  }
  if (score === 3) {
    return { score, label: "Fair", colorClass: "bg-emerald-500", checks };
  }
  return { score, label: "Strong", colorClass: "bg-farmly-accent", checks };
}
