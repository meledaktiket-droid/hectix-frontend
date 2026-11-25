import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import jsQR from 'jsqr';
import {
  computeVideoRoiCrop,
  extractBarcodeCorners,
  normalizePointsToPercent,
  pickClosestBarcode,
  type DetectedBarcodeLike,
  type Point2D,
} from '../lib/qrRoi';

interface UseQrCameraOptions {
  paused?: boolean;
  reticleRef: RefObject<HTMLDivElement | null>;
  onScan: (code: string) => void;
}

interface BarcodeDetectorLike {
  detect(source: ImageBitmapSource): Promise<DetectedBarcodeLike[]>;
}

const ROI_CANVAS_SIZE = 440;
const TARGET_LOCK_DELAY_MS = 120;

export function useQrCamera({ paused = false, reticleRef, onScan }: UseQrCameraOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onScanRef = useRef(onScan);
  const lastCodeRef = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const lockTimerRef = useRef<number | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [torchOn, setTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectedBox, setDetectedBox] = useState<Point2D[] | null>(null);
  const [multiDetected, setMultiDetected] = useState(false);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopStream = useCallback(() => {
    if (lockTimerRef.current !== null) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
    setHasTorch(false);
    setTorchOn(false);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      stopStream();
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Kamera tidak tersedia di browser ini. Gunakan Input Manual.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        if (track && typeof track.getCapabilities === 'function') {
          const caps = track.getCapabilities() as MediaTrackCapabilities & {
            torch?: boolean;
          };
          setHasTorch(Boolean(caps.torch));
        }

        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          if (!cancelled) {
            setIsReady(true);
          }
        }
      } catch (err) {
        if (!cancelled) {
          const msg =
            err instanceof Error && err.name === 'NotAllowedError'
              ? 'Izin kamera ditolak. Aktifkan izin kamera atau gunakan Input Manual.'
              : 'Kamera tidak ditemukan / sedang dipakai aplikasi lain.';
          setError(msg);
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode, stopStream]);

  useEffect(() => {
    if (!isReady || paused) return;

    let rafId = 0;
    let lastTick = 0;
    let detecting = false;

    const DetectorCtor = (
      window as unknown as {
        BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
      }
    ).BarcodeDetector;
    const detector = DetectorCtor ? new DetectorCtor({ formats: ['qr_code'] }) : null;

    const handleDetected = (raw: string, corners: Point2D[], isMulti: boolean) => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const now = Date.now();
      if (
        lastCodeRef.current.code === trimmed &&
        now - lastCodeRef.current.at < 1500
      ) {
        return;
      }
      lastCodeRef.current = { code: trimmed, at: now };

      const normalized = normalizePointsToPercent(
        corners,
        ROI_CANVAS_SIZE,
        ROI_CANVAS_SIZE
      );
      setDetectedBox(normalized.length >= 4 ? normalized : null);
      setMultiDetected(isMulti);

      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current);
      }
      lockTimerRef.current = window.setTimeout(() => {
        onScanRef.current(trimmed);
        setDetectedBox(null);
        setMultiDetected(false);
        lockTimerRef.current = null;
      }, TARGET_LOCK_DELAY_MS);
    };

    const tick = async (time: number) => {
      rafId = requestAnimationFrame(tick);
      if (detecting || lockTimerRef.current !== null || time - lastTick < 65) {
        return;
      }

      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      lastTick = time;
      detecting = true;

      try {
        let canvas = canvasRef.current;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvasRef.current = canvas;
        }
        if (canvas.width !== ROI_CANVAS_SIZE || canvas.height !== ROI_CANVAS_SIZE) {
          canvas.width = ROI_CANVAS_SIZE;
          canvas.height = ROI_CANVAS_SIZE;
        }

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        // Crop strictly to the reticle region so QR codes outside the box are ignored.
        const crop = computeVideoRoiCrop(video, reticleRef.current);
        ctx.drawImage(
          video,
          crop.sx,
          crop.sy,
          crop.sw,
          crop.sh,
          0,
          0,
          ROI_CANVAS_SIZE,
          ROI_CANVAS_SIZE
        );

        if (detector) {
          const codes = await detector.detect(canvas);
          const { chosen, multiDetected: isMulti } = pickClosestBarcode(
            codes,
            ROI_CANVAS_SIZE,
            ROI_CANVAS_SIZE
          );
          if (chosen?.rawValue) {
            handleDetected(chosen.rawValue, extractBarcodeCorners(chosen), isMulti);
          }
        } else {
          const imgData = ctx.getImageData(0, 0, ROI_CANVAS_SIZE, ROI_CANVAS_SIZE);
          const result = jsQR(imgData.data, ROI_CANVAS_SIZE, ROI_CANVAS_SIZE, {
            inversionAttempts: 'dontInvert',
          });
          if (result?.data) {
            const corners: Point2D[] = [
              result.location.topLeftCorner,
              result.location.topRightCorner,
              result.location.bottomRightCorner,
              result.location.bottomLeftCorner,
            ];
            handleDetected(result.data, corners, false);
          }
        }
      } catch {
        // Ignore single-frame decode errors.
      } finally {
        detecting = false;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
      if (lockTimerRef.current !== null) {
        window.clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    };
  }, [isReady, paused, reticleRef]);

  const toggleTorch = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !hasTorch) return;
    const next = !torchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      // Ignore unsupported torch constraints.
    }
  }, [hasTorch, torchOn]);

  const flipCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  return {
    videoRef,
    isReady,
    error,
    facingMode,
    torchOn,
    hasTorch,
    detectedBox: paused ? null : detectedBox,
    multiDetected: paused ? false : multiDetected,
    toggleTorch,
    flipCamera,
  };
}
