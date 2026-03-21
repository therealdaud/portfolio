import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiBriefcase, FiBook, FiUsers, FiHeart } from 'react-icons/fi';

type Job = {
  role: string;
  company: string;
  period: string;
  type: string;
  icon: React.ReactNode;
  color: string;
  bullets: string[];
};

const jobs: Job[] = [
  {
    role: 'Software Engineering Intern',
    company: 'ConnecTel',
    period: 'May 2025 – Aug 2025',
    type: 'Industry',
    icon: <FiBriefcase size={16} />,
    color: '#00d4ff',
    bullets: [
      'Engineered customer portal features by implementing React.js performance optimizations, lazy loading, Webpack bundling, and dynamic code-splitting which reduced page load times by 30% and directly improving the experience for 10k+ active users.',
      'Designed and built a data analytics monitoring service in Python, SQL, and Flask, integrating AI hooks that enabled 40% faster anomaly detection and significantly uplifted reliability engineering across production systems.',
      'Owned end-to-end feature delivery within an Agile team, participating in sprint planning, code reviews, and stand-ups, while shipping production-ready code that scaled across ConnecTel\'s customer-facing infrastructure.',
    ],
  },
  {
    role: 'Senator & Vice-Chair',
    company: 'USF Student Government',
    period: 'Mar 2024 – Mar 2025',
    type: 'Leadership',
    icon: <FiUsers size={16} />,
    color: '#7c3aed',
    bullets: [
      'Drafted and co-sponsored 15+ legislative bills as a direct liaison between the student body and university administration, addressing issues ranging from campus safety to academic resources for a community of 50,000+ students.',
      'Served as Vice-Chair of Programming committee, facilitating structured debate, mediating cross-partisan discussions, and driving consensus on policy decisions that shaped campus life at one of the largest universities in the US.',
      'Championed initiatives that improved student access to mental health resources, financial aid transparency, and on-campus amenities, translating student concerns into measurable institutional change.',
    ],
  },
  {
    role: 'Calculus I Learning Team Instructor',
    company: 'University of South Florida',
    period: 'Jun 2024 – Dec 2024',
    type: 'Education',
    icon: <FiBook size={16} />,
    color: '#06d6a0',
    bullets: [
      'Led structured weekly Calculus I collaborative sessions for a cohort of 20 students, applying problem decomposition and algorithmic thinking to break down complex topics, resulting in a 15% average improvement in quiz scores over the semester.',
      'Delivered 30+ hours of targeted one-on-one and group tutoring, using data-driven KPI tracking to identify struggling students early and deploy personalized intervention strategies before exam cycles.',
      'Designed practice sets, solution guides, and supplemental workflows that bridged the gap between high school and college-level mathematical reasoning, significantly easing the academic transition for first-year students.',
    ],
  },
  {
    role: 'Founder',
    company: 'Tasawwur.pk',
    period: 'Jun 2020 – Aug 2023',
    type: 'NGO / Leadership',
    icon: <FiHeart size={16} />,
    color: '#f97316',
    bullets: [
      'Founded and scaled one of Pakistan\'s largest student-run NGOs from the ground up, mobilizing volunteer networks to execute food distribution drives, clothing campaigns, and tree plantation projects that collectively impacted 500+ individuals across underserved communities.',
      'Spearheaded a landmark community literacy initiative in partnership with a local university, overseeing the end-to-end creation of a fully accessible community library that provided 100+ students in under-resourced areas with free, structured access to educational materials.',
      'Developed operational frameworks, volunteer onboarding systems, and community outreach strategies that sustained the organization\'s growth and impact across multiple cities over three years.',
    ],
  },
];

export default function Experience() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="experience" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">03. Experience</p>
          <h2 className="section-title">Where I've <span>Worked</span></h2>
          <div className="section-divider" />
        </motion.div>

        {/* Timeline */}
        <div style={{ position: 'relative', paddingLeft: 32 }}>
          {/* Vertical line */}
          <div style={{
            position: 'absolute',
            left: 7,
            top: 12,
            bottom: 12,
            width: 2,
            background: 'linear-gradient(180deg, var(--accent), var(--accent2), transparent)',
            borderRadius: 2,
          }} />

          {jobs.map((job, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15 + 0.2 }}
              style={{ position: 'relative', marginBottom: 40 }}
            >
              {/* Timeline dot */}
              <div style={{
                position: 'absolute',
                left: -28,
                top: 20,
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: job.color,
                border: `3px solid var(--bg)`,
                boxShadow: `0 0 12px ${job.color}66`,
              }} />

              {/* Card */}
              <div style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 28,
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${job.color}44`; el.style.boxShadow = `0 12px 40px rgba(0,0,0,0.4)`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 4 }}>{job.role}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, color: job.color, fontSize: 14 }}>@ {job.company}</span>
                      <span style={{
                        padding: '2px 10px', borderRadius: 20,
                        background: `${job.color}18`,
                        border: `1px solid ${job.color}44`,
                        fontSize: 11, color: job.color,
                        fontFamily: 'var(--mono)',
                      }}>
                        {job.type}
                      </span>
                    </div>
                  </div>
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: 'var(--muted)',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '4px 12px',
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                  }}>
                    {job.period}
                  </span>
                </div>

                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {job.bullets.map((b, bi) => (
                    <li key={bi} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>
                      <span style={{ color: job.color, marginTop: 5, flexShrink: 0 }}>▹</span>
                      <span dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--text)">$1</strong>') }} />
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
