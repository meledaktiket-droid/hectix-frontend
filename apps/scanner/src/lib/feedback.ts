// Audio & haptic feedback using Web Audio API (zero external audio assets)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctx) {
      audioCtx = new Ctx();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function unlockAudio(): void {
  try {
    getAudioContext();
  } catch {
    // Ignore audio errors on restricted devices
  }
}

function playTone(
  frequency: number,
  durationMs: number,
  type: OscillatorType = 'sine',
  delayMs = 0,
  gainValue = 0.18
): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const startTime = ctx.currentTime + delayMs / 1000;
    const endTime = startTime + durationMs / 1000;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, startTime);

    gain.gain.setValueAtTime(gainValue, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, endTime);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(endTime);
  } catch {
    // Ignore audio failure
  }
}

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration failure
  }
}

export function playScanSuccess(): void {
  playTone(880, 75, 'sine', 0, 0.2);
  playTone(1320, 110, 'sine', 75, 0.22);
  vibrate(80);
}

export function playScanWarning(): void {
  playTone(540, 110, 'triangle', 0, 0.2);
  playTone(440, 130, 'triangle', 120, 0.18);
  vibrate([60, 40, 60]);
}

export function playScanError(): void {
  playTone(220, 130, 'sawtooth', 0, 0.16);
  playTone(180, 180, 'sawtooth', 140, 0.16);
  vibrate([120, 60, 120]);
}
