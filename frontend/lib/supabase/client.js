import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'your_supabase_project_url') {
    // During build/prerender without real env vars, return a no-op proxy
    if (typeof window === 'undefined') return null;
    console.warn('Supabase env vars not set. Configure .env.local');
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}
