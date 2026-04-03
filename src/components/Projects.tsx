import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { FiGithub, FiExternalLink } from 'react-icons/fi';
import { MdOutlineAccountTree } from 'react-icons/md';

type Project = {
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  bullets: string[];
  tech: string[];
  github?: string;
  live?: string;
  link?: string;  // internal route (e.g. '/projects/dijkstra')
  demo?: string;  // Path to GIF/MP4 in public/demos/
  color: string;
  period: string;
};

const projects: Project[] = [
  {
    name: 'HeatShield',
    emoji: '🌡️',
    tagline: 'Personalized Heat-Risk Alert System',
    period: 'Aug 2025 – Present',
    description: 'A production-grade serverless IoT system on AWS that ingests real-time temperature and humidity readings from IoT sensors, runs a personalized heat index algorithm, and fires SMS alerts via SNS before conditions turn dangerous.',
    bullets: [
      'Built a fully serverless pipeline with AWS Lambda (Python 3.13), AWS IoT Core, DynamoDB, SNS, and SAM IaC. IoT devices publish telemetry to an IoT topic rule that triggers Lambda for immediate processing with zero server management.',
      'Engineered a personalized heat index algorithm beyond standard meteorological formulas, factoring in solar radiation, wind speed, clothing type, exertion level, heat acclimatization days, and cumulative thermal load via exponential smoothing to assign a 4-tier risk level (Green/Yellow/Orange/Red).',
      'Reduced false negatives by 35% through adaptive sensor-driven alert thresholds with a 10-minute cooldown to prevent alert fatigue, and stored all readings in DynamoDB with auto-expiring TTL to keep storage lean.',
      'Deployed via AWS SAM with CloudFormation, enabling fully reproducible infrastructure with Lambda Function URLs for HTTP access, making the entire system version-controlled and one-command deployable.',
    ],
    tech: ['AWS Lambda', 'AWS IoT Core', 'DynamoDB', 'SNS', 'Python 3.13', 'AWS SAM', 'CloudFormation'],
    color: '#ff6b35',
    github: 'https://github.com/therealdaud',
  },
  {
    name: 'QuietSpot',
    emoji: '🎙️',
    tagline: 'Crowdsourced Noise Mapping with ML Classification',
    period: 'Jan 2025 – Mar 2025',
    description: 'A crowd-sourced noise mapping web app where anyone can measure how loud their surroundings are and pin it to a live shared map. Open the app, hit record, and within 5 seconds your phone microphone captures the ambient sound level, tags your GPS location, and drops a color-coded marker on a map that anyone can browse. What makes it technically interesting is everything happening under the hood to turn raw microphone input into a calibrated, frequency-analyzed, ML-classified noise reading.',
    bullets: [
      'Wrote a custom audio processing engine in C, compiled to WebAssembly via Emscripten, running entirely in the browser with no server round-trip. It implements a Cooley-Tukey radix-2 FFT with Hann windowing, IEC 61672-1 A-weighting for perceptually accurate dBA measurement, octave-band spectrum analysis across 8 standard frequency bands, spectral centroid, temporal variance, and zero-crossing rate — six acoustic descriptors extracted per recording.',
      'Built a Python FastAPI backend with a scikit-learn Random Forest classifier that identifies the noise source from 15 acoustic features per recording — traffic, voices, construction, nature, music, or HVAC. Predictions below 42% confidence return "ambient" rather than a wrong confident-sounding label.',
      'Implemented an active learning feedback loop where user label corrections are stored as ground-truth training data and the model retrains in-process immediately, weighting real samples 5x over synthetic data. The classifier gets more accurate the more it is used, with no redeployment needed.',
      'Disabled browser AGC, echo cancellation, and noise suppression via getUserMedia constraints to preserve the full dynamic range required for environmental measurement rather than voice-call optimisation, which was the root cause of compressed readings across whisper-to-shout range.',
    ],
    tech: ['C', 'WebAssembly', 'Emscripten', 'Python', 'FastAPI', 'scikit-learn', 'React', 'Web Audio API', 'Google Maps API', 'SQLite'],
    color: '#00d4ff',
    github: 'https://github.com/therealdaud/QuietSpot-Ambient-Noise-Locator',
    live: 'https://quietspotweb.vercel.app/',
  },
  {
    name: 'WanderWise',
    emoji: '✈️',
    tagline: 'Smart Travel Budget Finder',
    period: 'Mar 2025 – Jun 2025',
    description: 'A React web app that takes a departure city and total budget, searches real flight and hotel pricing via the Air Scraper API (RapidAPI/Skyscanner data), and returns ranked trip combos that fit the budget, including a full mock mode for demos.',
    bullets: [
      'Built a budget-first trip matching engine in JavaScript. Given a departure airport and budget, it searches flights via Air Scraper API, then for each qualifying flight searches hotels and filters combos within the remaining budget.',
      'Implemented auto date window generation that creates 4 weekend (Fri-Mon) and 2 week-long (Sat-Sat) trip windows when no dates are specified, and searches across 10 popular destinations if no specific city is given.',
      'Built a full mock data engine with realistic seeded flight and hotel data across 11 cities (NYC, Miami, LA, London, Tokyo, and more) toggled by a single MOCK_MODE flag, enabling live demos with zero API calls.',
      'Designed a glassmorphism UI in React 18 with a sentence-style input form, hotel option tabs per trip, a budget breakdown bar, and rate limiting with retry delays to respect RapidAPI free-tier limits.',
    ],
    tech: ['React 18', 'JavaScript', 'Air Scraper API', 'RapidAPI', 'Axios', 'CSS'],
    color: '#7c3aed',
    github: 'https://github.com/therealdaud/WanderWise',
  },
  {
    name: 'Dijkstra Graph Visualizer',
    emoji: '🔷',
    tagline: 'Interactive Shortest-Path Algorithm Visualization',
    period: 'Spring 2024',
    description: 'A dynamic weighted graph engine written in C++ paired with an interactive Dijkstra visualizer built in React and raw SVG. Build your own graph, drag nodes around the canvas, set custom edge weights, then watch the algorithm find the shortest path one step at a time.',
    bullets: [
      'C++ core implements an adjacency list graph with full input validation covering self-loops, duplicate vertices, duplicate edges, and existence checks on all operations, backed by a clean GraphBase abstract interface.',
      'Dijkstra runs O(V² + E) via linear scan matching the C++ source exactly, with every relaxation step captured and replayed so the visualizer shows what the real code does.',
      'Interactive SVG canvas with drag to reposition nodes, click to add edges with custom weights, and a delete mode. Two preset graphs load instantly for immediate exploration.',
      'Playback controls include play, pause, step forward, step back, variable speed, and keyboard shortcuts with a live distance table showing d(v) and predecessor for every node at each step.',
    ],
    tech: ['C++', 'TypeScript', 'React', 'SVG', 'Graph Theory', 'Data Structures', 'Framer Motion'],
    color: '#00d4ff',
    github: 'https://github.com/therealdaud/cpp-dynamic-graph-dijkstra',
    link: '/projects/dijkstra',
  },
];

function TechTag({ name, color }: { name: string; color: string }) {
  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: 20,
      background: `${color}14`,
      border: `1px solid ${color}33`,
      fontSize: 11,
      color: color,
      fontFamily: 'var(--mono)',
      whiteSpace: 'nowrap',
    }}>
      {name}
    </span>
  );
}

export default function Projects() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="projects" ref={ref} style={{ background: 'var(--bg2)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">04. Projects</p>
          <h2 className="section-title">Things I've <span>Built</span></h2>
          <div className="section-divider" />
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {projects.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 20,
                overflow: 'hidden',
                transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${p.color}50`; el.style.boxShadow = `0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px ${p.color}20`; el.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none'; el.style.transform = 'translateY(0)'; }}
            >
              {/* Top accent bar */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${p.color}, ${p.color}44)` }} />

              {/* Demo GIF/Video preview */}
              {p.demo && (
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  borderBottom: '1px solid var(--border)',
                  background: '#0a0a14',
                  maxHeight: 280,
                }}>
                  {p.demo.endsWith('.mp4') ? (
                    <video
                      src={p.demo}
                      autoPlay muted loop playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <img
                      src={p.demo}
                      alt={`${p.name} demo`}
                      loading="lazy"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  {/* Gradient fade at bottom */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 40,
                    background: 'linear-gradient(transparent, var(--card))',
                  }} />
                </div>
              )}

              <div className="project-card-grid">
                <div>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 28 }}>{p.emoji}</span>
                    <div>
                      <h3 style={{ fontSize: 20, fontWeight: 800, color: 'var(--heading)' }}>{p.name}</h3>
                      <p style={{ fontSize: 13, color: p.color, fontFamily: 'var(--mono)' }}>{p.tagline}</p>
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
                      {p.period}
                    </span>
                  </div>

                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 16, maxWidth: 680 }}>
                    {p.description}
                  </p>

                  {/* Bullets */}
                  <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                    {p.bullets.map((b, bi) => (
                      <li key={bi} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>
                        <span style={{ color: p.color, flexShrink: 0, marginTop: 3 }}>▹</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Tech tags */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {p.tech.map(t => <TechTag key={t} name={t} color={p.color} />)}
                  </div>
                </div>

                {/* Links */}
                <div className="project-links">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontSize: 13, color: 'var(--text)',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = p.color; el.style.color = p.color; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.color = 'var(--text)'; }}
                    >
                      <FiGithub size={14} /> Code
                    </a>
                  )}
                  {p.live && (
                    <a
                      href={p.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: `${p.color}18`,
                        border: `1px solid ${p.color}44`,
                        fontSize: 13, color: p.color,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `${p.color}30`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `${p.color}18`; }}
                    >
                      <FiExternalLink size={14} /> Live Demo
                    </a>
                  )}
                  {p.link && (
                    <Link
                      to={p.link}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8,
                        background: `${p.color}18`,
                        border: `1px solid ${p.color}44`,
                        fontSize: 13, color: p.color,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `${p.color}30`; }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = `${p.color}18`; }}
                    >
                      <MdOutlineAccountTree size={14} /> Live Demo
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* More on GitHub */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          style={{ textAlign: 'center', marginTop: 48 }}
        >
          <a
            href="https://github.com/therealdaud"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ fontSize: 13, gap: 8 }}
          >
            <FiGithub size={16} /> View More on GitHub
          </a>
        </motion.div>
      </div>
    </section>
  );
}
