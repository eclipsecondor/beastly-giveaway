//js/supabaseClient.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = "https://dxztumshvbkcqeuurfer.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4enR1bXNodmJrY3FldXVyZmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4ODkyODYsImV4cCI6MjA5MjQ2NTI4Nn0.qwTHFbcAsvfadP_y0wLz6F3uEAFmEvuR4eOqiqDsJeo"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)