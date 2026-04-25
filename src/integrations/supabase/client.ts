import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://njfixwkpjgojvsyohsnv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qZml4d2twamdvanZzeW9oc252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MzQ3MDMsImV4cCI6MjA4OTQxMDcwM30.uxYIaMhqpvtMcxpgN7RfY_8uNcAtlyEvwiFHW-mjXg0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});