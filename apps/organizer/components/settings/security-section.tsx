"use client";

import { useEffect, useState } from "react";
import { authClient } from "../../lib/auth-client";
import { Button } from "@repo/ui/button";

type Session = NonNullable<
  Awaited<ReturnType<typeof authClient.listSessions>>["data"]
>[number];

function deviceLabel(ua?: string | null): string {
  if (!ua) return "Unknown device";

  let browser = "Browser";
  if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("Android")) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (ua.includes("Mac OS X")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";

  return `${browser} on ${os}`;
}

function relativeTime(value?: string | Date | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  if (Number.isNaN(ms)) return "";

  const diff = Date.now() - ms;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return "just now";

  const min = Math.round(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;

  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;

  const day = Math.round(hr / 24);
  if (day < 30) return `${day} day${day === 1 ? "" : "s"} ago`;

  const month = Math.round(day / 30);
  if (month < 12) return `${month} month${month === 1 ? "" : "s"} ago`;

  const year = Math.round(month / 12);
  return `${year} year${year === 1 ? "" : "s"} ago`;
}

export function SecuritySection() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const { data: current } = authClient.useSession();
  const currentToken = current?.session.token;

  const load = async () => {
    const { data } = await authClient.listSessions();
    setSessions(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const sorted = [...sessions].sort((a, b) => {
    if (a.token === currentToken) return -1;
    if (b.token === currentToken) return 1;
    return 0;
  });

  return (
    <section className="space-y-4 rounded-lg border p-5">
      <h2 className="font-semibold">Security</h2>
      <div className="flex items-center justify-between text-sm">
        <span>Signed in with Google</span>
        <span className="text-muted-foreground">Connected</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Active sessions</span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await authClient.revokeOtherSessions();
              load();
            }}
          >
            Sign out other devices
          </Button>
        </div>
        <ul className="space-y-1 text-sm">
          {sorted.map((s) => {
            const isCurrent = s.token === currentToken;
            const lastActive = relativeTime(s.updatedAt ?? s.createdAt);
            return (
              <li
                key={s.id}
                className="flex items-center justify-between rounded border px-3 py-2"
              >
                <span className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {deviceLabel(s.userAgent)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isCurrent
                      ? `This device${lastActive ? ` · ${lastActive}` : ""}`
                      : lastActive || "Active session"}
                  </span>
                </span>
                {isCurrent ? (
                  <span className="text-xs text-muted-foreground">Current</span>
                ) : (
                  <button
                    className="text-destructive hover:underline"
                    onClick={async () => {
                      await authClient.revokeSession({ token: s.token });
                      load();
                    }}
                  >
                    Revoke
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
