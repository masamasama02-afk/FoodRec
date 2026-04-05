import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vbzjsxqjvdkxdralocde.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZiempzeHFqdmRreGRyYWxvY2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0NjgwMDksImV4cCI6MjA4OTA0NDAwOX0.z18gBIXOULwh7A1TAMH1cI1gqBzUXhxa-P2E_rFOTIE";

export const supabase = createClient(supabaseUrl, supabaseKey);