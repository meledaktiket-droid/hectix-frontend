import { useState, type FormEvent } from 'react';
import { Keyboard, X } from 'lucide-react';

interface ManualCodeModalProps {
  open: boolean;
  title: string;
  placeholder: string;
  onClose: () => void;
  onSubmit: (code: string) => void;
}

export function ManualCodeModal({
  open,
  title,
  placeholder,
  onClose,
  onSubmit,
}: ManualCodeModalProps) {
  const [value, setValue] = useState('');

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = value.trim();
    if (!cleaned) return;
    onSubmit(cleaned);
    setValue('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-white p-5 pb-8 shadow-xl md:max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-hectix-navy" />
            <h2 className="font-heading text-base font-bold text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup input manual"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="font-mono w-full rounded-xl border border-border-subtle bg-slate-50 px-4 py-3.5 text-base font-semibold tracking-wider text-slate-900 outline-none focus:border-hectix-blue focus:bg-white"
          />

          <button
            type="submit"
            disabled={!value.trim()}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-hectix-navy px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            Proses Kode
          </button>
        </form>
      </div>
    </div>
  );
}
