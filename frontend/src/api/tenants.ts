import { apiFetch } from "./client";
import { unwrapList } from "@/lib/api-utils";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export async function fetchTenants(): Promise<Tenant[]> {
  const data = await apiFetch<Tenant[] | { results: Tenant[] }>("/tenants/");
  return unwrapList(data);
}
