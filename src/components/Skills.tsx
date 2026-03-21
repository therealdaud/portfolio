import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

type Skill = { name: string; level: number };

const categories: { title: string; emoji: string; color: string; skills: Skill[] }[] = [
  {
    title: 'Languages',
    emoji: '⌨️',
    color: '#00d4ff',
    skills: [
      { name: 'Python',     level: 92 },
      { name: 'JavaScript', level: 88 },
      { name: 'Java',       level: 80 },
      { name: 'C / C++',   level: 75 },
      { name: 'SQL',        level: 82 },
      { name: 'HTML / CSS', level: 90 },
      { name: 'C#',         level: 65 },
    ],
  },
  {
    title: 'Frameworks & Libraries',
    emoji: '🧩',
    color: '#7c3aed',
    skills: [
      { name: 'React.js',  level: 88 },
      { name: 'Node.js',   level: 82 },
      { name: 'Flask',     level: 78 },
      { name: 'Express',   level: 78 },
      { name: 'Angular',   level: 65 },
      { name: 'NumPy / Pandas', level: 85 },
      { name: 'TensorFlow / PyTorch', level: 70 },
    ],
  },
  {
    title: 'Cloud & DevOps',
    emoji: '☁️',
    color: '#ff9900',
    skills: [
      { name: 'AWS (Lambda, DynamoDB, SNS)', level: 85 },
      { name: 'Azure',   level: 65 },
      { name: 'Docker',  level: 72 },
      { name: 'CI/CD',   level: 70 },
      { name: 'Jenkins', level: 65 },
      { name: 'Git / GitHub', level: 90 },
      { name: 'Linux',   level: 75 },
    ],
  },
  {
    title: 'Databases',
    emoji: '🗄️',
    color: '#06d6a0',
    skills: [
      { name: 'MongoDB',   level: 80 },
      { name: 'MySQL',     level: 82 },
      { name: 'Firebase',  level: 75 },
      { name: 'DynamoDB',  level: 78 },
    ],
  },
];

const tagSkills = [
  'Machine Learning', 'LLMs', 'REST APIs', 'Agile / Scrum',
  'Serverless', 'Microservices', 'Data Structures', 'Algorithms',
  'System Design', 'React Native', 'PowerShell', 'Jira', 'XML / JSON',
];

function SkillBar({ name, level, color, delay }: { name: string; level: number; color: string; delay: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{name}</span>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{level}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.07)', borderRadius: 10, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : {}}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 10 }}
        />
      </div>
    </div>
  );
}

export default function Skills() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="skills" ref={ref} style={{ background: 'var(--bg2)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">02. Skills</p>
          <h2 className="section-title">My <span>Tech Stack</span></h2>
          <div className="section-divider" />
        </motion.div>

        {/* Category cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, marginBottom: 48 }}>
          {categories.map((cat, ci) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: ci * 0.1 + 0.2 }}
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 28,
                transition: 'border-color 0.3s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${cat.color}44`; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--heading)' }}>{cat.title}</h3>
              </div>
              {cat.skills.map((s, si) => (
                <SkillBar key={s.name} name={s.name} level={s.level} color={cat.color} delay={ci * 0.05 + si * 0.06} />
              ))}
            </motion.div>
          ))}
        </div>

        {/* Tag cloud */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          style={{ textAlign: 'center' }}
        >
          <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)', marginBottom: 18, letterSpacing: 2 }}>
            ALSO FAMILIAR WITH
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            {tagSkills.map((tag, i) => (
              <motion.span
                key={tag}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.7 + i * 0.04 }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.25)',
                  fontSize: 13,
                  color: '#a78bfa',
                  fontFamily: 'var(--mono)',
                  cursor: 'default',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'rgba(124,58,237,0.2)'; el.style.borderColor = '#7c3aed'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLSpanElement; el.style.background = 'rgba(124,58,237,0.1)'; el.style.borderColor = 'rgba(124,58,237,0.25)'; }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
