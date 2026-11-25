import { useRef } from 'react';
import { CameraOff, Flashlight, Keyboard, RefreshCcw } from 'lucide-react';
import { useQrCamera } from '../hooks/useQrCamera';

interface CameraViewfinderProps {
  guideText: string;
  paused?: boolean;
  accentColor?: 'navy' | 'green' | 'amber' | 'blue';
  onScan: (code: string) => void;
  onManualInput: () => void;
}

const CORNER_COLOR = {
  navy: 'border-white',
  blue: 'border-blue-400',
  green: 'border-emerald-400',
  amber: 'border-amber-400',
};

const LASER_COLOR = {
  navy: 'bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.85)]',
  blue: 'bg-blue-400 shadow-[0_0_12px_rgba(96,165,250,0.9)]',
  green: 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]',
  amber: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)]',
};

const LOCK_STROKE = {
  navy: '#FFFFFF',
  blue: '#60A5FA',
  green: '#34D399',
  amber: '#FBBF24',
};

export function CameraViewfinder({
  guideText,
  paused = false,
  accentColor = 'navy',
  onScan,
  onManualInput,
}: CameraViewfinderProps) {
  const reticleRef = useRef<HTMLDivElement | null>(null);
  const {
    videoRef,
    isReady,
    error,
    torchOn,
    hasTorch,
    detectedBox,
    multiDetected,
    toggleTorch,
    flipCamera,
  } = useQrCamera({ paused, reticleRef, onScan });

  const cornerClass = CORNER_COLOR[accentColor];
  const laserClass = LASER_COLOR[accentColor];
  const lockStroke = LOCK_STROKE[accentColor];
  const polygonPoints = detectedBox
    ? detectedBox.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : '';

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-slate-950 text-white">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`h-full w-full object-cover transition-opacity duration-200 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-4">
        <div className="rounded-full bg-slate-900/70 px-3 py-1 text-[11px] font-medium text-slate-200 backdrop-blur-xs">
          {paused
            ? 'Kamera Dijeda'
            : detectedBox
              ? 'QR Terkunci'
              : isReady
                ? 'Pindai di Dalam Kotak'
                : 'Membuka Kamera...'}
        </div>

        <div className="flex items-center gap-2">
          {hasTorch && (
            <button
              type="button"
              onClick={toggleTorch}
              aria-label="Toggle Senter"
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-xs transition ${
                torchOn
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-900/70 text-white hover:bg-slate-800'
              }`}
            >
              <Flashlight className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={flipCamera}
            aria-label="Putar Kamera"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/70 text-white backdrop-blur-xs transition hover:bg-slate-800"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
            <CameraOff className="h-7 w-7" />
          </div>
          <p className="mt-3 max-w-xs text-sm font-medium text-slate-200">{error}</p>
          <button
            type="button"
            onClick={onManualInput}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-xl bg-hectix-blue px-5 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <Keyboard className="h-4 w-4" />
            Ketik Kode Manual
          </button>
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div
            ref={reticleRef}
            className="relative h-60 w-60 overflow-hidden rounded-2xl shadow-[0_0_0_9999px_rgba(2,6,23,0.58)]"
          >
            <span
              className={`absolute left-0 top-0 h-8 w-8 rounded-tl-2xl border-l-4 border-t-4 ${cornerClass}`}
            />
            <span
              className={`absolute right-0 top-0 h-8 w-8 rounded-tr-2xl border-r-4 border-t-4 ${cornerClass}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-8 w-8 rounded-bl-2xl border-b-4 border-l-4 ${cornerClass}`}
            />
            <span
              className={`absolute bottom-0 right-0 h-8 w-8 rounded-br-2xl border-b-4 border-r-4 ${cornerClass}`}
            />

            {isReady && !paused && !detectedBox && (
              <div
                className={`animate-scan-line absolute inset-x-3 h-0.5 rounded-full ${laserClass}`}
              />
            )}

            {detectedBox && (
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
              >
                <polygon
                  points={polygonPoints}
                  fill={lockStroke}
                  fillOpacity="0.18"
                  stroke={lockStroke}
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                  className="transition-all duration-100"
                />
              </svg>
            )}

            {multiDetected && (
              <div className="absolute inset-x-0 top-2 flex justify-center">
                <span className="rounded-full bg-slate-900/85 px-2.5 py-0.5 text-[10px] font-semibold text-white">
                  Fokus QR Terdekat
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-3 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent px-4 pb-5 pt-8">
        <p className="text-center text-xs font-medium text-slate-100">{guideText}</p>
        <button
          type="button"
          onClick={onManualInput}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-xs font-semibold text-white backdrop-blur-xs transition hover:bg-white/20 active:scale-[0.98]"
        >
          <Keyboard className="h-4 w-4" />
          Input Kode Manual
        </button>
      </div>
    </div>
  );
}
