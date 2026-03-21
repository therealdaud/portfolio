import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiUser, FiCode, FiBriefcase, FiMail,
  FiFileText, FiGithub, FiLinkedin, FiBookOpen, FiHome,
} from 'react-icons/fi';

type CommandItem = {
  id: string;
  label: string;
  section: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string;
};

function scrollTo(hash: string) {
  document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth' });
}

const items: CommandItem[] = [
  { id: 'home',       section: 'Navigation', label: 'Go to Top',          icon: <FiHome size={16} />,       action: () => scrollTo('#hero'),       keywords: 'home hero top' },
  { id: 'about',      section: 'Navigation', label: 'Go to About',        icon: <FiUser size={16} />,       action: () => scrollTo('#about'),      keywords: 'who bio me' },
  { id: 'skills',     section: 'Navigation', label: 'Go to Skills',       icon: <FiCode size={16} />,       action: () => scrollTo('#skills'),     keywords: 'tech stack tools' },
  { id: 'experience', section: 'Navigation', label: 'Go to Experience',   icon: <FiBriefcase size={16} />,  action: () => scrollTo('#experience'), keywords: 'work jobs intern' },
  { id: 'projects',   section: 'Navigation', label: 'Go to Projects',     icon: <FiCode size={16} />,       action: () => scrollTo('#projects'),   keywords: 'portfolio built apps' },
  { id: 'blog',       section: 'Navigation', label: 'Go to Blog',         icon: <FiBookOpen size={16} />,   action: () => scrollTo('#blog'),       keywords: 'articles writing posts' },
  { id: 'contact',    section: 'Navigation', label: 'Go to Contact',      icon: <FiMail size={16} />,       action: () => scrollTo('#contact'),    keywords: 'email reach out' },
  { id: 'resume',     section: 'Actions',    label: 'Download Resume',    icon: <FiFileText size={16} />,   action: () => { const a = document.createElement('a'); a.href = '/Daud_Ahmad_Nisar_Resume.pdf'; a.download = 'Daud_Ahmad_Nisar_Resume.pdf'; a.click(); }, keywords: 'pdf cv download' },
  { id: 'github',     section: 'Actions',    label: 'Open GitHub Profile', icon: <FiGithub size={16} />,     action: () => window.open('https://github.com/therealdaud', '_blank'),         keywords: 'code repos source' },
  { id: 'linkedin',   section: 'Actions',    label: 'Open LinkedIn',       icon: <FiLinkedin size={16} />,   action: () => window.open('https://linkedin.com/in/daudahmadnisar', '_blank'), keywords: 'connect profile network' },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter(item => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q)
    );
  });

  // Ctrl+K / Cmd+K toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Reset selection on query change
  useEffect(() => { setSelectedIndex(0); }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      filtered[selectedIndex].action();
      setOpen(false);
    }
  }, [filtered, selectedIndex]);

  // Group by section
  const sections: { name: string; items: (typeof items[0] & { globalIndex: number })[] }[] = [];
  let globalIdx = 0;
  filtered.forEach(item => {
    const existing = sections.find(s => s.name === item.section);
    if (existing) {
      existing.items.push({ ...item, globalIndex: globalIdx });
    } else {
      sections.push({ name: item.section, items: [{ ...item, globalIndex: globalIdx }] });
    }
    globalIdx++;
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)', zIndex: 200,
            }}
          />

          {/* Palette container — centered via flex */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 201,
            display: 'flex', justifyContent: 'center',
            paddingTop: 'min(20vh, 160px)',
            pointerEvents: 'none',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              style={{
                width: '92%', maxWidth: 520, height: 'fit-content',
                background: '#0e0e1a',
                border: '1px solid rgba(0,212,255,0.15)',
                borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 60px rgba(0,212,255,0.06)',
                pointerEvents: 'auto',
              }}
            >
              {/* Search input */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <FiSearch size={18} style={{ color: 'var(--muted)', flexShrink: 0 }} />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a command or search..."
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: 'var(--text)', fontFamily: 'var(--font)', fontSize: 15,
                  }}
                />
                <kbd style={{
                  padding: '3px 8px', borderRadius: 5,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)',
                }}>ESC</kbd>
              </div>

              {/* Results */}
              <div style={{ maxHeight: 340, overflowY: 'auto', padding: 8 }}>
                {filtered.length === 0 && (
                  <p style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                    No results found
                  </p>
                )}
                {sections.map(section => (
                  <div key={section.name}>
                    <p style={{
                      fontSize: 11, fontFamily: 'var(--mono)',
                      color: 'var(--muted)', letterSpacing: 1.5,
                      padding: '10px 16px 4px', textTransform: 'uppercase',
                    }}>
                      {section.name}
                    </p>
                    {section.items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { item.action(); setOpen(false); }}
                        onMouseEnter={() => setSelectedIndex(item.globalIndex)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 12,
                          width: '100%', padding: '11px 16px', borderRadius: 10,
                          background: item.globalIndex === selectedIndex
                            ? 'rgba(0,212,255,0.08)' : 'transparent',
                          border: item.globalIndex === selectedIndex
                            ? '1px solid rgba(0,212,255,0.15)' : '1px solid transparent',
                          color: item.globalIndex === selectedIndex
                            ? 'var(--accent)' : 'var(--text)',
                          cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14,
                          transition: 'all 0.1s', textAlign: 'left',
                        }}
                      >
                        <span style={{
                          color: item.globalIndex === selectedIndex ? 'var(--accent)' : 'var(--muted)',
                        }}>{item.icon}</span>
                        {item.label}
                        {item.globalIndex === selectedIndex && (
                          <span style={{
                            marginLeft: 'auto', fontSize: 11,
                            fontFamily: 'var(--mono)', color: 'var(--muted)',
                          }}>↵</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div style={{
                padding: '10px 20px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', gap: 20,
                fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)',
              }}>
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>esc close</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
