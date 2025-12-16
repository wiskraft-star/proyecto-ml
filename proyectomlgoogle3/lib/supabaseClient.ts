import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Fix: The type of environment variables from Vite can be string | boolean | undefined.
// The original check `!supabaseUrl` would fail to catch a boolean `true` as an invalid value,
// leading to a TypeScript error. This updated validation ensures both variables are valid, non-empty strings.
if (typeof supabaseUrl !== 'string' || !supabaseUrl || typeof supabaseAnonKey !== 'string' || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined as non-empty strings in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
