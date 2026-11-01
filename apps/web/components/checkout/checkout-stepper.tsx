import { cn } from "@/lib/utils"

type Step = 1 | 2 | 3

const STEPS = [
  { n: 1, label: "Masuk &\nPilih" },
  { n: 2, label: "Bayar" },
  { n: 3, label: "Sukses" },
]

export function CheckoutStepper({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 py-6">
      {STEPS.map((step, i) => (
        <div key={step.n} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
                current === step.n
                  ? "bg-[#0C2D57] text-white"
                  : current > step.n
                  ? "bg-[#0C2D57] text-white opacity-60"
                  : "border border-[#D6D6D6] text-[#9E9E9E]"
              )}
            >
              {step.n}
            </div>
            <span
              className={cn(
                "whitespace-pre-line text-center text-xs font-medium leading-tight",
                current >= step.n ? "text-[#0C2D57]" : "text-[#9E9E9E]"
              )}
            >
              {step.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={cn(
                "mx-4 mb-4 h-px w-16",
                current > step.n ? "bg-[#0C2D57]" : "bg-[#D6D6D6]"
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}
