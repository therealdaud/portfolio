import { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiArrowDown, FiGithub, FiLinkedin, FiMail, FiCloud, FiDownload } from 'react-icons/fi';

const roles = [
  'Machine Learning Engineer',
  'Full Stack Developer',
  'Cloud Architect',
  'Problem Solver',
];

function useTypingEffect(words: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState('');
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    const delay = deleting ? 40 : charIdx === current.length ? pause : speed;
    const timer = setTimeout(() => {
      if (!deleting && charIdx < current.length) {
        setDisplay(current.slice(0, charIdx + 1));
        setCharIdx(c => c + 1);
      } else if (!deleting && charIdx === current.length) {
        setDeleting(true);
      } else if (deleting && charIdx > 0) {
        setDisplay(current.slice(0, charIdx - 1));
        setCharIdx(c => c - 1);
      } else {
        setDeleting(false);
        setWordIdx(w => (w + 1) % words.length);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);

  return display;
}

// Smooth lerp helper
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function AvatarWithTilt() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  // Current & target rotation values
  const current = useRef({ rotX: 0, rotY: 0, shine: { x: 50, y: 50 } });
  const target  = useRef({ rotX: 0, rotY: 0, shine: { x: 50, y: 50 } });
  const isHovering = useRef(false);

  const MAX_TILT = 18; // degrees
  const LERP_SPEED = 0.08; // lower = smoother / lazier

  const animate = useCallback(() => {
    const c = current.current;
    const t = target.current;
    const el = containerRef.current;
    if (!el) { rafRef.current = requestAnimationFrame(animate); return; }

    // Smoothly interpolate toward target
    c.rotX = lerp(c.rotX, t.rotX, LERP_SPEED);
    c.rotY = lerp(c.rotY, t.rotY, LERP_SPEED);
    c.shine.x = lerp(c.shine.x, t.shine.x, LERP_SPEED);
    c.shine.y = lerp(c.shine.y, t.shine.y, LERP_SPEED);

    el.style.transform = `perspective(700px) rotateX(${c.rotX}deg) rotateY(${c.rotY}deg)`;

    // Dynamic glow follows tilt direction
    const glowEl = el.querySelector('.avatar-glow') as HTMLElement;
    if (glowEl) {
      const glowX = 50 + c.rotY * 2;
      const glowY = 50 - c.rotX * 2;
      glowEl.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(0,212,255,0.55), rgba(124,58,237,0.45) 60%, transparent 100%)`;
    }

    // Subtle shine layer
    const shineEl = el.querySelector('.avatar-shine') as HTMLElement;
    if (shineEl) {
      shineEl.style.background = `radial-gradient(circle at ${c.shine.x}% ${c.shine.y}%, rgba(255,255,255,0.12) 0%, transparent 60%)`;
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top  + rect.height / 2;

      // Normalize: -1 to 1 relative to avatar center, but use FULL window for reach
      const dx = (e.clientX - centerX) / (window.innerWidth  / 2);
      const dy = (e.clientY - centerY) / (window.innerHeight / 2);

      target.current.rotY =  dx * MAX_TILT;
      target.current.rotX = -dy * MAX_TILT;

      // Shine follows cursor relative to avatar
      if (isHovering.current) {
        target.current.shine.x = ((e.clientX - rect.left) / rect.width)  * 100;
        target.current.shine.y = ((e.clientY - rect.top)  / rect.height) * 100;
      }
    };

    const handleMouseLeave = () => {
      isHovering.current = false;
      target.current.rotX = 0;
      target.current.rotY = 0;
      target.current.shine = { x: 50, y: 50 };
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [animate]);

  return (
    <div
      ref={containerRef}
      style={{
        width: 240,
        height: 240,
        borderRadius: '50%',
        position: 'relative',
        transformStyle: 'preserve-3d',
        willChange: 'transform',
        cursor: 'none',
      }}
      onMouseEnter={() => { isHovering.current = true; }}
      onMouseLeave={() => { isHovering.current = false; }}
    >
      {/* Animated gradient ring */}
      <div
        className="avatar-glow"
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(0,212,255,0.55), rgba(124,58,237,0.45) 60%, transparent 100%)',
          padding: 3,
          transition: 'box-shadow 0.3s ease',
          boxShadow: '0 0 40px rgba(0,212,255,0.25), 0 0 80px rgba(124,58,237,0.15)',
        }}
      />

      {/* Photo */}
      <div style={{
        position: 'absolute',
        inset: 3,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--surface)',
        border: '3px solid transparent',
        backgroundClip: 'padding-box',
      }}>
        <img
          src="/avatar.JPG"
          alt="Daud Ahmad Nisar"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            borderRadius: '50%',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
          onError={e => {
            // Fallback to emoji if photo not found yet
            const img = e.currentTarget;
            img.style.display = 'none';
            const parent = img.parentElement;
            if (parent && !parent.querySelector('.emoji-fallback')) {
              const span = document.createElement('div');
              span.className = 'emoji-fallback';
              span.style.cssText = 'display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:80px;';
              span.textContent = '🧑‍💻';
              parent.appendChild(span);
            }
          }}
        />

        {/* Shine overlay — makes it feel 3D glossy */}
        <div
          className="avatar-shine"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 60%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default function Hero() {
  const typed = useTypingEffect(roles);

  const socials = [
    { icon: <FiGithub size={20} />,   href: 'https://github.com/therealdaud',         label: 'GitHub'   },
    { icon: <FiLinkedin size={20} />, href: 'https://linkedin.com/in/daudahmadnisar', label: 'LinkedIn' },
    { icon: <FiMail size={20} />,     href: 'mailto:daudnisar1@gmail.com',             label: 'Email'    },
  ];

  return (
    <section
      id="hero"
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden', padding: 0 }}
    >
      {/* Background blobs + grid */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{
          position: 'absolute', top: '15%', right: '5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', left: '-5%',
          width: 450, height: 450, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(100,210,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(100,210,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      </div>

      <div className="container" style={{ paddingTop: 120, paddingBottom: 60 }}>
        <div className="hero-grid">

          {/* ── Left: Text ── */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              style={{ fontFamily: 'var(--mono)', color: 'var(--accent)', fontSize: 15, marginBottom: 16, letterSpacing: 1 }}
            >
              👋 Hi, I'm
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontWeight: 900, color: 'var(--heading)', lineHeight: 1.05, letterSpacing: -1, marginBottom: 8 }}
            >
              Daud Ahmad
              <br />
              <span style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Nisar
              </span>
            </motion.h1>

            {/* Typing role */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ height: 40, marginBottom: 24 }}
            >
              <span style={{ fontFamily: 'var(--mono)', fontSize: 'clamp(16px, 2.5vw, 22px)', color: 'var(--muted)' }}>
                {'> '}
                <span style={{ color: 'var(--accent3)' }}>{typed}</span>
                <span style={{ color: 'var(--accent)', animation: 'blink 1s step-end infinite' }}>|</span>
              </span>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
              style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 520, lineHeight: 1.75, marginBottom: 36 }}
            >
              Junior majoring in <span style={{ color: 'var(--text)' }}>Computer Science at the University of South Florida</span> with a passion for
              building impactful products at the intersection of{' '}
              <span style={{ color: 'var(--text)' }}>AI, cloud, and full-stack engineering</span>.
              AWS Certified Cloud Practitioner.
            </motion.p>

            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}
              style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 40 }}
            >
              {[
                { label: 'AWS Certified',      icon: <FiCloud size={14} />, color: '#ff9900'       },
                { label: "Dean's Honor List",  icon: '🏆',                  color: 'var(--accent3)' },
                { label: 'GPA 3.80 / 4.0',    icon: '🎓',                  color: 'var(--accent)'  },
              ].map((b, i) => (
                <span key={i} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12, color: b.color, fontFamily: 'var(--mono)',
                }}>
                  {b.icon} {b.label}
                </span>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.85 }}
              style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}
            >
              <a href="#projects" className="btn btn-primary">View Projects</a>
              <a href="#contact"  className="btn btn-outline">Get In Touch</a>
              <a
                href="/Daud_Ahmad_Nisar_Resume.pdf"
                download="Daud_Ahmad_Nisar_Resume.pdf"
                className="btn btn-outline"
                style={{ borderColor: 'rgba(6,214,160,0.5)', color: 'var(--accent3)' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(6,214,160,0.08)'; el.style.borderColor = 'var(--accent3)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'transparent'; el.style.borderColor = 'rgba(6,214,160,0.5)'; }}
              >
                <FiDownload size={15} /> Resume
              </a>
            </motion.div>

            {/* Socials */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              style={{ display: 'flex', gap: 20 }}
            >
              {socials.map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  style={{ color: 'var(--muted)', display: 'flex', alignItems: 'center', transition: 'color 0.2s, transform 0.2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--accent)'; el.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)';  el.style.transform = 'translateY(0)'; }}
                >
                  {s.icon}
                </a>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Avatar with 3D tilt ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, ease: 'easeOut' }}
            className="hero-visual"
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
          >
            {/* Subtle floating wrapper (keeps gentle bob alive) */}
            <motion.div
              animate={{ y: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
            >
              <AvatarWithTilt />

              {/* Floating code tag */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                style={{
                  background: 'rgba(14,14,24,0.95)',
                  border: '1px solid rgba(0,212,255,0.25)',
                  borderRadius: 12, padding: '9px 18px',
                  fontFamily: 'var(--mono)', fontSize: 12,
                  color: 'var(--accent)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  letterSpacing: 0.5,
                }}
              >
                {'{ ML + Cloud + Code }'}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
          style={{ display: 'flex', justifyContent: 'center', marginTop: 60 }}
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            style={{ color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--mono)' }}
          >
            <span>scroll</span>
            <FiArrowDown size={16} />
          </motion.div>
        </motion.div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @media(max-width:768px){ .hero-visual{display:none !important;} }
      `}</style>
    </section>
  );
}
