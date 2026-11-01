import { Typography } from "@/components/ui/typography"

type OrderItem = {
  ticketTypeName: string
  price: number
  quantity: number
}

type OrderSummaryProps = {
  eventName: string
  eventDate: string
  items: OrderItem[]
  subtotal: number
  tax: number
  serviceFee: number
  total: number
  voucherDiscount?: number
  ticketCount: number
}

function fmt(n: number) {
  return "Rp" + n.toLocaleString("id-ID")
}

export function OrderSummary({
  eventName,
  eventDate,
  items,
  subtotal,
  tax,
  serviceFee,
  total,
  voucherDiscount = 0,
  ticketCount,
}: OrderSummaryProps) {
  return (
    <div className="rounded-[20px] p-2.5 bg-[#E5E5E5] ">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="heading-s-bold" color="#1F1F1F">Detail Pembelian</Typography>
        <Typography variant="body-xl-semibold" color="#0C2D57">
          {ticketCount} Tiket
        </Typography>
      </div>
      <div className="bg-[#FAFAFA] p-2.5 rounded-[16px]">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Typography variant="body-xl-bold" color="#303030">{eventName}</Typography>
            <Typography variant="body-l-medium" color="#424242">{eventDate}</Typography>
          </div>
          {items.map((item, i) => (
            <div key={i} className="space-y-2">
              <Typography variant="body-xl-medium" color="#1F1F1F">{item.ticketTypeName}</Typography>
              <div className="flex items-center  justify-between gap-2">
                <Typography variant="body-xl-semibold" color="#256EFF">
                  {fmt(item.price)}
                </Typography>
                <Typography variant="body-xl-semibold" color="#256EFF">
                  x{item.quantity}
                </Typography>
              </div>
            </div>
          ))}
        </div>

        <div className="h-px bg-[#D6D6D6] my-2" />
        <div className="flex justify-between">
          <Typography variant="body-xl-medium" color="#575757">Subtotal</Typography>
          <Typography variant="body-xl-semibold" color="#1F1F1F">{fmt(subtotal)}</Typography>
        </div>

        {voucherDiscount > 0 && (
          <>
            <div className="h-px bg-[#D6D6D6] my-2" />
            <div className="flex justify-between">
              <Typography variant="body-xl-medium" color="#575757">Diskon Voucher</Typography>
              <Typography variant="body-xl-semibold" color="#1F1F1F">-{fmt(voucherDiscount)}</Typography>
            </div>
          </>
        )}

        <div className="h-px bg-[#D6D6D6] my-2" />
        <div className="flex justify-between">
          <Typography variant="body-xl-medium" color="#575757">Pajak</Typography>
          <Typography variant="body-xl-semibold" color="#1F1F1F">{fmt(tax)}</Typography>
        </div>

        <div className="h-px bg-[#D6D6D6] my-2" />
        <div className="flex justify-between">
          <Typography variant="body-xl-medium" color="#575757">Biaya layanan</Typography>
          <Typography variant="body-xl-semibold" color="#1F1F1F">{fmt(serviceFee)}</Typography>
        </div>

        <div className="h-px bg-[#D6D6D6] my-2" />

        <div className="flex justify-between">
          <Typography variant="body-xl-medium" color="#1F1F1F">Total ({ticketCount} tiket)</Typography>
          <Typography variant="heading-s-bold" color="#256EFF">{fmt(total)}</Typography>
        </div>
      </div>
    </div>
  )
}
