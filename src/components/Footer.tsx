import { FiGithub, FiLinkedin, FiMail, FiHeart } from 'react-icons/fi';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--border)',
      padding: '40px 32px',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>
            &lt;Daud Ahmad Nisar /&gt;
          </p>
          <p style={{ fontSize: 12, color: 'var(--muted)' }}>
            Aspiring ML Engineer · CS @ USF · AWS Certified
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { icon: <FiGithub size={18} />, href: 'https://github.com/therealdaud', label: 'GitHub' },
            { icon: <FiLinkedin size={18} />, href: 'https://linkedin.com/in/daudahmadnisar', label: 'LinkedIn' },
            { icon: <FiMail size={18} />, href: 'mailto:daudnisar1@gmail.com', label: 'Email' },
          ].map((s, i) => (
            <a
              key={i}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              style={{
                color: 'var(--muted)',
                display: 'flex', alignItems: 'center',
                transition: 'color 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--accent)'; el.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = 'var(--muted)'; el.style.transform = 'translateY(0)'; }}
            >
              {s.icon}
            </a>
          ))}
        </div>

        <p style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)', display: 'flex', alignItems: 'center', gap: 6 }}>
          Built with <FiHeart size={12} style={{ color: '#f97316' }} /> in {year}
        </p>
      </div>
    </footer>
  );
}
