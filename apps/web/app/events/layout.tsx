export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(to bottom, #527599 0%, #D4D7D9 68%, #E5E5E5 100%)",
      }}
    >
      {children}
    </div>
  )
}
