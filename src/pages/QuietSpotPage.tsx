import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiArrowLeft, FiGithub, FiExternalLink,
  FiMic, FiMicOff, FiChevronDown,
} from 'react-icons/fi';

// ── Constants ─────────────────────────────────────────────────────────────────
const COLOR      = '#00d4ff';
const FFT_SZ     = 2048;

const BAND_CENTERS = [31.5, 63, 125, 250, 500, 1000, 2000, 4000];
const BAND_LABELS  = ['31', '63', '125', '250', '500', '1k', '2k', '4k'];

// ── IEC 61672-1 A-weighting, normalised at 1 kHz ─────────────────────────────
const A_NORM = 0.7943; // Ra(1000 Hz)
function aWeight(f: number): number {
  if (f <= 0) return 0;
  const f2 = f * f;
  const f4 = f2 * f2;
  const Ra =
    (12200 ** 2 * f4) /
    ((f2 + 20.6 ** 2) *
      Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) *
      (f2 + 12200 ** 2));
  return Ra / A_NORM;
}

// ── Map a frequency to an octave band index ───────────────────────────────────
function getBandIdx(freq: number): number {
  for (let i = 0; i < BAND_CENTERS.length; i++) {
    const lo = BAND_CENTERS[i] / Math.SQRT2;
    const hi = BAND_CENTERS[i] * Math.SQRT2;
    if (freq >= lo && freq < hi) return i;
  }
  return -1;
}

// ── Heuristic noise classifier ────────────────────────────────────────────────
type NoiseClass =
  | 'Traffic' | 'Voices' | 'Construction'
  | 'Nature'  | 'Music'  | 'HVAC'
  | 'Ambient' | 'Silence';

function classify(
  bandDb: number[],
  totalDb: number,
): { label: NoiseClass; confidence: number } {
  if (totalDb < 30) return { label: 'Silence', confidence: 0.97 };
  if (totalDb < 38) return { label: 'Ambient', confidence: 0.82 };

  const pow  = bandDb.map(db => 10 ** (db / 10));
  const tot  = pow.reduce((s, p) => s + p, 0) || 1;
  const n    = pow.map(p => p / tot);

  const bass  = n[0] + n[1] + n[2];   // 31 to 125 Hz
  const low   = n[3] + n[4];           // 250 to 500 Hz
  const mid   = n[5];                  // 1 kHz
  const high  = n[6] + n[7];          // 2 to 4 kHz
  const voice = low + mid + n[6];

  if (bass  > 0.50 && totalDb > 50) return { label: 'Traffic',      confidence: Math.min(0.90, bass + 0.05) };
  if (bass  > 0.45 && totalDb < 60) return { label: 'HVAC',         confidence: 0.74 };
  if (voice > 0.55 && low   > 0.25) return { label: 'Voices',       confidence: Math.min(0.88, voice) };
  if (high  > 0.25 && bass  > 0.20) return { label: 'Music',        confidence: 0.76 };
  if (totalDb < 65 && (low + mid) > 0.40 && bass < 0.30)
                                     return { label: 'Nature',       confidence: 0.71 };
  if (totalDb > 70)                  return { label: 'Construction', confidence: 0.80 };
  return                                    { label: 'Ambient',      confidence: 0.60 };
}

const NOISE_COLOR: Record<NoiseClass, string> = {
  Traffic:      '#ef4444',
  Voices:       '#f59e0b',
  Construction: '#f97316',
  Nature:       '#22c55e',
  Music:        '#a855f7',
  HVAC:         '#6366f1',
  Ambient:      '#00d4ff',
  Silence:      '#475569',
};

function riskTier(db: number) {
  if (db < 50) return { label: 'Safe',      color: '#22c55e', tier: 'Green'  };
  if (db < 65) return { label: 'Moderate',  color: '#eab308', tier: 'Yellow' };
  if (db < 75) return { label: 'Elevated',  color: '#f97316', tier: 'Orange' };
  return              { label: 'Hazardous', color: '#ef4444', tier: 'Red'    };
}

// ── How it works cards ────────────────────────────────────────────────────────
const HOW_IT_WORKS = [
  {
    icon: '⚡',
    title: 'C WebAssembly Audio Engine',
    body: 'A custom audio processing engine written in C and compiled to WebAssembly via Emscripten runs entirely in the browser with no server round trip. It implements a Cooley-Tukey radix-2 FFT with Hann windowing, IEC 61672-1 A-weighting, and octave band spectrum analysis across 8 standard frequency bands, producing 6 acoustic descriptors per recording.',
  },
  {
    icon: '🤖',
    title: 'Random Forest Classifier',
    body: 'A scikit-learn Random Forest running in a Python FastAPI backend identifies the noise source from 15 acoustic features per recording across 6 categories: traffic, voices, construction, nature, music, and HVAC. Predictions below 42% confidence fall back to "ambient" instead of surfacing an overconfident wrong label.',
  },
  {
    icon: '🔄',
    title: 'Active Learning Loop',
    body: 'User label corrections are stored as ground truth training data and the model retrains in process immediately, weighting real samples 5x over synthetic data. The classifier improves the more it is used with no redeployment needed.',
  },
  {
    icon: '🎛️',
    title: 'AGC and Noise Suppression Bypass',
    body: 'Browser automatic gain control, echo cancellation, and noise suppression are disabled via getUserMedia constraints to preserve the full dynamic range needed for environmental measurement. This was the root cause of compressed dB readings across the whisper to shout range.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function QuietSpotPage() {
  const navigate = useNavigate();
  const demoRef  = useRef<HTMLDivElement>(null);

  const [listening,  setListening]  = useState(false);
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [dbLevel,    setDbLevel]    = useState(0);
  const [bandLevels, setBandLevels] = useState<number[]>(Array(8).fill(0));
  const [noiseClass, setNoiseClass] = useState<{ label: NoiseClass; confidence: number }>({ label: 'Ambient', confidence: 0 });
  const [waveform,   setWaveform]   = useState<number[]>(Array(64).fill(0));

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Cleanup on unmount
  useEffect(() => () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
  }, []);

  // ── Animation loop ───────────────────────────────────────────────────────────
  const tick = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx      = audioCtxRef.current;
    if (!analyser || !ctx) return;

    const binCount = analyser.frequencyBinCount;
    const freqBuf  = new Float32Array(binCount);
    const timeBuf  = new Uint8Array(binCount);
    analyser.getFloatFrequencyData(freqBuf);
    analyser.getByteTimeDomainData(timeBuf);

    const binHz = ctx.sampleRate / (binCount * 2);

    // A-weighted total level
    let aPow = 0;
    for (let i = 1; i < binCount; i++) {
      const f   = i * binHz;
      const lin = 10 ** (freqBuf[i] / 10);
      const wa  = aWeight(f);
      aPow += lin * wa * wa;
    }
    const totalDb = Math.max(0, 10 * Math.log10(aPow) + 90);

    // Per-band power
    const bandPow = Array(8).fill(0);
    const bandCnt = Array(8).fill(0);
    for (let i = 1; i < binCount; i++) {
      const bi = getBandIdx(i * binHz);
      if (bi < 0) continue;
      bandPow[bi] += 10 ** (freqBuf[i] / 10);
      bandCnt[bi]++;
    }
    const bandDb = bandPow.map((p, i) =>
      bandCnt[i] > 0 ? Math.max(0, 10 * Math.log10(p / bandCnt[i]) + 90) : 0,
    );

    // Waveform (64 samples)
    const step = Math.floor(timeBuf.length / 64);
    const wave = Array.from({ length: 64 }, (_, j) => (timeBuf[j * step] - 128) / 128);

    setDbLevel(totalDb);
    setBandLevels(bandDb);
    setNoiseClass(classify(bandDb, totalDb));
    setWaveform(wave);

    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Mic controls ─────────────────────────────────────────────────────────────
  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl:  false,
        },
      });
      setPermission('granted');
      streamRef.current = stream;

      const ctx      = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize               = FFT_SZ;
      analyser.smoothingTimeConstant = 0.80;
      ctx.createMediaStreamSource(stream).connect(analyser);

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      setListening(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setPermission('denied');
    }
  };

  const stopListening = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current   = null;
    setListening(false);
    setDbLevel(0);
    setBandLevels(Array(8).fill(0));
    setWaveform(Array(64).fill(0));
    setNoiseClass({ label: 'Ambient', confidence: 0 });
  };

  const risk = riskTier(dbLevel);

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* Sticky nav */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(12px)',
        background: 'rgba(10,10,20,0.85)',
        borderBottom: '1px solid var(--border)',
        padding: '12px 24px',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none',
            color: COLOR, cursor: 'pointer',
            fontSize: 14, fontFamily: 'var(--mono)',
          }}
        >
          <FiArrowLeft size={16} /> cd ~/projects
        </button>
      </div>

      {/* Hero */}
      <div className="container" style={{ paddingTop: 64, paddingBottom: 56 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 56, lineHeight: 1 }}>🎙️</span>
            <div>
              <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: 'var(--heading)', lineHeight: 1.1, margin: 0 }}>
                QuietSpot
              </h1>
              <p style={{ color: COLOR, fontFamily: 'var(--mono)', fontSize: 14, marginTop: 4 }}>
                Crowdsourced Noise Mapping with ML Classification
              </p>
            </div>
            <span style={{
              marginLeft: 'auto',
              fontFamily: 'var(--mono)', fontSize: 11,
              color: 'var(--muted)',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '3px 10px', borderRadius: 20,
              whiteSpace: 'nowrap',
            }}>
              Jan 2025 – Mar 2025
            </span>
          </div>

          <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, maxWidth: 700, marginBottom: 28 }}>
            A crowd-sourced noise mapping web app where anyone can measure how loud their surroundings are and pin it to a live shared map. Open the app, hit record, and within 5 seconds your phone microphone captures the ambient sound level, tags your GPS location, and drops a color coded marker on a map that anyone can browse.
          </p>

          {/* Tech tags */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28 }}>
            {['C', 'WebAssembly', 'Emscripten', 'Python', 'FastAPI', 'scikit-learn', 'React', 'Web Audio API', 'Google Maps API', 'SQLite'].map(t => (
              <span key={t} style={{
                padding: '4px 12px', borderRadius: 20,
                background: `${COLOR}14`, border: `1px solid ${COLOR}33`,
                fontSize: 11, color: COLOR, fontFamily: 'var(--mono)',
              }}>{t}</span>
            ))}
          </div>

          {/* Action links */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 56 }}>
            <a
              href="https://github.com/therealdaud/QuietSpot-Ambient-Noise-Locator"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 13, color: 'var(--text)', textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <FiGithub size={14} /> Source Code
            </a>
            <a
              href="https://quietspotweb.vercel.app/"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 18px', borderRadius: 8,
                background: `${COLOR}18`, border: `1px solid ${COLOR}44`,
                fontSize: 13, color: COLOR, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
            >
              <FiExternalLink size={14} /> Live App
            </a>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            onClick={() => demoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              cursor: 'pointer', color: 'var(--muted)',
            }}
          >
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>
              scroll to demo
            </span>
            <motion.div
              animate={{ y: [0, 7, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <FiChevronDown size={20} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Live Demo ──────────────────────────────────────────────────────────── */}
      <div
        ref={demoRef}
        style={{
          background: 'var(--bg2)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '72px 0',
        }}
      >
        <div className="container">
          <p className="section-label">Live Browser Demo</p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: 'var(--heading)', marginBottom: 10 }}>
            Real-Time Noise Analysis
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 40, maxWidth: 540 }}>
            Grant microphone access to see A-weighted dBA measurement, octave band spectrum analysis,
            and noise source classification running live in your browser.
          </p>

          {/* Mic toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36, flexWrap: 'wrap' }}>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={listening ? stopListening : startListening}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 28px', borderRadius: 12,
                background: listening ? '#ef444418' : `${COLOR}18`,
                border: `1px solid ${listening ? '#ef4444' : COLOR}`,
                color: listening ? '#ef4444' : COLOR,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
              }}
            >
              {listening ? <FiMicOff size={16} /> : <FiMic size={16} />}
              {listening ? 'Stop Microphone' : 'Activate Microphone'}
            </motion.button>

            {permission === 'denied' && (
              <span style={{ fontSize: 12, color: '#ef4444', fontFamily: 'var(--mono)' }}>
                Microphone access denied — check browser permissions.
              </span>
            )}
            {listening && (
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#22c55e', fontFamily: 'var(--mono)' }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                Listening
              </motion.span>
            )}
          </div>

          {/* dB meter + Noise classification */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 20 }}>

            {/* dB Meter */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>
                Sound Level
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                <span style={{
                  fontSize: 72, fontWeight: 900, lineHeight: 1,
                  fontFamily: 'var(--mono)',
                  color: risk.color,
                  transition: 'color 0.3s',
                }}>
                  {Math.round(dbLevel)}
                </span>
                <span style={{ fontSize: 16, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>dBA</span>
              </div>
              {/* Level bar */}
              <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 14 }}>
                <motion.div
                  animate={{ width: `${Math.min(100, dbLevel)}%` }}
                  transition={{ duration: 0.08 }}
                  style={{ height: '100%', borderRadius: 4, background: `linear-gradient(90deg, #22c55e, ${risk.color})`, transition: 'background 0.3s' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: risk.color, display: 'inline-block', transition: 'background 0.3s' }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: risk.color, transition: 'color 0.3s' }}>
                  {risk.tier} · {risk.label}
                </span>
              </div>
              {/* Risk scale */}
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { label: 'Safe', color: '#22c55e', range: '<50' },
                  { label: 'Mod',  color: '#eab308', range: '50-65' },
                  { label: 'High', color: '#f97316', range: '65-75' },
                  { label: 'Haz',  color: '#ef4444', range: '>75' },
                ].map(r => (
                  <div key={r.label} style={{
                    flex: 1, padding: '4px 0', borderRadius: 4, textAlign: 'center',
                    background: `${r.color}14`, border: `1px solid ${r.color}28`,
                  }}>
                    <div style={{ fontSize: 9, color: r.color, fontFamily: 'var(--mono)', fontWeight: 700 }}>{r.label}</div>
                    <div style={{ fontSize: 8, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{r.range} dBA</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Noise classification */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 2 }}>
                Noise Source
              </p>
              <div style={{ marginBottom: 16 }}>
                <span style={{
                  padding: '6px 20px', borderRadius: 20,
                  fontWeight: 700, fontSize: 22,
                  background: `${NOISE_COLOR[noiseClass.label]}18`,
                  border: `1px solid ${NOISE_COLOR[noiseClass.label]}44`,
                  color: NOISE_COLOR[noiseClass.label],
                  transition: 'all 0.3s',
                }}>
                  {noiseClass.label}
                </span>
              </div>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>
                Confidence: {listening ? Math.round(noiseClass.confidence * 100) : 0}%
              </p>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: 20 }}>
                <motion.div
                  animate={{ width: `${listening ? Math.round(noiseClass.confidence * 100) : 0}%` }}
                  transition={{ duration: 0.3 }}
                  style={{ height: '100%', borderRadius: 3, background: NOISE_COLOR[noiseClass.label], transition: 'background 0.3s' }}
                />
              </div>
              {/* Class chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(['Traffic', 'Voices', 'Construction', 'Nature', 'Music', 'HVAC', 'Ambient', 'Silence'] as NoiseClass[]).map(cls => (
                  <span key={cls} style={{
                    padding: '2px 10px', borderRadius: 12,
                    fontSize: 11, fontFamily: 'var(--mono)',
                    background: noiseClass.label === cls ? `${NOISE_COLOR[cls]}22` : 'transparent',
                    border: `1px solid ${noiseClass.label === cls ? NOISE_COLOR[cls] : 'rgba(255,255,255,0.07)'}`,
                    color: noiseClass.label === cls ? NOISE_COLOR[cls] : 'var(--muted)',
                    transition: 'all 0.3s',
                  }}>
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Octave band spectrum */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: 28, marginBottom: 20 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 2 }}>
              Octave Band Spectrum (A-Weighted)
            </p>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
              {BAND_LABELS.map((label, i) => {
                const pct = Math.min(100, (bandLevels[i] / 90) * 100);
                return (
                  <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%' }}>
                    <div style={{
                      flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end',
                      background: 'rgba(255,255,255,0.03)', borderRadius: 6, overflow: 'hidden',
                    }}>
                      <motion.div
                        animate={{ height: `${pct}%` }}
                        transition={{ duration: 0.08 }}
                        style={{
                          width: '100%', borderRadius: 6,
                          background: `linear-gradient(to top, ${COLOR}, ${COLOR}55)`,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Waveform */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 16, padding: '22px 28px' }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: 2 }}>
              Time Domain Waveform
            </p>
            <svg viewBox="0 0 640 60" preserveAspectRatio="none" style={{ width: '100%', height: 60, display: 'block' }}>
              <line x1="0" y1="30" x2="640" y2="30" stroke={`${COLOR}15`} strokeWidth={1} />
              <polyline
                points={waveform.map((v, i) => `${(i / 63) * 640},${30 + v * 28}`).join(' ')}
                fill="none"
                stroke={COLOR}
                strokeWidth={1.5}
                strokeLinejoin="round"
                opacity={listening ? 0.85 : 0.15}
              />
            </svg>
          </div>
        </div>
      </div>

      {/* ── How it works ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '80px 0' }}>
        <div className="container">
          <p className="section-label">Technical Breakdown</p>
          <h2 style={{ fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 800, color: 'var(--heading)', marginBottom: 10 }}>
            How It Works
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 40, maxWidth: 580 }}>
            Under the hood, QuietSpot chains a compiled C audio engine, a Python ML backend, and an active learning loop — all invisible to the end user.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 20 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderTop: `3px solid ${COLOR}44`,
                  borderRadius: 16,
                  padding: 24,
                }}
              >
                <span style={{ fontSize: 28, display: 'block', marginBottom: 14 }}>{item.icon}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)', marginBottom: 10 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.75 }}>{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer CTA ─────────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '56px 0', textAlign: 'center' }}>
        <div className="container">
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
            Want to pin a noise reading on the live map?
          </p>
          <a
            href="https://quietspotweb.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ fontSize: 13, gap: 8, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
          >
            <FiExternalLink size={14} /> Open Full App
          </a>
        </div>
      </div>
    </div>
  );
}
