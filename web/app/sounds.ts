// Lightweight synthesized move sounds (no external audio assets required).

export type MoveSoundKind =
  | "move"
  | "capture"
  | "castle"
  | "promote"
  | "check"
  | "checkmate";

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!audioCtx) audioCtx = new Ctor();
  if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
  return audioCtx;
};

const tone = (
  ctx: AudioContext,
  startTime: number,
  frequency: number,
  duration: number,
  { gain = 0.18, type = "sine" }: { gain?: number; type?: OscillatorType } = {},
) => {
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, startTime);
  amp.gain.setValueAtTime(0, startTime);
  amp.gain.linearRampToValueAtTime(gain, startTime + 0.005);
  amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
};

const noiseBurst = (
  ctx: AudioContext,
  startTime: number,
  duration: number,
  gain = 0.12,
) => {
  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, startTime);
  amp.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1200;
  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start(startTime);
  source.stop(startTime + duration);
};

export const playMoveSound = (kind: MoveSoundKind) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;

  switch (kind) {
    case "move":
      tone(ctx, now, 520, 0.09, { gain: 0.14 });
      break;
    case "capture":
      noiseBurst(ctx, now, 0.1);
      tone(ctx, now, 220, 0.12, { gain: 0.12, type: "square" });
      break;
    case "castle":
      tone(ctx, now, 440, 0.07, { gain: 0.13 });
      tone(ctx, now + 0.07, 520, 0.09, { gain: 0.13 });
      break;
    case "promote":
      tone(ctx, now, 440, 0.08, { gain: 0.13 });
      tone(ctx, now + 0.08, 587, 0.08, { gain: 0.13 });
      tone(ctx, now + 0.16, 740, 0.14, { gain: 0.15 });
      break;
    case "check":
      tone(ctx, now, 660, 0.09, { gain: 0.16, type: "triangle" });
      tone(ctx, now + 0.1, 880, 0.14, { gain: 0.16, type: "triangle" });
      break;
    case "checkmate":
      tone(ctx, now, 660, 0.12, { gain: 0.17, type: "triangle" });
      tone(ctx, now + 0.13, 440, 0.12, { gain: 0.17, type: "triangle" });
      tone(ctx, now + 0.26, 330, 0.3, { gain: 0.18, type: "triangle" });
      break;
  }
};
