import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiMail, FiGithub, FiLinkedin, FiMapPin } from 'react-icons/fi';

const contactItems = [
  {
    icon: <FiMail size={20} />,
    label: 'Email',
    value: 'daudnisar1@gmail.com',
    href: 'mailto:daudnisar1@gmail.com',
    color: '#00d4ff',
  },
  {
    icon: <FiGithub size={20} />,
    label: 'GitHub',
    value: 'github.com/therealdaud',
    href: 'https://github.com/therealdaud',
    color: '#c0c0c0',
  },
  {
    icon: <FiLinkedin size={20} />,
    label: 'LinkedIn',
    value: 'linkedin.com/in/daudahmadnisar',
    href: 'https://linkedin.com/in/daudahmadnisar',
    color: '#0a66c2',
  },
  {
    icon: <FiMapPin size={20} />,
    label: 'Location',
    value: 'Tampa, FL',
    href: null,
    color: '#06d6a0',
  },
];

export default function Contact() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="contact" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <p className="section-label" style={{ textAlign: 'center' }}>05. Contact</p>
          <h2 className="section-title" style={{ textAlign: 'center' }}>Get In <span>Touch</span></h2>
          <div className="section-divider" style={{ margin: '0 auto 24px' }} />
          <p style={{ fontSize: 16, color: 'var(--muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
            I'm currently open to new opportunities, collaborations, and interesting conversations.
            Whether you have a project in mind or just want to say hi — my inbox is always open!
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start', maxWidth: 900, margin: '0 auto' }}>
          {/* Left: Contact info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            {contactItems.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                {item.href ? (
                  <a
                    href={item.href}
                    target={item.href.startsWith('mailto') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12, padding: '18px 22px',
                      transition: 'all 0.3s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${item.color}55`; el.style.transform = 'translateX(6px)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'translateX(0)'; }}
                  >
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: item.color, flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 2 }}>{item.label}</p>
                      <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{item.value}</p>
                    </div>
                  </a>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 12, padding: '18px 22px',
                  }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: 10,
                      background: `${item.color}15`,
                      border: `1px solid ${item.color}33`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: item.color, flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', marginBottom: 2 }}>{item.label}</p>
                      <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{item.value}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>

          {/* Right: CTA card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{
              background: 'linear-gradient(135deg, rgba(0,212,255,0.06), rgba(124,58,237,0.06))',
              border: '1px solid rgba(0,212,255,0.2)',
              borderRadius: 20,
              padding: 40,
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <div style={{ fontSize: 52 }}>📬</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: 'var(--heading)' }}>
              Let's Build Something Together
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.75 }}>
              Open to internships, full-time roles, freelance projects, and research collaborations.
              Always excited to connect with fellow builders and innovators.
            </p>
            <a
              href="mailto:daudnisar1@gmail.com"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <FiMail size={16} /> Send Me an Email
            </a>
            <a
              href="https://linkedin.com/in/daudahmadnisar"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <FiLinkedin size={16} /> Connect on LinkedIn
            </a>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){
          #contact .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
