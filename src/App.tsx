import { Fragment, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, ArrowUpRight, Box, ChevronRight, CircleHelp, Crosshair, DoorOpen, Expand, Layers3, Lightbulb, Maximize2, Minus, Plus, Power, Rotate3d, RotateCcw, Search, Settings2, Tags, TriangleAlert, Volume2, VolumeX, X } from 'lucide-react';
import { type SceneHandle } from './VehicleScene';
import { assertManifest, type GroupId, type Manifest } from './catalog';
import { localGroups, localPiece, translate, type Locale } from './i18n';
import { projectLocation } from './project';
import type { VehicleSwitches } from './vehicle-rig';
import { createVehicleSounds, type LoopSound } from './vehicle-sounds';

const VehicleScene = lazy(() => import('./VehicleScene'));

function XLogo({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.64 7.584H.47l8.6-9.835L0 1.154h7.594l5.243 6.932 6.064-6.933ZM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644Z" /></svg>;
}

function Youtube({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" /><path d="m10 9 5 3-5 3Z" fill="currentColor" stroke="none" /></svg>;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(() => {
    try { return localStorage.getItem('fusquinha.locale') === 'pt-BR' ? 'pt-BR' : 'en'; } catch { return 'en'; }
  });
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState<GroupId | null>(null);
  const [focused, setFocused] = useState('');
  const [explosion, setExplosion] = useState(0);
  const [isolated, setIsolated] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [labels, setLabels] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [engineOn, setEngineOn] = useState(false);
  const [engineStarting, setEngineStarting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [vehicleSwitches, setVehicleSwitches] = useState<VehicleSwitches>({ headlights: false, doorOpen: false, hazards: false, wipers: false });
  const engineAudio = useRef<HTMLAudioElement>(null);
  const soundEffects = useRef<ReturnType<typeof createVehicleSounds> | null>(null);
  const audioClock = useCallback((name: LoopSound) => soundEffects.current?.clock(name) ?? null, []);
  const [query, setQuery] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [tab, setTab] = useState<'about' | 'working'>('about');
  const [notice, setNotice] = useState('');
  const scene = useRef<SceneHandle>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const about = useRef<HTMLDialogElement>(null);
  const root = useRef<HTMLElement>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = locale === 'en' ? 'fusquinha — an interactive yellow Beetle' : 'fusquinha — nosso amarelinho';
  }, [locale]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${import.meta.env.BASE_URL}models/fusca-manifest.json`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Could not load the catalog.'); return r.json(); })
      .then(data => { assertManifest(data); setManifest(data); })
      .catch(e => { if (e.name !== 'AbortError') setError(translate(locale, 'Could not load the catalog. Reload the page.', 'Não foi possível carregar o catálogo. Recarregue a página.')); });
    setFullscreen(Boolean(document.fullscreenEnabled));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function key(event: KeyboardEvent) {
      if ((event.target as HTMLElement).closest('input, select, textarea, [contenteditable]') || about.current?.open) return;
      if (event.key.toLowerCase() === 'r') scene.current?.reset();
      if (event.key.toLowerCase() === 'e' && ready) { setExplosion(e => e ? 0 : 100); setIsolated(false); }
      if (event.key === '/') { event.preventDefault(); setCatalogOpen(true); requestAnimationFrame(() => searchInput.current?.focus()); }
      if (event.key === 'Escape') { setCatalogOpen(false); setToolsOpen(false); setSelected(null); setFocused(''); setIsolated(false); }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [ready]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    const audio = engineAudio.current!;
    audio.volume = .4;
    soundEffects.current = createVehicleSounds(() => setNotice(translate(localeRef.current, 'One sound effect could not play. Try the control again.', 'Um dos efeitos não pôde tocar. Tente acionar o comando novamente.')));
    return () => { audio.pause(); soundEffects.current?.dispose(); soundEffects.current = null; };
  }, []);

  useEffect(() => { soundEffects.current?.mute(muted); }, [muted]);
  useEffect(() => {
    const active = explosion === 0 && !isolated;
    soundEffects.current?.loop('hazards', active && vehicleSwitches.hazards);
    soundEffects.current?.loop('wipers', active && vehicleSwitches.wipers);
  }, [vehicleSwitches.hazards, vehicleSwitches.wipers, explosion, isolated]);

  useEffect(() => {
    if (explosion > 0 || isolated) setVehicleSwitches(s => s.doorOpen || s.wipers ? { ...s, doorOpen: false, wipers: false } : s);
  }, [explosion, isolated]);

  function toggleVehicleSwitch(key: keyof VehicleSwitches) {
    assemble(); closeDetails();
    const enabled = !vehicleSwitches[key];
    soundEffects.current?.command(key, enabled);
    setVehicleSwitches(s => ({ ...s, [key]: enabled }));
  }

  async function toggleEngine() {
    const audio = engineAudio.current;
    if (!audio) return;
    if (!audio.paused) { audio.pause(); audio.currentTime = 0; return; }
    setEngineStarting(true);
    try { await audio.play(); }
    catch { setEngineOn(false); setNotice(translate(locale, 'The engine sound could not play. Try starting it again.', 'Não foi possível tocar o motor. Tente ligar novamente.')); }
    finally { setEngineStarting(false); }
  }

  function select(group: GroupId, id = '') {
    setSelected(group); setFocused(id); setTab('about'); setCatalogOpen(false); setToolsOpen(false);
  }
  function assemble() { setExplosion(0); setIsolated(false); }
  function closeDetails() { setSelected(null); setFocused(''); setIsolated(false); }
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await root.current?.requestFullscreen();
    } catch { setNotice(translate(locale, 'This browser could not enter full screen.', 'Este navegador não conseguiu abrir a tela cheia.')); }
  }
  const localizedGroups = localGroups(locale);
  const group = localizedGroups.find(g => g.id === selected);
  const piece = manifest?.objects.find(p => p.id === focused);
  const groupPieces = manifest?.objects.filter(p => p.group === selected) ?? [];
  const search = query.trim().toLocaleLowerCase(locale);
  const searchPieces = search ? manifest?.objects.filter(p => localPiece(p, locale).toLocaleLowerCase(locale).includes(search)).slice(0, 40) ?? [] : [];
  const availableGroups = localizedGroups.filter(g => manifest?.objects.some(p => p.group === g.id));
  const t = (en: string, pt: string) => translate(locale, en, pt);
  function changeLocale(next: Locale) { setLocale(next); try { localStorage.setItem('fusquinha.locale', next); } catch { /* a session-only preference is still usable */ } }

  return <main ref={root} className={`studio ${selected ? 'with-details' : ''} ${isolated || explosion > 0 ? 'is-inspecting' : ''}`}>
    <div className="garage-backdrop" aria-hidden="true"><div className="garage-wall" /><div className="garage-cobogo" /><div className="garage-window-shadow" /><div className="garage-tiles" /><div className="garage-courtyard" /><div className="garage-plaster" /></div>
    <header className="studio-header">
      <div className="brand"><span className="brand-kicker">{t('A BRAZILIAN FAVORITE', 'UM XODÓ BRASILEIRO')}</span><h1>fusquinha<span>.</span></h1></div>
      <div className="edition"><span className="paint-dot" /><div><strong>{t('our yellow Beetle', 'nosso amarelinho')}</strong><span>{t('FROM GARAGE TO GARAGE.', 'DE GARAGEM EM GARAGEM.')}</span></div></div>
      <div className="heritage-stamp" aria-label={t('Brazilian favorite', 'Paixão nacional')}><span>{t('A NATIONAL', 'PAIXÃO')}</span><strong>{t('favorite', 'nacional')}</strong><span>{t('MADE TO EXPLORE', 'FEITO PRA EXPLORAR')}</span></div>
      <div className="language-switch" role="group" aria-label={t('Language', 'Idioma')}><button className={locale === 'en' ? 'active' : ''} aria-pressed={locale === 'en'} onClick={() => changeLocale('en')}>EN</button><button className={locale === 'pt-BR' ? 'active' : ''} aria-pressed={locale === 'pt-BR'} onClick={() => changeLocale('pt-BR')}>PT</button></div>
      <button className="about-button" onClick={() => about.current?.showModal()}><span>{t('About this project', 'Sobre o projeto')}</span><ArrowUpRight size={16} /></button>
    </header>

    <aside className={`catalog ${catalogOpen ? 'is-open' : ''}`} aria-label={t('Assembly catalog', 'Catálogo de conjuntos')}>
      <span className="catalog-kicker">{t('GARAGE MANUAL', 'MANUAL DE GARAGEM')}</span>
      <div className="catalog-heading"><h2>{t('Inside the favorite', 'Por dentro do xodó')}</h2><button className="mobile-only icon-button" aria-label={t('Close catalog', 'Fechar catálogo')} onClick={() => setCatalogOpen(false)}><X size={18} /></button></div>
      <p className="catalog-hint">{t('Come in. Choose where to begin.', 'Pode chegar. Escolha por onde começar.')}</p>
      <label className="search-field"><Search size={15} /><input ref={searchInput} placeholder={t('Find a part', 'Encontrar uma peça')} aria-label={t('Find a part', 'Buscar uma peça')} value={query} onChange={e => setQuery(e.target.value)} /><kbd>/</kbd></label>
      <div className="catalog-list">
        {search ? <>
          <p className="search-count">{searchPieces.length ? `${searchPieces.length}${searchPieces.length === 40 ? '+' : ''} ${t('results', 'resultados')}` : t('No parts found.', 'Nenhuma peça encontrada.')}</p>
          {searchPieces.map(p => <button className={`search-result ${focused === p.id ? 'selected' : ''}`} key={p.id} onClick={() => select(p.group, p.id)}>{localPiece(p, locale)}<ChevronRight size={13} /></button>)}
        </> : availableGroups.map((g, i) => <button disabled={!ready} key={g.id} className={`group-row ${selected === g.id ? 'selected' : ''}`} aria-pressed={selected === g.id} onClick={() => select(g.id)}>
          <span className="group-number">{String(i + 1).padStart(2, '0')}</span><span className="group-name">{g.name}</span><span className="group-count">{manifest?.objects.filter(p => p.group === g.id).length}</span><ChevronRight className="group-chevron" size={14} />
        </button>)}
      </div>
      <div className="catalog-bottom"><span className="tiny-rule" /><strong>{manifest?.objects.length ?? '—'} {t('3D elements', 'elementos 3D')}</strong><p>{t('A small piece of our history<br />in every curve.', 'Tem um pedacinho da nossa<br />história em cada curva.').split('<br />').map((line, i) => <Fragment key={i}>{i > 0 && <br />}{line}</Fragment>)}</p><span className="garage-sign">{t('THE GARAGE IS YOURS.', 'A GARAGEM É SUA.')}</span></div>
    </aside>

    <section className="stage" aria-label={t('Beetle 3D studio', 'Estúdio 3D do Fusca')}>
      {manifest && <Suspense fallback={<div className="scene-status" role="status"><span className="loading-wheel" />{t('Preparing the yellow Beetle…', 'Preparando o fusquinha…')}</div>}><VehicleScene ref={scene} manifest={manifest} locale={locale} selected={selected} focused={focused} explosion={explosion} isolated={isolated} autoRotate={autoRotate} labels={labels} wireframe={wireframe} engineOn={engineOn} vehicleSwitches={vehicleSwitches} audioClock={audioClock} onSelect={select} onReady={() => setReady(true)} /></Suspense>}
      {error && <div className="scene-status is-error" role="alert">{error}<button onClick={() => location.reload()}>{t('Try again', 'Tentar novamente')}</button></div>}
      <div className="stage-caption"><span className="caption-line" />{isolated ? t('A CLOSER LOOK', 'OLHANDO DE PERTINHO') : explosion === 100 ? t('EVERY PART IN ITS PLACE', 'CADA PEÇA NO SEU LUGAR') : explosion ? t('EXPLODED VIEW', 'VISTA EXPLODIDA') : t('IN OUR GARAGE · 360°', 'NA NOSSA GARAGEM · 360°')}</div>
      <div className={`ignition-controls ${engineOn ? 'is-running' : ''}`}>
        <button className="ignition-button" disabled={!ready || engineStarting} aria-pressed={engineOn} onClick={toggleEngine}><Power size={14} /><span>{engineStarting ? t('Starting…', 'Ligando…') : engineOn ? t('Stop engine', 'Desligar motor') : t('Start engine', 'Ligar motor')}</span><span className="engine-indicator" aria-hidden="true" /></button>
        <button className="engine-mute" disabled={!ready} aria-label={muted ? t('Enable sounds', 'Ativar sons') : t('Mute sounds', 'Silenciar sons')} title={muted ? t('Enable sounds', 'Ativar sons') : t('Mute sounds', 'Silenciar sons')} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <VolumeX size={15} /> : <Volume2 size={15} />}</button>
      </div>
      <div className="vehicle-switches" role="group" aria-label={t('Beetle controls', 'Comandos do Fusquinha')}>
        <button disabled={!ready} aria-label={vehicleSwitches.headlights ? t('Turn headlights off', 'Desligar faróis') : t('Turn headlights on', 'Ligar faróis')} aria-pressed={vehicleSwitches.headlights} onClick={() => toggleVehicleSwitch('headlights')}><Lightbulb size={14} /><span>{t('Headlights', 'Faróis')}</span></button>
        <button disabled={!ready} aria-label={vehicleSwitches.doorOpen ? t('Close driver door', 'Fechar porta do motorista') : t('Open driver door', 'Abrir porta do motorista')} aria-pressed={vehicleSwitches.doorOpen} onClick={() => toggleVehicleSwitch('doorOpen')}><DoorOpen size={14} /><span>{vehicleSwitches.doorOpen ? t('Door open', 'Porta aberta') : t('Door', 'Porta')}</span></button>
        <button disabled={!ready} className="hazard-switch" aria-label={vehicleSwitches.hazards ? t('Turn hazard lights off', 'Desligar pisca-alerta') : t('Turn hazard lights on', 'Ligar pisca-alerta')} aria-pressed={vehicleSwitches.hazards} onClick={() => toggleVehicleSwitch('hazards')}><TriangleAlert size={14} /><span>{t('Hazards', 'Alerta')}</span></button>
        <button disabled={!ready} aria-label={vehicleSwitches.wipers ? t('Turn wipers off', 'Desligar limpadores') : t('Turn wipers on', 'Ligar limpadores')} aria-pressed={vehicleSwitches.wipers} onClick={() => toggleVehicleSwitch('wipers')}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 18 1.5 6a25 25 0 0 1 21 0L21 18Z" /><path d="m5 18 8-10m-5 0 7 5" /></svg><span>{t('Wipers', 'Limpadores')}</span></button>
      </div>
      <div className="stage-footer"><span>{t('Drag to turn', 'Arraste pra girar')} <i /> {t('Zoom in to discover', 'Aproxime pra descobrir')}</span><span className="coordinates">{projectLocation.toLocaleUpperCase(locale)} &nbsp; · &nbsp; {t('BRAZIL', 'BRASIL')}</span></div>
    </section>

    <nav className={`view-tools ${toolsOpen ? 'is-open' : ''}`} aria-label={t('View controls', 'Controles de visualização')}>
      <button className={`mobile-only ${catalogOpen ? 'active' : ''}`} aria-label={t('Open catalog', 'Abrir catálogo')} aria-expanded={catalogOpen} onClick={() => { setCatalogOpen(!catalogOpen); setToolsOpen(false); }}><Layers3 size={18} /></button>
      <button className="tool-extra" disabled={!ready} aria-label={t('Zoom in', 'Aproximar')} title={t('Zoom in', 'Aproximar')} onClick={() => scene.current?.zoom(.82)}><Plus size={18} /></button>
      <button className="tool-extra" disabled={!ready} aria-label={t('Zoom out', 'Afastar')} title={t('Zoom out', 'Afastar')} onClick={() => scene.current?.zoom(1.22)}><Minus size={18} /></button>
      <span className="tool-separator tool-extra" />
      <button disabled={!ready} aria-label={t('Reset camera', 'Redefinir câmera')} title={`${t('Reset camera', 'Redefinir câmera')} (R)`} onClick={() => { setAutoRotate(false); scene.current?.reset(); }}><RotateCcw size={17} /></button>
      <button className={`tool-extra ${autoRotate ? 'active' : ''}`} disabled={!ready} aria-label={t('Auto-rotate', 'Girar automaticamente')} aria-pressed={autoRotate} title={t('Auto-rotate', 'Girar automaticamente')} onClick={() => setAutoRotate(!autoRotate)}><Rotate3d size={19} /></button>
      <button className={`tool-extra ${wireframe ? 'active' : ''}`} disabled={!ready} aria-label={t('Show wireframe', 'Mostrar malha')} aria-pressed={wireframe} title={t('Show wireframe', 'Mostrar malha')} onClick={() => setWireframe(!wireframe)}><Box size={18} /></button>
      <button className={`mobile-labels tool-extra ${labels ? 'active' : ''}`} disabled={!ready} aria-label={t('Show assembly names', 'Mostrar nomes dos conjuntos')} aria-pressed={labels} title={t('Assembly names', 'Nomes dos conjuntos')} onClick={() => setLabels(!labels)}><Tags size={18} /></button>
      <span className="tool-separator tool-extra" />
      <button className="tool-extra" disabled={!ready} aria-label={t('Save image', 'Salvar imagem')} title={t('Save Beetle image', 'Salvar imagem do Fusca')} onClick={() => scene.current?.capture()}><ArrowDownToLine size={17} /></button>
      {fullscreen && <button className="tool-extra" aria-label={t('Toggle full screen', 'Alternar tela cheia')} title={t('Full screen', 'Tela cheia')} onClick={toggleFullscreen}><Maximize2 size={17} /></button>}
      <button className="mobile-only" aria-label={t('More controls', 'Mais controles')} aria-expanded={toolsOpen} onClick={() => { setToolsOpen(!toolsOpen); setCatalogOpen(false); }}><Settings2 size={18} /></button>
    </nav>

    {group && <aside className="detail-panel" aria-label={t('Part details', 'Detalhes da peça')}>
      <div className="detail-eyebrow"><span>{String(localizedGroups.indexOf(group) + 1).padStart(2, '0')} / {group.name}</span><button className="icon-button" aria-label={t('Close details', 'Fechar detalhes')} onClick={closeDetails}><X size={18} /></button></div>
      <h2>{piece ? localPiece(piece, locale) : group.name}</h2>
      <p className="detail-subtitle">{group.subtitle}</p>
      <div className="detail-tabs" role="tablist" aria-label={t('Assembly information', 'Informações do conjunto')}>
        <button role="tab" id="about-tab" aria-selected={tab === 'about'} aria-controls="detail-content" onClick={() => setTab('about')}>{t('Overview', 'Visão geral')}</button>
        <button role="tab" id="working-tab" aria-selected={tab === 'working'} aria-controls="detail-content" onClick={() => setTab('working')}>{t('How it works', 'Como funciona')}</button>
      </div>
      <p id="detail-content" className="detail-copy" role="tabpanel" aria-labelledby={tab === 'about' ? 'about-tab' : 'working-tab'}>{tab === 'about' ? group.description : group.working}</p>
      <div className="detail-metadata"><span>{focused ? t('Selected element', 'Elemento selecionado') : t('Elements in this assembly', 'Elementos neste conjunto')}</span><strong>{focused ? String(groupPieces.findIndex(p => p.id === focused) + 1).padStart(2, '0') + ' / ' + groupPieces.length : groupPieces.length}</strong></div>
      <label className="piece-picker">{t('Inspect a part', 'Inspecionar uma peça')}<select aria-label={t('Select an individual part', 'Selecionar peça individual')} value={focused} onChange={e => setFocused(e.target.value)}><option value="">{t('Complete assembly', 'Conjunto completo')}</option>{groupPieces.map((p, i) => <option key={p.id} value={p.id}>{String(i + 1).padStart(2, '0')} · {localPiece(p, locale)}</option>)}</select></label>
      <button className={`isolate-button ${isolated ? 'is-active' : ''}`} aria-pressed={isolated} onClick={() => setIsolated(!isolated)}>{isolated ? <Layers3 size={17} /> : <Crosshair size={17} />}{isolated ? t('Return to Beetle', 'Voltar ao Fusca') : focused ? t('Isolate this part', 'Isolar esta peça') : t('Isolate assembly', 'Isolar conjunto')}<ArrowUpRight size={16} /></button>
      <p className="piece-note">{piece?.sourceObject === 'Fusquinha' ? t('Detail added in this reinterpretation.', 'Detalhe acrescentado nesta releitura.') : t('Artistic geometry for visual exploration.', 'Geometria artística para exploração visual.')}</p>
      <a className="reference-link" href="https://www.thesamba.com/vw/archives/manuals/type1.php" target="_blank" rel="noreferrer">{t('Browse historical manuals', 'Consultar manuais históricos')} <ArrowUpRight size={12} /></a>
    </aside>}

    <div className="assembly-dock" aria-label={t('Assembly controls', 'Controles de montagem')}>
      <button className={`assembly-mode ${explosion === 0 ? 'active' : ''}`} disabled={!ready} onClick={assemble} aria-label={t('Assemble Beetle', 'Montar Fusca')}><Box size={19} /><span>{t('Assembled', 'Montado')}</span></button>
      <div className="explosion-slider"><div><label htmlFor="explosion">{t('Disassemble to discover', 'Desmontar para descobrir')}</label><output htmlFor="explosion">{explosion}<small>%</small></output></div><input id="explosion" aria-label={t('Disassembly', 'Desmontagem')} disabled={!ready} type="range" min="0" max="100" step="1" value={explosion} style={{ '--progress': `${explosion}%` } as React.CSSProperties} onChange={e => { setExplosion(Number(e.target.value)); setIsolated(false); }} /></div>
      <button className={`assembly-mode ${explosion === 100 ? 'active' : ''}`} disabled={!ready} onClick={() => { setExplosion(100); setIsolated(false); }} aria-label={t('Separate every part', 'Separar todas as peças')}><Expand size={19} /><span>{t('All parts', 'Todas as peças')}</span></button>
      <span className="dock-separator" />
      <label className="labels-switch"><input type="checkbox" checked={labels} onChange={e => setLabels(e.target.checked)} aria-label={t('Show assembly names', 'Mostrar nomes dos conjuntos')} /><span className="switch-track" /><span>{t('Names', 'Nomes')}</span></label>
    </div>

    <footer className="studio-footer"><span>{t('MADE IN BRAZIL. FULL OF STORIES.', 'FEITO NO BRASIL. CHEIO DE HISTÓRIAS.')}</span><button className="project-credit" aria-label={t('A project by Victor — open credits', 'Projeto de Victor — abrir créditos')} onClick={() => about.current?.showModal()}><span>{t('project', 'projeto')}</span><span className="social-credit"><XLogo />@ovictor</span><span className="social-credit"><Youtube size={14} aria-hidden="true" />@ovictorlab</span><ArrowUpRight size={11} /></button></footer>
    {notice && <div className="notice" role="status">{notice}</div>}
    <audio ref={engineAudio} loop muted={muted} preload="none" onPlaying={() => setEngineOn(true)} onPause={() => setEngineOn(false)} onError={() => { setEngineOn(false); setNotice(t('The engine sound could not load.', 'Não foi possível carregar o som do motor.')); }}>
      <source src={`${import.meta.env.BASE_URL}audio/fusquinha-engine.ogg`} type="audio/ogg" />
      <source src={`${import.meta.env.BASE_URL}audio/fusquinha-engine.mp3`} type="audio/mpeg" />
    </audio>

    <dialog ref={about} className="about-dialog" onClick={event => { if (event.target === event.currentTarget) about.current?.close(); }}>
      <div className="about-content"><div className="detail-eyebrow"><span>FUSQUINHA / {t('CREDITS', 'CRÉDITOS')}</span><button autoFocus className="icon-button" aria-label={t('Close project information', 'Fechar sobre o projeto')} onClick={() => about.current?.close()}><X size={21} /></button></div>
        <span className="about-title">{t('It is ours.', 'É nosso.')}<br />{t('It is ', 'É ')}<em>{t('yellow.', 'amarelinho.')}</em></span>
        <p>{t('A family car for the open road and a pause on the sidewalk. An open garage for a closer look at a familiar old friend.', 'Carro de família, de pegar estrada, de parar na calçada pra uma prosa. Uma garagem aberta pra olhar de perto um velho conhecido.')}</p>
        <dl className="credits"><div className="creator-credit"><dt>{t('Concept and direction', 'Idealização e direção')}</dt><dd><strong>Victor</strong><span className="creator-profiles"><a href="https://x.com/ovictor" target="_blank" rel="noreferrer"><XLogo />@ovictor</a><a href="https://www.youtube.com/@ovictorlab" target="_blank" rel="noreferrer"><Youtube size={14} aria-hidden="true" />@ovictorlab</a></span></dd></div><div><dt>{t('3D model', 'Modelo 3D')}</dt><dd><a href={manifest?.source} target="_blank" rel="noreferrer">Rodrigo Marini · BlenderKit <ArrowUpRight size={13} /></a></dd></div><div><dt>{t('Asset license', 'Licença do asset')}</dt><dd><a href={manifest?.licenseUrl} target="_blank" rel="noreferrer">Royalty Free <ArrowUpRight size={13} /></a></dd></div><div><dt>{t('Experience inspiration', 'Inspiração da experiência')}</dt><dd><a href="https://github.com/ashemag/model-x-studio" target="_blank" rel="noreferrer">Model X Studio · Ashe <ArrowUpRight size={13} /></a></dd></div><div><dt>{t('Studio lighting', 'Luz de estúdio')}</dt><dd><a href="https://polyhaven.com/a/studio_small_09" target="_blank" rel="noreferrer">Sergej Majboroda · Poly Haven <ArrowUpRight size={13} /></a></dd></div></dl>
        <p className="audio-credit">{t('Engine sound: ', 'Som do motor: ')}<a href="https://commons.wikimedia.org/wiki/File:WWS_VolkswagenBeetle8211engine.ogg" target="_blank" rel="noreferrer">Dušan Oblak · Work With Sounds / Technical Museum of Slovenia</a>. {t('1984 Beetle 1600 · ', 'Fusca 1600 de 1984 · ')}<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a>. {t('Selected by Victor. Uncut, with MP3 conversion, looping, and adjusted playback volume.', 'Seleção de Victor. Sem cortes; conversão MP3, repetição e volume ajustado.')}</p>
        <details className="sound-credits"><summary>{t('Sound effects · authors', 'Efeitos sonoros · autores')}</summary><a href="https://freesound.org/people/khenshom/sounds/504954/" target="_blank" rel="noreferrer">{t('Switch', 'Interruptor')} · khenshom</a><a href="https://freesound.org/people/MWsfx/sounds/574249/" target="_blank" rel="noreferrer">{t('Relay', 'Relé')} · MWsfx</a><a href="https://freesound.org/people/MyInnerWill/sounds/704508/" target="_blank" rel="noreferrer">{t('Wipers', 'Limpadores')} · MyInnerWill</a><a href="https://freesound.org/people/nmscher/sounds/86232/" target="_blank" rel="noreferrer">{t('Door', 'Porta')} · nmscher</a><span>Freesound · CC0 · {t('selected by Victor.', 'seleção de Victor.')}</span></details>
        <p className="about-scope">{t(`From ${projectLocation}: a Brazilian reinterpretation of a 1965 model, with yellow paint, chrome hubcaps, Espírito Santo plates, and ${manifest?.objects.length} elements to explore. The parts are artistic geometry; no equivalence with replacement parts is guaranteed. An independent project with no affiliation with Volkswagen.`, `Direto de ${projectLocation}: uma releitura brasileira de um modelo de 1965, com pintura amarela, calotas cromadas, placas capixabas e ${manifest?.objects.length} elementos para explorar. As peças são geometria artística, sem equivalência garantida com peças de reposição. Projeto independente, sem vínculo com a Volkswagen.`)}</p>
        <div className="help-line"><CircleHelp size={17} /><span>{t('Drag to turn. Use two fingers or the mouse wheel to zoom. ', 'Arraste para girar. Use dois dedos ou a roda do mouse para aproximar. ')}<kbd>E</kbd>{t(' disassembles and ', ' desmonta e ')}<kbd>R</kbd>{t(' reframes.', ' reenquadra.')}</span></div>
      </div>
    </dialog>
  </main>;
}
