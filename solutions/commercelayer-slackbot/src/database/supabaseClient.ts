import * as dotenv from "dotenv";
dotenv.config();

import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/supabase";

export const database = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
