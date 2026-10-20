import { zoomIdentity, type ZoomTransform } from 'd3-zoom';
import type { GraphNode } from './layout';

interface Callbacks {
  onStart(): void;
  onHideTooltip(): void;
  onArm(key: string | null): void;
  onMove(): void;
  onSettle(key?: string): void;
  onSave(): void;
  getTransform(): ZoomTransform;
  onTransform(transform: ZoomTransform): void;
}

/** Quick drag pans; holding a planet for 320 ms arms its independent drag. */
export function attachMapGestures(svg: SVGSVGElement, nodes: GraphNode[], size: {width: number; height: number}, callbacks: Callbacks) {
    const nodeMap = new Map(nodes.map(node => [node.key, node]));
    let suppressClickUntil = 0;
    const pointers = new Map<number, { x: number; y: number }>();
    let gesture: { node?: GraphNode; x: number; y: number; mode: 'pending' | 'pan' | 'planet'; timer?: ReturnType<typeof setTimeout>; moved: boolean } | null = null;
    const point = (event: PointerEvent) => {
      const rect = svg.getBoundingClientRect();
      return { x: (event.clientX - rect.left) * size.width / rect.width, y: (event.clientY - rect.top) * size.height / rect.height };
    };
    const cancelTimer = () => { if (gesture?.timer) clearTimeout(gesture.timer); };
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      callbacks.onStart();
      const p = point(event);
      pointers.set(event.pointerId, p);
      const captureTarget = (event.target as Element).closest<SVGGElement>('[data-node-key]') || svg;
      captureTarget.setPointerCapture(event.pointerId);
      if (pointers.size > 1) {
        cancelTimer();
        if (gesture) { gesture.mode = 'pan'; gesture.moved = true; }
        callbacks.onArm(null);
        return;
      }
      const element = (event.target as Element).closest('[data-node-key]');
      const node = nodeMap.get(element?.getAttribute('data-node-key') || '');
      gesture = { node: node?.kind === 'subject' ? node : undefined, ...p, mode: 'pending', moved: false };
      callbacks.onHideTooltip();
      if (gesture.node) gesture.timer = setTimeout(() => {
        if (gesture?.mode === 'pending' && gesture.node && pointers.size === 1) {
          gesture.mode = 'planet';
          callbacks.onArm(gesture.node.key);
        }
      }, 320);
    };
    const move = (event: PointerEvent) => {
      const old = pointers.get(event.pointerId);
      if (!old || !gesture) return;
      const p = point(event);
      if (pointers.size > 1) {
        const previous = [...pointers.values()];
        pointers.set(event.pointerId, p);
        const next = [...pointers.values()];
        const a = previous[0], b = previous[1], c = next[0], d = next[1];
        const oldDistance = Math.hypot(a.x - b.x, a.y - b.y);
        const newDistance = Math.hypot(c.x - d.x, c.y - d.y);
        const current = callbacks.getTransform();
        const scale = Math.max(.08, Math.min(4, current.k * newDistance / Math.max(1, oldDistance)));
        const oldCenter = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const center = { x: (c.x + d.x) / 2, y: (c.y + d.y) / 2 };
        callbacks.onTransform(zoomIdentity.translate(center.x - (oldCenter.x - current.x) * scale / current.k, center.y - (oldCenter.y - current.y) * scale / current.k).scale(scale));
        return;
      }
      if (gesture.mode === 'pending' && Math.hypot(p.x - gesture.x, p.y - gesture.y) < 6) return;
      if (gesture.mode === 'pending') { cancelTimer(); gesture.mode = 'pan'; }
      gesture.moved = true;
      pointers.set(event.pointerId, p);
      const current = callbacks.getTransform();
      if (gesture.mode === 'planet' && gesture.node) {
        const dx = (p.x - old.x) / current.k, dy = (p.y - old.y) / current.k;
        for (const node of nodes) if (node.subjectId === gesture.node.id) {
          node.x += dx; node.y += dy; node.fx = node.fy = null; node.vx = node.vy = 0;
        }
        callbacks.onMove();
      } else callbacks.onTransform(zoomIdentity.translate(current.x + p.x - old.x, current.y + p.y - old.y).scale(current.k));
    };
    const up = (event: PointerEvent) => {
      if (!pointers.has(event.pointerId)) return;
      cancelTimer();
      pointers.delete(event.pointerId);
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      if (gesture?.moved || gesture?.mode === 'planet') suppressClickUntil = performance.now() + 450;
      if (pointers.size) { if (gesture) gesture.mode = 'pan'; return; }
      if (gesture?.mode === 'planet' && gesture.moved) callbacks.onSettle(gesture.node?.key);
      else { callbacks.onSave(); }
      gesture = null;
      callbacks.onArm(null);
    };
    const click = (event: MouseEvent) => {
      if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
    };
    const contextMenu = (event: Event) => {
      if ((event.target as Element).closest('.planet-node')) event.preventDefault();
    };
    svg.addEventListener('contextmenu', contextMenu);
    svg.addEventListener('pointerdown', down);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('lostpointercapture', up);
    svg.addEventListener('click', click, true);
    return () => {
      cancelTimer();
      svg.removeEventListener('contextmenu', contextMenu);
      svg.removeEventListener('pointerdown', down);
      svg.removeEventListener('pointermove', move);
      svg.removeEventListener('pointerup', up);
      svg.removeEventListener('pointercancel', up);
      svg.removeEventListener('lostpointercapture', up);
      svg.removeEventListener('click', click, true);
    };
}
