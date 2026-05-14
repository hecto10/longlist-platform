// ─── SUPABASE CLIENT ─────────────────────────────────────
const SUPABASE_URL = 'https://mtcjomtptsgkdhqwewjj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10Y2pvbXRwdHNna2RocXdld2pqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMzUzMjAsImV4cCI6MjA5MzcxMTMyMH0.tZehQIZ6XXhKcT9Ib7p_x7hBQwIVBqS3MXwEq2-yIF0';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  global: {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  }
});
