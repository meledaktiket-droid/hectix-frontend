export interface Point2D {
  x: number;
  y: number;
}

export interface RoiCropRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface DetectedBarcodeLike {
  rawValue: string;
  cornerPoints?: Point2D[];
  boundingBox?: { x: number; y: number; width: number; height: number };
}

export function computeVideoRoiCrop(
  video: HTMLVideoElement,
  reticle: HTMLElement | null
): RoiCropRect {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (!reticle || vw === 0 || vh === 0) {
    const side = Math.min(vw, vh);
    return {
      sx: Math.max(0, (vw - side) / 2),
      sy: Math.max(0, (vh - side) / 2),
      sw: side,
      sh: side,
    };
  }

  const vRect = video.getBoundingClientRect();
  const rRect = reticle.getBoundingClientRect();
  if (vRect.width === 0 || vRect.height === 0) {
    const side = Math.min(vw, vh);
    return { sx: (vw - side) / 2, sy: (vh - side) / 2, sw: side, sh: side };
  }

  // Account for CSS object-cover scaling and centering offset.
  const scale = Math.max(vRect.width / vw, vRect.height / vh);
  const offsetX = (vw * scale - vRect.width) / 2;
  const offsetY = (vh * scale - vRect.height) / 2;

  const rx = rRect.left - vRect.left;
  const ry = rRect.top - vRect.top;

  const sx = Math.max(0, Math.min(vw - 1, (rx + offsetX) / scale));
  const sy = Math.max(0, Math.min(vh - 1, (ry + offsetY) / scale));
  const sw = Math.max(1, Math.min(vw - sx, rRect.width / scale));
  const sh = Math.max(1, Math.min(vh - sy, rRect.height / scale));

  return { sx, sy, sw, sh };
}

export function normalizePointsToPercent(
  points: Point2D[],
  canvasW: number,
  canvasH: number
): Point2D[] {
  if (canvasW === 0 || canvasH === 0) return [];
  return points.map((p) => ({
    x: Math.max(0, Math.min(100, (p.x / canvasW) * 100)),
    y: Math.max(0, Math.min(100, (p.y / canvasH) * 100)),
  }));
}

export function extractBarcodeCorners(code: DetectedBarcodeLike): Point2D[] {
  if (code.cornerPoints && code.cornerPoints.length >= 4) {
    return code.cornerPoints.slice(0, 4);
  }
  if (code.boundingBox) {
    const { x, y, width, height } = code.boundingBox;
    return [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height },
    ];
  }
  return [];
}

export function pickClosestBarcode(
  codes: DetectedBarcodeLike[],
  canvasW: number,
  canvasH: number
): { chosen: DetectedBarcodeLike | null; multiDetected: boolean } {
  const valid = codes.filter((c) => Boolean(c.rawValue?.trim()));
  if (valid.length === 0) return { chosen: null, multiDetected: false };
  if (valid.length === 1) return { chosen: valid[0], multiDetected: false };

  const cx = canvasW / 2;
  const cy = canvasH / 2;
  let best = valid[0];
  let bestDist = Infinity;

  for (const item of valid) {
    const pts = extractBarcodeCorners(item);
    if (pts.length === 0) continue;
    const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const dist = (avgX - cx) ** 2 + (avgY - cy) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = item;
    }
  }

  return { chosen: best, multiDetected: true };
}
