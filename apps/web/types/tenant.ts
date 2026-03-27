export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  status: "active" | "suspended" | "cancelled";
  created_at: string;
}

export interface TenantMember {
  id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  created_at: string;
}
