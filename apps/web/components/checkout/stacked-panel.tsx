import { cn } from "@/lib/utils"

export function StackedPanel({
  stackBehind = 0,
  className,
  children,
}: {
  stackBehind?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      {Array.from({ length: stackBehind }).map((_, i) => {
        const level = stackBehind - i
        return (
          <div
            key={i}
            aria-hidden
            className="pointer-events-none absolute h-3 rounded-t-[10px] bg-[#E6EAF1] shadow-[0_-1px_5px_rgba(12,45,87,0.12)] md:hidden"
            style={{
              left: level * 14,
              right: level * 14,
              top: -(12 + (level - 1) * 8),
            }}
          />
        )
      })}
      <div className={cn("relative z-10", className)}>{children}</div>
    </div>
  )
}
