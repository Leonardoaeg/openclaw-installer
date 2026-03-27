import { createClient } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  fullName: string | null;
  company: string | null;
  phone: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  email: string | null;
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      fullName: profile?.full_name ?? null,
      company: profile?.company ?? null,
      phone: profile?.phone ?? null,
      avatarUrl: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? null,
      isAdmin: profile?.is_admin ?? false,
      email: user.email ?? null,
    };
  } catch {
    return null;
  }
}
