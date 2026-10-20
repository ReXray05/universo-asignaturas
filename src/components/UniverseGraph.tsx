import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import type { Lesson, Subject } from '../types';
import { createLayout, wrapLabel, type GraphNode } from '../lib/layout';
import { contrastingInk } from '../lib/colors';
import './graph.css';

export interface GraphHandle { fit(): void; zoomBy(factor: number): void; focus(id: string): void }
interface Props {
  subjects: Subject[];
  lessons: Lesson[];
  selectedId: string | null;
  highlightedIds: string[] | null;
  showLabels: boolean;
  onSelectSubject(id: string): void;
  onOpenLesson(id: string): void;
  onZoomChange?(scale: number): void;
}

const UniverseGraph = forwardRef<GraphHandle, Props>(function UniverseGraph({ subjects, lessons, selectedId, highlightedIds, showLabels, onSelectSubject, onOpenLesson, onZoomChange }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<ZoomTransform>(zoomIdentity);
  const animationRef = useRef<number | null>(null);
  const zoomChangeRef = useRef(onZoomChange);
  zoomChangeRef.current = onZoomChange;
  const [size, setSize] = useState({ width: 1000, height: 700 });
  const [zoomScale, setZoomScale] = useState(1);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const { nodes, links } = useMemo(() => createLayout(subjects, lessons), [subjects, lessons]);
  const nodeMap = useMemo(() => new Map(nodes.map(node => [node.key, node])), [nodes]);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const lesson of lessons) result.set(lesson.subjectId, (result.get(lesson.subjectId) || 0) + 1);
    return result;
  }, [lessons]);
  const hoveredNode = hovered ? nodeMap.get(hovered) : undefined;
  const highlighted = highlightedIds === null ? null : new Set(highlightedIds);
  const compact = size.width < 600;
  const labelMetrics = (scale: number, name: string) => {
    const lines = wrapLabel(name, scale < 0.65 ? 22 : 25);
    return {
      lines,
      font: Math.max(18, 14 / scale),
      metaFont: Math.max(14, 12 / scale),
      abbreviationFont: Math.max(18, 13 / scale),
      firstLine: Math.max(39, 16 / scale) + Math.max(28, 20 / scale),
      lineHeight: Math.max(22, 17 / scale),
      metaGap: Math.max(24, 19 / scale),
    };
  };
  const subjectLabelY = (node: GraphNode, scale: number, metrics: ReturnType<typeof labelMetrics>) => {
    const halfWidth = Math.max(...metrics.lines.map(line => line.length)) * metrics.font * .55 / 2;
    const bottom = metrics.firstLine + (metrics.lines.length - 1) * metrics.lineHeight + metrics.metaGap + metrics.metaFont;
    const satelliteBelow = nodes.some(other => other.kind === 'lesson' && Math.abs(other.x - node.x) < halfWidth + 16 && other.y > node.y + 39 && other.y < node.y + bottom + 16);
    return satelliteBelow ? -Math.max(39, 16 / scale) - Math.max(28, 20 / scale) - (metrics.lines.length - 1) * metrics.lineHeight - metrics.metaGap : metrics.firstLine;
  };

  const applyTransform = useCallback((target: ZoomTransform, animate = true) => {
    const svg = svgRef.current;
    const behavior = zoomRef.current;
    if (!svg || !behavior) return;
    if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduced) { select(svg).call(behavior.transform, target); return; }
    const start = transformRef.current;
    const startedAt = performance.now();
    const step = (time: number) => {
      const fraction = Math.min(1, (time - startedAt) / 360);
      const eased = 1 - Math.pow(1 - fraction, 3);
      select(svg).call(behavior.transform, zoomIdentity.translate(start.x + (target.x - start.x) * eased, start.y + (target.y - start.y) * eased).scale(start.k + (target.k - start.k) * eased));
      if (fraction < 1) animationRef.current = requestAnimationFrame(step);
      else animationRef.current = null;
    };
    animationRef.current = requestAnimationFrame(step);
  }, []);

  const fit = useCallback((animate = true) => {
    if (!nodes.length) return;
    const padding = compact ? 28 : 38;
    let scale = 0.6;
    let minX = 0; let maxX = 0; let minY = 0; let maxY = 0;
    // Screen-sized text must be included in fitting, especially in short windows.
    for (let iteration = 0; iteration < 5; iteration++) {
      const bounds = nodes.map(node => {
        if (node.kind === 'lesson') return { left: node.x - 16, right: node.x + 16, top: node.y - 16, bottom: node.y + 16 };
        const metrics = labelMetrics(scale, node.subject.name);
        const baseline = subjectLabelY(node, scale, metrics);
        const width = compact ? 52 : Math.max(55, Math.max(...metrics.lines.map(line => line.length)) * metrics.font * 0.55 / 2);
        const bottom = compact ? 55 : Math.max(55, baseline + (metrics.lines.length - 1) * metrics.lineHeight + metrics.metaGap + metrics.metaFont * 0.3);
        const top = compact ? -55 : Math.min(-55, baseline - metrics.font);
        return { left: node.x - width, right: node.x + width, top: node.y + top, bottom: node.y + bottom };
      });
      minX = Math.min(...bounds.map(bound => bound.left)); maxX = Math.max(...bounds.map(bound => bound.right));
      minY = Math.min(...bounds.map(bound => bound.top)); maxY = Math.max(...bounds.map(bound => bound.bottom));
      scale = Math.min(1.2, Math.max(0.08, Math.min((size.width - padding * 2) / (maxX - minX), (size.height - padding * 2) / (maxY - minY))));
    }
    applyTransform(zoomIdentity.translate(size.width / 2 - (minX + maxX) / 2 * scale, size.height / 2 - (minY + maxY) / 2 * scale).scale(scale), animate);
  }, [nodes, size, compact, applyTransform]);

  const focus = useCallback((id: string) => {
    const node = nodes.find(item => item.id === id);
    if (!node) return;
    layerRef.current?.querySelector<SVGGElement>('[data-node-key="' + node.key + '"]')?.focus({preventScroll:true});
    const scale = Math.min(1.7, Math.max(0.75, size.width / 470));
    // Leave room for the subject details beside or below the focused planet.
    const centerX = size.width > 650 ? (size.width - 350) / 2 : size.width / 2;
    const centerY = size.width > 650 ? size.height / 2 : size.height * 0.28;
    applyTransform(zoomIdentity.translate(centerX - node.x * scale, centerY - (node.y + 20) * scale).scale(scale));
  }, [nodes, size, applyTransform]);

  const zoomBy = useCallback((factor: number) => {
    const current = transformRef.current;
    const nextScale = Math.max(0.08, Math.min(4, current.k * factor));
    const ratio = nextScale / current.k;
    applyTransform(zoomIdentity.translate(size.width / 2 - (size.width / 2 - current.x) * ratio, size.height / 2 - (size.height / 2 - current.y) * ratio).scale(nextScale));
  }, [size, applyTransform]);

  useImperativeHandle(ref, () => ({
    fit: () => fit(), focus, zoomBy,
  }), [fit, focus, zoomBy]);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const bounds = entries[0]?.contentRect;
      if (bounds && bounds.width > 0 && bounds.height > 0) setSize({ width: bounds.width, height: bounds.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const behavior = zoom<SVGSVGElement, unknown>().scaleExtent([0.08, 4]).touchable(() => true)
      .filter(event => !event.button && event.type !== 'dblclick')
      .on('start', event => {
        if (event.sourceEvent && animationRef.current !== null) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
        setTooltip(null);
      })
      .on('zoom', event => {
        transformRef.current = event.transform;
        layerRef.current?.setAttribute('transform', event.transform.toString());
        setZoomScale(event.transform.k);
        zoomChangeRef.current?.(event.transform.k);
      });
    zoomRef.current = behavior;
    select(svg).call(behavior).on('dblclick.zoom', null);
    return () => {
      select(svg).on('.zoom', null);
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => { fit(false); }, [fit]);

  const activate = (node: GraphNode) => {
    if (node.kind === 'subject') onSelectSubject(node.id);
    else onOpenLesson(node.id);
  };

  const showTooltip = (node: GraphNode) => {
    setHovered(node.key);
    if (node.kind !== 'lesson') return;
    const current = transformRef.current;
    setTooltip({ node, x: Math.max(12, Math.min(size.width - 278, node.x * current.k + current.x + 16)), y: Math.max(12, Math.min(size.height - 130, node.y * current.k + current.y + 16)) });
  };

  return <div className="universe-graph" ref={containerRef}>
    <svg ref={svgRef} className="universe-canvas" width={size.width} height={size.height} tabIndex={0} role="region" aria-label={`Mapa de ${subjects.length} asignaturas y ${lessons.length} clases. Arrastra o usa las flechas para desplazarte. Rueda, más y menos para ampliar. Inicio ajusta el universo.`}
      onKeyDown={event => {
        const directions: Record<string, [number, number]> = { ArrowLeft: [70, 0], ArrowRight: [-70, 0], ArrowUp: [0, 70], ArrowDown: [0, -70] };
        const movement = directions[event.key];
        if (movement) {
          event.preventDefault();
          const current = transformRef.current;
          applyTransform(zoomIdentity.translate(current.x + movement[0], current.y + movement[1]).scale(current.k));
        } else if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomBy(1.25); }
        else if (event.key === '-' || event.key === '−') { event.preventDefault(); zoomBy(0.8); }
        else if (event.key === 'Home') { event.preventDefault(); fit(); }
      }}>
      <g ref={layerRef}>
        <g className="universe-links" aria-hidden="true">
          {links.map(link => {
            const source = nodeMap.get(link.source)!;
            const target = nodeMap.get(link.target)!;
            const active = hoveredNode?.subjectId === target.subjectId || selectedId === target.subjectId;
            return <line key={link.target} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke={source.subject.color} opacity={active ? 0.65 : 0.22} strokeWidth={active ? 1.4 : 1} />;
          })}
        </g>
        {nodes.map(node => {
          const isSubject = node.kind === 'subject';
          const active = hoveredNode?.subjectId === node.subjectId || selectedId === node.id || selectedId === node.subjectId;
          const matched = highlighted?.has(node.id) || (node.kind === 'lesson' && highlighted?.has(node.subjectId));
          const dimmed = highlighted !== null && !matched;
          const metrics = labelMetrics(zoomScale, node.subject.name);
          const lines = isSubject ? metrics.lines : [];
          // Keep small-screen labels sparse until a node is focused or the map is enlarged.
          const showName = showLabels && (!compact || zoomScale >= .65 || active || matched);
          const count = counts.get(node.id) || 0;
          const labelBaseline = isSubject ? subjectLabelY(node, zoomScale, metrics) : 0;
          const visualRadius = Math.max(39, 16 / zoomScale);
          const satelliteRadius = Math.max(8, 5 / zoomScale);
          return <g key={node.key} data-node-key={node.key} style={{'--node-color':node.subject.color,'--node-ink':contrastingInk(node.subject.color)} as CSSProperties} transform={`translate(${node.x}, ${node.y})`} className={`universe-node ${isSubject ? 'planet-node' : 'lesson-node'}${active ? ' is-active' : ''}${dimmed ? ' is-dimmed' : ''}${matched ? ' is-match' : ''}`} tabIndex={0} role="button"
            aria-label={isSubject ? `${node.subject.name}. ${node.subject.year}.º curso. ${count} ${count === 1 ? 'clase' : 'clases'}. Enfocar asignatura.` : `${node.lesson!.title}. ${node.subject.name}. Abrir visualización.`}
            onMouseEnter={() => showTooltip(node)} onMouseLeave={() => { setHovered(null); setTooltip(null); }}
            onFocus={() => showTooltip(node)} onBlur={() => { setHovered(null); setTooltip(null); }}
            onClick={event => { event.stopPropagation(); activate(node); }}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(node); }
              if (event.key === 'Escape') { setHovered(null); setTooltip(null); }
            }}>
            {showLabels && <title>{isSubject ? `${node.subject.name} · ${count} ${count === 1 ? 'clase' : 'clases'}` : `${node.lesson!.title}${node.lesson!.description ? ` — ${node.lesson!.description}` : ''}`}</title>}
            {isSubject ? <>
              <circle className="node-hit-area" r={Math.max(56, 22 / zoomScale)} fill="transparent" />
              <circle className="planet-focus-ring" r={visualRadius + 7 / zoomScale} fill="none" strokeWidth="1" />
              <circle className="planet-body" r={visualRadius} fill={node.subject.color} strokeWidth="1" />
              <ellipse className="planet-contour" rx={visualRadius * .95} ry={visualRadius * .34} transform="rotate(-28)" fill="none" strokeWidth="0.6" />
              <ellipse className="planet-contour meridian" rx={visualRadius * .34} ry={visualRadius * .95} transform="rotate(-28)" fill="none" strokeWidth="0.6" />
              <text className="planet-abbreviation" style={{ fontSize: metrics.abbreviationFont }} textAnchor="middle" dominantBaseline="central">{node.subject.abbreviation}</text>
              {showName && <>
                <text className="planet-name" style={{ fontSize: metrics.font }} textAnchor="middle" y={labelBaseline}>{lines.map((line, index) => <tspan key={index} x="0" dy={index ? metrics.lineHeight : 0}>{line}</tspan>)}</text>
                <text className="planet-meta" style={{ fontSize: metrics.metaFont }} textAnchor="middle" y={labelBaseline + (lines.length - 1) * metrics.lineHeight + metrics.metaGap}>{node.subject.year}.º curso <tspan className="meta-separator"> · </tspan>{count} {count === 1 ? 'clase' : 'clases'}</text>
              </>}
            </> : <>
              <circle className="node-hit-area" r={Math.max(19, 22 / zoomScale)} fill="transparent" />
              <circle className="lesson-focus-ring" r={satelliteRadius + 5 / zoomScale} fill="none" />
              <circle className="satellite-body" r={satelliteRadius} strokeWidth="1" />
              <circle r={satelliteRadius * .3} className="satellite-center" />
            </>}
          </g>;
        })}
      </g>
    </svg>
    {showLabels && tooltip?.node.lesson && <div className="universe-tooltip" role="tooltip" style={{ left: tooltip.x, top: tooltip.y }}>
      <span className="tooltip-subject" style={{ color: tooltip.node.subject.color }}>{tooltip.node.subject.name}</span>
      <strong>{tooltip.node.lesson.title}</strong>
      {tooltip.node.lesson.description && <p>{tooltip.node.lesson.description}</p>}
      <span className="tooltip-hint">Abrir visualización ↗</span>
    </div>}
    {!nodes.length && <div className="graph-empty">No hay asignaturas que coincidan con estos filtros.</div>}
  </div>;
});

export default UniverseGraph;
