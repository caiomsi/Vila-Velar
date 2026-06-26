const SUPABASE_URL = 'https://mxozwxreyrpyochrzwdv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14b3p3eHJleXJweW9jaHJ6d2R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0ODcyNTcsImV4cCI6MjA5ODA2MzI1N30.9mCbFwoMl-nguFO6SdT2GF5-i1xVtfixgoQJHCe2mXo'
const { createClient } = window.supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
