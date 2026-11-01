export type AuthError = { message?: string; code?: string; status: number };
export type Result<T> = { data: T | null; error: AuthError | null };

export type SessionData = {
  session: { id: string; userId: string; expiresAt: string; token: string };
  user: { id: string; name: string; email: string; image?: string | null };
};

async function request<T>(path: string, method: "GET" | "POST" = "GET", body?: unknown): Promise<Result<T>> {
  try {
    const post = method === "POST";
    const res = await fetch(`/api/auth${path}`, {
      method,
      credentials: "include",
      headers: post ? { "content-type": "application/json" } : undefined,
      body: post ? JSON.stringify(body ?? {}) : undefined,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) return { data: null, error: { ...(json ?? {}), status: res.status } };
    return { data: json as T, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e), status: 0 } };
  }
}

export const authClient = {
  getSession: () => request<SessionData | null>("/get-session"),
  signIn: {
    social: async (body: { provider: "google"; callbackURL?: string; errorCallbackURL?: string; newUserCallbackURL?: string }) => {
      const r = await request<{ url: string; redirect: boolean }>("/sign-in/social", "POST", body);
      if (r.data?.redirect) window.location.href = r.data.url;
      return r;
    },
  },
  signOut: () => request<{ success: boolean }>("/sign-out", "POST"),
};
