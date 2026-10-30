import { useEffect, useState } from 'react'
import { supabase, supabaseConfigured } from './supabaseClient'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [nucleos, setNucleos] = useState([])
  const [extensiones, setExtensiones] = useState([])
  const [capacidades, setCapacidades] = useState([])
  const [aulas, setAulas] = useState([])
  const [asignacionesAulas, setAsignacionesAulas] = useState([])
  const [aspirantes, setAspirantes] = useState([])
  const [busquedaAspirante, setBusquedaAspirante] = useState('')
  const [filtroAspirantePnf, setFiltroAspirantePnf] = useState('todos')
  const [aulaNombre, setAulaNombre] = useState('')
  const [aulaCapacidad, setAulaCapacidad] = useState('')
  const [aulaExtensionId, setAulaExtensionId] = useState('')
  const [aulaObservaciones, setAulaObservaciones] = useState('')
  const [asignacionAulaId, setAsignacionAulaId] = useState('')
  const [asignacionCapacidadId, setAsignacionCapacidadId] = useState('')
  const [asignacionTurno, setAsignacionTurno] = useState('Mañana')
  const [asignacionHoraInicio, setAsignacionHoraInicio] = useState('')
  const [asignacionHoraFin, setAsignacionHoraFin] = useState('')
  const [asignacionDias, setAsignacionDias] = useState('')
  const [asignacionSeccion, setAsignacionSeccion] = useState('')
  const [asignacionEstudiantes, setAsignacionEstudiantes] = useState('0')
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
    const [n, e, c, a, aa, ad] = await Promise.all([
      supabase.from('nucleos').select('id,nombre,activo,estado').order('nombre'),
      supabase.from('extensiones').select('id,nucleo_id,nombre,activa').order('nombre'),
      supabase.from('capacidad_academica').select('id,nucleo_id,extension_id,periodo,programa,trayecto,cantidad_docentes,cantidad_estudiantes,cantidad_aulas,capacidad_por_aula,observaciones,creado_en').order('creado_en', { ascending: false }),
      supabase.from('aulas').select('id,nucleo_id,extension_id,nombre,capacidad_puestos,observaciones,activa').order('nombre'),
      supabase.from('asignaciones_aulas').select('id,nucleo_id,aula_id,capacidad_academica_id,turno,hora_inicio,hora_fin,dias,seccion,estudiantes_asignados').order('creado_en', { ascending: false }),
      supabase.from('aspirantes_admision').select('id,nucleo_id,extension_id,nucleo_origen_pdf,apellidos,nombres,cedula,genero,pnf,proceso,semana,prueba_medica_estado,prueba_psicologica_estado,prueba_fisica_estado,estado_general').order('apellidos')
    ])
    const problem = n.error || e.error || c.error || a.error || aa.error || (ad.error && !String(ad.error.message || '').includes('aspirantes_admision'))
    if (problem) setError(problem.message + ' Revisa las tablas y supabase/policies.sql en Supabase.')
    if (n.data) { setNucleos(n.data); if (!nucleoId && n.data.length) setNucleoId(String(n.data[0].id)) }
    if (e.data) setExtensiones(e.data)
    if (c.data) setCapacidades(c.data)
    if (a.data) setAulas(a.data)
    if (aa.data) setAsignacionesAulas(aa.data)
    if (ad.data) setAspirantes(ad.data)
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
      observaciones: observaciones.trim() || null
    })
    setSaving(false)
    if (error) setError(error.message)
    else { setPeriodo(''); setPrograma(''); setTrayecto('I'); setExtensionId(''); setDocentes('0'); setEstudiantes('0'); setObservaciones(''); setNotice('Capacidad académica guardada.'); await loadData() }
  }
  async function addAula(event) {
    event.preventDefault()
    if (!nucleoId || !aulaNombre.trim() || Number(aulaCapacidad) < 1) { setError('Indica el nombre del aula y una capacidad de puestos mayor que cero.'); return }
    setSaving(true); setError(''); setNotice('')
    const { error } = await supabase.from('aulas').insert({ nucleo_id: Number(nucleoId), extension_id: aulaExtensionId ? Number(aulaExtensionId) : null, nombre: aulaNombre.trim(), capacidad_puestos: Number(aulaCapacidad), observaciones: aulaObservaciones.trim() || null })
    setSaving(false)
    if (error) setError(error.message)
    else { setAulaNombre(''); setAulaCapacidad(''); setAulaObservaciones(''); setNotice('Aula incorporada al inventario físico.'); await loadData() }
  }
  async function addAsignacionAula(event) {
    event.preventDefault()
    const selectedCapacity = capacidades.find(c => String(c.id) === String(asignacionCapacidadId))
    const selectedRoom = aulas.find(a => String(a.id) === String(asignacionAulaId))
    if (!selectedCapacity || !selectedRoom || String(selectedCapacity.nucleo_id) !== String(nucleoId) || String(selectedRoom.nucleo_id) !== String(nucleoId)) { setError('Selecciona un aula y un registro académico del núcleo actual.'); return }
    if (Number(asignacionEstudiantes) > Number(selectedRoom.capacidad_puestos)) { setError('Los estudiantes asignados superan los puestos disponibles del aula.'); return }
    setSaving(true); setError(''); setNotice('')
    const { error } = await supabase.from('asignaciones_aulas').insert({ nucleo_id: Number(nucleoId), aula_id: Number(asignacionAulaId), capacidad_academica_id: Number(asignacionCapacidadId), turno: asignacionTurno, hora_inicio: asignacionHoraInicio || null, hora_fin: asignacionHoraFin || null, dias: asignacionDias.trim() || null, seccion: asignacionSeccion.trim() || null, estudiantes_asignados: Number(asignacionEstudiantes) })
    setSaving(false)
    if (error) setError(error.message)
    else { setAsignacionHoraInicio(''); setAsignacionHoraFin(''); setAsignacionDias(''); setAsignacionSeccion(''); setAsignacionEstudiantes('0'); setNotice('Uso académico del aula registrado.'); await loadData() }
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
        caps.length ? caps.map(c => c.periodo + ' - ' + (c.programa || 'PNF sin indicar') + ' - Trayecto ' + (c.trayecto || 'sin indicar') + ' - ' + (extensiones.find(e => e.id === c.extension_id)?.nombre || 'Sede principal') + ': Docentes ' + c.cantidad_docentes + '; Estudiantes ' + c.cantidad_estudiantes + (c.observaciones ? '; ' + c.observaciones : '')).join('\n') + '\nTOTAL DEL NÚCLEO: Docentes ' + caps.reduce((sum, c) => sum + Number(c.cantidad_docentes || 0), 0) + '; Estudiantes ' + caps.reduce((sum, c) => sum + Number(c.cantidad_estudiantes || 0), 0) : 'Sin registros']
    })
    autoTable(pdf, { startY: 31, head: [['Núcleo', 'Extensiones', 'Capacidad académica']], body: rows,
      styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' }, headStyles: { fillColor: [16,45,79] },
      columnStyles: { 0: { cellWidth: 42 }, 1: { cellWidth: 55 }, 2: { cellWidth: 85 } } })
    pdf.save('reporte-capacidad-academica-unes.pdf')
  }

  function exportExcel() {
    const filtered = capacidades.filter(c =>
      (reportNucleo === 'todos' || String(c.nucleo_id) === reportNucleo) &&
      (reportPnf === 'todos' || normalizePnf(c.programa) === normalizePnf(reportPnf))
    )
    const filteredIds = new Set(filtered.map(c => String(c.id)))
    const filteredAssignments = asignacionesAulas.filter(x => filteredIds.has(String(x.capacidad_academica_id)))
    const usedRoomIds = new Set(filteredAssignments.map(x => String(x.aula_id)))
    const filteredRooms = aulas.filter(a =>
      (reportNucleo === 'todos' || String(a.nucleo_id) === reportNucleo) &&
      (reportPnf === 'todos' || usedRoomIds.has(String(a.id)))
    )
    const nucleoName = id => nucleos.find(n => String(n.id) === String(id))?.nombre || '—'
    const extensionName = id => extensiones.find(e => String(e.id) === String(id))?.nombre || 'Sede principal'
    const roomName = id => aulas.find(a => String(a.id) === String(id))?.nombre || '—'
    const sheets = [
      { name: 'Resumen', rows: [
        ['REPORTE DE CAPACIDAD ACADÉMICA UNES'],
        ['Fecha de generación', new Date().toLocaleString('es-VE')],
        ['Filtro de núcleo', reportNucleo === 'todos' ? 'Todos' : nucleoName(reportNucleo)],
        ['Filtro de PNF', reportPnf === 'todos' ? 'Todos los PNF' : reportPnf],
        [],
        ['Indicador', 'Total'],
        ['Registros académicos', filtered.length],
        ['Docentes', filtered.reduce((sum,c)=>sum+Number(c.cantidad_docentes||0),0)],
        ['Estudiantes', filtered.reduce((sum,c)=>sum+Number(c.cantidad_estudiantes||0),0)],
        ['Aulas físicas registradas', filteredRooms.length],
        ['Puestos físicos instalados', filteredRooms.filter(a=>a.activa).reduce((sum,a)=>sum+Number(a.capacidad_puestos||0),0)]
      ]},
      { name: 'Matrícula y docentes', rows: [
        ['Núcleo','Sede o extensión','Período','PNF','Trayecto','Docentes','Estudiantes','Observaciones'],
        ...filtered.map(c=>[nucleoName(c.nucleo_id),extensionName(c.extension_id),c.periodo,c.programa,c.trayecto,c.cantidad_docentes,c.cantidad_estudiantes,c.observaciones||''])
      ]},
      { name: 'Inventario de aulas', rows: [
        ['Núcleo','Sede o extensión','Aula','Capacidad (puestos)','Estado','Observaciones'],
        ...filteredRooms.map(a=>[nucleoName(a.nucleo_id),extensionName(a.extension_id),a.nombre,a.capacidad_puestos,a.activa?'Activa':'Inactiva',a.observaciones||''])
      ]},
      { name: 'Asignaciones de aulas', rows: [
        ['Núcleo','Aula','Capacidad del aula','PNF','Trayecto','Período','Turno','Hora inicio','Hora fin','Días','Sección','Estudiantes asignados'],
        ...filteredAssignments.map(x=>{
          const room=aulas.find(a=>String(a.id)===String(x.aula_id))
          const cap=capacidades.find(c=>String(c.id)===String(x.capacidad_academica_id))
          return [nucleoName(x.nucleo_id),roomName(x.aula_id),room?.capacidad_puestos??'',cap?.programa||'',cap?.trayecto||'',cap?.periodo||'',x.turno,x.hora_inicio||'',x.hora_fin||'',x.dias||'',x.seccion||'',x.estudiantes_asignados]
        })
      ]}
    ]
    const workbook = XLSX.utils.book_new()
    sheets.forEach(({name,rows})=>{
      const worksheet=XLSX.utils.aoa_to_sheet(rows)
      worksheet['!cols']=rows[0]?.map((_,i)=>({wch:Math.min(38,Math.max(14,...rows.map(row=>String(row[i]??'').length+2)))}))||[]
      XLSX.utils.book_append_sheet(workbook,worksheet,name)
    })
    XLSX.writeFile(workbook,'reporte-capacidad-academica-unes.xlsx')
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
      <div className="welcome"><div><p className="eyebrow">PANEL DE CONTROL</p><h1>Registro académico</h1><p className="muted">Administra núcleos, extensiones y capacidad académica.</p></div><div className="export-actions"><button className="primary" onClick={exportPdf}>Descargar reporte PDF</button><button className="secondary" onClick={exportExcel}>Exportar Excel</button></div></div>
      {error && <p className="alert error">{error}</p>}{notice && <p className="alert success">{notice}</p>}
      <nav className="report-tabs">
        <button className={activeTab === 'registro' ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab('registro')}>Registro académico</button>
        <button className={activeTab === 'admision' ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab('admision')}>Admisión de aspirantes</button>
        <button className={activeTab === 'reportes' ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab('reportes')}>📊 Reportes y estadísticas</button>
        <button className={activeTab === 'mapa' ? 'tab active-tab' : 'tab'} onClick={() => setActiveTab('mapa')}>🗺️ Mapa de Venezuela</button>
      </nav>
      {activeTab === 'admision' && (() => {
        const visibles = aspirantes.filter(a =>
          (isAdmin || String(a.nucleo_id) === String(nucleoId)) &&
          (filtroAspirantePnf === 'todos' || a.pnf === filtroAspirantePnf) &&
          (!busquedaAspirante || [a.apellidos,a.nombres,a.cedula,a.nucleo_origen_pdf].some(v => String(v || '').toLocaleLowerCase('es').includes(busquedaAspirante.toLocaleLowerCase('es'))))
        )
        const aprobados = visibles.filter(a => a.estado_general === 'Aprobado para ingresar').length
        const rechazados = visibles.filter(a => a.estado_general === 'No aprobado').length
        const evaluacion = visibles.length - aprobados - rechazados
        const nucleoNombre = id => nucleos.find(n => String(n.id) === String(id))?.nombre || 'Núcleo sin asignar'
        return <section className="report-section">
          <div className="report-heading"><div><p className="eyebrow">PROCESO ENERO I-2027</p><h2>Admisión de aspirantes</h2><p className="muted">Listado individual, seguimiento de pruebas y comparación de demanda con capacidad instalada.</p></div></div>
          <div className="stats-grid">
            <article className="stat-card" style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'8px',minWidth:0}}>
              <span>Aspirantes registrados</span><strong style={{display:'block',fontSize:'1.8rem',lineHeight:1.2,fontVariantNumeric:'tabular-nums'}}>{visibles.length.toLocaleString('es-VE')}</strong>
            </article>
            <article className="stat-card" style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'8px',minWidth:0}}>
              <span>Aprobados para ingresar</span><strong style={{display:'block',fontSize:'1.8rem',lineHeight:1.2,fontVariantNumeric:'tabular-nums'}}>{aprobados.toLocaleString('es-VE')}</strong>
            </article>
            <article className="stat-card" style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'8px',minWidth:0}}>
              <span>En evaluación</span><strong style={{display:'block',fontSize:'1.8rem',lineHeight:1.2,fontVariantNumeric:'tabular-nums'}}>{evaluacion.toLocaleString('es-VE')}</strong>
            </article>
            <article className="stat-card" style={{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'8px',minWidth:0}}>
              <span>No aprobados</span><strong style={{display:'block',fontSize:'1.8rem',lineHeight:1.2,fontVariantNumeric:'tabular-nums'}}>{rechazados.toLocaleString('es-VE')}</strong>
            </article>
          </div>
          <div className="filters-row">
            <label>Buscar aspirante<input value={busquedaAspirante} onChange={e=>setBusquedaAspirante(e.target.value)} placeholder="Nombre, apellido o cédula" /></label>
            <label>PNF<select value={filtroAspirantePnf} onChange={e=>setFiltroAspirantePnf(e.target.value)}><option value="todos">Todos los PNF</option>{pnfOptions.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
            {isAdmin && <label>Núcleo<select value={reportNucleo} onChange={e=>setReportNucleo(e.target.value)}><option value="todos">Todos los núcleos</option>{nucleos.map(n=><option key={n.id} value={String(n.id)}>{n.nombre}</option>)}</select></label>}
          </div>
          <p className="muted">Los resultados médicos, psicológicos y físicos se muestran solo como estados. No se guardan diagnósticos ni informes clínicos.</p>
          <div className="table-wrap"><table><thead><tr><th>Núcleo</th><th>Aspirante</th><th>Cédula</th><th>PNF</th><th>Semana</th><th>Médica</th><th>Psicológica</th><th>Física</th><th>Resultado</th></tr></thead><tbody>
            {visibles.filter(a=>reportNucleo==='todos'||String(a.nucleo_id)===reportNucleo).map(a=><tr key={a.id}><td>{nucleoNombre(a.nucleo_id)}</td><td>{a.apellidos}, {a.nombres}</td><td>{a.cedula}</td><td>{a.pnf}</td><td>{a.semana||'—'}</td><td>{a.prueba_medica_estado}</td><td>{a.prueba_psicologica_estado}</td><td>{a.prueba_fisica_estado}</td><td><strong>{a.estado_general}</strong></td></tr>)}
            {!visibles.length&&<tr><td colSpan="9">Todavía no hay aspirantes cargados. Primero ejecuta la migración de admisión en Supabase.</td></tr>}
          </tbody></table></div>
          <div className="report-heading"><div><h3>Demanda frente a capacidad</h3><p className="muted">Comparación inicial: los puestos de aulas se muestran una sola vez. La diferencia es referencial; los cupos efectivos deben validarse por turno y horario para no contar un aula varias veces.</p></div></div>
          <div className="table-wrap"><table><thead><tr><th>Núcleo</th><th>Aspirantes</th><th>Matrícula registrada</th><th>Puestos en aulas activas</th><th>Diferencia referencial</th></tr></thead><tbody>
            {nucleos.filter(n=>isAdmin||String(n.id)===String(nucleoId)).map(n=>{
              const total=aspirantes.filter(a=>String(a.nucleo_id)===String(n.id)).length
              const matricula=capacidades.filter(c=>String(c.nucleo_id)===String(n.id)).reduce((v,c)=>v+Number(c.cantidad_estudiantes||0),0)
              const puestos=aulas.filter(a=>String(a.nucleo_id)===String(n.id)&&a.activa).reduce((v,a)=>v+Number(a.capacidad_puestos||0),0)
              return <tr key={n.id}><td>{n.nombre}</td><td>{total}</td><td>{matricula}</td><td>{puestos}</td><td>{puestos?Math.max(0,puestos-matricula):'Pendiente de inventario'}</td></tr>
            })}
          </tbody></table></div>
        </section>
      })()}
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
        const filteredIds = new Set(filtered.map(c => String(c.id)))
        const filteredAssignments = asignacionesAulas.filter(x => filteredIds.has(String(x.capacidad_academica_id)))
        const uniqueRoomIds = [...new Set(filteredAssignments.map(x => String(x.aula_id)))]
        const programs = pnfOptions.filter(p => capacidades.some(c => normalizePnf(c.programa) === normalizePnf(p)))
        const byPnf = programs.map(p => {
          const pnfCapacityIds = new Set(filtered.filter(c => normalizePnf(c.programa) === normalizePnf(p)).map(c => String(c.id)))
          const roomIds = [...new Set(filteredAssignments.filter(x => pnfCapacityIds.has(String(x.capacidad_academica_id))).map(x => String(x.aula_id)))]
          return { name:p, docentes:filtered.filter(c=>normalizePnf(c.programa)===normalizePnf(p)).reduce((a,c)=>a+Number(c.cantidad_docentes||0),0), estudiantes:filtered.filter(c=>normalizePnf(c.programa)===normalizePnf(p)).reduce((a,c)=>a+Number(c.cantidad_estudiantes||0),0), aulas:roomIds.length, capacidadAulas:roomIds.reduce((sum,id)=>sum+Number(aulas.find(a=>String(a.id)===id)?.capacidad_puestos||0),0) }
        }).filter(x=>x.docentes+x.estudiantes+x.aulas>0)
        const byNucleo = nucleos.map(n=>({name:n.nombre, docentes:filtered.filter(c=>c.nucleo_id===n.id).reduce((a,c)=>a+Number(c.cantidad_docentes||0),0), estudiantes:filtered.filter(c=>c.nucleo_id===n.id).reduce((a,c)=>a+Number(c.cantidad_estudiantes||0),0)})).filter(x=>x.docentes+x.estudiantes>0).sort((a,b)=>b.estudiantes-a.estudiantes)
        const maxP = Math.max(1,...byPnf.map(x=>x.estudiantes))
        const maxN = Math.max(1,...byNucleo.map(x=>x.estudiantes))
        return <section className="reports-area">
          <div className="report-heading"><div><p className="eyebrow">ANÁLISIS INSTITUCIONAL</p><h2>Panel de reportes</h2><p className="muted">Explora la capacidad académica con filtros dinámicos.</p></div><div className="export-actions"><button className="primary" onClick={exportPdf}>Descargar PDF</button><button className="secondary" onClick={exportExcel}>Exportar Excel (.xlsx)</button></div></div>
          <div className="report-filters">
            <label>Filtrar por núcleo<select value={reportNucleo} onChange={e=>setReportNucleo(e.target.value)}><option value="todos">Todos los núcleos</option>{nucleos.map(n=><option key={n.id} value={String(n.id)}>{n.nombre}</option>)}</select></label>
            <label>Filtrar por PNF<select value={reportPnf} onChange={e=>setReportPnf(e.target.value)}><option value="todos">Todos los PNF</option>{pnfOptions.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
          </div>
          <div className="report-kpis">
            <article className="report-kpi"><span>Registros encontrados</span><strong>{filtered.length}</strong><small>Según los filtros aplicados</small></article>
            <article className="report-kpi"><span>Total de docentes</span><strong>{totalDoc.toLocaleString('es-VE')}</strong><small>Personal académico registrado</small></article>
            <article className="report-kpi"><span>Total de estudiantes</span><strong>{totalEst.toLocaleString('es-VE')}</strong><small>Matrícula registrada</small></article>
            <article className="report-kpi"><span>Total de aulas registradas</span><strong>{uniqueRoomIds.length.toLocaleString('es-VE')}</strong><small>Según los filtros aplicados</small></article>
          </div>
          <div className="report-grid">
            <article className="report-chart"><h3>Estudiantes por PNF</h3><p className="muted">Comparación de matrícula por programa</p>{byPnf.length ? byPnf.map(x=><div className="bar-row" key={x.name}><div className="bar-label"><span>{x.name.replace('PNF en ','')}</span><b>{x.estudiantes}</b></div><div className="bar-track"><div className="bar-fill" style={{width:(x.estudiantes/maxP*100)+'%'}}/></div><small>{x.docentes} docentes</small></div>) : <p className="empty">No hay datos para estos filtros.</p>}</article>
            <article className="report-chart"><h3>Aulas asignadas por PNF</h3><p className="muted">Aulas físicas vinculadas a registros académicos; un aula puede aparecer en varios PNF si se usa en turnos distintos</p>{byPnf.length ? byPnf.map(x=><div className="bar-row" key={x.name}><div className="bar-label"><span>{x.name.replace('PNF en ','')}</span><b>{x.aulas} aulas</b></div><div className="bar-track"><div className="bar-fill" style={{width:(x.aulas/Math.max(1,...byPnf.map(p=>p.aulas))*100)+'%'}}/></div><small>Capacidad total: {x.capacidadAulas.toLocaleString('es-VE')} estudiantes</small></div>) : <p className="empty">No hay datos de aulas para estos filtros.</p>}</article>
            <article className="report-chart"><h3>Estudiantes por núcleo</h3><p className="muted">Núcleos con mayor matrícula</p>{byNucleo.slice(0,10).map(x=><div className="bar-row" key={x.name}><div className="bar-label"><span>{x.name}</span><b>{x.estudiantes}</b></div><div className="bar-track"><div className="bar-fill alt-fill" style={{width:(x.estudiantes/maxN*100)+'%'}}/></div><small>{x.docentes} docentes</small></div>)}{!byNucleo.length&&<p className="empty">No hay datos para estos filtros.</p>}</article>
          </div>
          <article className="report-chart report-detail"><h3>Detalle de registros</h3><div className="table-wrap"><table><thead><tr><th>Núcleo</th><th>PNF</th><th>Trayecto</th><th>Período</th><th>Docentes</th><th>Estudiantes</th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td>{nucleos.find(n=>n.id===c.nucleo_id)?.nombre||'—'}</td><td>{c.programa}</td><td>{c.trayecto||'—'}</td><td>{c.periodo}</td><td>{c.cantidad_docentes}</td><td>{c.cantidad_estudiantes}</td></tr>)}</tbody></table></div></article>
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
            <label>Observaciones<textarea rows="3" value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional" /></label>
            <button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar capacidad'}</button>
          </form>
        </section>
      </div>
      <section className="panel"><div className="section-title"><div><p className="eyebrow">RESUMEN</p><h2>Capacidad del núcleo</h2></div><span className="pill">{caps.length} registros</span></div>
        {!caps.length ? <p className="empty">No hay registros de capacidad para este núcleo.</p> : <div className="table-wrap"><table><thead><tr><th>Período</th><th>Sede/extensión</th><th>PNF</th><th>Trayecto</th><th>Docentes</th><th>Estudiantes</th><th>Observaciones</th></tr></thead><tbody>{caps.map(c => <tr key={c.id}><td>{c.periodo}</td><td>{extensiones.find(e => e.id === c.extension_id)?.nombre || 'Sede principal'}</td><td>{c.programa || '—'}</td><td>{c.trayecto ? 'Trayecto ' + c.trayecto : '—'}</td><td>{c.cantidad_docentes}</td><td>{c.cantidad_estudiantes}</td><td>{c.observaciones || '—'}</td></tr>)}</tbody></table></div>}
      </section>
      </>}
      {activeTab === 'registro' && <section className="panel room-inventory">
        <div className="section-title"><div><p className="eyebrow">INFRAESTRUCTURA FÍSICA</p><h2>Inventario de aulas</h2><p className="muted">Cada espacio se registra una sola vez, con sus puestos reales. Puede utilizarse en distintos PNF y trayectos en horarios diferentes.</p></div><span className="pill">{aulas.filter(a => String(a.nucleo_id) === String(nucleoId)).length} aulas · {aulas.filter(a => String(a.nucleo_id) === String(nucleoId) && a.activa).reduce((sum,a) => sum + Number(a.capacidad_puestos || 0),0).toLocaleString('es-VE')} puestos</span></div>
        <form className="room-form" onSubmit={addAula}>
          <label>Sede o extensión<select value={aulaExtensionId} onChange={e=>setAulaExtensionId(e.target.value)}><option value="">Sede principal</option>{exts.map(e=><option key={e.id} value={e.id}>{e.nombre}</option>)}</select></label>
          <label>Nombre o código del aula<input value={aulaNombre} onChange={e=>setAulaNombre(e.target.value)} placeholder="Ej. Aula 01" required /></label>
          <label>Capacidad real (puestos)<input type="number" min="1" step="1" value={aulaCapacidad} onChange={e=>setAulaCapacidad(e.target.value)} required placeholder="Ej. 35" /></label>
          <label>Observaciones<input value={aulaObservaciones} onChange={e=>setAulaObservaciones(e.target.value)} placeholder="Opcional" /></label>
          <button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Agregar aula'}</button>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Aula</th><th>Sede</th><th>Puestos</th><th>Estado</th><th>Observaciones</th></tr></thead><tbody>{aulas.filter(a=>String(a.nucleo_id)===String(nucleoId)).map(a=><tr key={a.id}><td>{a.nombre}</td><td>{extensiones.find(e=>String(e.id)===String(a.extension_id))?.nombre || 'Sede principal'}</td><td>{a.capacidad_puestos}</td><td>{a.activa?'Activa':'Inactiva'}</td><td>{a.observaciones||'—'}</td></tr>)}{!aulas.some(a=>String(a.nucleo_id)===String(nucleoId))&&<tr><td colSpan="5">Aún no se han registrado aulas físicas.</td></tr>}</tbody></table></div>
        <h3>Asignar un aula a un PNF y trayecto</h3><p className="muted">La misma aula puede tener varias asignaciones en turnos distintos.</p>
        <form className="room-form" onSubmit={addAsignacionAula}>
          <label>Aula<select value={asignacionAulaId} onChange={e=>setAsignacionAulaId(e.target.value)} required><option value="">Selecciona un aula</option>{aulas.filter(a=>String(a.nucleo_id)===String(nucleoId)&&a.activa).map(a=><option key={a.id} value={a.id}>{a.nombre} · {a.capacidad_puestos} puestos</option>)}</select></label>
          <label>Registro PNF / trayecto<select value={asignacionCapacidadId} onChange={e=>setAsignacionCapacidadId(e.target.value)} required><option value="">Selecciona un registro académico</option>{caps.map(c=><option key={c.id} value={c.id}>{c.programa} · Trayecto {c.trayecto} · {c.periodo}</option>)}</select></label>
          <label>Turno<select value={asignacionTurno} onChange={e=>setAsignacionTurno(e.target.value)}><option>Mañana</option><option>Tarde</option><option>Noche</option></select></label>
          <label>Estudiantes en esta aula<input type="number" min="0" step="1" value={asignacionEstudiantes} onChange={e=>setAsignacionEstudiantes(e.target.value)} required /></label>
          <label>Hora de inicio<input type="time" value={asignacionHoraInicio} onChange={e=>setAsignacionHoraInicio(e.target.value)} /></label>
          <label>Hora de fin<input type="time" value={asignacionHoraFin} onChange={e=>setAsignacionHoraFin(e.target.value)} /></label>
          <label>Días<input value={asignacionDias} onChange={e=>setAsignacionDias(e.target.value)} placeholder="Ej. Lunes y miércoles" /></label>
          <label>Sección / grupo<input value={asignacionSeccion} onChange={e=>setAsignacionSeccion(e.target.value)} placeholder="Ej. Sección A" /></label>
          <button className="primary" disabled={saving}>{saving ? 'Guardando…' : 'Registrar uso del aula'}</button>
        </form>
        <div className="table-wrap"><table><thead><tr><th>Aula</th><th>PNF / trayecto</th><th>Período</th><th>Turno</th><th>Horario</th><th>Grupo / días</th><th>Estudiantes</th></tr></thead><tbody>{asignacionesAulas.filter(x=>String(x.nucleo_id)===String(nucleoId)).map(x=>{const a=aulas.find(v=>String(v.id)===String(x.aula_id));const c=capacidades.find(v=>String(v.id)===String(x.capacidad_academica_id));return <tr key={x.id}><td>{a?.nombre||'—'}</td><td>{c?.programa||'—'} · {c?.trayecto||'—'}</td><td>{c?.periodo||'—'}</td><td>{x.turno}</td><td>{x.hora_inicio&&x.hora_fin?x.hora_inicio+'–'+x.hora_fin:'—'}</td><td>{[x.seccion,x.dias].filter(Boolean).join(' · ')||'—'}</td><td>{x.estudiantes_asignados}</td></tr>})}{!asignacionesAulas.some(x=>String(x.nucleo_id)===String(nucleoId))&&<tr><td colSpan="7">Todavía no hay asignaciones de aulas.</td></tr>}</tbody></table></div>
      </section>}
      <footer>UNES · Sistema de Capacidad Académica</footer>
    </main>
  </div>
}
