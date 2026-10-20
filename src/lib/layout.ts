import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force';
import type { Lesson, Subject } from '../types';

export interface GraphNode extends SimulationNodeDatum {
  key: string;
  id: string;
  kind: 'subject' | 'lesson';
  subjectId: string;
  subject: Subject;
  lesson?: Lesson;
  x: number;
  y: number;
  radius: number;
}
export interface GraphLink { source: string; target: string }
interface SavedPosition { x: number; y: number }
const STORAGE_KEY = 'universo.positions.v1';

export function readPositions(): Record<string, SavedPosition> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, SavedPosition] => {
      const p = entry[1];
      return !!p && typeof p === 'object' && Number.isFinite(p.x) && Number.isFinite(p.y) && Math.abs(p.x) < 1e6 && Math.abs(p.y) < 1e6;
    }));
  } catch { return {}; }
}

/** Merge visible coordinates without losing positions hidden by a filter. */
export function savePositions(nodes: GraphNode[]): void {
  const positions = readPositions();
  for (const node of nodes) positions[node.key] = { x: +node.x.toFixed(3), y: +node.y.toFixed(3) };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch { /* Storage is optional. */ }
}

export function planetRadius(count: number, enabled: boolean): number {
  return 39 + (enabled ? Math.min(39, 4 * Math.sqrt(Math.max(0, count))) : 0);
}

/** Brief, local relaxation around the user's arrangement; no return to seed coordinates. */
export function relaxLayout(nodes: GraphNode[], links: GraphLink[], fixedKey?: string, minimumRadius = 0) {
  const anchors = new Map(nodes.map(node => [node.key, { x: node.x, y: node.y }]));
  for (const node of nodes) {
    node.fx = node.key === fixedKey ? node.x : null;
    node.fy = node.key === fixedKey ? node.y : null;
    node.vx = node.vy = 0;
  }
  return forceSimulation(nodes).alphaDecay(.065).velocityDecay(.48)
    .force('link', forceLink<GraphNode, GraphLink>(links.map(link => ({ ...link }))).id(node => node.key)
      .distance(link => Math.max(126, (link.source as unknown as GraphNode).radius + 80)).strength(.3))
    .force('collision', forceCollide<GraphNode>().radius(node => node.kind === 'subject' ? Math.max(node.radius, minimumRadius * node.radius / 39) + 25 : Math.max(8, minimumRadius * .3125) + 7).iterations(5).strength(1))
    .force('charge', forceManyBody<GraphNode>().strength(node => node.kind === 'subject' ? -75 : -15).distanceMax(220))
    .force('x', forceX<GraphNode>(node => anchors.get(node.key)!.x).strength(node => node.kind === 'subject' ? .12 : .015))
    .force('y', forceY<GraphNode>(node => anchors.get(node.key)!.y).strength(node => node.kind === 'subject' ? .12 : .015));
}

function hash(value: string): number {
  let result = 2166136261;
  for (const char of value) result = Math.imul(result ^ char.charCodeAt(0), 16777619);
  return result >>> 0;
}

/** Calculate once, stop, and preserve existing coordinates when the library grows. */
export function createLayout(subjects: Subject[], lessons: Lesson[]): { nodes: GraphNode[]; links: GraphLink[] } {
  const positions = readPositions();
  const nodes: GraphNode[] = subjects.map(subject => {
    const saved = positions[`subject:${subject.id}`];
    const position = saved || subject.position;
    return { key: `subject:${subject.id}`, id: subject.id, kind: 'subject', subjectId: subject.id, subject, radius: 39, ...position, ...(saved ? { fx: saved.x, fy: saved.y } : {}) };
  });
  const bySubject = new Map(nodes.map(node => [node.id, node]));
  const counts = new Map<string, number>();
  for (const lesson of lessons) {
    const parent = bySubject.get(lesson.subjectId);
    if (!parent) continue;
    const key = `lesson:${lesson.id}`;
    const saved = positions[key];
    const index = counts.get(lesson.subjectId) || 0;
    counts.set(lesson.subjectId, index + 1);
    const angle = hash(key) / 4294967296 * Math.PI * 2;
    const distance = 118 + Math.floor(index / 8) * 27;
    const position = saved || { x: parent.x + Math.cos(angle) * distance, y: parent.y + Math.sin(angle) * distance };
    nodes.push({ key, id: lesson.id, kind: 'lesson', subjectId: lesson.subjectId, subject: parent.subject, lesson, radius: 8, ...position, ...(saved ? { fx: saved.x, fy: saved.y } : {}) });
  }
  const links = nodes.filter(node => node.kind === 'lesson').map(node => ({ source: `subject:${node.subjectId}`, target: node.key }));
  if (nodes.some(node => node.fx == null)) {
    const simulation = forceSimulation(nodes)
      .force('link', forceLink<GraphNode, GraphLink>(links.map(link => ({ ...link }))).id(node => node.key).distance(126).strength(0.5))
      .force('charge', forceManyBody<GraphNode>().strength(node => node.kind === 'subject' ? -95 : -18).distanceMax(240))
      .force('collision', forceCollide<GraphNode>().radius(node => node.kind === 'subject' ? 103 : 15).iterations(3))
      .force('x', forceX<GraphNode>(node => node.subject.position.x).strength(node => node.kind === 'subject' ? 0.8 : 0.025))
      .force('y', forceY<GraphNode>(node => node.subject.position.y).strength(node => node.kind === 'subject' ? 0.8 : 0.025))
      .stop();
    simulation.tick(220);
    simulation.stop();
    for (const node of nodes) positions[node.key] = { x: +node.x.toFixed(3), y: +node.y.toFixed(3) };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch { /* The map also works without browser storage. */ }
  }
  return { nodes, links };
}

export function wrapLabel(label: string, maxLength = 25): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of label.split(/\s+/)) {
    if (line && (line.length + word.length + 1) > maxLength) { lines.push(line); line = word; }
    else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}
