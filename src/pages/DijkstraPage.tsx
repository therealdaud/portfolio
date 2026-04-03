import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiArrowLeft, FiGithub, FiPlay, FiPause,
  FiSkipForward, FiRotateCcw, FiTrash2,
} from 'react-icons/fi';
import { MdOutlineAccountTree } from 'react-icons/md';
import { computeDijkstraSteps, type GNode, type GEdge, type DijkstraStep } from '../utils/dijkstraAlgo';

// ─── Canvas constants ────────────────────────────────────────────────────────
const W = 860;
const H = 490;
const R = 26; // node radius

// ─── Types ───────────────────────────────────────────────────────────────────
type ToolMode = 'select' | 'addNode' | 'addEdge' | 'delete';
type AlgoPhase = 'idle' | 'paused' | 'done';
type NS = 'default' | 'start' | 'end' | 'current' | 'visited' | 'considering' | 'path';
type ES = 'default' | 'active' | 'path' | 'improved';

interface Drag { nodeId: string; startCX: number; startCY: number; initX: number; initY: number; }
interface PendingEdge { fromId: string; toId: string; }

// ─── Preset graphs ───────────────────────────────────────────────────────────
const PRESETS: Record<string, { nodes: GNode[]; edges: GEdge[]; start: string; end: string; label: string }> = {
  classic: {
    label: 'Classic',
    nodes: [
      { id: 'A', label: 'A', x: 90,  y: 245 },
      { id: 'B', label: 'B', x: 275, y: 100 },
      { id: 'C', label: 'C', x: 490, y: 100 },
      { id: 'D', label: 'D', x: 675, y: 245 },
      { id: 'E', label: 'E', x: 275, y: 390 },
      { id: 'F', label: 'F', x: 675, y: 390 },
    ],
    edges: [
      { id: 'e1', from: 'A', to: 'B', weight: 4 },
      { id: 'e2', from: 'A', to: 'E', weight: 7 },
      { id: 'e3', from: 'B', to: 'C', weight: 3 },
      { id: 'e4', from: 'B', to: 'E', weight: 5 },
      { id: 'e5', from: 'C', to: 'D', weight: 2 },
      { id: 'e6', from: 'C', to: 'E', weight: 8 },
      { id: 'e7', from: 'D', to: 'F', weight: 4 },
      { id: 'e8', from: 'E', to: 'F', weight: 6 },
    ],
    start: 'A',
    end: 'F',
  },
  network: {
    label: 'Network',
    nodes: [
      { id: 'S', label: 'S', x: 80,  y: 245 },
      { id: 'A', label: 'A', x: 245, y: 110 },
      { id: 'B', label: 'B', x: 245, y: 385 },
      { id: 'C', label: 'C', x: 430, y: 55  },
      { id: 'D', label: 'D', x: 430, y: 245 },
      { id: 'E', label: 'E', x: 430, y: 440 },
      { id: 'F', label: 'F', x: 620, y: 145 },
      { id: 'T', label: 'T', x: 775, y: 245 },
    ],
    edges: [
      { id: 'e1',  from: 'S', to: 'A', weight: 7  },
      { id: 'e2',  from: 'S', to: 'B', weight: 2  },
      { id: 'e3',  from: 'A', to: 'C', weight: 3  },
      { id: 'e4',  from: 'A', to: 'D', weight: 6  },
      { id: 'e5',  from: 'B', to: 'D', weight: 4  },
      { id: 'e6',  from: 'B', to: 'E', weight: 8  },
      { id: 'e7',  from: 'C', to: 'F', weight: 1  },
      { id: 'e8',  from: 'D', to: 'F', weight: 5  },
      { id: 'e9',  from: 'D', to: 'T', weight: 9  },
      { id: 'e10', from: 'F', to: 'T', weight: 2  },
      { id: 'e11', from: 'E', to: 'T', weight: 3  },
    ],
    start: 'S',
    end: 'T',
  },
};

// ─── Visual configs ──────────────────────────────────────────────────────────
function nodeVisual(s: NS): { fill: string; stroke: string; sw: number; filter?: string; lc: string } {
  switch (s) {
    case 'start':       return { fill: 'rgba(6,214,160,0.18)',   stroke: '#06d6a0', sw: 2.5, filter: 'url(#g-green)',  lc: '#06d6a0' };
    case 'end':         return { fill: 'rgba(124,58,237,0.18)',  stroke: '#7c3aed', sw: 2.5, filter: 'url(#g-purple)', lc: '#a78bfa' };
    case 'current':     return { fill: 'rgba(0,212,255,0.26)',   stroke: '#00d4ff', sw: 3,   filter: 'url(#g-cyan)',   lc: '#00d4ff' };
    case 'visited':     return { fill: 'rgba(6,214,160,0.10)',   stroke: 'rgba(6,214,160,0.5)', sw: 1.5, lc: '#06d6a0' };
    case 'considering': return { fill: 'rgba(255,171,0,0.18)',   stroke: '#ffab00', sw: 2.5, filter: 'url(#g-orange)', lc: '#ffab00' };
    case 'path':        return { fill: 'rgba(168,85,247,0.26)',  stroke: '#a855f7', sw: 3,   filter: 'url(#g-purple)', lc: '#e9d5ff' };
    default:            return { fill: '#12121e',                stroke: 'rgba(100,210,255,0.28)', sw: 1.5, lc: '#ccd6f6' };
  }
}

function edgeVisual(s: ES): { stroke: string; sw: number; filter?: string; dash?: string } {
  switch (s) {
    case 'active':   return { stroke: '#ffab00', sw: 2.5 };
    case 'improved': return { stroke: '#00d4ff', sw: 2.5, filter: 'url(#g-cyan)' };
    case 'path':     return { stroke: '#a855f7', sw: 3,   filter: 'url(#g-purple)', dash: '8 4' };
    default:         return { stroke: 'rgba(100,210,255,0.18)', sw: 1.5 };
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function toSVG(svg: SVGSVGElement, cx: number, cy: number) {
  const r = svg.getBoundingClientRect();
  return { x: ((cx - r.left) / r.width) * W, y: ((cy - r.top) / r.height) * H };
}

function nextLabel(nodes: GNode[]): string {
  const used = new Set(nodes.map(n => n.label));
  for (let i = 0; i < 26; i++) {
    const l = String.fromCharCode(65 + i);
    if (!used.has(l)) return l;
  }
  return `N${nodes.length + 1}`;
}

function fmtDist(d: number) { return d === Infinity ? '∞' : String(d); }

function getNodeState(
  id: string, step: DijkstraStep | null, startId: string, endId: string,
): NS {
  if (step) {
    if (step.shortestPath.includes(id)) return 'path';
    if (id === step.current) return 'current';
    if (id === step.considering) return 'considering';
    if (step.visited.includes(id)) return 'visited';
  }
  if (id === startId) return 'start';
  if (id === endId)   return 'end';
  return 'default';
}

function getEdgeState(edge: GEdge, step: DijkstraStep | null): ES {
  if (!step) return 'default';
  const { shortestPath, relaxedEdge, improved } = step;
  if (shortestPath.length > 1) {
    for (let i = 0; i < shortestPath.length - 1; i++) {
      const a = shortestPath[i], b = shortestPath[i + 1];
      if ((edge.from === a && edge.to === b) || (edge.from === b && edge.to === a)) return 'path';
    }
  }
  if (relaxedEdge) {
    const match =
      (relaxedEdge.from === edge.from && relaxedEdge.to === edge.to) ||
      (relaxedEdge.from === edge.to   && relaxedEdge.to === edge.from);
    if (match) return improved ? 'improved' : 'active';
  }
  return 'default';
}

// ─── TechBadge ───────────────────────────────────────────────────────────────
function TechBadge({ name, color }: { name: string; color: string }) {
  return (
    <span style={{
      padding: '4px 12px', borderRadius: 20,
      background: `${color}14`, border: `1px solid ${color}33`,
      fontSize: 11, color, fontFamily: 'var(--mono)', whiteSpace: 'nowrap',
    }}>
      {name}
    </span>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function DijkstraPage() {
  const navigate = useNavigate();

  // Graph state
  const [nodes, setNodes] = useState<GNode[]>(PRESETS.classic.nodes);
  const [edges, setEdges] = useState<GEdge[]>(PRESETS.classic.edges);

  // Interaction
  const [mode, setMode] = useState<ToolMode>('select');
  const [drag, setDrag] = useState<Drag | null>(null);
  const [edgeFrom, setEdgeFrom] = useState<string | null>(null);
  const [mouseSVG, setMouseSVG] = useState<{ x: number; y: number } | null>(null);
  const [pendingEdge, setPendingEdge] = useState<PendingEdge | null>(null);
  const [pendingWeight, setPendingWeight] = useState('1');
  const [hovered, setHovered] = useState<string | null>(null);

  // Algorithm
  const [startNode, setStartNode] = useState<string>('A');
  const [endNode,   setEndNode]   = useState<string>('F');
  const [steps, setSteps] = useState<DijkstraStep[]>([]);
  const [stepIdx, setStepIdx] = useState(-1);
  const [phase, setPhase] = useState<AlgoPhase>('idle');
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);

  const svgRef     = useRef<SVGSVGElement>(null);
  const weightRef  = useRef<HTMLInputElement>(null);
  const playTimer  = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentStep = stepIdx >= 0 && steps.length ? steps[stepIdx] : null;

  // ── Auto-play ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) { if (playTimer.current) clearInterval(playTimer.current); return; }
    playTimer.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= steps.length - 1) {
          setPlaying(false);
          setPhase('done');
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => { if (playTimer.current) clearInterval(playTimer.current); };
  }, [playing, steps.length, speed]);

  // ── Focus weight input when modal opens ────────────────────────────────────
  useEffect(() => {
    if (pendingEdge) setTimeout(() => weightRef.current?.focus(), 50);
  }, [pendingEdge]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (pendingEdge) return; // modal open
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') stepForward();
      if (e.key === 'ArrowLeft')  stepBack();
      if (e.key === 'r' || e.key === 'R') resetAlgo();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // ── SVG coordinate conversion ──────────────────────────────────────────────
  const getSVGCoords = useCallback((cx: number, cy: number) => {
    return svgRef.current ? toSVG(svgRef.current, cx, cy) : { x: 0, y: 0 };
  }, []);

  // ── Algorithm controls ─────────────────────────────────────────────────────
  const runAlgo = useCallback(() => {
    if (!startNode || !endNode || startNode === endNode) return;
    const computed = computeDijkstraSteps(nodes, edges, startNode, endNode);
    setSteps(computed);
    setStepIdx(0);
    setPhase('paused');
    setPlaying(false);
  }, [nodes, edges, startNode, endNode]);

  const togglePlay = useCallback(() => {
    if (phase === 'idle') { runAlgo(); setPlaying(true); return; }
    if (stepIdx >= steps.length - 1) return;
    setPlaying(p => !p);
  }, [phase, stepIdx, steps.length, runAlgo]);

  const stepForward = useCallback(() => {
    if (phase === 'idle') { runAlgo(); return; }
    setPlaying(false);
    setStepIdx(prev => {
      const next = Math.min(prev + 1, steps.length - 1);
      if (next === steps.length - 1) setPhase('done');
      return next;
    });
  }, [phase, runAlgo, steps.length]);

  const stepBack = useCallback(() => {
    setPlaying(false);
    setStepIdx(prev => Math.max(prev - 1, 0));
    setPhase('paused');
  }, []);

  const resetAlgo = useCallback(() => {
    setPlaying(false);
    setSteps([]);
    setStepIdx(-1);
    setPhase('idle');
  }, []);

  // ── Load preset ────────────────────────────────────────────────────────────
  const loadPreset = (key: string) => {
    const p = PRESETS[key];
    setNodes(p.nodes);
    setEdges(p.edges);
    setStartNode(p.start);
    setEndNode(p.end);
    resetAlgo();
    setEdgeFrom(null);
    setMode('select');
  };

  // ── Graph editing ──────────────────────────────────────────────────────────
  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setStartNode('');
    setEndNode('');
    resetAlgo();
    setEdgeFrom(null);
  };

  const confirmEdge = () => {
    if (!pendingEdge) return;
    const w = Math.max(1, parseInt(pendingWeight) || 1);
    const id = `e-${Date.now()}`;
    setEdges(prev => [...prev, { id, from: pendingEdge.fromId, to: pendingEdge.toId, weight: w }]);
    setPendingEdge(null);
    setEdgeFrom(null);
    setPendingWeight('1');
    resetAlgo();
  };

  const cancelEdge = () => {
    setPendingEdge(null);
    setEdgeFrom(null);
    setPendingWeight('1');
  };

  // ── SVG mouse handlers ────────────────────────────────────────────────────
  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (drag) return; // was dragging
    const { x, y } = getSVGCoords(e.clientX, e.clientY);
    if (mode === 'addNode') {
      const label = nextLabel(nodes);
      const newNode: GNode = { id: label, label, x, y };
      setNodes(prev => [...prev, newNode]);
      if (!startNode) setStartNode(label);
      else if (!endNode) setEndNode(label);
      resetAlgo();
    }
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (mode === 'delete') {
      setNodes(prev => prev.filter(n => n.id !== nodeId));
      setEdges(prev => prev.filter(ed => ed.from !== nodeId && ed.to !== nodeId));
      if (startNode === nodeId) setStartNode('');
      if (endNode   === nodeId) setEndNode('');
      resetAlgo();
      return;
    }
    if (mode === 'addEdge') {
      if (!edgeFrom) {
        setEdgeFrom(nodeId);
      } else if (edgeFrom !== nodeId) {
        // check duplicate
        const exists = edges.some(
          ed => (ed.from === edgeFrom && ed.to === nodeId) || (ed.from === nodeId && ed.to === edgeFrom),
        );
        if (!exists) {
          setPendingEdge({ fromId: edgeFrom, toId: nodeId });
          setPendingWeight('1');
        } else {
          setEdgeFrom(null);
        }
      }
      return;
    }
    if (mode === 'select') {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;
      setDrag({ nodeId, startCX: e.clientX, startCY: e.clientY, initX: node.x, initY: node.y });
    }
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleEdgeClick = (e: React.MouseEvent, edgeId: string) => {
    e.stopPropagation();
    if (mode === 'delete') {
      setEdges(prev => prev.filter(ed => ed.id !== edgeId));
      resetAlgo();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const pos = getSVGCoords(e.clientX, e.clientY);
    setMouseSVG(pos);

    if (!drag) return;
    const svg = svgRef.current!;
    const rect = svg.getBoundingClientRect();
    const sx = W / rect.width;
    const sy = H / rect.height;
    const dx = (e.clientX - drag.startCX) * sx;
    const dy = (e.clientY - drag.startCY) * sy;
    const nx = Math.max(R + 2, Math.min(W - R - 2, drag.initX + dx));
    const ny = Math.max(R + 2, Math.min(H - R - 2, drag.initY + dy));
    setNodes(prev => prev.map(n => n.id === drag.nodeId ? { ...n, x: nx, y: ny } : n));
  };

  const handleMouseUp = () => setDrag(null);

  // ─── Render ────────────────────────────────────────────────────────────────
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  const isDone  = phase === 'done' && currentStep?.type === 'done';
  const noPath  = phase === 'done' && currentStep?.type === 'no_path';
  const canRun  = startNode && endNode && startNode !== endNode && nodes.length >= 2;

  const ACCENT   = '#00d4ff';
  const PURPLE   = '#7c3aed';
  const GREEN    = '#06d6a0';
  const ORANGE   = '#ffab00';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Top Nav ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,8,15,0.94)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(100,210,255,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 32px', height: 58,
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <FiArrowLeft size={15} /> Back to Portfolio
        </button>

        <a href="/" style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 17, color: ACCENT, letterSpacing: 1 }}>
          &lt;Daud /&gt;
        </a>

        <a
          href="https://github.com/therealdaud/cpp-dynamic-graph-dijkstra"
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--mono)',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = ACCENT)}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <FiGithub size={16} /> Source
        </a>
      </header>

      {/* ── Page Hero ── */}
      <div style={{ paddingTop: 60, paddingBottom: 48 }}>
        <div className="container">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p style={{ fontFamily: 'var(--mono)', fontSize: 12, color: ACCENT, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 }}>
              04. Projects — Interactive Visualizer
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
              <MdOutlineAccountTree size={36} color={ACCENT} />
              <h1 style={{ fontSize: 'clamp(26px,4vw,44px)', fontWeight: 800, color: 'var(--heading)', lineHeight: 1.1 }}>
                Dijkstra Graph{' '}
                <span style={{ background: `linear-gradient(135deg, ${ACCENT}, ${PURPLE})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Visualizer
                </span>
              </h1>
            </div>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, maxWidth: 680, marginBottom: 20 }}>
              An interactive step-by-step walkthrough of Dijkstra's shortest-path algorithm on a
              dynamic weighted graph. Build your own graph, set source and destination nodes, then
              watch the algorithm find the optimal path in real time.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['C++', 'TypeScript', 'React', 'SVG', 'Graph Theory', 'Data Structures', 'Algorithms'].map(t => (
                <TechBadge key={t} name={t} color={ACCENT} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Visualizer ── */}
      <div className="container" style={{ paddingBottom: 80 }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}
          className="viz-grid"
        >
          {/* ── Canvas ── */}
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden',
          }}>
            {/* Toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
              borderBottom: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
              flexWrap: 'wrap',
            }}>
              {/* Presets */}
              {Object.entries(PRESETS).map(([k, p]) => (
                <button key={k}
                  onClick={() => loadPreset(k)}
                  style={{
                    padding: '4px 12px', borderRadius: 6,
                    background: 'rgba(0,212,255,0.08)',
                    border: '1px solid rgba(0,212,255,0.2)',
                    color: ACCENT, fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
                >
                  {p.label}
                </button>
              ))}

              <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

              {/* Tool buttons */}
              {([
                ['select',  'Move',        '⊹'],
                ['addNode', 'Add Node',    '+'],
                ['addEdge', 'Add Edge',    '─'],
                ['delete',  'Delete',      '✕'],
              ] as [ToolMode, string, string][]).map(([m, label, icon]) => (
                <button key={m}
                  onClick={() => { setMode(m); setEdgeFrom(null); }}
                  title={label}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: mode === m ? `${ACCENT}22` : 'transparent',
                    border: `1px solid ${mode === m ? `${ACCENT}55` : 'rgba(255,255,255,0.08)'}`,
                    color: mode === m ? ACCENT : 'var(--muted)',
                    fontSize: 12, fontFamily: 'var(--mono)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                  }}
                >
                  <span>{icon}</span>
                  <span className="tool-label">{label}</span>
                </button>
              ))}

              <div style={{ marginLeft: 'auto' }}>
                <button
                  onClick={clearGraph}
                  style={{
                    padding: '4px 10px', borderRadius: 6,
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--muted)', fontSize: 11, fontFamily: 'var(--mono)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#ef444440'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
                >
                  <FiTrash2 size={11} /> Clear
                </button>
              </div>
            </div>

            {/* Mode hint */}
            <div style={{
              padding: '6px 14px',
              background: 'rgba(0,212,255,0.04)',
              borderBottom: '1px solid rgba(0,212,255,0.06)',
              fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--muted)',
            }}>
              {mode === 'select'  && (edgeFrom ? `Drawing edge from ${edgeFrom} — click destination node` : 'Drag nodes to reposition')}
              {mode === 'addNode' && 'Click anywhere on the canvas to place a node'}
              {mode === 'addEdge' && (!edgeFrom ? 'Click a source node' : `From ${edgeFrom} → click a destination node`)}
              {mode === 'delete'  && 'Click a node or edge to delete it'}
              {' '}
              {phase !== 'idle' && <span style={{ color: ACCENT }}>
                · Step {stepIdx + 1} / {steps.length}
              </span>}
            </div>

            {/* SVG Canvas */}
            <svg
              ref={svgRef}
              viewBox={`0 0 ${W} ${H}`}
              style={{
                width: '100%', display: 'block',
                cursor: mode === 'addNode' ? 'crosshair' : mode === 'delete' ? 'not-allowed' : drag ? 'grabbing' : 'default',
                userSelect: 'none',
              }}
              onClick={handleSVGClick}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                {/* Grid pattern */}
                <pattern id="dot-grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.8" fill="rgba(100,210,255,0.12)" />
                </pattern>
                {/* Glow filters */}
                {[
                  ['g-cyan',   '0,212,255'],
                  ['g-purple', '168,85,247'],
                  ['g-green',  '6,214,160'],
                  ['g-orange', '255,171,0'],
                ].map(([id, rgb]) => (
                  <filter key={id} id={id} x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feFlood floodColor={`rgb(${rgb})`} floodOpacity="0.4" result="color" />
                    <feComposite in="color" in2="blur" operator="in" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                ))}
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="rgba(100,210,255,0.3)" />
                </marker>
              </defs>

              {/* Background */}
              <rect width={W} height={H} fill="#0a0a14" />
              <rect width={W} height={H} fill="url(#dot-grid)" />

              {/* Edges */}
              {edges.map(edge => {
                const n1 = nodeMap[edge.from];
                const n2 = nodeMap[edge.to];
                if (!n1 || !n2) return null;
                const es = getEdgeState(edge, currentStep);
                const ev = edgeVisual(es);
                const mid = { x: (n1.x + n2.x) / 2, y: (n1.y + n2.y) / 2 };
                const isPath = es === 'path';

                return (
                  <g key={edge.id}
                    onClick={ev2 => handleEdgeClick(ev2, edge.id)}
                    style={{ cursor: mode === 'delete' ? 'pointer' : 'default' }}
                  >
                    {/* Invisible hit area */}
                    <line
                      x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                      stroke="transparent" strokeWidth={16}
                    />
                    <line
                      x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                      stroke={ev.stroke} strokeWidth={ev.sw}
                      strokeDasharray={isPath ? '8 4' : undefined}
                      filter={ev.filter}
                      style={isPath ? { animation: 'dash-flow 0.6s linear infinite' } : undefined}
                    />
                    {/* Weight label */}
                    <rect
                      x={mid.x - 12} y={mid.y - 10} width={24} height={18} rx={5}
                      fill="#0e0e1c" stroke={ev.stroke} strokeWidth={0.8} opacity={0.9}
                    />
                    <text
                      x={mid.x} y={mid.y + 4}
                      textAnchor="middle" fontSize={10}
                      fill={es !== 'default' ? ev.stroke : 'var(--muted)'}
                      fontFamily="var(--mono)"
                    >
                      {edge.weight}
                    </text>
                  </g>
                );
              })}

              {/* Drawing edge preview */}
              {mode === 'addEdge' && edgeFrom && mouseSVG && nodeMap[edgeFrom] && (
                <line
                  x1={nodeMap[edgeFrom].x} y1={nodeMap[edgeFrom].y}
                  x2={mouseSVG.x} y2={mouseSVG.y}
                  stroke={ACCENT} strokeWidth={1.5} strokeDasharray="6 4" opacity={0.5}
                />
              )}

              {/* Nodes */}
              {nodes.map(node => {
                const ns  = getNodeState(node.id, currentStep, startNode, endNode);
                const nv  = nodeVisual(ns);
                const dis = currentStep?.distances[node.id];
                const isEdgeFrom = edgeFrom === node.id;

                return (
                  <g key={node.id}
                    onMouseDown={e => handleNodeMouseDown(e, node.id)}
                    onClick={handleNodeClick}
                    onMouseEnter={() => setHovered(node.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{ cursor: mode === 'delete' ? 'pointer' : mode === 'select' ? 'grab' : 'pointer' }}
                  >
                    {/* Pulse ring for current node */}
                    {ns === 'current' && (
                      <circle
                        cx={node.x} cy={node.y} r={R + 10}
                        fill="none" stroke={ACCENT} strokeWidth={1.5}
                        style={{
                          animation: 'pulse-ring 1.4s ease-out infinite',
                          transformOrigin: `${node.x}px ${node.y}px`,
                        }}
                      />
                    )}

                    {/* Selection ring when picking edge source */}
                    {isEdgeFrom && (
                      <circle cx={node.x} cy={node.y} r={R + 6}
                        fill="none" stroke={ACCENT} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
                      />
                    )}

                    {/* Hover ring */}
                    {hovered === node.id && ns === 'default' && (
                      <circle cx={node.x} cy={node.y} r={R + 5}
                        fill="none" stroke={ACCENT} strokeWidth={1} opacity={0.3}
                      />
                    )}

                    {/* Main circle */}
                    <circle
                      cx={node.x} cy={node.y} r={R}
                      fill={nv.fill} stroke={nv.stroke} strokeWidth={nv.sw}
                      filter={nv.filter}
                      style={{ transition: 'fill 0.25s, stroke 0.25s' }}
                    />

                    {/* Node label */}
                    <text
                      x={node.x} y={node.y + 5}
                      textAnchor="middle" fontSize={14} fontWeight={700}
                      fill={nv.lc} fontFamily="var(--mono)"
                      style={{ transition: 'fill 0.25s', pointerEvents: 'none' }}
                    >
                      {node.label}
                    </text>

                    {/* Distance badge */}
                    {dis !== undefined && (
                      <g>
                        <rect
                          x={node.x + R - 6} y={node.y - R - 16} width={28} height={16} rx={4}
                          fill={dis === Infinity ? '#1a1a2e' : `${ACCENT}22`}
                          stroke={dis === Infinity ? 'rgba(255,255,255,0.1)' : `${ACCENT}55`}
                          strokeWidth={0.8}
                        />
                        <text
                          x={node.x + R + 8} y={node.y - R - 4}
                          textAnchor="middle" fontSize={9}
                          fill={dis === Infinity ? 'var(--muted)' : ACCENT}
                          fontFamily="var(--mono)"
                          style={{ pointerEvents: 'none' }}
                        >
                          {fmtDist(dis)}
                        </text>
                      </g>
                    )}

                    {/* S / E role indicators */}
                    {node.id === startNode && ns !== 'path' && (
                      <text x={node.x} y={node.y - R - 6} textAnchor="middle"
                        fontSize={9} fill={GREEN} fontFamily="var(--mono)">src</text>
                    )}
                    {node.id === endNode && ns !== 'path' && (
                      <text x={node.x} y={node.y - R - 6} textAnchor="middle"
                        fontSize={9} fill="#a78bfa" fontFamily="var(--mono)">dst</text>
                    )}
                  </g>
                );
              })}

              {/* Done overlay banner */}
              <AnimatePresence>
                {isDone && (
                  <motion.g
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  >
                    <rect x={W / 2 - 200} y={H - 52} width={400} height={38} rx={10}
                      fill="rgba(168,85,247,0.18)" stroke="#a855f7" strokeWidth={1} />
                    <text x={W / 2} y={H - 28} textAnchor="middle" fontSize={12}
                      fill="#e9d5ff" fontFamily="var(--mono)">
                      {currentStep?.message}
                    </text>
                  </motion.g>
                )}
                {noPath && (
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <rect x={W / 2 - 180} y={H - 52} width={360} height={38} rx={10}
                      fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth={1} />
                    <text x={W / 2} y={H - 28} textAnchor="middle" fontSize={12}
                      fill="#fca5a5" fontFamily="var(--mono)">
                      No path exists between selected nodes
                    </text>
                  </motion.g>
                )}
              </AnimatePresence>

              <style>{`
                @keyframes dash-flow { to { stroke-dashoffset: -24; } }
                @keyframes pulse-ring {
                  0%   { transform: scale(0.85); opacity: 0.7; }
                  100% { transform: scale(1.5);  opacity: 0; }
                }
              `}</style>
            </svg>
          </div>

          {/* ── Control Panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Algorithm controls */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 14, padding: 18, display: 'flex', flexDirection: 'column', gap: 14,
            }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: ACCENT, letterSpacing: 2, textTransform: 'uppercase' }}>
                Algorithm
              </p>

              {/* Start / End selectors */}
              {(['start', 'end'] as const).map(role => {
                const value    = role === 'start' ? startNode : endNode;
                const setFn    = role === 'start' ? setStartNode : setEndNode;
                const color    = role === 'start' ? GREEN : '#a78bfa';
                const label    = role === 'start' ? 'Source' : 'Destination';
                return (
                  <div key={role} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>{label}</span>
                    <select
                      value={value}
                      onChange={e => { setFn(e.target.value); resetAlgo(); }}
                      style={{
                        background: `${color}18`, border: `1px solid ${color}44`,
                        color, borderRadius: 6, padding: '4px 10px',
                        fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer',
                        outline: 'none',
                      }}
                    >
                      <option value="">— none —</option>
                      {nodes.filter(n => role === 'start' ? n.id !== endNode : n.id !== startNode).map(n => (
                        <option key={n.id} value={n.id}>{n.label}</option>
                      ))}
                    </select>
                  </div>
                );
              })}

              {/* Run / playback row */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {phase === 'idle' ? (
                  <button
                    onClick={runAlgo}
                    disabled={!canRun}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 8,
                      background: canRun ? `linear-gradient(135deg, ${ACCENT}, #0096b3)` : 'rgba(255,255,255,0.05)',
                      border: 'none', color: canRun ? '#08080f' : 'var(--muted)',
                      fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, cursor: canRun ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s',
                    }}
                  >
                    ▶ Initialize
                  </button>
                ) : (
                  <>
                    <button onClick={stepBack} disabled={stepIdx <= 0}
                      style={ctrlBtn(stepIdx > 0)}>⏮</button>
                    <button onClick={togglePlay} disabled={stepIdx >= steps.length - 1}
                      style={{ ...ctrlBtn(stepIdx < steps.length - 1), flex: 1 }}>
                      {playing ? <FiPause size={14} /> : <FiPlay size={14} />}
                    </button>
                    <button onClick={stepForward} disabled={stepIdx >= steps.length - 1}
                      style={ctrlBtn(stepIdx < steps.length - 1)}><FiSkipForward size={14} /></button>
                    <button onClick={resetAlgo} style={ctrlBtn(true)}><FiRotateCcw size={14} /></button>
                  </>
                )}
              </div>

              {/* Speed */}
              {phase !== 'idle' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted)' }}>Speed</span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: ACCENT }}>
                      {speed >= 1000 ? 'Slow' : speed >= 500 ? 'Medium' : 'Fast'}
                    </span>
                  </div>
                  <input
                    type="range" min={150} max={1400} step={50} value={speed}
                    onChange={e => setSpeed(Number(e.target.value))}
                    style={{ width: '100%', accentColor: ACCENT, cursor: 'pointer' }}
                  />
                </div>
              )}

              {/* Keyboard shortcuts */}
              {phase !== 'idle' && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[['Space','Play/Pause'],['→','Step'],['R','Reset']].map(([k, v]) => (
                    <span key={k} style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                      <kbd style={{
                        padding: '1px 5px', borderRadius: 3,
                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      }}>{k}</kbd> {v}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Step message */}
            <AnimatePresence mode="wait">
              {currentStep && (
                <motion.div
                  key={currentStep.stepIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: phase === 'done' && currentStep.type === 'done'
                      ? 'rgba(168,85,247,0.1)' : 'var(--card)',
                    border: `1px solid ${phase === 'done' && currentStep.type === 'done' ? '#a855f733' : 'var(--border)'}`,
                    borderRadius: 12, padding: '12px 14px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{
                      fontFamily: 'var(--mono)', fontSize: 10, padding: '2px 7px',
                      borderRadius: 10, border: '1px solid',
                      ...stepTypeStyle(currentStep.type),
                    }}>
                      {currentStep.type.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)' }}>
                      step {currentStep.stepIndex + 1}/{steps.length}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65, fontFamily: 'var(--mono)' }}>
                    {currentStep.message}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Distances table */}
            {currentStep && nodes.length > 0 && (
              <div style={{
                background: 'var(--card)', border: '1px solid var(--border)',
                borderRadius: 12, overflow: 'hidden',
              }}>
                <div style={{
                  padding: '8px 14px', borderBottom: '1px solid var(--border)',
                  fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)',
                  textTransform: 'uppercase', letterSpacing: 2,
                }}>
                  Distance Table
                </div>
                <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {nodes.map(n => {
                    const d   = currentStep.distances[n.id];
                    const via = currentStep.previous[n.id];
                    const inPath = currentStep.shortestPath.includes(n.id);
                    return (
                      <div key={n.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '3px 0',
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        opacity: currentStep.visited.includes(n.id) && !inPath ? 0.6 : 1,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700,
                            color: inPath ? '#e9d5ff' : n.id === currentStep.current ? ACCENT : 'var(--text)',
                          }}>
                            {n.label}
                          </span>
                          {via && (
                            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                              via {via}
                            </span>
                          )}
                        </div>
                        <span style={{
                          fontFamily: 'var(--mono)', fontSize: 12,
                          color: inPath ? '#a855f7' : d === Infinity ? 'var(--muted)' : ACCENT,
                          fontWeight: inPath ? 700 : 400,
                        }}>
                          {fmtDist(d)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div style={{
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '12px 14px',
            }}>
              <p style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>
                Legend
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  [GREEN,   'Source node'],
                  ['#a78bfa','Destination node'],
                  [ACCENT,  'Currently processing'],
                  [ORANGE,  'Neighbor being evaluated'],
                  ['rgba(6,214,160,0.5)', 'Visited (settled)'],
                  ['#a855f7','Shortest path'],
                ].map(([color, label]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Project Details ── */}
      <div style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '80px 32px' }}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <p className="section-label">About This Project</p>
            <h2 className="section-title">How It <span>Works</span></h2>
            <div className="section-divider" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="details-grid">
              <div>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85, marginBottom: 20 }}>
                  This project started as a C++ data structures assignment implementing Dijkstra's algorithm
                  on a dynamic weighted graph using an adjacency-list representation. The core engine
                  is built in C++ with a clean abstract base class (<code style={{ color: ACCENT, fontFamily: 'var(--mono)' }}>GraphBase</code>) and
                  a concrete implementation featuring full input validation.
                </p>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.85 }}>
                  The visualizer you're using is built in TypeScript and React with raw SVG — no
                  graph-rendering library, no canvas abstraction. Every glow, animation, and step
                  transition is hand-coded to match the portfolio's aesthetic.
                </p>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  'Adjacency-list graph (O(V + E) space) with dynamic vertex and edge management',
                  'Dijkstra\'s algorithm runs in O(V² + E) using a linear scan — identical to the C++ implementation',
                  'Abstract GraphBase interface with a concrete Graph class, mirroring classic OOP design',
                  'Full input validation: no self-loops, no duplicate vertices or edges, existence checks on all operations',
                  'Interactive SVG canvas: drag nodes, add/delete nodes and edges, set custom edge weights',
                  'Step-by-step mode with play/pause, variable speed, keyboard shortcuts, and a live distance table',
                ].map((b, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>
                    <span style={{ color: ACCENT, flexShrink: 0, marginTop: 3 }}>▹</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'wrap' }}>
              <a
                href="https://github.com/therealdaud/cpp-dynamic-graph-dijkstra"
                target="_blank" rel="noopener noreferrer"
                className="btn btn-outline"
                style={{ fontSize: 13, gap: 8 }}
              >
                <FiGithub size={15} /> View C++ Source
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Weight Modal ── */}
      <AnimatePresence>
        {pendingEdge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.72)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 500,
            }}
            onClick={cancelEdge}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 26 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--card)',
                border: '1px solid rgba(0,212,255,0.25)',
                borderRadius: 16, padding: 28, minWidth: 280,
                boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              }}
            >
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: ACCENT, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
                New Edge
              </p>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 6 }}>
                {pendingEdge.fromId} → {pendingEdge.toId}
              </h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>Set edge weight (positive integer)</p>
              <input
                ref={weightRef}
                type="number" min={1} max={999} value={pendingWeight}
                onChange={e => setPendingWeight(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') confirmEdge(); if (e.key === 'Escape') cancelEdge(); }}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(0,212,255,0.35)',
                  color: 'var(--heading)', fontFamily: 'var(--mono)', fontSize: 20,
                  outline: 'none', marginBottom: 16, textAlign: 'center',
                }}
              />
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={confirmEdge}
                  style={{
                    flex: 1, padding: '10px 0', borderRadius: 8,
                    background: `linear-gradient(135deg, ${ACCENT}, #0096b3)`,
                    border: 'none', color: '#08080f',
                    fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Add Edge
                </button>
                <button
                  onClick={cancelEdge}
                  style={{
                    padding: '10px 16px', borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 13, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 900px) {
          .viz-grid { grid-template-columns: 1fr !important; }
          .tool-label { display: none; }
        }
        @media (max-width: 768px) {
          .details-grid { grid-template-columns: 1fr !important; }
        }
        select option { background: #14141f; color: #ccd6f6; }
      `}</style>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function ctrlBtn(enabled: boolean): React.CSSProperties {
  return {
    padding: '8px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: enabled ? 'var(--text)' : 'var(--muted)',
    cursor: enabled ? 'pointer' : 'not-allowed',
    fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', opacity: enabled ? 1 : 0.4,
  };
}

function stepTypeStyle(type: DijkstraStep['type']): React.CSSProperties {
  switch (type) {
    case 'init':    return { color: '#7a8499',  borderColor: 'rgba(122,132,153,0.4)', background: 'rgba(122,132,153,0.1)' };
    case 'visit':   return { color: '#00d4ff',  borderColor: 'rgba(0,212,255,0.4)',   background: 'rgba(0,212,255,0.1)'   };
    case 'relax':   return { color: '#ffab00',  borderColor: 'rgba(255,171,0,0.4)',   background: 'rgba(255,171,0,0.1)'   };
    case 'done':    return { color: '#a855f7',  borderColor: 'rgba(168,85,247,0.4)',  background: 'rgba(168,85,247,0.1)'  };
    case 'no_path': return { color: '#ef4444',  borderColor: 'rgba(239,68,68,0.4)',   background: 'rgba(239,68,68,0.1)'   };
    default:        return {};
  }
}
