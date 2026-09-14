import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://dyantwbneroakxxljftb.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR5YW50d2JuZXJvYWt4eGxqZnRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwNjE1MzEsImV4cCI6MjEwNDYzNzUzMX0.qI6fiLjCRM5M4tDNje1feiova8_jVuaNrikLBBVCGuI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
