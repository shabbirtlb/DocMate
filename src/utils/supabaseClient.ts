import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://your-project-id.supabase.co',
  'public-anon-or-service-role-key'
);
