import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';
import { FiAward, FiBookOpen, FiUsers, FiCloud } from 'react-icons/fi';

const stats = [
  { value: '3.80', label: 'GPA', icon: '🎓' },
  { value: '3+',   label: 'Projects Built', icon: '🚀' },
  { value: '500+', label: 'Lives Impacted', icon: '🌍' },
  { value: '10+',  label: 'Bills Drafted', icon: '📜' },
];

const highlights = [
  { icon: <FiAward size={18} />,    text: "Green & Gold Presidential Scholarship" },
  { icon: <FiBookOpen size={18} />, text: "Dean's Honor List — Fall 2023, Spring 2024, Spring 2025" },
  { icon: <FiUsers size={18} />,    text: "Senator & Vice-Chair, USF Student Government" },
  { icon: <FiCloud size={18} />, text: "AWS Certified Cloud Practitioner" },
];

export default function About() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="about" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">01. About Me</p>
          <h2 className="section-title">Who I <span>Am</span></h2>
          <div className="section-divider" />
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'start' }}>
          {/* Left: Bio */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.85, marginBottom: 22 }}>
              Hey! I'm <strong style={{ color: 'var(--heading)' }}>Daud Ahmad Nisar</strong>, a junior majoring in Computer Science at the
              University of South Florida. I'm an aspiring{' '}
              <span style={{ color: 'var(--accent)' }}>Machine Learning Engineer</span> who loves engineering products
              that make a real difference in people's everyday lives.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.85, marginBottom: 22 }}>
              I've had the chance to work as a <strong style={{ color: 'var(--heading)' }}>Software Engineering Intern</strong>{' '}
              at ConnecTel, where I shipped React optimizations that cut load times by 30% for 10k+ users, and built
              AI-powered analytics tools. I also bring a strong cloud foundation as an{' '}
              <span style={{ color: 'var(--accent)' }}>AWS Certified Cloud Practitioner</span>.
            </p>
            <p style={{ fontSize: 16, color: 'var(--text)', lineHeight: 1.85, marginBottom: 36 }}>
              Beyond code, I founded <strong style={{ color: 'var(--heading)' }}>Tasawwur.pk</strong>, a student-run NGO that
              impacted 500+ lives, and I serve as a Senator in USF Student Government. I believe great engineering is about
              empathy, impact, and relentless curiosity.
            </p>

            <div style={{ display: 'flex', gap: 14 }}>
              <a
                href="mailto:daudnisar1@gmail.com"
                className="btn btn-primary"
                style={{ fontSize: 13 }}
              >
                Say Hello 👋
              </a>
              <a
                href="https://github.com/therealdaud"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 13 }}
              >
                GitHub Profile
              </a>
            </div>
          </motion.div>

          {/* Right: Highlights + Stats */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
          >
            {/* Highlights */}
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: 28,
            }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--accent)', marginBottom: 18, letterSpacing: 2 }}>
                ACHIEVEMENTS
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {highlights.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <span style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }}>{h.icon}</span>
                    <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.5 }}>{h.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.08 }}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    padding: '20px 18px',
                    textAlign: 'center',
                    transition: 'border-color 0.3s, box-shadow 0.3s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'rgba(0,212,255,0.35)'; el.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, fontFamily: 'var(--mono)' }}>{s.label}</div>
                </motion.div>
              ))}
            </div>

            {/* USF Badge */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.05), rgba(124,58,237,0.05))',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}>
              <img
                src="/usf-logo.png"
                alt="USF Bulls Logo"
                style={{ width: 56, height: 56, objectFit: 'contain', flexShrink: 0 }}
              />
              <div>
                <p style={{ fontWeight: 700, color: 'var(--heading)', fontSize: 14 }}>University of South Florida</p>
                <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>B.S. Computer Science · Class of 2027</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          #about .container > div:last-child {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>
    </section>
  );
}
