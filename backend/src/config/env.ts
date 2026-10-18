import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().min(1, "SUPABASE_URL is required"),
  SUPABASE_ANON_KEY: z.string().min(1, "SUPABASE_ANON_KEY is required"),
  SEPOLIA_RPC_URL: z.string().default("https://ethereum-sepolia-rpc.publicnode.com"),
  SEPOLIA_PRIVATE_KEY: z.string().optional(),
  BATCH_REGISTRY_CONTRACT_ADDRESS: z.string().optional(),
  PINATA_JWT: z.string().optional(),
  PINATA_GATEWAY_URL: z.string().default("https://gateway.pinata.cloud/ipfs"),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  SEPOLIA_RPC_URL: process.env.SEPOLIA_RPC_URL,
  SEPOLIA_PRIVATE_KEY: process.env.SEPOLIA_PRIVATE_KEY,
  BATCH_REGISTRY_CONTRACT_ADDRESS: process.env.BATCH_REGISTRY_CONTRACT_ADDRESS,
  PINATA_JWT: process.env.PINATA_JWT,
  PINATA_GATEWAY_URL: process.env.PINATA_GATEWAY_URL,
});
