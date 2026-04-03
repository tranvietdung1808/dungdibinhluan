import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

async function test() {
  console.log("Checking user_roles table...");
  const { data, error } = await supabaseAdmin.from("user_roles").select("*");
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Data:", data);
  }
}

test();
