import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://aoozvekvlmbrfrdoqwnu.supabase.co',
  'public-anon-or-service-role-key'
);
