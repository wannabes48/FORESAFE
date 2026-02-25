import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cgqolpsohxezdujkrudj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNncW9scHNvaHhlemR1amtydWRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTEyMzAsImV4cCI6MjA4Njk2NzIzMH0.XHv04S4p8ARqUvPSEIS8hKTFGSg-wnrHJREYdE9N16w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
