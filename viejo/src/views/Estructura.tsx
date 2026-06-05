import React, { useState, useEffect } from 'react';
import { 
    FaTerminal, FaExclamationTriangle, FaSync, 
    FaBuilding, FaPlus, FaEdit, FaUserTie, FaSearch, FaRocket
} from 'react-icons/fa';
import client from '../api/client';
import './styles/Estructura.css';

interface Puesto {
    idpuesto: number;
    nombre_puesto: string;
    descripcion: string | null;
    cupo_maximo: number;
    personal_actual: number;
    idarea: number | null;
    areas?: { nombre_area: string };
}

const Estructura: React.FC = () => {
    const [puestos, setPuestos] = useState<Puesto[]>([]);
    const [areas, setAreas] = useState<any[]>([]);
    const [command, setCommand] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [auditResults, setAuditResults] = useState({ deficitTotal: 0 });
    const [pendingAction, setPendingAction] = useState<{ type: string, data: any } | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingPuesto, setEditingPuesto] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [puestosRes, areasRes] = await Promise.all([
                client.get('/puestos'),
                client.get('/areas')
            ]);
            setPuestos(puestosRes.data);
            setAreas(areasRes.data);
            
            const deficit = puestosRes.data.reduce((acc: number, p: Puesto) => {
                return acc + Math.max(0, p.cupo_maximo - p.personal_actual);
            }, 0);
            setAuditResults({ deficitTotal: deficit });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCommand = async (e: React.FormEvent) => {
        e.preventDefault();
        const cmd = command.trim().toUpperCase();
        setPendingAction(null); 
        
        try {
            if (cmd.startsWith('CREAR_PUESTO:')) {
                const parts = cmd.replace('CREAR_PUESTO:', '').split(',');
                const nombre = parts[0].trim();
                const cupo = parts[1]?.includes('CUPO:') ? parseInt(parts[1].replace('CUPO:', '').trim()) : 5;
                await client.post('/puestos', { nombre_puesto: nombre, cupo_maximo: cupo });
                alert(`IMPACTO: Nuevo puesto estratégico "${nombre}" creado con cupo de ${cupo}.`);
            } else if (cmd.startsWith('GESTIONAR_CUPO:')) {
                const parts = cmd.replace('GESTIONAR_CUPO:', '').split(',');
                const nombre = parts[0].trim();
                const cupoStr = parts[1]?.replace('CUPO:', '').trim();
                const newCupo = parseInt(cupoStr);
                
                const p = puestos.find((x: Puesto) => x.nombre_puesto.toUpperCase() === nombre);
                if (p) {
                    if (newCupo > p.personal_actual) {
                        setPendingAction({
                            type: 'GAP_DECISION',
                            data: { p, newCupo, diff: newCupo - p.personal_actual }
                        });
                    } else {
                        await client.put('/puestos/cupo', { idpuesto: p.idpuesto, cupo_maximo: newCupo });
                        alert(`Cupo de "${nombre}" ajustado a ${newCupo}.`);
                    }
                }
            } else if (cmd === 'SYNC') {
                await client.post('/puestos/sync');
                alert('Sincronización de personal completada en tiempo real.');
            }
            setCommand('');
            fetchData();
        } catch (err) {
            alert('Error al ejecutar comando');
        }
    };

    const handleActivateCyI = async (puesto: Puesto) => {
        const diff = puesto.cupo_maximo - puesto.personal_actual;
        if (diff <= 0) {
            alert('El puesto ya tiene cobertura total. No es necesario activar C y I.');
            return;
        }

        try {
            await client.post('/vacantes', {
                titulo: `Reclutamiento: ${puesto.nombre_puesto}`,
                cantidad_solicitada: diff,
                idpuesto: puesto.idpuesto,
                idarea: puesto.idarea,
                descripcion: `Proceso activado desde Estructura Organizativa para cubrir déficit de ${diff} personas.`
            });
            alert(`FLUJO INICIADO: Se ha creado una vacante para ${puesto.nombre_puesto}. El equipo de C y I ya puede ver el requerimiento.`);
            fetchData();
        } catch (err) {
            alert('Error al activar el proceso de C y I');
        }
    };

    const handleSavePuesto = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPuesto.idpuesto) {
                await client.put(`/puestos/${editingPuesto.idpuesto}`, editingPuesto);
            } else {
                await client.post('/puestos', editingPuesto);
            }
            setShowEditModal(false);
            fetchData();
        } catch (err) {
            alert('Error al guardar puesto');
        }
    };

    const filteredPuestos = puestos.filter(p => 
        p.nombre_puesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.areas?.nombre_area.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="estructura-container">
            <header className="estructura-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div>
                        <h1>Command Center: Gestión de Talento</h1>
                        <p>Arquitectura organizacional y control de capacidad operativa.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <div className="search-pill">
                            <FaSearch />
                            <input 
                                type="text" 
                                placeholder="Buscar puesto..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button className="btn-primary-fused" onClick={() => { setEditingPuesto({ nombre_puesto: '', cupo_maximo: 1, idarea: '' }); setShowEditModal(true); }}>
                            <FaPlus /> Nuevo Puesto
                        </button>
                    </div>
                </div>
            </header>

            <section className="audit-kpi-bar">
                <div className="kpi-item">
                    <span className="kpi-label">Puestos Totales</span>
                    <span className="kpi-value">{puestos.length}</span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Déficit Operativo</span>
                    <span className={`kpi-value ${auditResults.deficitTotal > 0 ? 'danger' : 'success'}`}>
                        {auditResults.deficitTotal} vacantes
                    </span>
                </div>
                <div className="kpi-item">
                    <span className="kpi-label">Estado de Staff</span>
                    <span className="kpi-value">{((puestos.reduce((a,b)=>a+b.personal_actual,0) / puestos.reduce((a,b)=>a+b.cupo_maximo,0)) * 100).toFixed(1)}%</span>
                </div>
            </section>

            <section className="architect-console">
                <div className="console-header">
                    <FaTerminal /> Architect Core v2.0 - Dynamic Sync Active
                </div>
                
                {!pendingAction ? (
                    <form onSubmit={handleCommand} className="console-input-wrapper">
                        <input 
                            type="text" 
                            className="console-input"
                            placeholder="Comando (ej: GESTIONAR_CUPO: Carpintero, Cupo: 12)"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                        />
                        <button type="submit" className="console-btn">EJECUTAR</button>
                    </form>
                ) : (
                    <div className="console-decision-box">
                        <p>
                            <FaExclamationTriangle style={{ color: '#ed8936', marginRight: '10px' }} />
                            Auditoría: Hay {pendingAction.data.diff} vacantes potenciales. ¿Desea activar el flujo de C y I?
                        </p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button className="console-btn-success" onClick={() => { handleActivateCyI(pendingAction.data.p); setPendingAction(null); }}>Activar C y I</button>
                            <button className="console-btn-gray" onClick={() => { client.put('/puestos/cupo', { idpuesto: pendingAction.data.p.idpuesto, cupo_maximo: pendingAction.data.p.personal_actual }); setPendingAction(null); fetchData(); }}>Ajustar Cupo</button>
                            <button className="console-btn-outline" onClick={() => setPendingAction(null)}>Ignorar</button>
                        </div>
                    </div>
                )}
            </section>

            {loading ? (
                <div className="fused-loader">
                    <FaSync className="spin" />
                    <p>Sincronizando flujos de talento...</p>
                </div>
            ) : (
                <div className="audit-grid">
                    {filteredPuestos.map((p: Puesto) => {
                        const progress = (p.personal_actual / p.cupo_maximo) * 100;
                        const isDeficit = p.personal_actual < p.cupo_maximo;
                        
                        return (
                            <div key={p.idpuesto} className={`puesto-card-fused ${isDeficit ? 'deficit' : ''}`}>
                                <div className="card-top">
                                    <div className="puesto-info">
                                        <h3 className="puesto-name">{p.nombre_puesto}</h3>
                                        <span className="puesto-area"><FaBuilding /> {p.areas?.nombre_area || 'General'}</span>
                                    </div>
                                    <button className="edit-icon-btn" onClick={() => { setEditingPuesto(p); setShowEditModal(true); }}>
                                        <FaEdit />
                                    </button>
                                </div>

                                <div className="capacity-flow">
                                    <div className="cap-numbers">
                                        <span className="current">{p.personal_actual}</span>
                                        <span className="divider">/</span>
                                        <span className="max">{p.cupo_maximo}</span>
                                    </div>
                                    <div className="cap-bar-bg">
                                        <div 
                                            className={`cap-bar-fill ${progress < 50 ? 'danger' : progress < 100 ? 'warning' : 'success'}`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="puesto-footer">
                                    {isDeficit ? (
                                        <button className="btn-activate-cyi" onClick={() => handleActivateCyI(p)}>
                                            <FaRocket /> Activar C y I
                                        </button>
                                    ) : (
                                        <span className="status-ok"><FaUserTie /> Staff Completo</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay-fused">
                    <div className="modal-content-fused">
                        <div className="modal-header">
                            <h3>{editingPuesto.idpuesto ? 'Editar Puesto' : 'Nuevo Puesto Estratégico'}</h3>
                            <button className="close-btn" onClick={() => setShowEditModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSavePuesto}>
                            <div className="form-group">
                                <label>Nombre del Puesto</label>
                                <input 
                                    type="text" 
                                    value={editingPuesto.nombre_puesto}
                                    onChange={e => setEditingPuesto({...editingPuesto, nombre_puesto: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Área Organizativa</label>
                                <select 
                                    value={editingPuesto.idarea || ''}
                                    onChange={e => setEditingPuesto({...editingPuesto, idarea: e.target.value})}
                                >
                                    <option value="">Seleccionar área...</option>
                                    {areas.map(a => <option key={a.idarea} value={a.idarea}>{a.nombre_area}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cupo Operativo Máximo</label>
                                <input 
                                    type="number" 
                                    value={editingPuesto.cupo_maximo}
                                    onChange={e => setEditingPuesto({...editingPuesto, cupo_maximo: parseInt(e.target.value)})}
                                    min="1"
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                <button type="submit" className="btn-primary-fused">Guardar Cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Estructura;
