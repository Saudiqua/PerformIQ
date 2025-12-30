import { QueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  const orgId = localStorage.getItem('selected_org_id');

  const headers: Record<string, string> = {};

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  if (orgId) {
    headers['X-Org-Id'] = orgId;
  }

  return headers;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const authHeaders = await getAuthHeaders();
  const res = await fetch(url, {
    method,
    headers: {
      ...authHeaders,
      ...(data ? { "Content-Type": "application/json" } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });
  await throwIfResNotOk(res);
  return res;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: false,
      queryFn: async ({ queryKey }) => {
        const authHeaders = await getAuthHeaders();
        const res = await fetch(queryKey[0] as string, {
          headers: authHeaders,
          credentials: "include",
        });
        await throwIfResNotOk(res);
        return res.json();
      },
    },
  },
});
