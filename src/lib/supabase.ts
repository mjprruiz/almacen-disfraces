import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zakqbiuhvlbuykhmmafz.supabase.co';
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_95efaWjDZNB5WG9Ib6Gp6Q_CkXrhu-1';

export const supabase = createClient(supabaseUrl, supabaseKey);
