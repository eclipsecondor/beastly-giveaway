//server/supabaseAdmin.js
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;

console.log("SUPABASE URL:", SUPABASE_URL);

const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY;

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY
);