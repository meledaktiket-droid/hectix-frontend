import { OrderDetail } from "@/components/histori/order-detail"

export default async function HistoriDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  return (
    <div className="mx-4 md:mx-10 pt-6 pb-16">
      <OrderDetail orderId={orderId} />
    </div>
  )
}
