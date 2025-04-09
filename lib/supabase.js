import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://khledntlhecudzcpdbxz.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobGVkbnRsaGVjdWR6Y3BkYnh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxNzUyMzMsImV4cCI6MjA1OTc1MTIzM30.p0OYC-9wdEFyLgM4tkRLHThYe5Z3Y3zQJql8pY9u0V8'
export const supabase = createClient(supabaseUrl, supabaseKey)