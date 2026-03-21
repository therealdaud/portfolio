import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGithub, FiLinkedin, FiMenu, FiX, FiSearch } from 'react-icons/fi';

const links = [
  { label: 'About',      href: '#about' },
  { label: 'Skills',     href: '#skills' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects',   href: '#projects' },
  { label: 'Blog',       href: '#blog' },
  { label: 'Contact',    href: '#contact' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 100,
        transition: 'all 0.3s ease',
        background: scrolled
          ? 'rgba(8,8,15,0.92)'
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(100,210,255,0.08)' : 'none',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 70 }}>
        {/* Logo + Currently Building */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#hero" style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 18, color: 'var(--accent)', letterSpacing: 1 }}>
            &lt;Daud /&gt;
          </a>
          <span className="building-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 20,
            background: 'rgba(6,214,160,0.08)',
            border: '1px solid rgba(6,214,160,0.2)',
            fontSize: 11, color: 'var(--accent3)',
            fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--accent3)',
              boxShadow: '0 0 8px var(--accent3)',
              animation: 'pulse-dot 2s ease-in-out infinite',
            }} />
            Building: HeatShield
          </span>
        </div>

        {/* Desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }} className="desktop-nav">
          {links.map((l, i) => (
            <motion.a
              key={l.href}
              href={l.href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--muted)', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              <span style={{ color: 'var(--accent)' }}>0{i + 1}.</span> {l.label}
            </motion.a>
          ))}

          {/* Ctrl+K + Socials */}
          <div style={{ display: 'flex', gap: 14, marginLeft: 8, alignItems: 'center' }}>
            <button
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--muted)', cursor: 'pointer',
                fontFamily: 'var(--mono)', fontSize: 11,
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(0,212,255,0.3)'; el.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.1)'; el.style.color = 'var(--muted)'; }}
            >
              <FiSearch size={12} />
              <kbd style={{
                padding: '1px 5px', borderRadius: 4,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                fontSize: 10,
              }}>Ctrl K</kbd>
            </button>
            {[
              { icon: <FiGithub size={18} />, href: 'https://github.com/therealdaud' },
              { icon: <FiLinkedin size={18} />, href: 'https://linkedin.com/in/daudahmadnisar' },
            ].map((s, i) => (
              <a
                key={i}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--muted)', transition: 'color 0.2s, transform 0.2s', display: 'flex' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--accent)'; el.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.transform = 'translateY(0)'; }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {/* Hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'none' }}
          className="hamburger"
        >
          {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: 'rgba(13,13,22,0.98)',
              borderTop: '1px solid var(--border)',
              padding: '20px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            {links.map(l => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                style={{ fontFamily: 'var(--mono)', fontSize: 15, color: 'var(--text)' }}
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
          .building-badge { display: none !important; }
        }
      `}</style>
    </motion.nav>
  );
}
