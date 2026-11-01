"use client"

import { Lock } from "lucide-react"
import { authClient } from "@/lib/auth-client"

export function SignInGate({
  title,
  description,
  callbackURL,
}: {
  title: string
  description: string
  callbackURL: string
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-black/[0.06] bg-white p-8 text-center shadow-[0_8px_30px_rgba(12,45,87,0.08)]">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0C2D57]/10">
          <Lock className="h-6 w-6 text-[#0C2D57]" />
        </div>
        <h1 className="text-2xl font-bold text-[#0C2D57]">{title}</h1>
        <p className="mt-2 text-neutral-600">{description}</p>
        <button
          onClick={() => authClient.signIn.social({ provider: "google", callbackURL })}
          className="mt-6 cursor-pointer rounded-full bg-[#0C2D57] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Masuk dengan Google
        </button>
      </div>
    </div>
  )
}
