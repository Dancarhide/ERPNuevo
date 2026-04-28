import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { 
    FiCalendar, FiDownload, FiCheckCircle, FiFileText, 
    FiUsers, FiDollarSign, FiPercent, FiSave, FiEye, FiArrowLeft, FiSearch, FiLayers, FiSettings, FiX 
} from 'react-icons/fi';
import './styles/Payroll.css';

const Payroll = () => {
    const [view, setView] = useState<'manage' | 'history' | 'detail'>('manage');
    const [selectedLote, setSelectedLote] = useState<any>(null);
    const [nominasLote, setNominasLote] = useState<any[]>([]);
    const [period, setPeriod] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });
    const [previa, setPrevia] = useState<any[]>([]);
    const [lotes, setLotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Config states
    const [showSettings, setShowSettings] = useState(false);
    const [companyName, setCompanyName] = useState('STARTIA');
    const [savingConfig, setSavingConfig] = useState(false);

    useEffect(() => {
        fetchConfig();
        if (view === 'history') {
            fetchLotes();
        }
    }, [view]);

    const fetchConfig = async () => {
        try {
            const res = await client.get('/nominas/config/company-name');
            setCompanyName(res.data.companyName);
        } catch (error) {
            console.error('Error fetching config');
        }
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            await client.put('/nominas/config/company-name', { companyName });
            setShowSettings(false);
            alert('Configuración guardada correctamente');
        } catch (error) {
            alert('Error al guardar configuración');
        } finally {
            setSavingConfig(false);
        }
    };

    const fetchPrevia = async () => {
        setLoading(true);
        try {
            const res = await client.get('/nominas/previa');
            const data = res.data.map((emp: any) => ({
                ...emp,
                bonos: 0,
                deducciones: 0
            }));
            setPrevia(data);
        } catch (error) {
            console.error(error);
            alert('Error al obtener previa');
        } finally {
            setLoading(false);
        }
    };

    const fetchLotes = async () => {
        setLoading(true);
        try {
            const res = await client.get('/nominas/lotes');
            setLotes(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchNominasLote = async (lote: any) => {
        setLoading(true);
        try {
            const res = await client.get(`/nominas/lote/${lote.id_lote}`);
            setNominasLote(res.data);
            setSelectedLote(lote);
            setView('detail');
        } catch (error) {
            console.error(error);
            alert('Error al cargar detalle del lote');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (id: number, field: string, value: string) => {
        setPrevia(prev => prev.map(emp => {
            if (emp.idempleado === id) {
                const updated = { ...emp, [field]: Number(value) };
                updated.total_pagado = updated.sueldo_base + updated.vales_despensa + updated.bonos - updated.fondo_ahorro - updated.infonavit - updated.deducciones;
                return updated;
            }
            return emp;
        }));
    };

    const saveLote = async () => {
        if (previa.length === 0) return;
        setSaving(true);
        try {
            await client.post('/nominas/lote', {
                periodo_inicio: period.start,
                periodo_fin: period.end,
                tipo_nomina: 'Quincenal',
                nominas: previa
            });
            alert('Lote de nómina generado correctamente');
            setPrevia([]);
            setView('history');
        } catch (error) {
            console.error(error);
            alert('Error al guardar lote');
        } finally {
            setSaving(false);
        }
    };

    const downloadPDF = async (id: number) => {
        try {
            const response = await client.get(`/nominas/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Recibo_Nomina_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error: any) {
            console.error(error);
            if (error.response?.data instanceof Blob) {
                const text = await error.response.data.text();
                const json = JSON.parse(text);
                alert('Error al descargar PDF: ' + (json.details || json.error));
            } else {
                alert('Error al descargar PDF: ' + (error.response?.data?.error || 'Fallo de conexión'));
            }
        }
    };

    const stats = {
        total: previa.reduce((acc, curr) => acc + curr.total_pagado, 0),
        count: previa.length,
        avg: previa.length > 0 ? previa.reduce((acc, curr) => acc + curr.total_pagado, 0) / previa.length : 0
    };

    const filteredLotes = lotes.filter(l => 
        l.id_lote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.tipo_nomina.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="payroll-dashboard">
            <header className="dashboard-header">
                <div className="header-info">
                    <div className="company-badge">{companyName}</div>
                    <h1>Módulo de Nómina</h1>
                    <p>Cálculo, dispersión y gestión de comprobantes fiscales</p>
                </div>
                <div className="header-actions">
                    <div className="view-selector">
                        <button 
                            className={`btn-payroll ${view === 'manage' ? 'btn-payroll-primary' : 'btn-payroll-outline'}`}
                            onClick={() => { setView('manage'); setSearchTerm(''); }}
                        >
                            <FiLayers /> Nueva Nómina
                        </button>
                        <button 
                            className={`btn-payroll ${view === 'history' || view === 'detail' ? 'btn-payroll-primary' : 'btn-payroll-outline'}`}
                            onClick={() => { setView('history'); setSearchTerm(''); }}
                        >
                            <FiFileText /> Historial de Lotes
                        </button>
                    </div>
                    <button className="btn-settings" onClick={() => setShowSettings(true)} title="Configuración">
                        <FiSettings />
                    </button>
                </div>
            </header>

            {showSettings && (
                <div className="payroll-modal-overlay">
                    <div className="payroll-modal">
                        <div className="modal-header">
                            <h3>Configuración de Empresa</h3>
                            <button className="btn-close-modal" onClick={() => setShowSettings(false)}><FiX /></button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nombre de la Empresa (para recibos)</label>
                                <input 
                                    type="text" 
                                    value={companyName} 
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Ej. STARTIA MÉXICO"
                                />
                            </div>
                            <p className="modal-hint">Este nombre aparecerá en la parte superior de todos los PDFs generados.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-payroll btn-payroll-outline" onClick={() => setShowSettings(false)}>Cancelar</button>
                            <button className="btn-payroll btn-payroll-primary" onClick={handleSaveConfig} disabled={savingConfig}>
                                {savingConfig ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'manage' && (
                <div className="fade-in">
                    <div className="payroll-focus-toolbar">
                        <div className="toolbar-section">
                            <label><FiCalendar /> Periodo de Nómina</label>
                            <div className="input-group-range">
                                <input 
                                    type="date" 
                                    value={period.start} 
                                    onChange={(e) => setPeriod({...period, start: e.target.value})}
                                />
                                <span>al</span>
                                <input 
                                    type="date" 
                                    value={period.end} 
                                    onChange={(e) => setPeriod({...period, end: e.target.value})}
                                />
                            </div>
                        </div>
                        <button className="btn-payroll btn-payroll-primary btn-calc" onClick={fetchPrevia} disabled={loading}>
                            {loading ? 'Procesando...' : 'Pre-calcular Nómina'}
                        </button>
                    </div>

                    <div className="payroll-summary-grid">
                        <div className="payroll-summary-card stat-total">
                            <div className="card-info">
                                <h3>Gasto Total Estimado</h3>
                                <p>${stats.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="card-icon-wrapper"><FiDollarSign /></div>
                        </div>
                        <div className="payroll-summary-card stat-users">
                            <div className="card-info">
                                <h3>Colaboradores a Pagar</h3>
                                <p>{stats.count}</p>
                            </div>
                            <div className="card-icon-wrapper"><FiUsers /></div>
                        </div>
                        <div className="payroll-summary-card stat-avg">
                            <div className="card-info">
                                <h3>Sueldo Promedio</h3>
                                <p>${stats.avg.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div className="card-icon-wrapper"><FiPercent /></div>
                        </div>
                        <div className="payroll-summary-card stat-status">
                            <div className="card-info">
                                <h3>Estado del Lote</h3>
                                <p>{previa.length > 0 ? 'Borrador Abierto' : 'Esperando Datos'}</p>
                            </div>
                            <div className="card-icon-wrapper"><FiCheckCircle /></div>
                        </div>
                    </div>

                    <div className="payroll-table-container">
                        <table className="payroll-table">
                            <thead>
                                <tr>
                                    <th className="sticky-col">Colaborador</th>
                                    <th>Sueldo Base</th>
                                    <th>F. Ahorro (-)</th>
                                    <th>Vales (+)</th>
                                    <th>Infonavit (-)</th>
                                    <th>Bonos Extras (+)</th>
                                    <th>Deducciones (-)</th>
                                    <th className="total-header">Monto Neto</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {previa.map((emp) => (
                                    <tr key={emp.idempleado}>
                                        <td className="sticky-col">
                                            <div className="collaborator-info-pro">
                                                <div className="avatar-mini-alt">{emp.nombre.substring(0,1).toUpperCase()}</div>
                                                <div className="text-info">
                                                    <span className="name">{emp.nombre}</span>
                                                    <span className="rfc">{emp.rfc}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>${emp.sueldo_base.toLocaleString()}</td>
                                        <td className="text-danger">-${emp.fondo_ahorro.toLocaleString()}</td>
                                        <td className="text-success">+${emp.vales_despensa.toLocaleString()}</td>
                                        <td className="text-danger">-${emp.infonavit.toLocaleString()}</td>
                                        <td>
                                            <input 
                                                type="number" 
                                                className="payroll-input-modern"
                                                value={emp.bonos}
                                                onChange={(e) => handleEdit(emp.idempleado, 'bonos', e.target.value)}
                                            />
                                        </td>
                                        <td>
                                            <input 
                                                type="number" 
                                                className="payroll-input-modern"
                                                value={emp.deducciones}
                                                onChange={(e) => handleEdit(emp.idempleado, 'deducciones', e.target.value)}
                                            />
                                        </td>
                                        <td className="total-cell-pro">
                                            <span>${emp.total_pagado.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        </td>
                                        <td>
                                            <button className="btn-action-detail" title="Ver Perfil"><FiEye /> Perfil</button>
                                        </td>
                                    </tr>
                                ))}
                                {previa.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="empty-row">
                                            <div className="empty-placeholder">
                                                <FiLayers size={48} opacity={0.2} />
                                                <p>Seleccione un periodo para visualizar la proyección de nómina.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {previa.length > 0 && (
                        <div className="action-footer sticky-footer">
                            <div className="footer-info">
                                <span>Total a Dispersar: <strong>${stats.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</strong></span>
                            </div>
                            <button className="btn-payroll btn-payroll-primary" onClick={saveLote} disabled={saving}>
                                <FiSave /> {saving ? 'Dispersando...' : 'Confirmar y Generar Lote Fiscal'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {view === 'history' && (
                <div className="fade-in">
                    <div className="payroll-focus-toolbar">
                        <div className="search-box-pro">
                            <FiSearch />
                            <input 
                                type="text" 
                                placeholder="Filtrar por ID de Lote, Periodo o Tipo de Nómina..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="payroll-table-container">
                        <table className="payroll-table">
                            <thead>
                                <tr>
                                    <th>Identificador de Lote</th>
                                    <th>Fecha de Registro</th>
                                    <th>Periodo Correspondiente</th>
                                    <th>Tipo</th>
                                    <th>Monto Total</th>
                                    <th>Estatus</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredLotes.map((lote) => (
                                    <tr key={lote.id_lote}>
                                        <td><strong>{lote.id_lote}</strong></td>
                                        <td>{new Date(lote.fecha_creacion).toLocaleString()}</td>
                                        <td>{new Date(lote.periodo_inicio).toLocaleDateString()} - {new Date(lote.periodo_fin).toLocaleDateString()}</td>
                                        <td>{lote.tipo_nomina}</td>
                                        <td><strong>${Number(lote.total_lote).toLocaleString()}</strong></td>
                                        <td>
                                            <span className={`badge-status ${lote.estatus === 'Cerrado' ? 'closed' : 'open'}`}>
                                                {lote.estatus}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn-action-detail" onClick={() => fetchNominasLote(lote)}>
                                                <FiEye /> Detalle
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {view === 'detail' && selectedLote && (
                <div className="fade-in detail-view">
                    <div className="detail-navigation">
                        <button className="btn-back" onClick={() => setView('history')}>
                            <FiArrowLeft /> Regresar al listado
                        </button>
                        <div className="lote-title">
                            <h2>Detalle de Lote Fiscal</h2>
                            <span className="lote-id">{selectedLote.id_lote}</span>
                        </div>
                    </div>
                    
                    <div className="payroll-summary-grid">
                        <div className="summary-card-horizontal">
                            <div className="icon-box"><FiDollarSign /></div>
                            <div className="content">
                                <span>Total Dispersado</span>
                                <h3>${Number(selectedLote.total_lote).toLocaleString()}</h3>
                            </div>
                        </div>
                        <div className="summary-card-horizontal">
                            <div className="icon-box"><FiCalendar /></div>
                            <div className="content">
                                <span>Periodo Cubierto</span>
                                <h3>{new Date(selectedLote.periodo_inicio).toLocaleDateString()} al {new Date(selectedLote.periodo_fin).toLocaleDateString()}</h3>
                            </div>
                        </div>
                    </div>

                    <div className="payroll-table-container">
                        <table className="payroll-table">
                            <thead>
                                <tr>
                                    <th>Colaborador</th>
                                    <th>Sueldo Base</th>
                                    <th>Bonos</th>
                                    <th>Deducciones</th>
                                    <th>Neto Pagado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {nominasLote.map((n) => (
                                    <tr key={n.idnomina}>
                                        <td>
                                            <div className="collaborator-info-pro">
                                                <div className="avatar-mini-alt">{n.empleados.nombre_completo_empleado.substring(0,1)}</div>
                                                <div className="text-info">
                                                    <span className="name">{n.empleados.nombre_completo_empleado}</span>
                                                    <span className="rfc">{n.empleados.rfc}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>${Number(n.sueldo_base).toLocaleString()}</td>
                                        <td className="text-success">+${Number(n.bonos).toLocaleString()}</td>
                                        <td className="text-danger">-${Number(n.deducciones).toLocaleString()}</td>
                                        <td><strong className="text-primary">${Number(n.total_pagado).toLocaleString()}</strong></td>
                                        <td>
                                            <button className="btn-download-pro" onClick={() => downloadPDF(n.idnomina)}>
                                                <FiDownload /> PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
