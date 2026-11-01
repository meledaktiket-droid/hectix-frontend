"use client"

import { useState } from "react"
import { ChevronUp } from "lucide-react"
import { faqSections, type FaqItem } from "./faq-data"

function FaqCard({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(true)

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(12,45,87,0.06)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left md:px-8"
      >
        <span className="text-base font-bold text-[#0C2D57]">{item.q}</span>
        <ChevronUp
          className={`h-5 w-5 shrink-0 text-[#F0613E] transition-transform duration-200 ${
            open ? "" : "rotate-180"
          }`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6 text-[15px] leading-relaxed text-neutral-700 md:px-8">
          {item.intro && <p className="mb-2">{item.intro}</p>}
          {item.steps && (
            <ol className="list-decimal space-y-1.5 pl-5 marker:text-neutral-500">
              {item.steps.map((step, i) => (
                <li key={i} className="pl-1">
                  {step}
                </li>
              ))}
            </ol>
          )}
          {item.outro && <p className="mt-3">{item.outro}</p>}
        </div>
      )}
    </div>
  )
}

export function FaqAccordion() {
  return (
    <div className="space-y-10">
      {faqSections.map((section) => (
        <section key={section.title}>
          <h2 className="mb-4 text-xl font-bold text-[#0C2D57]">{section.title}</h2>
          <div className="space-y-4">
            {section.items.map((item) => (
              <FaqCard key={item.q} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
