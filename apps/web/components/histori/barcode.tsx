"use client"

import { useEffect, useRef } from "react"
import JsBarcode from "jsbarcode"

export function Barcode({ value }: { value: string }) {
  const ref = useRef<SVGSVGElement>(null)
  useEffect(() => {
    if (ref.current) {
      JsBarcode(ref.current, value, {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 60,
        width: 2,
      })
    }
  }, [value])
  return <svg ref={ref} className="w-full" />
}
