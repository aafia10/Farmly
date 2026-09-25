import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://vaickahnshecbcrxoinp.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhaWNrYWhuc2hlY2JjcnhvaW5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MTI1OTUsImV4cCI6MjEwNTE4ODU5NX0.CAYKhEnutIqNOZSfdbMQtZ0drky9Khd3JjPMgeWJGko";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
