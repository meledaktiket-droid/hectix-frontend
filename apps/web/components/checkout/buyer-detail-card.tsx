import { AlertTriangle } from "lucide-react"
import { Typography } from "@/components/ui/typography"

type User = { name: string; email: string; phone?: string }

export function BuyerDetailCard({ user }: { user: User | null }) {
  return (
    <div className="rounded-xl bg-[#817E77] p-4">
      <Typography variant="heading-s-semibold" color="#FAFAFA" className="mb-3">
        Detail Pembeli
      </Typography>
      <div className="p-3 rounded-xl bg-[#E5E5E5]">
        {user ? (
          <div className="space-y-0.5">
            <Typography variant="body-xl-medium">{user.email}</Typography>
            {user.phone && (
              <Typography variant="body-xl-medium">{user.phone}</Typography>
            )}
            <div className="flex justify-end">
              <Typography variant="body-xl-semibold" color="#0C2D57">
                {user.name}
              </Typography>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <Typography variant="body-xl-medium" color="#424242">
              Untuk membeli tiket, silakan masuk dengan Google terlebih dulu.
            </Typography>
            <div className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 shrink-0">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              <span className="text-xs font-semibold text-amber-600">Penting</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
