import { createClient } from "@/lib/supabase/server";
import { AlertsClient } from "./alerts-client";

export default async function AlertsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isDemo = user?.email === "demostracion@agenteflow.com";
  return <AlertsClient isDemo={isDemo} />;
}
