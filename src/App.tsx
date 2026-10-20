import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, BookOpen, Check, ChevronDown, ChevronRight, CircleHelp, Copy, Crosshair, ExternalLink, GraduationCap, Maximize, Minus, Moon, Network, Plus, Search, SlidersHorizontal, Sun, X } from 'lucide-react';
import UniverseGraph, { type GraphHandle } from './components/UniverseGraph';
import subjectsData from './data/subjects.json';
import lessonsData from './data/lessons.json';
import type { Category, Lesson, Subject } from './types';

const subjects = subjectsData as Subject[];
const lessons = lessonsData as Lesson[];
const categories: Record<Category, string> = { 'notas-clase': 'Notas de clase', 'apuntes-estudio': 'Apuntes de estudio', laboratorio: 'Prácticas de laboratorio' };
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const readHash = () => { try { return decodeURIComponent(location.hash.slice(1)); } catch { return '/invalid'; } };
const getStoredTheme = () => { try { return localStorage.getItem('universo-theme') ?? 'dark'; } catch { return 'dark'; } };

export default function App() {
  const graph = useRef<GraphHandle>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState(getStoredTheme);
  const [route, setRoute] = useState(readHash);
  const [year, setYear] = useState<0 | 3 | 4>(0);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [modal, setModal] = useState<'help' | 'add' | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [copied, setCopied] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => { const cb = () => setRoute(readHash()); window.addEventListener('hashchange', cb); return () => window.removeEventListener('hashchange', cb); }, []);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem('universo-theme', theme); } catch { /* Private browsing may disable storage. */ } }, [theme]);
  useEffect(() => { if (modal) dialog.current?.showModal(); else dialog.current?.close(); }, [modal]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setMobileNav(true); searchInput.current?.focus(); }
      if (e.key === 'Escape') { setSelectedId(null); setMobileNav(false); setQuery(''); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, []);

  const filteredSubjects = useMemo(() => subjects.filter(s => !year || s.year === year), [year]);
  const filteredLessons = useMemo(() => lessons.filter(l => filteredSubjects.some(s => s.id === l.subjectId) && (category === 'all' || category === l.category)), [filteredSubjects, category]);
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return [
      ...filteredSubjects.filter(s => normalize(`${s.name} ${s.abbreviation}`).includes(q)).map(s => ({id:s.id,title:s.name,subtitle:`${s.year}.º curso · Asignatura`,subject:true,color:s.color})),
      ...filteredLessons.filter(l => normalize(`${l.title} ${(l.tags ?? []).join(' ')}`).includes(q)).map(l => ({id:l.id,title:l.title,subtitle:subjects.find(s => s.id === l.subjectId)!.name,subject:false,color:subjects.find(s => s.id === l.subjectId)!.color})),
    ];
  }, [query, filteredSubjects, filteredLessons]);
  const activeSubject = subjects.find(s => s.id === selectedId);
  const activeLessons = filteredLessons.filter(l => l.subjectId === selectedId);
  const isLessonRoute = route.startsWith('/lesson/');
  const lesson = isLessonRoute ? lessons.find(l => l.id === route.slice(8)) : undefined;
  const lessonSubject = subjects.find(s => s.id === lesson?.subjectId);

  function selectSubject(id: string) { setSelectedId(id); setMobileNav(false); graph.current?.focus(id); }
  function changeYear(value: 0 | 3 | 4) { setYear(value); setSelectedId(null); setQuery(''); setMobileNav(false); }
  function openLesson(id: string) { location.hash = `/lesson/${encodeURIComponent(id)}`; }
  async function copyLink() {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
    catch { window.prompt('Copia el enlace de esta clase', location.href); }
  }
  return <div className="app-shell">
    <a className="skip-link" href="#workspace">Ir al mapa</a>
    {mobileNav && <button className="nav-backdrop" aria-label="Cerrar navegación" onClick={() => setMobileNav(false)}/>}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`} aria-label="Biblioteca">
      <a className="brand" href="#/" onClick={() => { changeYear(0); graph.current?.fit(); }}><span className="brand-mark"><Network size={22}/></span><span>universo<span className="brand-dot">.</span><small>BIBLIOTECA DE INGENIERÍA</small></span></a>
      <label className="search-field"><Search size={16}/><input ref={searchInput} value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar en tu universo" aria-label="Buscar asignaturas y clases"/><kbd>⌘ K</kbd></label>
      {query && <div className="search-results" aria-live="polite"><div className="section-label">{results.length} resultados</div>{results.length ? results.map(r => <button key={r.id} onClick={() => { if(r.subject) selectSubject(r.id); else openLesson(r.id); }}><i style={{background:r.color}}/><span>{r.title}<small>{r.subtitle}</small></span><ArrowUpRight size={14}/></button>) : <p>Sin coincidencias. Prueba con otro nombre o cambia los filtros.</p>}</div>}
      <div className="section-label library-label">MI BIBLIOTECA <span>01</span></div>
      <button className={`nav-item ${year === 0 ? 'active' : ''}`} onClick={() => changeYear(0)}><Network size={17}/>Todo el universo<span className="count">11</span></button>
      <button className={`nav-item ${year === 3 ? 'active' : ''}`} onClick={() => changeYear(3)}><GraduationCap size={18}/>Tercer curso<span className="count">5</span></button>
      <button className={`nav-item ${year === 4 ? 'active' : ''}`} onClick={() => changeYear(4)}><GraduationCap size={18}/>Cuarto curso<span className="count">6</span></button>
      <div className="sidebar-line"/>
      <div className="section-label">ASIGNATURAS <span>{filteredSubjects.length.toString().padStart(2,'0')}</span></div>
      <nav className="subject-list" aria-label="Asignaturas">{filteredSubjects.map(s => <button key={s.id} className={selectedId === s.id ? 'selected' : ''} onClick={() => selectSubject(s.id)} title={s.name}><i style={{background:s.color}}/><span>{s.name}</span><small>{lessons.filter(l => l.subjectId === s.id).length}</small></button>)}</nav>
      <div className="sidebar-bottom"><div className="library-total"><BookOpen size={17}/><span>{lessons.length} visualizaciones<small>Un espacio para conectar ideas.</small></span></div><button className="help-button" onClick={() => setModal('help')}><CircleHelp size={16}/>Cómo explorar<ArrowUpRight size={14}/></button><div className="profile"><span className="avatar">L</span><div>Mi espacio de estudio<small>Ingeniería · Biblioteca personal</small></div><span className="status-dot"/></div></div>
    </aside>
    <main id="workspace" className="workspace" tabIndex={-1}>
      <header className="topbar"><button className="icon-button mobile-toggle" onClick={() => setMobileNav(true)} aria-label="Abrir navegación"><SlidersHorizontal size={19}/></button><div className="breadcrumb">Mi biblioteca <ChevronRight size={13}/><span>Universo de asignaturas</span></div><div className="topbar-actions"><span className="local-badge"><i/>Tu conocimiento, conectado</span><button className="icon-button" aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} title="Cambiar tema" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button" aria-label="Ayuda" onClick={() => setModal('help')}><CircleHelp size={18}/></button></div></header>
      <section className="map-heading"><div><div className="eyebrow"><span/> EL MAPA DE TU CONOCIMIENTO</div><h1>Todo empieza con una conexión<span>.</span></h1><p>Explora tus asignaturas. Construye tu universo, clase a clase.</p></div><button className="add-button" onClick={() => setModal('add')}><Plus size={16}/>Añadir visualización</button></section>
      <div className="map-toolbar"><div className="segmented" aria-label="Filtrar por curso">{([0,3,4] as const).map(y => <button aria-pressed={year === y} className={year === y ? 'active' : ''} key={y} onClick={() => changeYear(y)}>{y ? `${y}.º curso` : 'Todo el universo'}</button>)}</div><div className="filter-select"><SlidersHorizontal size={14}/><select aria-label="Filtrar por tipo de contenido" value={category} onChange={e => setCategory(e.target.value)}><option value="all">Todo el contenido</option>{Object.entries(categories).map(([v,label]) => <option key={v} value={v}>{label}</option>)}</select><ChevronDown size={13}/></div></div>
      <section className={`map-area ${activeSubject ? 'has-selection' : ''}`} aria-label="Mapa interactivo de asignaturas">
        <div className="map-corner top-left"/><div className="map-corner bottom-right"/>
        <div className="map-caption"><span className="tiny-cross">+</span> UNIVERSO / {year ? `${year}.º CURSO` : 'VISTA GENERAL'}</div>
        <UniverseGraph ref={graph} subjects={filteredSubjects} lessons={filteredLessons} selectedId={selectedId} highlightedIds={query.trim() ? results.map(r => r.id) : null} onSelectSubject={selectSubject} onOpenLesson={openLesson} onZoomChange={setZoom}/>
        {!lessons.length && !activeSubject && <div className="first-lesson-note"><span className="note-icon"><Plus size={15}/></span><div>Tu universo está listo para crecer.<small>Selecciona un planeta para explorar su asignatura.</small></div></div>}
        {category !== 'all' && !filteredLessons.length && <div className="filter-empty" role="status">Todavía no hay {categories[category as Category].toLowerCase()} en este curso.</div>}
        {activeSubject && <aside className="subject-panel" aria-label={`Detalles de ${activeSubject.name}`}><div className="panel-top"><span className="section-label">ASIGNATURA / {activeSubject.year}.º CURSO</span><button className="icon-button" aria-label="Cerrar asignatura" onClick={() => setSelectedId(null)}><X size={17}/></button></div><div className="panel-planet" style={{'--planet':activeSubject.color} as React.CSSProperties}>{activeSubject.abbreviation}</div><h2>{activeSubject.name}</h2><div className="panel-meta"><i style={{background:activeSubject.color}}/>{activeLessons.length} {activeLessons.length === 1 ? 'visualización disponible' : 'visualizaciones disponibles'}</div><div className="sidebar-line"/>{activeLessons.length ? <div className="lesson-list">{activeLessons.map(l => <button key={l.id} onClick={() => openLesson(l.id)}><span>{l.title}<small>{l.description}</small></span><ArrowUpRight size={16}/></button>)}</div> : <div className="empty-subject"><BookOpen size={25}/><h3>Un mundo por descubrir</h3><p>{category === 'all' ? 'Aquí aparecerán las clases y visualizaciones que añadas a esta asignatura.' : 'No hay clases de este tipo. Puedes cambiar el filtro para ver las demás.'}</p><button onClick={() => setModal('add')}>Añadir la primera visualización<ArrowUpRight size={15}/></button></div>}</aside>}
        <div className="map-legend"><span><i className="warm"/>Tercer curso</span><span><i className="cool"/>Cuarto curso</span><span className="legend-separator"/><span><i className="satellite"/>Visualización</span></div>
        <div className="zoom-controls"><button aria-label="Alejar" onClick={() => graph.current?.zoomBy(0.8)}><Minus size={17}/></button><span>{Math.round(zoom*100)}%</span><button aria-label="Acercar" onClick={() => graph.current?.zoomBy(1.25)}><Plus size={17}/></button><div/><button aria-label="Ajustar universo a la pantalla" title="Ajustar a pantalla" onClick={() => {setSelectedId(null); graph.current?.fit();}}><Maximize size={16}/></button></div>
      </section>
      <footer className="map-footer"><span><Crosshair size={13}/> Arrastra para explorar <b>·</b> Desliza para acercar <b>·</b> Selecciona un planeta</span><span>{filteredSubjects.length} asignaturas <b>/</b> {filteredLessons.length} visualizaciones</span></footer>
    </main>
    <dialog ref={dialog} className="info-dialog" onCancel={() => setModal(null)} onClick={e => {if(e.target === e.currentTarget) setModal(null);}}><button className="icon-button dialog-close" aria-label="Cerrar" onClick={() => setModal(null)}><X size={20}/></button>{modal === 'help' ? <><div className="eyebrow">GUÍA DE EXPLORACIÓN</div><h2>Encuentra tu próxima conexión.</h2><p>Elige una asignatura para enfocarla y consultar sus clases. Cada visualización será un pequeño satélite conectado a su planeta.</p><ul><li>Arrastra el fondo para desplazarte. Usa la rueda o dos dedos para hacer zoom.</li><li>Tabulador y Enter permiten seleccionar los planetas y las clases. Las flechas desplazan el mapa cuando tiene el foco; + y − cambian el zoom.</li><li>Busca por nombre o abrevia una asignatura. Los filtros delimitan el curso y el tipo de contenido.</li><li>El botón de encuadre recupera la vista completa. El mapa se queda quieto al alcanzar el equilibrio.</li></ul><button className="add-button" onClick={() => setModal(null)}>Volver a explorar<ArrowUpRight size={16}/></button></> : <><div className="eyebrow">UNA BIBLIOTECA QUE CRECE CONTIGO</div><h2>Una clase más. El mismo universo.</h2><p>Las nuevas visualizaciones se incorporan al repositorio de este portal. Conservan sus controles, recursos y una dirección propia.</p><div className="prompt-example">“Añade esta visualización a Ingeniería Térmica. Se llama [nombre]. Súbela al universo.”</div><p>Comparte la carpeta completa de tu programa con Codex y el nombre de la asignatura. Codex lo integrará, comprobará y publicará cuando tenga acceso al repositorio.</p><p className="muted">No se suben archivos desde esta pantalla. La incorporación se realiza en el proyecto y GitHub publica la actualización.</p><button className="add-button" onClick={() => setModal(null)}>Entendido<Check size={16}/></button></>}</dialog>
    {isLessonRoute && <section className="lesson-viewer" aria-label={lesson?.title ?? 'Clase no encontrada'}><header><a className="back-link" href="#/"><ArrowLeft size={18}/><span>Volver al universo</span></a><div className="viewer-title"><small>{lessonSubject?.name ?? 'Universo de asignaturas'}</small><strong>{lesson?.title ?? 'Clase no encontrada'}</strong></div>{lesson && <div className="viewer-actions"><button className="icon-button" aria-label="Copiar enlace de la clase" title="Copiar enlace" onClick={copyLink}>{copied ? <Check size={18}/> : <Copy size={18}/>}</button><a className="icon-button" href={`${import.meta.env.BASE_URL}${lesson.path}`} target="_blank" rel="noopener noreferrer" title="Abrir programa en una pestaña" aria-label="Abrir programa en una pestaña"><ExternalLink size={18}/></a></div>}</header>{lesson ? <iframe key={lesson.id} title={lesson.title} src={`${import.meta.env.BASE_URL}${lesson.path}`} sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-modals" allow="fullscreen"/> : <div className="missing-lesson"><BookOpen size={35}/><h1>Esta clase no está en el universo.</h1><p>Comprueba el enlace o vuelve al mapa para encontrar una visualización.</p><a className="add-button" href="#/">Explorar asignaturas<ArrowUpRight size={16}/></a></div>}</section>}
  </div>;
}
