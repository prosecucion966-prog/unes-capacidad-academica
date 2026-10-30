import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [nucleos, setNucleos] = useState([])
  const [extensiones, setExtensiones] = useState([])
  const [capacidades, setCapacidades] = useState([])
  const [nucleoId, setNucleoId] = useState('')
  const [tieneExtensiones, setTieneExtensiones] = useState('no')
  const [extension, setExtension] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [programa, setPrograma] = useState('')
  const [trayecto, setTrayecto] = useState('I')
  const [extensionId, setExtensionId] = useState('')
  const [docentes, setDocentes] = useState('0')
  const [estudiantes, setEstudiantes] = useState('0')
  const [cantidadAulas, setCantidadAulas] = useState('0')
  const [capacidadPorAula, setCapacidadPorAula] = useState('0')
  const [observaciones, setObservaciones] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authMode, setAuthMode] = useState('login')
  const [signupNucleo, setSignupNucleo] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('registro')
  const [reportNucleo, setReportNucleo] = useState('todos')
  const [reportPnf, setReportPnf] = useState('todos')
  const [selectedEstado, setSelectedEstado] = useState('Distrito Capital')
  const [geoFeatures, setGeoFeatures] = useState([])
  const [mapLoadError, setMapLoadError] = useState('')
  useEffect(() => {
    const url = 'https://services3.arcgis.com/yaewiDuOIcucvCmt/ArcGIS/rest/services/DPA_Venezuela/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson'
    fetch(url).then(response => { if (!response.ok) throw new Error('No se pudo cargar el mapa geográfico'); return response.json() })
      .then(data => { setGeoFeatures(data.features || []); setMapLoadError('') })
      .catch(() => setMapLoadError('No se pudo cargar el mapa geográfico. Puedes seleccionar el estado desde la lista.'))
  }, [])
  const normalizeEstado = value => String(value || '').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLocaleLowerCase('es').replace(/^(estado|state)\s+/, '').trim()
  const geoEstadoName = feature => {
    const props = feature?.properties || {}
    const vals = Object.values(props).filter(v => typeof v === 'string')
    return estadosVenezuela.find(estado => vals.some(v => normalizeEstado(v) === normalizeEstado(estado) || normalizeEstado(v).startsWith(normalizeEstado(estado) + ' '))) || ''
  }
  const projectGeoPoint = point => [((point[0] + 74) / 15) * 600, ((13 - point[1]) / 13) * 500]
  const geoPath = geometry => {
    if (!geometry) return ''
    const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat(1) : []
    return rings.map(ring => ring.map((point, i) => { const [x,y] = projectGeoPoint(point); return (i ? 'L' : 'M') + x.toFixed(2) + ' ' + y.toFixed(2) }).join(' ') + ' Z').join(' ')
  }
  const estadosVenezuela = ['Zulia','Falcón','Lara','Yaracuy','Carabobo','Aragua','Distrito Capital','La Guaira','Miranda','Anzoátegui','Sucre','Nueva Esparta','Trujillo','Portuguesa','Cojedes','Guárico','Monagas','Mérida','Barinas','Apure','Táchira','Amazonas','Bolívar','Delta Amacuro']
  const estadoTiles = [['Zulia',1,2],['Falcón',2,2],['Lara',3,3],['Yaracuy',4,3],['Carabobo',5,3],['Aragua',6,3],['Distrito Capital',7,3],['La Guaira',8,2],['Miranda',8,3],['Anzoátegui',9,3],['Sucre',10,3],['Nueva Esparta',10,2],['Trujillo',3,4],['Portuguesa',4,4],['Cojedes',5,4],['Guárico',6,4],['Monagas',9,4],['Mérida',2,5],['Barinas',4,5],['Apure',5,5],['Táchira',2,6],['Amazonas',5,7],['Bolívar',7,5],['Delta Amacuro',10,5]]
  const isAdmin = String(session?.user?.email || '').toLowerCase() === 'bancodepreguntasunes@gmail.com'
  const pnfOptions = ['PNF en Investigación Penal', 'PNF en Ciencias del Fuego y Seguridad contra Incendios', 'PNF en Protección Civil y Administración de Desastres', 'PNF en Servicio Penitenciario', 'PNF en Prevención y Seguridad Ciudadana', 'PNF en Emergencia Prehospitalaria']
  const normalizePnf = value => String(value || '').trim().replace(/\\s+/g, ' ').toLocaleLowerCase('es')

  useEffect(() => {
    if (!supabaseConfigured) { setLoading(false); return }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message)
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => { if (session) loadData() }, [session])

  useEffect(() => {
    if (!supabaseConfigured || session) return
    supabase.from('nucleos').select('id,nombre,activo,estado').order('nombre').then(({ data, error }) => {
      if (error) { setError('No se pudo cargar la lista de núcleos: ' + error.message); return }
      if (data) { setNucleos(data); if (!signupNucleo && data.length) setSignupNucleo(String(data[0].id)) }
    })
  }, [session])

  async function loadData() {
    setLoading(true); setError('')
    const [n, e, c] = await Promise.all([
      supabase.from('nucleos').select('id,nombre,activo,estado').order('nombre'),
      supabase.from('extensiones').select('id,nucleo_id,nombre,activa').order('nombre'),
      supabase.from('capacidad_academica').select('id,nucleo_id,extension_id,periodo,programa,trayecto,cantidad_docentes,cantidad_estudiantes,cantidad_aulas,capacidad_por_aula,observaciones,creado_en').order('creado_en', { ascending: false })
    ])
    const problem = n.error || e.error || c.error
    if (problem) setError(problem.message + ' Revisa las tablas y supabase/policies.sql en Supabase.')
    if (n.data) { setNucleos(n.data); if (!nucleoId && n.data.length) setNucleoId(String(n.data[0].id)) }
    if (e.data) setExtensiones(e.data)
    if (c.data) setCapacidades(c.data)
    setLoading(false)
  }

  async function signIn(event) {
    event.preventDefault(); setError(''); setNotice('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else { setPassword(''); setNotice('Sesión iniciada correctamente.') }
  }
  async function signUp(event) {
    event.preventDefault(); setError(''); setNotice('')
    if (!fullName.trim() || !signupNucleo) { setError('Escribe tu nombre y selecciona el núcleo que te corresponde.'); return }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return }
    setSaving(true)
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password, options: { data: { full_name: fullName.trim(), nucleo_id: signupNucleo } } })
    setSaving(false)
    if (error) setError(error.message)
    else if (data.session) { setPassword(''); setNotice('Cuenta creada. Ya puedes comenzar a registrar información del núcleo seleccionado.') }
    else { setPassword(''); setNotice('Cuenta creada. Si Supabase solicita confirmar el correo, revisa tu bandeja de entrada. Para acceso inmediato, desactiva la confirmación de correo en la configuración de autenticación de Supabase.') }
  }
  async function signOut() {
    await supabase.auth.signOut()
    setSession(null); setNucleos([]); setExtensiones([]); setCapacidades([])
  }
  async function addExtension(event) {
    event.preventDefault()
    if (!nucleoId || !extension.trim()) { setError('Selecciona un núcleo y escribe el nombre de la extensión.'); return }
    setSaving(true); setError(''); setNotice('')
    const { error } = await supabase.from('extensiones').insert({ nucleo_id: Number(nucleoId), nombre: extension.trim(), activa: true })
    setSaving(false)
    if (error) setError(error.message)
    else { setExtension(''); setTieneExtensiones('si'); setNotice('Extensión guardada.'); await loadData() }
  }
  async function addCapacity(event) {
    event.preventDefault()
    if (!nucleoId || !periodo.trim() || !programa || !trayecto) { setError('Selecciona el núcleo, PNF, trayecto e indica el período académico.'); return }
    setSaving(true); setError(''); setNotice('')
    const { error } = await supabase.from('capacidad_academica').insert({
      nucleo_id: Number(nucleoId), extension_id: extensionId ? Number(extensionId) : null,
      periodo: periodo.trim(), programa, trayecto,
      cantidad_docentes: Number(docentes), cantidad_estudiantes: Number(estudiantes),
      cantidad_aulas: Number(cantidadAulas), capacidad_por_aula: Number(capacidadPorAula),
      observaciones: observaciones.trim() || null
    })
    setSaving(false)
    if (error) setError(error.message)
    else { setPeriodo(''); setPrograma(''); setTrayecto('I'); setExtensionId(''); setDocentes('0'); setEstudiantes('0'); setCantidadAulas('0'); setCapacidadPorAula('0'); setObservaciones(''); setNotice('Capacidad académica guardada.'); await loadData() }
  }
  async function saveNucleoEstado(item, estado) {
    setError(''); setNotice('')
    const { error } = await supabase.from('nucleos').update({ estado: estado || null }).eq('id', item.id)
    if (error) setError('No se pudo guardar el estado del núcleo. Ejecuta la migración del mapa en Supabase. Detalle: ' + error.message)
    else { setNotice('Estado actualizado para ' + item.nombre + '.'); await loadData() }
  }
  async function toggleExtension(item) {
    const { error } = await supabase.from('extensiones').update({ activa: !item.activa }).eq('id', item.id)
    if (error) setError(error.message)
    else { setNotice('Estado de extensión actualizado.'); await loadData() }
  }
  function exportPdf() {
    const pdf = new jsPDF()
    pdf.setFontSize(16); pdf.text('UNES - Reporte de Capacidad Académica', 14, 18)
    pdf.setFontSize(9); pdf.text('Generado: ' + new Date().toLocaleDateString('es-VE'), 14, 25)
    const rows = nucleos.map(n => {
      const exts = extensiones.filter(e => e.nucleo_id === n.id)
      const caps = capacidades.filter(c => c.nucleo_id === n.id)
      return [n.nombre, exts.length ? exts.map(e => e.nombre + (e.activa ? ' (activa)' : ' (inactiva)')).join(', ') : 'Sin extensiones',
        caps.length ? caps.map(c => c.periodo + ' - ' + (c.programa || 'PNF sin indicar') + ' - Trayecto ' + (c.trayecto || 'sin indicar') + ' - ' + (extensiones.find(e => e.id === c.extension_id)?.nombre || 'Sede principal') + ': Docentes ' + c.cantidad_docentes + '; Estudiantes ' + c.cantidad_estudiantes + '; Aulas ' + (c.cantidad_aulas ?? 0) + '; Capacidad por aula ' + (c.capacidad_por_aula ?? 0) + '; Capacidad total de aulas ' + (Number(c.cantidad_aulas || 0) * Number(c.capacidad_por_aula || 0)) + (c.observaciones ? '; ' + c.observaciones : '')).join('\n') + '\nTOTAL DEL NÚCLEO: Docentes ' + caps.reduce((sum, c) => sum + Number(c.cantidad_docentes || 0), 0) + '; Estudiantes ' + caps.reduce((sum, c) => sum + Number(c.cantidad_estudiantes || 0), 0) : 'Sin registros']
    })
    autoTable(pdf, { startY: 31, head: [['Núcleo', 'Extensiones', 'Capacidad académica']], body: rows,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' }, headStyles: { fillColor: [16,45,79] },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 55 }, 2: { cellWidth: 85 } } })
    pdf.save('reporte-capacidad-academica-unes.pdf')
  }

  if (!supabaseConfigured) return <main className="center"><section className="panel setup">
    <div className="logo">UNES</div><p className="eyebrow">CONFIGURACIÓN INICIAL</p><h1>Conectar Supabase</h1>
    <p>Crea un archivo <code>.env</code> a partir de <code>.env.example</code> y coloca la URL del proyecto y la clave pública publishable.</p>
    <p>No uses nunca la clave <code>secret</code> ni <code>service_role</code> en una aplicación web.</p>
  </section></main>

  if (loading && !session) return <main className="center"><section className="panel">Cargando…</section></main>
  if (!session) return <main className="center"><section className="panel login">
    <img className="unes-emblem login-emblem" src="https://www.unes.com.ve/_next/static/media/Unes.ab4c127e.png" alt="Logo oficial UNES" onError={e => { e.currentTarget.style.display = 'none' }} />
    <p className="eyebrow">SISTEMA INSTITUCIONAL</p><h1>Capacidad Académica</h1>
    <div className="auth-switch"><button type="button" className={authMode === 'login' ? 'tab active-tab' : 'tab'} onClick={() => {setAuthMode('login');setError('');setNotice('')}}>Iniciar sesión</button><button type="button" className={authMode === 'signup' ? 'tab active-tab' : 'tab'} onClick={() => {setAuthMode('signup');setError('');setNotice('')}}>Crear cuenta</button></div>
    {authMode === 'login' ? <>
      <p className="muted">Ingresa con tu correo y contraseña.</p>
      <form onSubmit={signIn} className="stack">
        <label>Correo electrónico<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="username" /></label>
        <label>Contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" /></label>
        <button className="primary">Iniciar sesión</button>
      </form>
    </> : <>
      <p className="muted">Crea tu cuenta y selecciona el núcleo que tienes asignado. Cada responsable trabaja únicamente con su núcleo.</p>
      <form onSubmit={signUp} className="stack">
        <label>Nombre y apellido<input value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" placeholder="Tu nombre completo" /></label>
        <label>Correo electrónico<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></label>
        <label>Selecciona tu núcleo<select value={signupNucleo} onChange={e => setSignupNucleo(e.target.value)} required><option value="">Selecciona un núcleo</option>{nucleos.map(n => <option key={n.id} value={String(n.id)}>{n.nombre}</option>)}</select></label>
        <label>Crear contraseña<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" placeholder="Mínimo 8 caracteres" /></label>
        <button className="primary" disabled={saving}>{saving ? 'Creando cuenta…' : 'Crear cuenta y continuar'}</button>
      </form>
    </>}
    {error && <p className="alert error">{error}</p>}{notice && <p className="alert success">{notice}</p>}
  </section></main>

  const exts = extensiones.filter(e => String(e.nucleo_id) === String(nucleoId))
  const caps = capacidades.filter(c => String(c.nucleo_id) === String(nucleoId))
  return <div>
    <header className="topbar"><div className="brand"><img className="unes-emblem top-emblem" src="https://www.unes.com.ve/_next/static/media/Unes.ab4c127e.png" alt="Logo UNES" onError={e => { e.currentTarget.style.display = 'none' }} /><div><strong>Capacidad Académica</strong><span>Gestión institucional</span></div></div>
      <div className="actions"><span>{session.user.email}</span><button className="secondary" onClick={signOut}>Cerrar sesión</button></div>
    </header>
    <main className="content">
      <div className="welcome"><div><p className="eyebrow">PANEL DE CONTROL</p><h1>Registro académico</h1><p className="muted">Administra núcleos, extensiones y capacidad académica.</p></div><button className="primary" onClick={exportPdf}>Descargar reporte PDF</button></div>
      {error && <p className="alert error">{error}</p>}{notice && <p className="alert success">{notice}</p>}
      <nav className="report-tabs">
        <button className={activeTab === 'registro' ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab('registro')}>Registro académico</button>
        <button className={activeTab === 'reportes' ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab('reportes')}>📊 Reportes y estadísticas</button>
        <button className={activeTab === 'mapa' ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab('mapa')}>🗺️ Mapa de Venezuela</button>
      </nav>
      {activeTab === 'mapa' && (() => {
        const nucleosEstado = nucleos.filter(n => String(n.estado || '').toLocaleLowerCase('es') === selectedEstado.toLocaleLowerCase('es'))
        const idsEstado = new Set(nucleosEstado.map(n => String(n.id)))
        const capsEstado = capacidades.filter(c => idsEstado.has(String(c.nucleo_id)))
        const totalDocEstado = capsEstado.reduce((a,c) => a + Number(c.cantidad_docentes || 0), 0)
        const totalEstEstado = capsEstado.reduce((a,c) => a + Number(c.cantidad_estudiantes || 0), 0)
        const countFor = estado => nucleos.filter(n => String(n.estado || '').toLocaleLowerCase('es') === estado.toLocaleLowerCase('es')).length
        return <section className="map-area">
          <div className="report-heading"><div><p className="eyebrow">VISTA TERRITORIAL</p><h2>Capacidad académica por estado</h2><p className="muted">Selecciona una región para consultar sus núcleos, extensiones y matrícula.</p></div></div>
          <div className="map-layout">
            <article className="report-chart map-visual">
              <div className="map-title"><div><h3>Mapa esquemático de Venezuela</h3><p className="muted">Selecciona un estado para ver sus indicadores.</p></div><span className="pill">{nucleos.filter(n=>n.estado).length} núcleos ubicados</span></div>
              {mapLoadError && <p className="alert error">{mapLoadError}</p>}
              <div className="real-venezuela-map" role="group" aria-label="Mapa geográfico de Venezuela por estados">
                {geoFeatures.length ? <svg viewBox="0 0 600 500" role="img" aria-label="Mapa geográfico interactivo de Venezuela">
                  {geoFeatures.map((feature,i) => { const estado=geoEstadoName(feature); if (!estado) return null; return <path key={feature.id || i} d={geoPath(feature.geometry)} className={'geo-state ' + (selectedEstado===estado?'geo-state-selected':'') + (countFor(estado)?' geo-state-has-data':'')} onClick={()=>setSelectedEstado(estado)} tabIndex="0" role="button" aria-label={estado} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelectedEstado(estado)}}}><title>{estado}: {countFor(estado)} núcleos</title></path> })}
                </svg> : <div className="map-placeholder">Cargando mapa geográfico de Venezuela…</div>}
              </div>
              <p className="map-note">Selecciona una división territorial en el mapa. El tono verde indica que hay núcleos asignados a ese estado.</p>
              <label>Seleccionar estado<select value={selectedEstado} onChange={e=>setSelectedEstado(e.target.value)}>{estadosVenezuela.map(estado=><option key={estado}>{estado}</option>)}</select></label>
            </article>
            <article className="report-chart state-summary">
              <p className="eyebrow">ESTADO SELECCIONADO</p><h2>{selectedEstado}</h2>
              <div className="state-kpis"><div><span>Núcleos</span><strong>{nucleosEstado.length}</strong></div><div><span>Registros</span><strong>{capsEstado.length}</strong></div><div><span>Docentes</span><strong>{totalDocEstado.toLocaleString('es-VE')}</strong></div><div><span>Estudiantes</span><strong>{totalEstEstado.toLocaleString('es-VE')}</strong></div></div>
              {!nucleosEstado.length ? <p className="empty">Todavía no hay núcleos asignados a este estado. {isAdmin ? 'Usa el panel de asignación que aparece abajo.' : 'El administrador debe asignar el estado a cada núcleo.'}</p> :
                <div className="state-nucleus-list">{nucleosEstado.map(n=>{const nc=capacidades.filter(c=>String(c.nucleo_id)===String(n.id));const ne=extensiones.filter(e=>String(e.nucleo_id)===String(n.id));return <div className="state-nucleus" key={n.id}><div><strong>{n.nombre}</strong><small>{ne.length} extensiones · {nc.length} registros de capacidad</small></div><div className="state-nucleus-metrics"><span>{nc.reduce((a,c)=>a+Number(c.cantidad_docentes||0),0)} docentes</span><span>{nc.reduce((a,c)=>a+Number(c.cantidad_estudiantes||0),0)} estudiantes</span></div></div>})}</div>}
            </article>
          </div>
          {isAdmin && <article className="report-chart state-admin"><h3>Asignar estado a cada núcleo</h3><p className="muted">Selecciona el estado correspondiente. Estos cambios no alteran los registros académicos.</p><div className="state-assignment-list">{nucleos.map(n=><label key={n.id}>{n.nombre}<select value={n.estado || ''} onChange={e=>saveNucleoEstado(n,e.target.value)}><option value="">Sin asignar</option>{estadosVenezuela.map(estado=><option key={estado}>{estado}</option>)}</select></label>)}</div></article>}
          <article className="report-chart report-detail"><h3>Registros académicos de {selectedEstado}</h3><div className="table-wrap"><table><thead><tr><th>Núcleo</th><th>PNF</th><th>Trayecto</th><th>Período</th><th>Docentes</th><th>Estudiantes</th></tr></thead><tbody>{capsEstado.map(c=><tr key={c.id}><td>{nucleos.find(n=>String(n.id)===String(c.nucleo_id))?.nombre||'—'}</td><td>{c.programa}</td><td>{c.trayecto||'—'}</td><td>{c.periodo}</td><td>{c.cantidad_docentes}</td><td>{c.cantidad_estudiantes}</td></tr>)}{!capsEstado.length&&<tr><td colSpan="6">No hay registros para este estado.</td></tr>}</tbody></table></div></article>
        </section>
      })()}
      {activeTab === 'reportes' && (() => {
        const filtered = capacidades.filter(c => (reportNucleo === 'todos' || String(c.nucleo_id) === reportNucleo) && (reportPnf === 'todos' || normalizePnf(c.programa) === normalizePnf(reportPnf)))
        const totalDoc = filtered.reduce((a,c) => a + Number(c.cantidad_docentes || 0), 0)
        const totalEst = filtered.reduce((a,c) => a + Number(c.cantidad_estudiantes || 0), 0)
        const programs = pnfOptions.filter(p => capacidades.some(c => normalizePnf(c.programa) === normalizePnf(p)))
        const byPnf = programs.map(p => ({ name:p, docentes:filtered.filter(c=>normalizePnf(c.programa)===normalizePnf(p)).reduce((a,c)=>a+Number(c.cantidad_docentes||0),0), estudiantes:filtered.filter(c=>normalizePnf(c.programa)===normalizePnf(p)).reduce((a,c)=>a+Number(c.cantidad_estudiantes||0),0), aulas:filtered.filter(c=>normalizePnf(c.programa)===normalizePnf(p)).reduce((a,c)=>a+Number(c.cantidad_aulas||0),0), capacidadAulas:filtered.filter(c=>normalizePnf(c.programa)===normalizePnf(p)).reduce((a,c)=>a+Number(c.cantidad_aulas||0)*Number(c.capacidad_por_aula||0),0) })).filter(x=>x.docentes+x.estudiantes+x.aulas>0)
        const byNucleo = nucleos.map(n=>({name:n.nombre, docentes:filtered.filter(c=>c.nucleo_id===n.id).reduce((a,c)=>a+Number(c.cantidad_docentes||0),0), estudiantes:filtered.filter(c=>c.nucleo_id===n.id).reduce((a,c)=>a+Number(c.cantidad_estudiantes||0),0)})).filter(x=>x.docentes+x.estudiantes>0).sort((a,b)=>b.estudiantes-a.estudiantes)
        const maxP = Math.max(1,...byPnf.map(x=>x.estudiantes))
        const maxN = Math.max(1,...byNucleo.map(x=>x.estudiantes))
        return <section className="reports-area">
          <div className="report-heading"><div><p className="eyebrow">ANÁLISIS INSTITUCIONAL</p><h2>Panel de reportes</h2><p className="muted">Explora la capacidad académica con filtros dinámicos.</p></div><button className="primary" onClick={exportPdf}>Descargar PDF</button></div>
          <div className="report-filters">
            <label>Filtrar por núcleo<select value={reportNucleo} onChange={e=>setReportNucleo(e.target.value)}><option value="todos">Todos los núcleos</option>{nucleos.map(n=><option key={n.id} value={String(n.id)}>{n.nombre}</option>)}</select></label>
            <label>Filtrar por PNF<select value={reportPnf} onChange={e=>setReportPnf(e.target.value)}><option value="todos">Todos los PNF</option>{pnfOptions.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
          </div>
          <div className="report-kpis">
            <article className="report-kpi"><span>Registros encontrados</span><strong>{filtered.length}</strong><small>Según los filtros aplicados</small></article>
            <article className="report-kpi"><span>Total de docentes</span><strong>{totalDoc.toLocaleString('es-VE')}</strong><small>Personal académico registrado</small></article>
            <article className="report-kpi"><span>Total de estudiantes</span><strong>{totalEst.toLocaleString('es-VE')}</strong><small>Matrícula registrada</small></article>
            <article className="report-kpi"><span>Total de aulas registradas</span><strong>{byPnf.reduce((a,x)=>a+x.aulas,0).toLocaleString('es-VE')}</strong><small>Según los filtros aplicados</small></article>
          </div>
          <div className="report-grid">
            <article className="report-chart"><h3>Estudiantes por PNF</h3><p className="muted">Comparación de matrícula por programa</p>{byPnf.length ? byPnf.map(x=><div className="bar-row" key={x.name}><div className="bar-label"><span>{x.name.replace('PNF en ','')}</span><b>{x.estudiantes}</b></div><div className="bar-track"><div className="bar-fill" style={{width:(x.estudiantes/maxP*100)+'%'}}/></div><small>{x.docentes} docentes</small></div>) : <p className="empty">No hay datos para estos filtros.</p>}</article>
            <article className="report-chart"><h3>Aulas por PNF</h3><p className="muted">Cantidad de aulas y capacidad física registrada por programa</p>{byPnf.length ? byPnf.map(x=><div className="bar-row" key={x.name}><div className="bar-label"><span>{x.name.replace('PNF en ','')}</span><b>{x.aulas} aulas</b></div><div className="bar-track"><div className="bar-fill" style={{width:(x.aulas/Math.max(1,...byPnf.map(p=>p.aulas))*100)+'%'}}/></div><small>Capacidad total: {x.capacidadAulas.toLocaleString('es-VE')} estudiantes</small></div>) : <p className="empty">No hay datos de aulas para estos filtros.</p>}</article>
            <article className="report-chart"><h3>Estudiantes por núcleo</h3><p className="muted">Núcleos con mayor matrícula</p>{byNucleo.slice(0,10).map(x=><div className="bar-row" key={x.name}><div className="bar-label"><span>{x.name}</span><b>{x.estudiantes}</b></div><div className="bar-track"><div className="bar-fill alt-fill" style={{width:(x.estudiantes/maxN*100)+'%'}}/></div><small>{x.docentes} docentes</small></div>)}{!byNucleo.length&&<p className="empty">No hay datos para estos filtros.</p>}</article>
          </div>
          <article className="report-chart report-detail"><h3>Detalle de registros</h3><div className="table-wrap"><table><thead><tr><th>Núcleo</th><th>PNF</th><th>Trayecto</th><th>Período</th><th>Docentes</th><th>Estudiantes</th><th>Aulas</th><th>Capacidad/aula</th><th>Capacidad total</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td>{nucleos.find(n=>n.id===c.nucleo_id)?.nombre||'—'}</td><td>{c.programa}</td><td>{c.trayecto||'—'}</td><td>{c.periodo}</td><td>{c.cantidad_docentes}</td><td>{c.cantidad_estudiantes}</td><td>{c.cantidad_aulas ?? 0}</td><td>{c.capacidad_por_aula ?? 0}</td><td>{Number(c.cantidad_aulas || 0) * Number(c.capacidad_por_aula || 0)}</td></tr>)}</tbody></table></div></article>
        </section>
      })()}
      {activeTab === 'registro' && <>

      <section className="stats">
        <div className="stat"><span>Núcleos</span><strong>{nucleos.length}</strong></div>
        <div className="stat"><span>Extensiones activas</span><strong>{extensiones.filter(e => e.activa).length}</strong></div>
        <div className="stat"><span>Registros de capacidad</span><strong>{capacidades.length}</strong></div>
      </section>
      <section className="panel">
        <div className="section-title"><div><p className="eyebrow">PASO 1</p><h2>Seleccionar núcleo</h2></div><button className="secondary" onClick={loadData}>Actualizar</button></div>
        <label>Núcleo<select value={nucleoId} onChange={e => { setNucleoId(e.target.value); setError(''); setNotice('') }} required>
          {!nucleos.length && <option value="">No hay núcleos disponibles</option>}
          {nucleos.map(n => <option key={n.id} value={n.id}>{n.nombre}</option>)}
        </select></label>
      </section>
      <div className="columns">
        <section className="panel"><p className="eyebrow">PASO 2</p><h2>Extensiones</h2><p className="muted">Cada núcleo puede tener varias extensiones.</p>
          <label>¿Tiene extensiones?<select value={tieneExtensiones} onChange={e => setTieneExtensiones(e.target.value)}><option value="no">No</option><option value="si">Sí</option></select></label>
          {tieneExtensiones === 'si' && <form className="stack form-top" onSubmit={addExtension}>
            <label>Nombre de la extensión<input value={extension} onChange={e => setExtension(e.target.value)} placeholder="Ej. Extensión Centro" required /></label>
            <button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Agregar extensión'}</button>
          </form>}
          <h3>Extensiones registradas ({exts.length})</h3>
          {!exts.length ? <p className="empty">Todavía no hay extensiones para este núcleo.</p> : <ul className="records">{exts.map(e => <li key={e.id}><div><strong>{e.nombre}</strong><small className={e.activa ? 'active' : 'inactive'}>{e.activa ? 'Activa' : 'Inactiva'}</small></div><button className="link" onClick={() => toggleExtension(e)}>{e.activa ? 'Desactivar' : 'Activar'}</button></li>)}</ul>}
        </section>
        <section className="panel"><p className="eyebrow">PASO 3</p><h2>Capacidad académica</h2>
          <form className="stack" onSubmit={addCapacity}>
            <label>Sede o extensión<select value={extensionId} onChange={e => setExtensionId(e.target.value)}><option value="">Sede principal</option>{exts.filter(e => e.activa).map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
            <label>Período académico<input value={periodo} onChange={e => setPeriodo(e.target.value)} placeholder="Ej. 2026-I" required /></label>
            <label>Programa Nacional de Formación (PNF)<select value={programa} onChange={e => setPrograma(e.target.value)} required><option value="">Selecciona un PNF</option>
              <option>PNF en Investigación Penal</option>
              <option>PNF en Ciencias del Fuego y Seguridad contra Incendios</option>
              <option>PNF en Protección Civil y Administración de Desastres</option>
              <option>PNF en Servicio Penitenciario</option>
              <option>PNF en Prevención y Seguridad Ciudadana</option>
              <option>PNF en Emergencia Prehospitalaria</option>
            </select></label>
            <label>Trayecto<select value={trayecto} onChange={e => setTrayecto(e.target.value)} required><option value="I">Trayecto I</option><option value="II">Trayecto II</option><option value="III">Trayecto III</option><option value="IV">Trayecto IV</option></select></label>
            <div className="numbers"><label>Docentes<input type="number" min="0" step="1" value={docentes} onChange={e => setDocentes(e.target.value)} required /></label><label>Estudiantes<input type="number" min="0" step="1" value={estudiantes} onChange={e => setEstudiantes(e.target.value)} required /></label></div>
            <div className="numbers"><label>Cantidad de aulas para este PNF<input type="number" min="0" step="1" value={cantidadAulas} onChange={e => setCantidadAulas(e.target.value)} required /></label><label>Capacidad de cada aula (estudiantes)<input type="number" min="0" step="1" value={capacidadPorAula} onChange={e => setCapacidadPorAula(e.target.value)} required /></label></div>
            <p className="hint">Capacidad total de aulas para este PNF, sede y trayecto: <strong>{(Number(cantidadAulas || 0) * Number(capacidadPorAula || 0)).toLocaleString('es-VE')} estudiantes</strong></p>
            <label>Observaciones<textarea rows="3" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional" /></label>
            <button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar capacidad'}</button>
          </form>
        </section>
      </div>
      <section className="panel"><div className="section-title"><div><p className="eyebrow">RESUMEN</p><h2>Capacidad del núcleo</h2></div><span className="pill">{caps.length} registros</span></div>
        {!caps.length ? <p className="empty">No hay registros de capacidad para este núcleo.</p> : <div className="table-wrap"><table><thead><tr><th>Período</th><th>Sede/extensión</th><th>PNF</th><th>Trayecto</th><th>Docentes</th><th>Estudiantes</th><th>Aulas del PNF</th><th>Capacidad por aula</th><th>Capacidad total</th><th>Observaciones</th></tr></thead><tbody>{caps.map(c => <tr key={c.id}><td>{c.periodo}</td><td>{extensiones.find(e => e.id === c.extension_id)?.nombre || 'Sede principal'}</td><td>{c.programa || '—'}</td><td>{c.trayecto ? 'Trayecto ' + c.trayecto : '—'}</td><td>{c.cantidad_docentes}</td><td>{c.cantidad_estudiantes}</td><td>{c.cantidad_aulas ?? 0}</td><td>{c.capacidad_por_aula ?? 0}</td><td>{Number(c.cantidad_aulas || 0) * Number(c.capacidad_por_aula || 0)}</td><td>{c.observaciones || '—'}</td></tr>)}</tbody></table></div>}
      </section>
      </>}
      <footer>UNES · Sistema de Capacidad Académica</footer>
    </main>
  </div>
}
