"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

export type AuthError = { message?: string; code?: string; status: number };
export type Result<T> = { data: T | null; error: AuthError | null };

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  expiresAt: string;
  token: string;
  createdAt: string;
  updatedAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
  activeOrganizationId?: string | null;
};

export type SessionData = { session: Session; user: User };

export type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: string;
  metadata?: string | null;
};

export type Member = {
  id: string;
  organizationId: string;
  userId: string;
  role: string;
  createdAt: string;
  user: { id: string; name: string; email: string; image?: string | null };
};

export type Invitation = {
  id: string;
  organizationId: string;
  email: string;
  role?: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  inviterId: string;
};

export type FullOrganization = Organization & { members: Member[]; invitations: Invitation[] };

type RequestInit = { method?: "GET" | "POST"; body?: unknown; query?: Record<string, string | undefined> };

async function request<T>(path: string, init: RequestInit = {}): Promise<Result<T>> {
  const method = init.method ?? (init.body === undefined ? "GET" : "POST");
  let url = `/api/auth${path}`;
  if (init.query) {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(init.query)) if (v !== undefined) q.set(k, v);
    const s = q.toString();
    if (s) url += `?${s}`;
  }
  try {
    const post = method === "POST";
    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: post ? { "content-type": "application/json" } : undefined,
      body: post ? JSON.stringify(init.body ?? {}) : undefined,
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) return { data: null, error: { ...(json ?? {}), status: res.status } };
    return { data: json as T, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : String(e), status: 0 } };
  }
}

type Store<T> = { data: T | null; error: AuthError | null; isPending: boolean; loaded: boolean };

function createStore<T>(load: () => Promise<Result<T>>) {
  let state: Store<T> = { data: null, error: null, isPending: true, loaded: false };
  let inflight: Promise<void> | null = null;
  const listeners = new Set<() => void>();
  const set = (s: Store<T>) => {
    state = s;
    listeners.forEach((l) => l());
  };
  const refetch = () => {
    inflight ??= load().then((r) => {
      inflight = null;
      set({ data: r.data, error: r.error, isPending: false, loaded: true });
    });
    return inflight;
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  const use = () => {
    const s = useSyncExternalStore(subscribe, () => state, () => state);
    useEffect(() => {
      if (!state.loaded) refetch();
    }, []);
    const r = useCallback(() => refetch(), []);
    return { data: s.data, error: s.error, isPending: s.isPending, refetch: r };
  };
  return { use, refetch, isLoaded: () => state.loaded };
}

const getSession = () => request<SessionData | null>("/get-session");
const sessionStore = createStore(getSession);
const activeOrgStore = createStore(() => request<FullOrganization | null>("/organization/get-full-organization"));
const orgListStore = createStore(() => request<Organization[]>("/organization/list"));

async function mutate<T>(path: string, body: unknown = {}): Promise<Result<T>> {
  const r = await request<T>(path, { method: "POST", body });
  await Promise.all(
    [sessionStore, activeOrgStore, orgListStore].filter((s) => s.isLoaded()).map((s) => s.refetch()),
  );
  return r;
}

export const authClient = {
  getSession,
  useSession: sessionStore.use,
  useActiveOrganization: activeOrgStore.use,
  useListOrganizations: orgListStore.use,
  signIn: {
    social: async (body: { provider: "google"; callbackURL?: string; errorCallbackURL?: string; newUserCallbackURL?: string }) => {
      const r = await request<{ url: string; redirect: boolean }>("/sign-in/social", { method: "POST", body });
      if (r.data?.redirect) window.location.href = r.data.url;
      return r;
    },
  },
  signOut: () => mutate<{ success: boolean }>("/sign-out"),
  updateUser: (body: { name?: string; image?: string | null }) => mutate<{ status: boolean }>("/update-user", body),
  listSessions: () => request<Session[]>("/list-sessions"),
  revokeSession: (body: { token: string }) => mutate<{ status: boolean }>("/revoke-session", body),
  revokeOtherSessions: () => mutate<{ status: boolean }>("/revoke-other-sessions"),
  organization: {
    create: (body: { name: string; slug: string; logo?: string; metadata?: Record<string, unknown> }) =>
      mutate<Organization>("/organization/create", body),
    update: (body: { organizationId?: string; data: { name?: string; slug?: string; logo?: string | null; metadata?: Record<string, unknown> } }) =>
      mutate<Organization>("/organization/update", body),
    setActive: (body: { organizationId: string | null }) => mutate<FullOrganization | null>("/organization/set-active", body),
    leave: (body: { organizationId: string }) => mutate<Member>("/organization/leave", body),
    listInvitations: (opts?: { query?: { organizationId?: string } }) =>
      request<Invitation[]>("/organization/list-invitations", { query: opts?.query }),
    inviteMember: (body: { organizationId?: string; email: string; role: string; resend?: boolean }) =>
      mutate<Invitation>("/organization/invite-member", body),
    cancelInvitation: (body: { invitationId: string }) => mutate<Invitation>("/organization/cancel-invitation", body),
    acceptInvitation: (body: { invitationId: string }) => mutate<unknown>("/organization/accept-invitation", body),
    removeMember: (body: { memberIdOrEmail: string; organizationId?: string }) =>
      mutate<{ member: Member }>("/organization/remove-member", body),
    updateMemberRole: (body: { memberId: string; role: string; organizationId?: string }) =>
      mutate<Member>("/organization/update-member-role", body),
  },
};
