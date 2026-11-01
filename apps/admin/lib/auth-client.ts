"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type AuthError = { message?: string; code?: string; status: number };
export type Result<T> = { data: T | null; error: AuthError | null };

export type SessionData = {
  session: { id: string; userId: string; expiresAt: string; token: string };
  user: { id: string; name: string; email: string; image?: string | null; role?: string | null };
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

const getSession = () => request<SessionData | null>("/get-session");

let state: { data: SessionData | null; error: AuthError | null; isPending: boolean; loaded: boolean } = {
  data: null,
  error: null,
  isPending: true,
  loaded: false,
};
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function refetch() {
  inflight ??= getSession().then((r) => {
    inflight = null;
    state = { data: r.data, error: r.error, isPending: false, loaded: true };
    listeners.forEach((l) => l());
  });
  return inflight;
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function useSession() {
  const s = useSyncExternalStore(subscribe, () => state, () => state);
  useEffect(() => {
    if (!state.loaded) refetch();
  }, []);
  const r = useCallback(() => refetch(), []);
  return { data: s.data, error: s.error, isPending: s.isPending, refetch: r };
}

export const authClient = {
  getSession,
  useSession,
  signIn: {
    social: async (body: { provider: "google"; callbackURL?: string; errorCallbackURL?: string; newUserCallbackURL?: string }) => {
      const r = await request<{ url: string; redirect: boolean }>("/sign-in/social", "POST", body);
      if (r.data?.redirect) window.location.href = r.data.url;
      return r;
    },
  },
  signOut: async () => {
    const r = await request<{ success: boolean }>("/sign-out", "POST");
    if (state.loaded) await refetch();
    return r;
  },
};
