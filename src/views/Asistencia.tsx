import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiSave, FiUsers, FiRefreshCw } from 'react-icons/fi';
import client from '../api/client';
import './styles/Asistencia.css';

interface Empleado {
    idempleado: number;
    nombre_completo_empleado: string;
    idarea: number | null;
    areas_empleados_idareaToareas?: { nombre_area: string } | null;
}

interface Registro {
    idasistencia?: number;
    idempleado: number;
    fecha: string;
    tipo: 'Normal' | 'Falta' | 'Retardo' | 'HomeOffice';
    hora_entrada?: string;
    hora_salida?: string;
    empleados?: Empleado;
}

interface Area {
    idarea: number;
    nombre_area: string | null;
}

type TipoAsistencia = 'Normal' | 'Falta' | 'Retardo' | 'HomeOffice';

const TIPOS: TipoAsistencia[] = ['Normal', 'Falta', 'Retardo', 'HomeOffice'];
const TIPO_LABELS: Record<TipoAsistencia, string> = {
    Normal: 'Presente',
    Falta: 'Falta',
    Retardo: 'Retardo',
    HomeOffice: 'Home Office'
};
const TIPO_ABBR: Record<TipoAsistencia, string> = {
    Normal: 'P',
    Falta: 'F',
    Retardo: 'R',
    HomeOffice: 'HO'
};

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const Asistencia: React.FC = () => {
    const hoy = new Date();
    const [mes, setMes] = useState(hoy.getMonth() + 1);
    const [year, setYear] = useState(hoy.getFullYear());
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [idareaFilter, setIdareaFilter] = useState<number | ''>('');
    const [registros, setRegistros] = useState<Record<string, Record<number, TipoAsistencia>>>({});
    // key: "YYYY-MM-DD", value: { idempleado: TipoAsistencia }
    const [cambiosPendientes, setCambiosPendientes] = useState<Record<string, { idempleado: number; fecha: string; tipo: TipoAsistencia }>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null); // "fecha-idempleado"
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Días del mes
    const diasDelMes = new Date(year, mes, 0).getDate();
    const dias = Array.from({ length: diasDelMes }, (_, i) => i + 1);

    const esFinDeSemana = (dia: number) => {
        const dow = new Date(year, mes - 1, dia).getDay();
        return dow === 0 || dow === 6;
    };

    const showToast = (msg: string, type: 'success' | 'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar empleados
    const fetchEmpleados = useCallback(async () => {
        try {
            const res = await client.get('/empleados');
            const data: Empleado[] = res.data;
            setEmpleados(data.filter(e => !idareaFilter || e.idarea === idareaFilter));
        } catch { /* ignore */ }
    }, [idareaFilter]);

    // Cargar áreas
    useEffect(() => {
        client.get('/areas').then(r => setAreas(r.data)).catch(() => {});
    }, []);

    // Cargar registros del mes
    const fetchRegistros = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = { mes, year };
            if (idareaFilter) params.idarea = idareaFilter;
            const res = await client.get('/asistencia', { params });
            const data: Registro[] = res.data;

            const mapa: Record<string, Record<number, TipoAsistencia>> = {};
            for (const r of data) {
                const f = r.fecha.split('T')[0];
                if (!mapa[f]) mapa[f] = {};
                mapa[f][r.idempleado] = r.tipo;
            }
            setRegistros(mapa);
            setCambiosPendientes({});
        } catch {
            showToast('Error al cargar registros de asistencia', 'error');
        } finally {
            setLoading(false);
        }
    }, [mes, year, idareaFilter]);

    useEffect(() => {
        fetchEmpleados();
        fetchRegistros();
    }, [fetchEmpleados, fetchRegistros]);

    // Cerrar dropdown al hacer click fuera
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getFecha = (dia: number) => {
        const mm = String(mes).padStart(2, '0');
        const dd = String(dia).padStart(2, '0');
        return `${year}-${mm}-${dd}`;
    };

    const getTipo = (dia: number, idempleado: number): TipoAsistencia | null => {
        const f = getFecha(dia);
        const pendKey = `${f}-${idempleado}`;
        if (cambiosPendientes[pendKey]) return cambiosPendientes[pendKey].tipo;
        return registros[f]?.[idempleado] ?? null;
    };

    const setTipo = (dia: number, idempleado: number, tipo: TipoAsistencia | null) => {
        const f = getFecha(dia);
        const key = `${f}-${idempleado}`;
        if (tipo === null) {
            setCambiosPendientes(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        } else {
            setCambiosPendientes(prev => ({
                ...prev,
                [key]: { idempleado, fecha: f, tipo }
            }));
        }
        setOpenDropdown(null);
    };

    const guardarCambios = async () => {
        const lista = Object.values(cambiosPendientes);
        if (lista.length === 0) return;
        setSaving(true);
        try {
            await client.post('/asistencia/bulk', { registros: lista });
            showToast(`${lista.length} registro(s) guardado(s) correctamente`, 'success');
            fetchRegistros();
        } catch {
            showToast('Error al guardar cambios', 'error');
        } finally {
            setSaving(false);
        }
    };

    const navMes = (delta: number) => {
        let m = mes + delta;
        let y = year;
        if (m < 1) { m = 12; y--; }
        if (m > 12) { m = 1; y++; }
        setMes(m);
        setYear(y);
    };

    // KPIs
    const kpis = empleados.reduce((acc, emp) => {
        dias.forEach(dia => {
            if (esFinDeSemana(dia)) return;
            const tipo = getTipo(dia, emp.idempleado);
            if (!tipo) { acc.sinRegistro++; return; }
            acc[tipo] = (acc[tipo] || 0) + 1;
        });
        return acc;
    }, { Normal: 0, Falta: 0, Retardo: 0, HomeOffice: 0, sinRegistro: 0 } as Record<string, number>);

    const totalCambios = Object.keys(cambiosPendientes).length;

    // Resumen por empleado (días presentes en el mes)
    const contarPresentes = (idempleado: number) =>
        dias.filter(d => !esFinDeSemana(d) && (getTipo(d, idempleado) === 'Normal' || getTipo(d, idempleado) === 'HomeOffice')).length;

    return (
        <div className="asistencia-container">
            {/* Header */}
            <div className="asistencia-header">
                <h1><FiCalendar /> Control de Asistencia</h1>
                <button
                    className="btn-guardar-cambios"
                    onClick={guardarCambios}
                    disabled={totalCambios === 0 || saving}
                    id="btn-guardar-asistencia"
                >
                    <FiSave />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                    {totalCambios > 0 && <span className="cambios-badge">{totalCambios}</span>}
                </button>
            </div>

            {/* KPI Cards */}
            <div className="asistencia-kpis">
                <div className="kpi-card presente">
                    <span className="kpi-label">Presentes</span>
                    <span className="kpi-value">{kpis.Normal}</span>
                </div>
                <div className="kpi-card homeoffice">
                    <span className="kpi-label">Home Office</span>
                    <span className="kpi-value">{kpis.HomeOffice}</span>
                </div>
                <div className="kpi-card retardo">
                    <span className="kpi-label">Retardos</span>
                    <span className="kpi-value">{kpis.Retardo}</span>
                </div>
                <div className="kpi-card falta">
                    <span className="kpi-label">Faltas</span>
                    <span className="kpi-value">{kpis.Falta}</span>
                </div>
                <div className="kpi-card sin-registro">
                    <span className="kpi-label">Sin Registro</span>
                    <span className="kpi-value">{kpis.sinRegistro}</span>
                </div>
            </div>

            {/* Controls */}
            <div className="asistencia-controls">
                <div className="mes-nav">
                    <button onClick={() => navMes(-1)} title="Mes anterior"><FiChevronLeft /></button>
                    <span className="mes-label">{MESES[mes - 1]} {year}</span>
                    <button onClick={() => navMes(1)} title="Mes siguiente"><FiChevronRight /></button>
                </div>

                <div className="area-filter">
                    <select
                        value={idareaFilter}
                        onChange={e => setIdareaFilter(e.target.value ? parseInt(e.target.value) : '')}
                        id="select-area-asistencia"
                    >
                        <option value="">Todas las áreas</option>
                        {areas.map(a => (
                            <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>
                        ))}
                    </select>
                </div>

                <button
                    className="btn-guardar-cambios"
                    onClick={fetchRegistros}
                    style={{ background: '#334155' }}
                    disabled={loading}
                    id="btn-refresh-asistencia"
                >
                    <FiRefreshCw />
                    Actualizar
                </button>
            </div>

            {/* Leyenda */}
            <div className="asistencia-leyenda">
                <div className="leyenda-item"><div className="leyenda-dot Normal" /><span>Presente (P)</span></div>
                <div className="leyenda-item"><div className="leyenda-dot HomeOffice" /><span>Home Office (HO)</span></div>
                <div className="leyenda-item"><div className="leyenda-dot Retardo" /><span>Retardo (R)</span></div>
                <div className="leyenda-item"><div className="leyenda-dot Falta" /><span>Falta (F)</span></div>
                <div className="leyenda-item"><div className="leyenda-dot vacio" /><span>Sin registro</span></div>
            </div>

            {/* Tabla */}
            {loading ? (
                <div className="asistencia-loading">
                    <div className="spinner-ring" />
                    <span>Cargando registros...</span>
                </div>
            ) : (
                <div className="asistencia-table-wrapper" ref={dropdownRef}>
                    <table className="asistencia-table">
                        <thead>
                            <tr>
                                <th>
                                    <FiUsers style={{ marginRight: 6 }} />
                                    Empleado
                                </th>
                                {dias.map(dia => (
                                    <th
                                        key={dia}
                                        style={{
                                            background: esFinDeSemana(dia) ? '#334155' : undefined,
                                            opacity: esFinDeSemana(dia) ? 0.6 : 1,
                                            fontSize: '0.7rem'
                                        }}
                                    >
                                        <div>{dia}</div>
                                        <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>
                                            {['D','L','M','X','J','V','S'][new Date(year, mes - 1, dia).getDay()]}
                                        </div>
                                    </th>
                                ))}
                                <th style={{ background: '#0f172a' }}>Días</th>
                            </tr>
                        </thead>
                        <tbody>
                            {empleados.length === 0 ? (
                                <tr>
                                    <td colSpan={diasDelMes + 2} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                        No hay empleados para mostrar
                                    </td>
                                </tr>
                            ) : empleados.map(emp => (
                                <tr key={emp.idempleado}>
                                    <td className="cell-nombre" title={emp.areas_empleados_idareaToareas?.nombre_area || ''}>
                                        {emp.nombre_completo_empleado.split(' ').slice(0, 2).join(' ')}
                                    </td>
                                    {dias.map(dia => {
                                        const tipo = getTipo(dia, emp.idempleado);
                                        const fds = esFinDeSemana(dia);
                                        const dropKey = `${getFecha(dia)}-${emp.idempleado}`;
                                        return (
                                            <td key={dia} className="cell-dia">
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <button
                                                        className={`tipo-chip ${tipo ?? 'vacio'}${fds ? ' weekend' : ''}`}
                                                        onClick={() => {
                                                            if (fds) return;
                                                            setOpenDropdown(openDropdown === dropKey ? null : dropKey);
                                                        }}
                                                        title={tipo ? TIPO_LABELS[tipo] : 'Sin registro'}
                                                        id={`chip-${emp.idempleado}-${dia}`}
                                                    >
                                                        {fds ? '—' : (tipo ? TIPO_ABBR[tipo] : '·')}
                                                    </button>

                                                    {openDropdown === dropKey && (
                                                        <div className="tipo-dropdown">
                                                            {TIPOS.map(t => (
                                                                <button
                                                                    key={t}
                                                                    className={`opt-${t}`}
                                                                    onClick={() => setTipo(dia, emp.idempleado, t)}
                                                                >
                                                                    <span className="leyenda-dot" style={{
                                                                        width: 8, height: 8, borderRadius: '50%',
                                                                        display: 'inline-block',
                                                                        background: t === 'Normal' ? '#22c55e' : t === 'Falta' ? '#ef4444' : t === 'Retardo' ? '#f59e0b' : '#6366f1'
                                                                    }} />
                                                                    {TIPO_LABELS[t]}
                                                                </button>
                                                            ))}
                                                            {tipo && (
                                                                <button className="opt-limpiar" onClick={() => setTipo(dia, emp.idempleado, null)}>
                                                                    ✕ Borrar
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="col-fin">
                                        {contarPresentes(emp.idempleado)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`toast-asistencia ${toast.type}`}>
                    {toast.type === 'success' ? '✓' : '✗'} {toast.msg}
                </div>
            )}
        </div>
    );
};

export default Asistencia;
