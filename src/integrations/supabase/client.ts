// Supabase client — manually maintained.
//
// We intentionally hardcode the canonical project URL + publishable key as
// a fallback below. Reasons :
//
//   1. The project under our control (org "kAIra", id pvpshyoaregroihwglye)
//      is the long-term canonical DB. Lovable / other tooling would otherwise
//      regenerate this file pointing at the legacy auto-provisioned project,
//      silently re-routing the live site to an orphaned database.
//   2. The publishable key (`sb_publishable_...`) is meant to be public and
//      is paired with row-level-security policies on the server. It is safe
//      to ship in the bundle.
//   3. Local dev / CI can still override via VITE_SUPABASE_URL +
//      VITE_SUPABASE_PUBLISHABLE_KEY env vars — useful for staging branches
//      or testing against a fork.
//
// If we ever migrate, change the two FALLBACK_* constants here and bump the
// build. Do not delete the env lookup — local override remains useful.

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const FALLBACK_URL = 'https://pvpshyoaregroihwglye.supabase.co';
const FALLBACK_PUBLISHABLE_KEY = 'sb_publishable_oYNdl-cJiMiJIijNsS9Euw_o9OuDJlM';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_PUBLISHABLE_KEY;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});