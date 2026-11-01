import { Mail, Instagram, Music2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function DetailFooter() {
  return (
    <footer className="mt-8">
      <Separator />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex justify-center gap-8 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground transition-colors">Beranda</a>
          <a href="#" className="hover:text-foreground transition-colors">Bantuan</a>
          <a href="#" className="hover:text-foreground transition-colors">Buat Acara</a>
        </div>
      </div>
      <Separator />
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Hectix. All right reserved. 2026.</p>
        <div className="flex items-center gap-3">
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="h-4 w-4" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <Instagram className="h-4 w-4" />
          </a>
          <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
            <Music2 className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}
