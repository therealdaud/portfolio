export interface GNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface DijkstraStep {
  stepIndex: number;
  type: 'init' | 'visit' | 'relax' | 'done' | 'no_path';
  current: string | null;
  considering: string | null;
  visited: string[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  relaxedEdge: { from: string; to: string } | null;
  improved: boolean;
  shortestPath: string[];
  totalCost: number;
  message: string;
}

export function computeDijkstraSteps(
  nodes: GNode[],
  edges: GEdge[],
  startId: string,
  endId: string,
): DijkstraStep[] {
  const steps: DijkstraStep[] = [];
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visitedSet = new Set<string>();

  for (const n of nodes) {
    dist[n.id] = n.id === startId ? 0 : Infinity;
    prev[n.id] = null;
  }

  const snap = () => ({
    visited: [...visitedSet],
    distances: { ...dist },
    previous: { ...prev },
  });

  steps.push({
    stepIndex: 0,
    type: 'init',
    current: null,
    considering: null,
    ...snap(),
    relaxedEdge: null,
    improved: false,
    shortestPath: [],
    totalCost: 0,
    message: `d(${startId}) = 0, all others = ∞. Ready to begin.`,
  });

  for (let iter = 0; iter < nodes.length * nodes.length + 4; iter++) {
    // Pick the unvisited node with the smallest known distance
    let current: string | null = null;
    let minDist = Infinity;
    for (const n of nodes) {
      if (!visitedSet.has(n.id) && dist[n.id] < minDist) {
        minDist = dist[n.id];
        current = n.id;
      }
    }

    if (!current) break; // all remaining nodes unreachable

    visitedSet.add(current);

    steps.push({
      stepIndex: steps.length,
      type: 'visit',
      current,
      considering: null,
      ...snap(),
      relaxedEdge: null,
      improved: false,
      shortestPath: [],
      totalCost: 0,
      message: `Settled ${current} with distance ${dist[current]}. Scanning its neighbors…`,
    });

    if (current === endId) break;

    // Relax each unvisited neighbor
    for (const e of edges) {
      let neighbor: string | null = null;
      if (e.from === current && !visitedSet.has(e.to)) neighbor = e.to;
      else if (e.to === current && !visitedSet.has(e.from)) neighbor = e.from;
      if (!neighbor) continue;

      const candidate = dist[current] + e.weight;
      const oldDist = dist[neighbor];
      const improved = candidate < oldDist;

      // snapshot BEFORE updating so the step shows the "before" state
      const beforeSnap = snap();

      if (improved) {
        dist[neighbor] = candidate;
        prev[neighbor] = current;
      }

      steps.push({
        stepIndex: steps.length,
        type: 'relax',
        current,
        considering: neighbor,
        ...beforeSnap,
        relaxedEdge: { from: current, to: neighbor },
        improved,
        shortestPath: [],
        totalCost: 0,
        message: improved
          ? `d(${current}) + ${e.weight} = ${candidate} < ${oldDist === Infinity ? '∞' : oldDist} → d(${neighbor}) updated to ${candidate}`
          : `d(${current}) + ${e.weight} = ${candidate} ≥ ${oldDist} → d(${neighbor}) unchanged`,
      });
    }
  }

  // Reconstruct shortest path
  const path: string[] = [];
  const seen = new Set<string>();
  let cur: string | null = endId;
  while (cur !== null && !seen.has(cur)) {
    seen.add(cur);
    path.unshift(cur);
    if (cur === startId) break;
    cur = prev[cur] ?? null;
  }

  const found =
    path.length > 0 &&
    path[0] === startId &&
    path[path.length - 1] === endId &&
    dist[endId] < Infinity;

  steps.push({
    stepIndex: steps.length,
    type: found ? 'done' : 'no_path',
    current: endId,
    considering: null,
    ...snap(),
    relaxedEdge: null,
    improved: false,
    shortestPath: found ? path : [],
    totalCost: found ? dist[endId] : 0,
    message: found
      ? `✓ Shortest path: ${path.join(' → ')}   |   Total cost: ${dist[endId]}`
      : `No path exists from ${startId} to ${endId}`,
  });

  return steps;
}
