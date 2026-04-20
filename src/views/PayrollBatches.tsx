import React, { useState, useEffect } from 'react';
import { FaLayerGroup, FaCalendarAlt, FaPaperPlane, FaSpinner, FaUsers, FaArrowLeft, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './styles/Dashboard.css';
import './styles/Payroll.css';

interface LoteNomina {
    lote_id: string;
    fecha_creacion: string;
    periodo: string;
    empleados: number;
    total_real: number;
    total_fiscal: number;
}

const PayrollBatches: React.FC = () => {
    const [lotes, setLotes] = useState<LoteNomina[]>([]);
    const [loading, setLoading] = useState(true);
    const [isTimbrando, setIsTimbrando] = useState<string | null>(null);

    const host = window.location.hostname;
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = userDataStr ? JSON.parse(userDataStr).token : '';

    useEffect(() => {
        fetchLotes();
    }, []);

    const fetchLotes = async () => {
        try {
            const res = await fetch(`http://${host}:4000/api/nominas/lotes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setLotes(await res.json());
            }
        } catch (error) {
            console.error('Error fetching lotes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTimbrarLote = async (loteId: string) => {
        if (!window.confirm(`¿Desea timbrar ante el SAT todas las nóminas del lote ${loteId}?`)) return;

        setIsTimbrando(loteId);
        try {
            const res = await fetch(`http://${host}:4000/api/nominas/lote/${loteId}/timbrar`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                alert(`Proceso completado: ${data.processed} timbradas exitosamente.`);
                fetchLotes();
            } else {
                const err = await res.json();
                alert('Error: ' + err.error);
            }
        } catch (error) {
            alert('Error de red al intentar timbrar.');
        } finally {
            setIsTimbrando(null);
        }
    };

    return (
        <div className="payroll-dashboard">
            <div className="dashboard-header" style={{ marginBottom: '30px' }}>
                <div>
                    <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '2rem', margin: '0 0 5px 0' }}>
                        <FaLayerGroup style={{ color: 'var(--payroll-accent)' }}/> Gestión por Lotes de Nómina
                    </h1>
                    <p style={{ color: '#64748b', margin: 0 }}>Historial de generación masiva y timbrado digital SAT.</p>
                    <Link to="/payroll-admin" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: 'var(--payroll-info)', fontWeight: 'bold', fontSize: '0.9rem', marginTop: '10px' }}>
                        <FaArrowLeft /> Volver a Generación de Nóminas
                    </Link>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <FaSpinner className="spin" style={{ fontSize: '2rem', color: 'var(--payroll-primary)' }} />
                    <p>Cargando lotes...</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                    {lotes.length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', backgroundColor: '#fff', borderRadius: '15px', color: '#64748b' }}>
                            <FaExclamationCircle style={{ fontSize: '3rem', marginBottom: '15px', opacity: 0.5 }} />
                            <p>No se han encontrado lotes de nómina generados con el nuevo sistema.</p>
                        </div>
                    ) : lotes.map((lote) => (
                        <div key={lote.lote_id} className="dashboard-panel" style={{ padding: '20px', position: 'relative', border: '1px solid #e2e8f0', transition: 'transform 0.2s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--payroll-info)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                        #{lote.lote_id}
                                    </div>
                                    <h3 style={{ margin: '5px 0', fontSize: '1.25rem' }}>Generado el {new Date(lote.fecha_creacion).toLocaleDateString('es-MX', { day: '2-digit', month: 'long' })}</h3>
                                </div>
                                <div style={{ backgroundColor: 'var(--payroll-primary-light)', padding: '5px 12px', borderRadius: '20px', fontSize: '0.85rem', color: 'var(--payroll-primary)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <FaUsers /> {lote.empleados} Empleados
                                </div>
                            </div>

                            <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#64748b' }}>Periodo:</span>
                                    <span style={{ fontWeight: '600' }}>{lote.periodo}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#64748b' }}>Total Real:</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--payroll-primary)' }}>${lote.total_real.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Fiscal (SAT):</span>
                                    <span style={{ fontWeight: 'bold', color: 'var(--payroll-success)' }}>${lote.total_fiscal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => handleTimbrarLote(lote.lote_id)}
                                    disabled={isTimbrando === lote.lote_id}
                                    className="btn-payroll btn-payroll-primary" 
                                    style={{ flex: 1, height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    {isTimbrando === lote.lote_id ? <FaSpinner className="spin" /> : <FaPaperPlane />}
                                    Timbrar Lote Completo
                                </button>
                                <Link to={`/payroll-history?lote=${lote.lote_id}`} className="btn-payroll btn-payroll-outline" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 15px', textDecoration: 'none' }}>
                                    Ver Detalle
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PayrollBatches;
