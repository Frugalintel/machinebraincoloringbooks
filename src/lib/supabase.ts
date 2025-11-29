import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Warn in development if credentials are missing
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      '⚠️ Supabase credentials missing. Auth features will use mock mode.\n' +
      'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.'
    );
  }
}

// Export a flag to check if Supabase is properly configured
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
