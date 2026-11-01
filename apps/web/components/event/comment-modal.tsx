"use client"

import { useState } from "react"
import { Dialog } from "radix-ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Typography } from "@/components/ui/typography"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { authClient } from "@/lib/auth-client"

const MAX_LEN = 150
const DEFAULT_AVATAR = "https://api.dicebear.com/9.x/thumbs/svg"

type Comment = {
  id: string
  content: string
  createdAt: string
  author: { name: string; image: string | null }
}

export function CommentModal({
  eventId,
  open,
  onOpenChange,
  canComment,
}: {
  eventId: string
  open: boolean
  onOpenChange: (v: boolean) => void
  canComment: boolean
}) {
  const qc = useQueryClient()
  const [draft, setDraft] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
  })
  const isLoggedIn = !!session?.data?.user

  const { data } = useQuery<{ comments: Comment[] }>({
    queryKey: ["event-comments", eventId],
    queryFn: () => fetch(`/api/events/${eventId}/comments`).then((r) => r.json()),
    enabled: open,
  })
  const comments = data?.comments ?? []

  const mutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) throw new Error("Failed to post comment")
      return (await res.json()) as Comment
    },
    onSuccess: (created) => {
      qc.setQueryData<{ comments: Comment[] }>(
        ["event-comments", eventId],
        (old) => ({ comments: [created, ...(old?.comments ?? [])] }),
      )
      qc.setQueryData(["event", eventId], (old: unknown) =>
        old && typeof old === "object"
          ? { ...old, commentCount: ((old as { commentCount?: number }).commentCount ?? 0) + 1 }
          : old,
      )
      setDraft("")
    },
  })

  const remaining = MAX_LEN - draft.length
  const canPost = draft.trim().length > 0 && !mutation.isPending

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,720px)] max-h-[88vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
          <div className="flex items-baseline justify-between">
            <Dialog.Title asChild>
              <Typography variant="body-xl-semibold" color="#0C2D57" className="text-2xl">
                Komentar
              </Typography>
            </Dialog.Title>
            <Typography variant="body-s-medium" color="#9E9E9E">
              Tinggalkan sesuatu untuk yang lain.
            </Typography>
          </div>

          <div className="relative mt-4 rounded-xl bg-[#E9EDF2] p-3">
            <div className={cn("flex flex-wrap gap-2", expandedId && "blur-sm")}>
              {comments.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setExpandedId(c.id)}
                  className="flex items-center gap-1 rounded-full bg-white px-2 py-1 max-w-[220px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.author.image ?? DEFAULT_AVATAR}
                    alt=""
                    className="h-5 w-5 shrink-0 rounded-full object-cover"
                  />
                  <span className="truncate text-sm">{c.content}</span>
                </button>
              ))}
              {comments.length === 0 && (
                <Typography variant="body-s-medium" color="#9E9E9E">
                  Jadilah yang pertama berkomentar.
                </Typography>
              )}
            </div>

            {expandedId && (
              <button
                className="absolute inset-0 flex items-center justify-center p-4"
                onClick={() => setExpandedId(null)}
              >
                <div className="max-w-[80%] rounded-xl bg-white px-4 py-3 shadow-lg">
                  <span className="text-sm">
                    {comments.find((c) => c.id === expandedId)?.content}
                  </span>
                </div>
              </button>
            )}
          </div>

          {canComment ? (
            <div className="mt-4 rounded-xl bg-white p-3 shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
              <Typography variant="body-s-medium" color="#9E9E9E">
                {remaining} karakter
              </Typography>
              <textarea
                value={draft}
                maxLength={MAX_LEN}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Tulis komentar..."
                className="mt-1 w-full resize-none text-[15px] outline-none"
                rows={2}
              />
              <div className="flex justify-end">
                <Button
                  onClick={() => mutation.mutate(draft.trim())}
                  disabled={!canPost}
                  className="bg-[#0C2D57] hover:bg-[#0C2D57]/90 text-white rounded-full px-6 disabled:opacity-50"
                >
                  {mutation.isPending ? "..." : "Posting"}
                </Button>
              </div>
              {mutation.isError && (
                <Typography variant="body-s-medium" color="#E92A67" className="mt-1 block">
                  Gagal posting. Coba lagi.
                </Typography>
              )}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-center gap-2 rounded-xl bg-white p-4 text-center shadow-[0_1px_8px_rgba(0,0,0,0.08)]">
              {isLoggedIn ? (
                <Typography variant="body-s-medium" color="#9E9E9E">
                  Beli tiket dulu untuk ikut berkomentar.
                </Typography>
              ) : (
                <>
                  <Typography variant="body-s-medium" color="#9E9E9E">
                    Masuk untuk ikut berkomentar.
                  </Typography>
                  <Button
                    onClick={() =>
                      authClient.signIn.social({ provider: "google", callbackURL: `/events/${eventId}` })
                    }
                    className="bg-[#0C2D57] hover:bg-[#0C2D57]/90 text-white rounded-full px-6"
                  >
                    Masuk
                  </Button>
                </>
              )}
            </div>
          )}

          <Typography variant="body-xl-semibold" color="#0C2D57" className="mt-6 mb-2 block text-xl">
            Siapa Saja
          </Typography>
          <div className="max-h-64 space-y-3 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex items-center gap-3 border-b border-neutral-100 pb-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.author.image ?? DEFAULT_AVATAR}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <Typography variant="body-xl-semibold" color="#1A1A1A" className="block truncate">
                    {c.author.name}
                  </Typography>
                  <Typography variant="body-s-medium" color="#9E9E9E" className="block truncate">
                    {c.content}
                  </Typography>
                </div>
              </div>
            ))}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
