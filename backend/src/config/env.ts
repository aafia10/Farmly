import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const optionalString = z
  .string()
  .optional()
  .transform((val) => (val && val.trim() ? val.trim() : undefined));

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),

  // Server-only key used for certificate/purchase tables protected by RLS. Never expose it to the browser.
  SUPABASE_SERVICE_ROLE_KEY: optionalString,

  // Demo logins (password-less demo accounts and demo_<role> tokens). Defaults to on outside production.
  ALLOW_DEMO_AUTH: optionalString,

  // Base URL used in QR codes for public traceability pages. Defaults to FRONTEND_URL.
  PUBLIC_APP_URL: optionalString,

  // Pinata / IPFS
  PINATA_JWT: optionalString,
  PINATA_GATEWAY_URL: optionalString,
  CERT_MAX_FILE_MB: z.string().default("10").transform((val) => parseFloat(val)),

  // EVM certificate registry
  CHAIN_RPC_URL: optionalString,
  CHAIN_ID: optionalString,
  CERT_REGISTRY_ADDRESS: optionalString,
  CHAIN_SIGNER_PRIVATE_KEY: optionalString,
  CHAIN_EXPLORER_TX_URL: optionalString,
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ALLOW_DEMO_AUTH: process.env.ALLOW_DEMO_AUTH,
  PUBLIC_APP_URL: process.env.PUBLIC_APP_URL,
  PINATA_JWT: process.env.PINATA_JWT,
  PINATA_GATEWAY_URL: process.env.PINATA_GATEWAY_URL,
  CERT_MAX_FILE_MB: process.env.CERT_MAX_FILE_MB,
  CHAIN_RPC_URL: process.env.CHAIN_RPC_URL,
  CHAIN_ID: process.env.CHAIN_ID,
  CERT_REGISTRY_ADDRESS: process.env.CERT_REGISTRY_ADDRESS,
  CHAIN_SIGNER_PRIVATE_KEY: process.env.CHAIN_SIGNER_PRIVATE_KEY,
  CHAIN_EXPLORER_TX_URL: process.env.CHAIN_EXPLORER_TX_URL,
});
