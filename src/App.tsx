import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronDown, CircleHelp, Copy, Crosshair, ExternalLink, GraduationCap, List, Maximize, Minus, Moon, Network, Plus, Search, Sun, Type, X } from 'lucide-react';
import UniverseGraph, { type GraphHandle } from './components/UniverseGraph';
import subjectsData from './data/subjects.json';
import lessonsData from './data/lessons.json';
import type { Category, Lesson, Subject } from './types';
import GlassSurface from './components/GlassSurface';
import { contrastingInk } from './lib/colors';

const subjects = subjectsData as Subject[];
const lessons = lessonsData as Lesson[];
const categories: Record<Category, string> = { 'notas-clase': 'Notas de clase', 'apuntes-estudio': 'Apuntes de estudio', laboratorio: 'Prácticas de laboratorio' };
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const readHash = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return '/invalid'; } };
const getStoredTheme = () => { try { return localStorage.getItem('universo-theme') === 'dark' ? 'dark' : 'light'; } catch { return 'light'; } };
const formatDate = (date?: string | null) => date ? date.split('-').reverse().join('.') : 'Sin fecha';
const latestLesson = [...lessons].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];

export default function App() {
  const graph = useRef<GraphHandle>(null);
  const mapArea = useRef<HTMLElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const viewerBack = useRef<HTMLAnchorElement>(null);
  const indexButton = useRef<HTMLButtonElement>(null);
  const indexClose = useRef<HTMLButtonElement>(null);
  const indexWasOpen = useRef(false);
  const [theme, setTheme] = useState(getStoredTheme);
  const [route, setRoute] = useState(readHash);
  const [year, setYear] = useState<0 | 3 | 4>(0);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showMapText, setShowMapText] = useState(() => {
    try { return localStorage.getItem('universo-map-text') !== 'hidden'; } catch { return true; }
  });
  const [growPlanets, setGrowPlanets] = useState(() => {
    try { return localStorage.getItem('universo-grow-planets') === 'true'; } catch { return false; }
  });
  useEffect(() => { try { localStorage.setItem('universo-grow-planets', String(growPlanets)); } catch { /* Storage is optional. */ } }, [growPlanets]);
  const [modal, setModal] = useState<'help' | 'add' | null>(null);
  const [indexOpen, setIndexOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { const cb = () => setRoute(readHash()); window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.visualTheme = theme;
    try { localStorage.setItem('universo-theme', theme); } catch { /* Storage is optional. */ }
  }, [theme]);
  useEffect(() => { if (modal) dialog.current?.showModal(); else dialog.current?.close(); }, [modal]);
  useEffect(() => {
    try { localStorage.setItem('universo-map-text', showMapText ? 'shown' : 'hidden'); } catch { /* Storage is optional. */ }
  }, [showMapText]);
  useEffect(() => {
    if (indexOpen) indexClose.current?.focus();
    else if (indexWasOpen.current) indexButton.current?.focus();
    indexWasOpen.current = indexOpen;
  }, [indexOpen]);
  useEffect(() => {
    if (!indexOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [indexOpen]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setIndexOpen(false); requestAnimationFrame(() => searchInput.current?.focus()); }
      if (e.key === 'Escape') { setSelectedId(null); setIndexOpen(false); setQuery(''); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredSubjects = useMemo(() => subjects.filter(s => !year || s.year === year), [year]);
  const filteredLessons = useMemo(() => lessons.filter(l => filteredSubjects.some(s => s.id === l.subjectId) && (category === 'all' || category === l.category)), [filteredSubjects, category]);
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return [
      ...filteredSubjects.filter(s => normalize(s.name + ' ' + s.abbreviation).includes(q)).map(s => ({id:s.id,title:s.name,subtitle:s.year + '.º curso · Asignatura',subject:true,color:s.color})),
      ...filteredLessons.filter(l => normalize(l.title + ' ' + (l.tags ?? []).join(' ')).includes(q)).map(l => ({id:l.id,title:l.title,subtitle:subjects.find(s => s.id === l.subjectId)!.name,subject:false,color:subjects.find(s => s.id === l.subjectId)!.color})),
    ];
  }, [query, filteredSubjects, filteredLessons]);
  const activeSubject = subjects.find(s => s.id === selectedId);
  const activeLessons = filteredLessons.filter(l => l.subjectId === selectedId);
  const isLessonRoute = route.startsWith('/lesson/');
  const lesson = isLessonRoute ? lessons.find(l => l.id === route.slice(8)) : undefined;
  const lessonSubject = subjects.find(s => s.id === lesson?.subjectId);
  useEffect(() => { document.title = lesson ? lesson.title + ' · Universo' : 'Universo · Biblioteca de ingeniería'; if (isLessonRoute) viewerBack.current?.focus(); }, [isLessonRoute, lesson]);

  function selectSubject(id: string) {
    setSelectedId(id); setIndexOpen(false); setQuery('');
    requestAnimationFrame(() => {
      mapArea.current?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',block:'center'});
      graph.current?.focus(id);
    });
  }
  function changeYear(value: 0 | 3 | 4) { setYear(value); setSelectedId(null); setQuery(''); setIndexOpen(false); }
  function openLesson(id: string) { setQuery(''); location.hash = '/lesson/' + encodeURIComponent(id); }
  async function copyLink() {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt('Copia el enlace de esta clase', location.href); }
  }

  return <div className="app-shell immersive-shell">
    <a className="skip-link" href="#workspace">Ir al mapa</a>
    {indexOpen && <button className="nav-backdrop" aria-label="Cerrar índice" onClick={() => setIndexOpen(false)}/>}
    <aside className={'sidebar ' + (indexOpen ? 'is-open' : '')} aria-label="Índice de asignaturas" inert={isLessonRoute || !indexOpen}
      onKeyDown={event => {
        if (event.key !== 'Tab') return;
        const items = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')].filter(el => el.getClientRects().length);
        const first = items[0], last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
      <div className="index-heading"><div><div className="technical-label">BIBLIOTECA / ÍNDICE</div><h2>Tus asignaturas.</h2></div><button ref={indexClose} className="icon-button" aria-label="Cerrar índice de asignaturas" onClick={() => setIndexOpen(false)}><X size={20}/></button></div>
      <div className="index-courses">
        <button className={'nav-item ' + (year === 0 ? 'active' : '')} onClick={() => changeYear(0)}><Network size={18}/>Todas las asignaturas<span>{subjects.length}</span></button>
        <button className={'nav-item ' + (year === 3 ? 'active' : '')} onClick={() => changeYear(3)}><GraduationCap size={18}/>Tercer curso<span>5</span></button>
        <button className={'nav-item ' + (year === 4 ? 'active' : '')} onClick={() => changeYear(4)}><GraduationCap size={18}/>Cuarto curso<span>6</span></button>
      </div>
      <div className="section-label">SELECCIONAR ASIGNATURA <span>{filteredSubjects.length.toString().padStart(2, '0')}</span></div>
      <nav className="subject-list" aria-label="Asignaturas">{filteredSubjects.map(s => <button key={s.id} className={selectedId === s.id ? 'selected' : ''} onClick={() => selectSubject(s.id)}><i style={{background:s.color}}/><span>{s.name}<small>{s.year}.º curso · {s.abbreviation}</small></span><span className="subject-count">{lessons.filter(l => l.subjectId === s.id).length}</span></button>)}</nav>
      <div className="index-footer"><BookOpen size={18}/><span>{lessons.length} {lessons.length === 1 ? 'clase publicada' : 'clases publicadas'}<small>Una biblioteca que crece contigo.</small></span></div>
    </aside>
    <div className="page-content" inert={isLessonRoute || indexOpen}>
      <header className="topbar"><div className="topbar-inner">
        <a className="brand" href="#/" onClick={() => { changeYear(0); graph.current?.fit(); }}><span className="brand-mark"><Network size={24} strokeWidth={1.3}/></span><span>universo<span className="brand-dot">.</span><small>BIBLIOTECA DE INGENIERÍA</small></span></a>
        <nav className="header-actions" aria-label="Navegación principal"><GlassSurface width="auto" height="auto" borderRadius={24} distortionScale={-180} displace={0.5} backgroundOpacity={0.1} className="navigation-glass">
          <button ref={indexButton} className="text-button" onClick={() => setIndexOpen(true)} aria-expanded={indexOpen} aria-label="Índice"><List size={18}/><span>Índice</span></button>
          <button className="text-button add-visualization-button" aria-label="Añadir visualización" title="Añadir visualización" onClick={() => setModal('add')}><Plus size={18}/></button>
          <button className="text-button guide-button" onClick={() => setModal('help')} aria-label="Guía de exploración"><CircleHelp size={18}/><span>Guía</span></button>
          <button className="text-button theme-button" aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}<span>{theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}</span></button>
        </GlassSurface></nav>
      </div></header>
      <main id="workspace" className="workspace" tabIndex={-1}>
        <h1 className="visually-hidden">Universo de asignaturas</h1>
        <section className="atlas-panel" aria-label="Biblioteca interactiva">
          <div className="figure-heading"><span>FIG. 01</span><span>MAPA DE ASIGNATURAS</span><span className="figure-view">{year ? year + '.º CURSO' : 'VISTA GENERAL'}</span></div>
          <GlassSurface width="auto" height="auto" borderRadius={24} distortionScale={-180} displace={0.5} backgroundOpacity={0.1} className="toolbar-glass"><div className="map-toolbar">
            <div className="search-group"><label htmlFor="universe-search" className="field-label">Buscar en la biblioteca</label><div className="search-field"><Search size={18}/><input id="universe-search" ref={searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="Asignatura, clase o etiqueta…" aria-label="Buscar asignaturas y clases" aria-controls="search-results" aria-expanded={!!query}/>{query ? <button className="search-clear" aria-label="Borrar búsqueda" onClick={() => {setQuery(''); searchInput.current?.focus();}}><X size={16}/></button> : <kbd>Ctrl K</kbd>}</div>
            {query && <div id="search-results" className="search-results" aria-live="polite"><div className="section-label">{results.length} RESULTADOS</div>{results.length ? results.map(r => <button key={r.id} onClick={() => { if(r.subject) selectSubject(r.id); else openLesson(r.id); }}><i style={{background:r.color}}/><span>{r.title}<small>{r.subtitle}</small></span><ArrowUpRight size={17}/></button>) : <p>Sin coincidencias. Prueba otro nombre o cambia los filtros.</p>}</div>}</div>
            <div className="course-group"><span className="field-label">Curso</span><div className="segmented" aria-label="Filtrar por curso">{([0,3,4] as const).map(y => <button aria-pressed={year === y} className={year === y ? 'active' : ''} key={y} onClick={() => changeYear(y)}>{y ? y + '.º curso' : 'Todos'}</button>)}</div></div>
            <div className="content-group"><label htmlFor="content-filter" className="field-label">Tipo de contenido</label><div className="filter-select"><select id="content-filter" aria-label="Filtrar por tipo de contenido" value={category} onChange={e => setCategory(e.target.value)}><option value="all">Todo el contenido</option>{Object.entries(categories).map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select><ChevronDown size={16}/></div></div>
          </div></GlassSurface>
          <section ref={mapArea} className={'map-area ' + (activeSubject ? 'has-selection' : '')} aria-label="Mapa interactivo de asignaturas">
            <div className="map-corner top-left"/><div className="map-corner top-right"/><div className="map-corner bottom-left"/><div className="map-corner bottom-right"/>
            <UniverseGraph ref={graph} subjects={filteredSubjects} lessons={filteredLessons} selectedId={selectedId} highlightedIds={query.trim() ? results.map(r => r.id) : null} showLabels={showMapText} growPlanets={growPlanets} allLessons={lessons} allSubjects={subjects} onSelectSubject={selectSubject} onOpenLesson={openLesson} onZoomChange={setZoom}/>
            {category !== 'all' && !filteredLessons.length && <div className="filter-empty" role="status">Todavía no hay {categories[category as Category].toLowerCase()} en este curso.</div>}
            {activeSubject && <aside className="subject-panel" aria-label={'Detalles de ' + activeSubject.name}><div className="panel-top"><span className="technical-label">ASIGNATURA / {activeSubject.year}.º CURSO</span><button className="icon-button" aria-label="Cerrar asignatura" onClick={() => setSelectedId(null)}><X size={20}/></button></div><div className="panel-planet" style={{'--planet':activeSubject.color,'--planet-ink':contrastingInk(activeSubject.color)} as React.CSSProperties}>{activeSubject.abbreviation}</div><h2>{activeSubject.name}</h2><div className="panel-meta">{activeLessons.length} {activeLessons.length === 1 ? 'clase disponible' : 'clases disponibles'}</div>
              {activeLessons.length ? <div className="lesson-list">{activeLessons.map(l => <button key={l.id} onClick={() => openLesson(l.id)}><span><small className="lesson-date">{formatDate(l.date)}{l.category ? ' / ' + categories[l.category] : ''}</small>{l.title}<small>{l.description}</small></span><ArrowUpRight size={18}/></button>)}</div> : <div className="empty-subject"><BookOpen size={24}/><h3>El siguiente capítulo.</h3><p>{category === 'all' ? 'Las clases que añadas a esta asignatura aparecerán aquí, conectadas a su planeta.' : 'No hay clases de este tipo en la asignatura. Cambia el filtro para consultar el resto.'}</p><button onClick={() => setModal('add')}>Añadir una visualización<ArrowUpRight size={17}/></button></div>}
            </aside>}
            <GlassSurface width="auto" height="auto" borderRadius={22} distortionScale={-180} displace={0.5} backgroundOpacity={0.1} className="zoom-glass"><div className="zoom-controls"><button className="map-text-toggle" aria-pressed={showMapText} aria-label={showMapText ? 'Ocultar textos del mapa' : 'Mostrar textos del mapa'} title={showMapText ? 'Ocultar textos del mapa' : 'Mostrar textos del mapa'} onClick={() => setShowMapText(value => !value)}><Type size={18}/><span>Textos</span></button><span/><button aria-label="Alejar" onClick={() => graph.current?.zoomBy(0.8)}><Minus size={18}/></button><output aria-label="Nivel de zoom">{Math.round(zoom*100)}%</output><button aria-label="Acercar" onClick={() => graph.current?.zoomBy(1.25)}><Plus size={18}/></button><span/><button aria-label="Ajustar universo a la pantalla" title="Ajustar a pantalla" onClick={() => {setSelectedId(null); graph.current?.fit();}}><Maximize size={18}/></button></div></GlassSurface>
          </section>
          <GlassSurface width="auto" height="auto" borderRadius={22} distortionScale={-180} displace={0.5} backgroundOpacity={0.1} className="legend-glass"><div className="figure-footer"><div className="map-legend"><span><i className="legend-planet"/>Asignatura</span><span><i className="legend-satellite"/>Clase</span><span className="legend-separator"/><span><i className="warm"/>3.º curso</span><span><i className="cool"/>4.º curso</span></div><div className="figure-count"><strong>{filteredSubjects.length.toString().padStart(2,'0')}</strong> ASIGNATURAS <span>/</span> <strong>{filteredLessons.length.toString().padStart(2,'0')}</strong> {filteredLessons.length === 1 ? 'CLASE' : 'CLASES'}</div></div></GlassSurface>
        </section>
        <div className="map-footer"><span><Crosshair size={15}/>Arrastra el lienzo para explorar. Selecciona un planeta para ver sus clases.</span><button onClick={() => setModal('help')}>Cómo explorar<ArrowUpRight size={16}/></button></div>
        {latestLesson && <section className="latest-lesson" aria-label="Última incorporación"><GlassSurface width="100%" height="auto" borderRadius={24} distortionScale={-180} displace={0.5} backgroundOpacity={0.1}><div className="technical-label">ÚLTIMA INCORPORACIÓN<span>{formatDate(latestLesson.date)}</span></div><button onClick={() => openLesson(latestLesson.id)}><span><small>{subjects.find(s => s.id === latestLesson.subjectId)?.name}</small>{latestLesson.title}</span><ArrowUpRight size={22}/></button></GlassSurface></section>}
        <footer className="page-footer"><span>UNIVERSO / BIBLIOTECA PERSONAL</span><span>El conocimiento se construye, clase a clase.</span></footer>
      </main>
    </div>
    <dialog ref={dialog} className="info-dialog" onCancel={() => setModal(null)} onClick={e => {if(e.target === e.currentTarget) setModal(null);}}><button className="icon-button dialog-close" aria-label="Cerrar" onClick={() => setModal(null)}><X size={20}/></button>{modal === 'help' ? <><div className="eyebrow">GUÍA / EXPLORAR EL MAPA</div><h2>Cada clase,<br/>una conexión.</h2><p>Los planetas son tus asignaturas. Los satélites son clases y visualizaciones conectadas a ellas.</p><ul><li>Selecciona un planeta para consultar sus clases, o abre el índice de asignaturas.</li><li>Arrastra el lienzo para desplazarte. Usa la rueda o dos dedos para ampliar.</li><li>Para mover un planeta, mantén pulsado un instante (0,3 s) y después arrastra. Si arrastras directamente, desplazas la cámara. Al soltar, sus vecinos se acomodan y el mapa vuelve a quedarse quieto.</li><li>También puedes mover un planeta enfocado con Alt + las flechas.</li><li>La profundidad responde al ratón: las asignaturas con más clases se perciben algo más cerca. En pantallas táctiles o con movimiento reducido, el mapa permanece quieto.</li><li>Busca por nombre, abreviatura o etiqueta y filtra por curso o contenido.</li><li>Con el mapa enfocado, las flechas desplazan el lienzo, + y − cambian el zoom e Inicio recupera la vista completa.</li></ul><label className="guide-option"><input type="checkbox" checked={growPlanets} onChange={event => setGrowPlanets(event.target.checked)}/><span><strong>Tamaño según número de clases</strong><small>Los planetas crecen suavemente al incorporar satélites. Opción experimental; se recuerda en este navegador.</small></span></label><button className="add-button" onClick={() => setModal(null)}>Volver al mapa<ArrowUpRight size={17}/></button></> : <><div className="eyebrow">BIBLIOTECA / AÑADIR UNA CLASE</div><h2>Un nuevo capítulo.</h2><p>Cada visualización conserva su programa completo y una dirección propia dentro de este mismo universo.</p><div className="prompt-example">“Añade esta visualización a Ingeniería Térmica. Se llama [nombre]. Súbela al universo.”</div><p>Comparte con Codex el archivo o la carpeta completa y la asignatura. Lo incorporará al portal y comprobará su funcionamiento.</p><p className="muted">La incorporación se realiza en el repositorio. Esta pantalla explica el proceso y no carga archivos.</p><button className="add-button" onClick={() => setModal(null)}>Entendido<Check size={17}/></button></>}</dialog>
    {isLessonRoute && <section className="lesson-viewer" aria-label={lesson?.title ?? 'Clase no encontrada'}><header><a ref={viewerBack} className="back-link" href="#/" aria-label="Volver al universo"><ArrowLeft size={18}/><span>Volver al universo</span></a><div className="viewer-title"><small>{lessonSubject?.name ?? 'Universo de asignaturas'}</small><strong>{lesson?.title ?? 'Clase no encontrada'}</strong></div>{lesson && <div className="viewer-actions"><button className="icon-button" aria-label="Copiar enlace de la clase" title="Copiar enlace" onClick={copyLink}>{copied ? <Check size={18}/> : <Copy size={18}/>}</button><a className="icon-button" href={import.meta.env.BASE_URL + lesson.path} target="_blank" rel="noopener noreferrer" title="Abrir programa en una pestaña" aria-label="Abrir programa en una pestaña"><ExternalLink size={18}/></a></div>}</header>{lesson ? <iframe key={lesson.id} title={lesson.title} src={import.meta.env.BASE_URL + lesson.path} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals" allow="fullscreen"/> : <div className="missing-lesson"><BookOpen size={35}/><h1>Clase no encontrada.</h1><p>Comprueba el enlace o vuelve al mapa para encontrar una visualización.</p><a className="add-button" href="#/">Explorar asignaturas<ArrowUpRight size={17}/></a></div>}</section>}
  </div>;
}
