import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { FiArrowRight, FiClock, FiCalendar } from 'react-icons/fi';

type Post = {
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  tags: string[];
  link: string;
  color: string;
};

// ──────────────────────────────────────────────
// ADD YOUR BLOG POSTS HERE
// Publish on Medium, Dev.to, or Hashnode,
// then paste the link below.
// ──────────────────────────────────────────────
const posts: Post[] = [
  // Example — uncomment and fill in when your first article is live:
  // {
  //   title: 'How I Built a Serverless IoT Pipeline on AWS for $0/month',
  //   date: 'Mar 2026',
  //   readTime: '8 min read',
  //   excerpt: 'A deep dive into building HeatShield — from IoT Core ingestion to personalized heat-risk alerts via SNS, all deployed with SAM.',
  //   tags: ['AWS', 'IoT', 'Serverless', 'Python'],
  //   link: 'https://medium.com/@yourhandle/your-article',
  //   color: '#ff6b35',
  // },
];

function PostCard({ post, index, inView }: { post: Post; index: number; inView: boolean }) {
  return (
    <motion.a
      href={post.link}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.12 + 0.2 }}
      style={{
        display: 'block',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 28,
        cursor: 'pointer',
        transition: 'border-color 0.3s, box-shadow 0.3s, transform 0.3s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = `${post.color}50`;
        el.style.boxShadow = `0 16px 50px rgba(0,0,0,0.4), 0 0 0 1px ${post.color}20`;
        el.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.borderColor = 'var(--border)';
        el.style.boxShadow = 'none';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Tags */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        {post.tags.map(tag => (
          <span key={tag} style={{
            padding: '3px 10px', borderRadius: 20,
            background: `${post.color}14`,
            border: `1px solid ${post.color}30`,
            fontSize: 11, color: post.color,
            fontFamily: 'var(--mono)',
          }}>{tag}</span>
        ))}
      </div>

      {/* Title */}
      <h3 style={{
        fontSize: 19, fontWeight: 700, color: 'var(--heading)',
        lineHeight: 1.4, marginBottom: 10,
      }}>{post.title}</h3>

      {/* Excerpt */}
      <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 18 }}>
        {post.excerpt}
      </p>

      {/* Meta */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <FiCalendar size={12} /> {post.date}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <FiClock size={12} /> {post.readTime}
          </span>
        </div>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: post.color, fontWeight: 600,
        }}>
          Read Article <FiArrowRight size={14} />
        </span>
      </div>
    </motion.a>
  );
}

function EmptyState({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.2 }}
      style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.04), rgba(124,58,237,0.04))',
        border: '1px dashed rgba(0,212,255,0.2)',
        borderRadius: 20,
        padding: '60px 32px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>✍️</div>
      <h3 style={{ fontSize: 22, fontWeight: 700, color: 'var(--heading)', marginBottom: 10 }}>
        First article dropping soon
      </h3>
      <p style={{ fontSize: 15, color: 'var(--muted)', maxWidth: 460, margin: '0 auto', lineHeight: 1.7 }}>
        I'm writing about building serverless systems on AWS, lessons from my internship,
        and the tech behind my projects. Stay tuned.
      </p>

      {/* Planned topics */}
      <div style={{
        display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap',
        marginTop: 28,
      }}>
        {[
          'AWS & Serverless',
          'Internship Lessons',
          'React Native',
          'System Design',
        ].map(topic => (
          <span key={topic} style={{
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--mono)',
          }}>{topic}</span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Blog() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section id="blog" ref={ref}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="section-label">05. Blog</p>
          <h2 className="section-title">Thoughts & <span>Writing</span></h2>
          <div className="section-divider" />
        </motion.div>

        {posts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: posts.length === 1 ? '1fr' : 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 24,
          }}>
            {posts.map((post, i) => (
              <PostCard key={post.title} post={post} index={i} inView={inView} />
            ))}
          </div>
        ) : (
          <EmptyState inView={inView} />
        )}
      </div>
    </section>
  );
}
