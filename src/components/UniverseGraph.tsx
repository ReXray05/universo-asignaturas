import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type CSSProperties } from 'react';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import type { Lesson, Subject } from '../types';
import { createLayout, wrapLabel, planetRadius, relaxLayout, savePositions, type GraphNode } from '../lib/layout';
import { attachMapGestures } from '../lib/mapGestures';
import { subjectDepths } from '../lib/depth';
import { contrastingInk } from '../lib/colors';
import './graph.css';

export interface GraphHandle { fit(): void; zoomBy(factor: number): void; focus(id: string): void }
interface Props {
  subjects: Subject[];
  lessons: Lesson[];
  selectedId: string | null;
  highlightedIds: string[] | null;
  showLabels: boolean;
  growPlanets: boolean;
  allLessons: Lesson[];
  allSubjects: Subject[];
  onSelectSubject(id: string): void;
  onOpenLesson(id: string): void;
  onZoomChange?(scale: number): void;
}

const UniverseGraph = forwardRef<GraphHandle, Props>(function UniverseGraph({ subjects, lessons, selectedId, highlightedIds, showLabels, growPlanets, allLessons, allSubjects, onSelectSubject, onOpenLesson, onZoomChange }, ref) {
  const depths = useMemo(() => subjectDepths(allSubjects, allLessons), [allSubjects, allLessons]);
  const parallaxRef = useRef({ x: 0, y: 0 });
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
  const [, redraw] = useState(0);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const physicsRef = useRef<ReturnType<typeof relaxLayout> | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const { nodes, links } = useMemo(() => createLayout(subjects, lessons), [subjects, lessons]);
  const nodeMap = useMemo(() => new Map(nodes.map(node => [node.key, node])), [nodes]);
  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const lesson of lessons) result.set(lesson.subjectId, (result.get(lesson.subjectId) || 0) + 1);
    return result;
  }, [lessons]);
  const growthCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lesson of allLessons) counts.set(lesson.subjectId, (counts.get(lesson.subjectId) || 0) + 1);
    return counts;
  }, [allLessons]);
  const settle = useCallback((fixedKey?: string) => {
    physicsRef.current?.stop();
    savePositions(nodes);
    const simulation = relaxLayout(nodes, links, fixedKey, 19 / transformRef.current.k, 1.85);
    physicsRef.current = simulation;
    const finish = () => {
      for (const node of nodes) { node.fx = node.fy = null; node.vx = node.vy = 0; }
      savePositions(nodes);
      redraw(value => value + 1);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      simulation.stop().tick(130); finish();
    } else simulation.on('tick', () => redraw(value => value + 1)).on('end', finish);
  }, [nodes, links]);
  useEffect(() => {
    let changed = false;
    for (const node of nodes) if (node.kind === 'subject') {
      const radius = planetRadius(growthCounts.get(node.id) || 0, growPlanets);
      changed ||= radius !== node.radius;
      node.radius = radius;
    }
    if (changed) settle();
  }, [nodes, growthCounts, growPlanets, settle]);
  useEffect(() => {
    const save = () => savePositions(nodes);
    window.addEventListener('pagehide', save);
    return () => { window.removeEventListener('pagehide', save); physicsRef.current?.stop(); save(); };
  }, [nodes]);
  const hoveredNode = hovered ? nodeMap.get(hovered) : undefined;
  const highlighted = highlightedIds === null ? null : new Set(highlightedIds);
  const compact = size.width < 600;
  const verticalScale = compact ? Math.max(1.5, Math.min(2.4, (size.height - 390) / Math.max(200, size.width - 70) * 1.9)) : 1;
  const horizontalScale = compact ? 1 : Math.max(1, Math.min(2.2, (size.width - 120) / Math.max(240, size.height - 230) / 1.8));
  const labelMetrics = (scale: number, name: string) => {
    const lines = wrapLabel(name, scale < 0.65 ? 22 : 25);
    return {
      lines,
      font: Math.max(18, 12 / scale),
      metaFont: Math.max(14, 12 / scale),
      abbreviationFont: Math.max(18, 13 / scale),
      firstLine: Math.max(39, 16 / scale) + Math.max(28, 20 / scale),
      lineHeight: Math.max(22, 15 / scale),
      metaGap: Math.max(24, 19 / scale),
    };
  };
  const subjectLabelY = (node: GraphNode, scale: number, metrics: ReturnType<typeof labelMetrics>) => {
    const radius = Math.max(node.radius * 1.65, 19 / scale * node.radius / 39) * (.92 + (depths.get(node.subjectId) || .5) * .22);

    const halfWidth = Math.max(...metrics.lines.map(line => line.length)) * metrics.font * .55 / 2;
    const bottom = metrics.firstLine + (metrics.lines.length - 1) * metrics.lineHeight + metrics.metaGap + metrics.metaFont;
    const satelliteBelow = nodes.some(other => other.kind === 'lesson' && Math.abs(other.x - node.x) < halfWidth + 16 && other.y > node.y + radius && other.y < node.y + bottom + 16);
    return satelliteBelow ? -radius - Math.max(20, 16 / scale) - (metrics.lines.length - 1) * metrics.lineHeight : radius + Math.max(22, 17 / scale);
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
    const padding = compact ? 28 : 48;
    const top = compact ? 210 : size.width < 1500 ? 170 : 105;
    const bottom = compact ? 178 : size.height < 550 ? 70 : 110;
    const availableHeight = Math.max(140, size.height - top - bottom);
    let scale = 0.6;
    let minX = 0; let maxX = 0; let minY = 0; let maxY = 0;
    // Screen-sized text must be included in fitting, especially in short windows.
    for (let iteration = 0; iteration < 5; iteration++) {
      const bounds = nodes.map(node => {
        if (node.kind === 'lesson') return { left: node.x * horizontalScale - 16, right: node.x * horizontalScale + 16, top: node.y * verticalScale - 16, bottom: node.y * verticalScale + 16 };
        const metrics = labelMetrics(scale, node.subject.name);
        const baseline = subjectLabelY(node, scale, metrics);
        const radius = Math.max(node.radius * 1.65, 19 / scale * node.radius / 39) * (.92 + (depths.get(node.subjectId) || .5) * .22) + 12;
        const width = compact ? radius : Math.max(radius, Math.max(...metrics.lines.map(line => line.length)) * metrics.font * 0.55 / 2);
        const bottom = compact ? radius : Math.max(radius, baseline + (metrics.lines.length - 1) * metrics.lineHeight + metrics.font * 0.2);
        const top = compact ? -radius : Math.min(-radius, baseline - metrics.font);
        return { left: node.x * horizontalScale - width, right: node.x * horizontalScale + width, top: node.y * verticalScale + top, bottom: node.y * verticalScale + bottom };
      });
      minX = Math.min(...bounds.map(bound => bound.left)); maxX = Math.max(...bounds.map(bound => bound.right));
      minY = Math.min(...bounds.map(bound => bound.top)); maxY = Math.max(...bounds.map(bound => bound.bottom));
      scale = Math.min(1.2, Math.max(0.08, Math.min((size.width - padding * 2) / (maxX - minX), (availableHeight - 28) / (maxY - minY))));
    }
    applyTransform(zoomIdentity.translate(size.width / 2 - (minX + maxX) / 2 * scale, top + availableHeight / 2 - (minY + maxY) / 2 * scale).scale(scale), animate);
  }, [nodes, size, compact, horizontalScale, verticalScale, applyTransform]);

  const focus = useCallback((id: string) => {
    const node = nodes.find(item => item.id === id);
    if (!node) return;
    layerRef.current?.querySelector<SVGGElement>('[data-node-key="' + node.key + '"]')?.focus({preventScroll:true});
    const scale = Math.min(1.7, Math.max(0.75, size.width / 470));
    // Leave room for the subject details beside or below the focused planet.
    const centerX = size.width > 650 ? (size.width - 350) / 2 : size.width / 2;
    const centerY = size.width > 850 ? size.height * .48 : Math.max(255, size.height * .36);
    applyTransform(zoomIdentity.translate(centerX - node.x * horizontalScale * scale, centerY - (node.y * verticalScale + 20) * scale).scale(scale));
  }, [nodes, size, horizontalScale, verticalScale, applyTransform]);

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
      .filter(event => event.type === 'wheel' && !event.button)
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

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    return attachMapGestures(svg, nodes, size, {
      onStart: () => {
        physicsRef.current?.stop();
        if (animationRef.current !== null) { cancelAnimationFrame(animationRef.current); animationRef.current = null; }
      },
      onHideTooltip: () => setTooltip(null),
      onArm: setDraggingKey,
      onMove: () => redraw(value => value + 1),
      onSettle: settle,
      onSave: () => savePositions(nodes),
      getTransform: () => transformRef.current,
      onTransform: target => applyTransform(target, false),
    }, horizontalScale, verticalScale);
  }, [nodes, nodeMap, size, horizontalScale, verticalScale, applyTransform, settle]);

  useEffect(() => { fit(false); }, [fit]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let frame = 0;
    let target = { x: 0, y: 0 };
    let held = false;
    const paint = () => {
      const current = parallaxRef.current;
      const scale = transformRef.current.k;
      for (const element of container.querySelectorAll<SVGGElement>('[data-depth-layer]')) {
        const depth = Number(element.dataset.depthLayer);
        element.style.transform = `translate(${current.x * depth / scale}px, ${current.y * depth / scale}px)`;
      }
      for (const element of container.querySelectorAll<SVGLineElement>('[data-link-subject]')) {
        const parent = nodeMap.get(`subject:${element.dataset.linkSubject}`);
        const child = nodeMap.get(element.dataset.linkTarget || '');
        if (!parent || !child) continue;
        const depth = depths.get(parent.id) || .5;
        element.setAttribute('x1', String(parent.x * horizontalScale + current.x * depth / scale));
        element.setAttribute('y1', String(parent.y * verticalScale + current.y * depth / scale));
        element.setAttribute('x2', String(child.x * horizontalScale + current.x * depth / scale));
        element.setAttribute('y2', String(child.y * verticalScale + current.y * depth / scale));
      }
      container.style.setProperty('--pointer-x', `${current.x * .28}px`);
      container.style.setProperty('--pointer-y', `${current.y * .28}px`);
    };
    const step = () => {
      const current = parallaxRef.current;
      current.x += (target.x - current.x) * .15;
      current.y += (target.y - current.y) * .15;
      paint();
      frame = Math.hypot(target.x - current.x, target.y - current.y) > .025 ? requestAnimationFrame(step) : 0;
    };
    const start = () => { if (!frame) frame = requestAnimationFrame(step); };
    const move = (event: PointerEvent) => {
      if (held || event.buttons || !pointer.matches || media.matches) return;
      const rect = container.getBoundingClientRect();
      target = { x: ((event.clientX - rect.left) / rect.width - .5) * 44, y: ((event.clientY - rect.top) / rect.height - .5) * 34 };
      start();
    };
    const leave = () => { if (!held) { target = { x: 0, y: 0 }; start(); } };
    const down = () => { held = true; cancelAnimationFrame(frame); frame = 0; target = { ...parallaxRef.current }; };
    const up = () => { held = false; };
    const preference = () => { target = { x: 0, y: 0 }; parallaxRef.current = { x: 0, y: 0 }; cancelAnimationFrame(frame); frame = 0; paint(); };
    container.addEventListener('pointermove', move);
    container.addEventListener('pointerleave', leave);
    container.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    media.addEventListener('change', preference);
    paint();
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('pointermove', move); container.removeEventListener('pointerleave', leave); container.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); media.removeEventListener('change', preference);
    };
  }, [depths, nodeMap, zoomScale, draggingKey, horizontalScale, verticalScale]);

  const activate = (node: GraphNode) => {
    if (node.kind === 'subject') onSelectSubject(node.id);
    else onOpenLesson(node.id);
  };

  const showTooltip = (node: GraphNode) => {
    setHovered(node.key);
    if (node.kind !== 'lesson') return;
    const current = transformRef.current;
    setTooltip({ node, x: Math.max(12, Math.min(size.width - 278, node.x * horizontalScale * current.k + current.x + 16)), y: Math.max(12, Math.min(size.height - 130, node.y * verticalScale * current.k + current.y + 16)) });
  };

  return <div className="universe-graph" ref={containerRef}>
    <div className="space-haze" aria-hidden="true"/>
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
            return <line key={link.target} data-link-subject={source.id} data-link-target={target.key} x1={source.x * horizontalScale + parallaxRef.current.x * (depths.get(source.id) || .5) / zoomScale} y1={source.y * verticalScale + parallaxRef.current.y * (depths.get(source.id) || .5) / zoomScale} x2={target.x * horizontalScale + parallaxRef.current.x * (depths.get(source.id) || .5) / zoomScale} y2={target.y * verticalScale + parallaxRef.current.y * (depths.get(source.id) || .5) / zoomScale} stroke={source.subject.color} opacity={active ? 0.65 : 0.22} strokeWidth={active ? 1.4 : 1} />;
          })}
        </g>
        {[...nodes].sort((a,b) => (depths.get(a.subjectId) || .5) - (depths.get(b.subjectId) || .5)).map(node => {
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
          const depth = depths.get(node.subjectId) || .5;
          const visualRadius = Math.max(node.radius * 1.65, 19 / zoomScale * node.radius / 39) * (.92 + depth * .22);
          const satelliteRadius = Math.max(11, 6 / zoomScale);
          return <g key={node.key} data-node-key={node.key} style={{'--node-color':node.subject.color,'--node-ink':contrastingInk(node.subject.color)} as CSSProperties} transform={`translate(${node.x * horizontalScale}, ${node.y * verticalScale})`} className={`universe-node ${isSubject ? 'planet-node' : 'lesson-node'}${active ? ' is-active' : ''}${draggingKey === node.key ? ' is-dragging' : ''}${dimmed ? ' is-dimmed' : ''}${matched ? ' is-match' : ''}`} tabIndex={0} role="button"
            aria-label={isSubject ? `${node.subject.name}. ${node.subject.year}.º curso. ${count} ${count === 1 ? 'clase' : 'clases'}. Enfocar asignatura.` : `${node.lesson!.title}. ${node.subject.name}. Abrir visualización.`}
            onMouseEnter={() => showTooltip(node)} onMouseLeave={() => { setHovered(null); setTooltip(null); }}
            onFocus={() => showTooltip(node)} onBlur={() => { setHovered(null); setTooltip(null); }}
            onClick={event => { event.stopPropagation(); activate(node); }}
            onKeyDown={event => {
              if (isSubject && event.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault(); event.stopPropagation();
                const dx = event.key === 'ArrowLeft' ? -24 : event.key === 'ArrowRight' ? 24 : 0;
                const dy = event.key === 'ArrowUp' ? -24 : event.key === 'ArrowDown' ? 24 : 0;
                for (const item of nodes) if (item.subjectId === node.id) { item.x += dx; item.y += dy; }
                redraw(value => value + 1); settle(node.key); return;
              }
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(node); }
              if (event.key === 'Escape') { setHovered(null); setTooltip(null); }
            }}>
            <g data-depth-layer={depth} style={{transform:`translate(${parallaxRef.current.x * depth / zoomScale}px, ${parallaxRef.current.y * depth / zoomScale}px)`}}>
            {showLabels && <title>{isSubject ? `${node.subject.name} · ${count} ${count === 1 ? 'clase' : 'clases'}` : `${node.lesson!.title}${node.lesson!.description ? ` — ${node.lesson!.description}` : ''}`}</title>}
            {isSubject ? <>
              <circle className="node-hit-area" r={Math.max(visualRadius + 17, 22 / zoomScale)} fill="transparent" />
              <circle className="planet-focus-ring" r={visualRadius + 7 / zoomScale} fill="none" strokeWidth="1" />
              <circle className="planet-body" r={visualRadius} fill={node.subject.color} strokeWidth="1" />
              <text className="planet-abbreviation" style={{ fontSize: metrics.abbreviationFont }} textAnchor="middle" dominantBaseline="central">{node.subject.abbreviation}</text>
              {showName && <>
                <text className="planet-name" style={{ fontSize: metrics.font }} textAnchor="middle" y={labelBaseline}>{lines.map((line, index) => <tspan key={index} x="0" dy={index ? metrics.lineHeight : 0}>{line}</tspan>)}</text>
                {(active || matched || zoomScale > .9) && <text className="planet-meta" style={{ fontSize: metrics.metaFont }} textAnchor="middle" y={labelBaseline + (lines.length - 1) * metrics.lineHeight + metrics.metaGap}>{node.subject.year}.º curso <tspan className="meta-separator"> · </tspan>{count} {count === 1 ? 'clase' : 'clases'}</text>}
              </>}
            </> : <>
              <circle className="node-hit-area" r={Math.max(19, 22 / zoomScale)} fill="transparent" />
              <circle className="lesson-focus-ring" r={satelliteRadius + 5 / zoomScale} fill="none" />
              <circle className="satellite-body" r={satelliteRadius} strokeWidth="1" />
            </>}
            </g>
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
