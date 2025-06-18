import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://aoozvekvlmbrfrdoqwnu.supabase.co',  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvb3p2ZWt2bG1icmZyZG9xd251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIzMzI2NSwiZXhwIjoyMDY1ODA5MjY1fQ.GaZiYUb4XIpiYy6BRciiP3qO6tR7lM-KQXKSS_P3WpQ'
);
