import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browser-only Supabase client. It deliberately accepts only a publishable key;
 * authorization belongs to database RLS policies, never to this module.
 */
export const supabase = url && publishableKey
  ? createClient(url, publishableKey)
  : null;

export const isSupabaseConfigured = (): boolean => supabase !== null;
