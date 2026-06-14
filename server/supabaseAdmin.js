//server/supabaseAdmin.js
import dotenv from "dotenv";

dotenv.config({
  path: "../.env"
});

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =  process.env.SUPABASE_URL;

console.log(
  "SUPABASE URL:",
  process.env.SUPABASE_URL
);

const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // 🔥 IMPORTANT

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);