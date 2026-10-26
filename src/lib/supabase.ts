import { createBrowserClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Warn in development if credentials are missing
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    logger.warn(
      "Supabase credentials missing. Auth features will use mock mode. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    );
  }
}

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const SUPABASE_URL = supabaseUrl || "https://placeholder.supabase.co";
export const SUPABASE_ANON_KEY = supabaseAnonKey || "placeholder";

export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
