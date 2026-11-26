import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseServiceKey.includes('placeholder')
);

// Format database and connection errors into user-friendly diagnostic messages
export function formatSupabaseError(err: any): string {
  const msg = err?.message || String(err || 'Unknown database error');
  if (
    msg.includes('fetch failed') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('TypeError') ||
    msg.includes('ECONNREFUSED')
  ) {
    return 'Database connection failed (fetch failed). Your Supabase project appears to be paused due to inactivity or unreachable. Please visit https://supabase.com/dashboard to unpause/restore your project.';
  }
  return msg;
}

// Server-side client using service role key
// Created safely so Next.js build step doesn't crash if variables are not in the build environment
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseServiceKey || 'placeholder-key',
  {
    auth: { persistSession: false },
  }
);
