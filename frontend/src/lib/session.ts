// Session state lives in an httpOnly cookie set by /api/auth/login. This module owns
// the react-query cache around it: beginSession() after login, endSession() on every
// sign-out (clearing only the server cookie would leak the previous admin's cached
// data to the next login in this browser).
import { useQuery } from "@tanstack/react-query";
import { apiGet, apiPost } from "./api";
import { queryClient } from "./queryClient";

export interface MeResponse {
  authenticated: boolean;
  email: string | null;
}

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function beginSession() {
  queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
}

export async function endSession() {
  try {
    await apiPost("/auth/logout");
  } finally {
    queryClient.clear();
  }
}

// Same call shape as the original useAuth() hook (session, loading, signIn, signOut)
// so the admin screens port unchanged.
export function useAuth() {
  const query = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: () => apiGet<MeResponse>("/auth/me"),
    staleTime: 5 * 60 * 1000,
  });

  return {
    session: query.data?.authenticated ? query.data : null,
    loading: query.isPending,
    signIn: async (email: string, password: string) => {
      try {
        await apiPost<MeResponse>("/auth/login", { email, password });
        beginSession();
        return { data: query.data ?? null, error: null };
      } catch (error) {
        return { data: null, error };
      }
    },
    signOut: async () => {
      await endSession();
    },
  };
}
