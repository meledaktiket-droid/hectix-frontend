import Link from "next/link";
import { inspectOrgInvite } from "./actions";
import { GoogleAcceptButton, SignOutButton } from "./accept-actions";

function LogoMark() {
  return (
    <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900">
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 fill-none stroke-white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <LogoMark />
        {children}
      </div>
    </main>
  );
}

export default async function InviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;

  if (!id) {
    return (
      <Shell>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Invitation not found
        </h1>
        <p className="mt-1.5 text-sm text-neutral-500">
          This invitation is no longer valid. Ask whoever invited you to resend.
        </p>
      </Shell>
    );
  }

  const result = await inspectOrgInvite(id);

  switch (result.status) {
    case "invalid":
      return (
        <Shell>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Invitation not found
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            This invitation is no longer valid. Ask whoever invited you to resend.
          </p>
        </Shell>
      );

    case "expired":
      return (
        <Shell>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Invitation expired
          </h1>
          <p className="mt-1.5 text-sm text-neutral-500">
            This invitation has expired. Ask whoever invited you to resend.
          </p>
        </Shell>
      );

    case "needs-signin":
      return (
        <Shell>
          <div className="mb-10">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              You&apos;ve been invited
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              <span className="font-medium text-neutral-900">
                {result.inviterName}
              </span>{" "}
              invited you to join{" "}
              <span className="font-medium text-neutral-900">
                {result.orgName}
              </span>{" "}
              as{" "}
              <span className="font-medium text-neutral-900">
                {result.roleLabel}
              </span>
              . Continue with the Google account for{" "}
              <span className="font-medium text-neutral-900">
                {result.email}
              </span>{" "}
              to accept.
            </p>
          </div>
          <GoogleAcceptButton id={id} />
        </Shell>
      );

    case "mismatch":
      return (
        <Shell>
          <div className="mb-10">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Wrong account
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              This invitation is for{" "}
              <span className="font-medium text-neutral-900">
                {result.invitedEmail}
              </span>
              , but you&apos;re signed in as{" "}
              <span className="font-medium text-neutral-900">
                {result.signedInEmail}
              </span>
              .
            </p>
          </div>
          <SignOutButton />
        </Shell>
      );

    case "accepted":
      return (
        <Shell>
          <div className="mb-10">
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
              You&apos;re in!
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">
              Welcome to the team. Your access is all set.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="flex w-full items-center justify-center rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Go to dashboard
          </Link>
        </Shell>
      );
  }
}
