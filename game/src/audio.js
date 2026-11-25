// Midnight Noodle Cart — audio.js
// One clear job: every sound the cart makes, synthesised live with
// WebAudio. No audio files, no network. Mute lives here too.

let ctx = null;
let muted = false;
let musicTimer = null;
let musicStep = 0;

// A soft pentatonic loop for the 2am street: one pluck every beat.
const MUSIC_NOTES = [523.25, 587.33, 659.25, 783.99, 880.0, 783.99, 659.25, 587.33];

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  if (muted) stopMusic();
  else startMusic();
  return muted;
}

function tone(freq, durSec, type, gainValue, whenSec = 0, slideTo = null) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + whenSec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + durSec);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(gainValue, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + durSec + 0.05);
}

function noiseBurst(durSec, gainValue, lowFreq) {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * durSec);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowFreq;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t0);
}

export const sfx = {
  click() { tone(660, 0.06, 'triangle', 0.12); },
  addIngredient() { tone(520, 0.09, 'sine', 0.16); tone(780, 0.12, 'sine', 0.12, 0.05); },
  plop() { tone(300, 0.12, 'sine', 0.2, 0, 140); },
  boilStart() { noiseBurst(0.35, 0.1, 900); tone(220, 0.2, 'sine', 0.1, 0, 330); },
  noodlesReady() { tone(880, 0.12, 'sine', 0.18); tone(1174.66, 0.18, 'sine', 0.16, 0.1); },
  burnt() { tone(180, 0.3, 'sawtooth', 0.1, 0, 90); },
  serveGood() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.07));
  },
  serveWrong() { tone(220, 0.18, 'square', 0.08, 0, 160); tone(160, 0.22, 'square', 0.08, 0.12, 110); },
  customerLeaves() { tone(392, 0.25, 'sine', 0.12, 0, 196); },
  ticketArrives() { tone(1046.5, 0.08, 'sine', 0.12); tone(1318.5, 0.1, 'sine', 0.1, 0.06); },
  rushStart() {
    [392, 523.25, 659.25].forEach((f, i) => tone(f, 0.16, 'square', 0.07, i * 0.09));
  },
  starEarned() { tone(1046.5, 0.3, 'triangle', 0.18); tone(1567.98, 0.4, 'triangle', 0.14, 0.12); },
  nightClear() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => tone(f, 0.3, 'triangle', 0.15, i * 0.1));
  },
};

export function startMusic() {
  if (!ctx || muted || musicTimer) return;
  musicTimer = setInterval(() => {
    if (muted || !ctx) return;
    const note = MUSIC_NOTES[musicStep % MUSIC_NOTES.length];
    musicStep++;
    tone(note, 0.9, 'sine', 0.045);
    if (musicStep % 8 === 0) tone(note / 2, 1.8, 'sine', 0.03);
  }, 480);
}

export function stopMusic() {
  if (musicTimer) {
    clearInterval(musicTimer);
    musicTimer = null;
  }
}
