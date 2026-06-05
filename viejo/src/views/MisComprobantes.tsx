import React, { useState, useEffect } from 'react';
import client from '../api/client';
import { FiDownload, FiFileText, FiCalendar, FiArrowRight } from 'react-icons/fi';
import './styles/Payroll.css';

const MisComprobantes = () => {
    const [nominas, setNominas] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNominas();
    }, []);

    const fetchNominas = async () => {
        try {
            const res = await client.get('/nominas/mis-comprobantes');
            setNominas(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (id: number) => {
        try {
            const response = await client.get(`/nominas/download/${id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Mi_Recibo_Nomina.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error(error);
            alert('Error al bajar el archivo');
        }
    };

    return (
        <div className="payroll-dashboard employee-view">
            <header className="dashboard-header simple">
                <div className="header-info">
                    <h1>Mis Pagos de Nómina</h1>
                    <p>Aquí puedes ver y descargar tus recibos de dinero</p>
                </div>
            </header>

            {loading ? (
                <div className="simple-loader">
                    <div className="spinner-mini"></div>
                    <p>Buscando tus recibos...</p>
                </div>
            ) : (
                <div className="comprobantes-list-simple">
                    {nominas.length === 0 ? (
                        <div className="empty-simple">
                            <FiFileText size={60} opacity={0.3} />
                            <h3>Aún no tienes recibos</h3>
                            <p>Cuando se genere tu pago, aparecerá aquí.</p>
                        </div>
                    ) : (
                        nominas.map((n) => (
                            <div key={n.idnomina} className="comprobante-card-simple">
                                <div className="card-left">
                                    <div className="doc-icon">
                                        <FiFileText />
                                    </div>
                                    <div className="pay-info">
                                        <span className="pay-label">Pago del periodo:</span>
                                        <span className="pay-dates">
                                            {new Date(n.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })} al {new Date(n.fecha_fin).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="card-middle">
                                    <span className="amount-label">Recibiste:</span>
                                    <span className="amount-value">${Number(n.total_pagado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                                </div>

                                <div className="card-right">
                                    <button className="btn-download-simple" onClick={() => downloadPDF(n.idnomina)}>
                                        <FiDownload /> <span>DESCARGAR RECIBO</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <style>{`
                .employee-view {
                    background-color: #f8fafc;
                    max-width: 1000px;
                    margin: 0 auto;
                    padding: 2rem;
                    min-height: 80vh;
                }

                .dashboard-header.simple {
                    text-align: left;
                    border-bottom: none;
                    margin-bottom: 3rem;
                }

                .dashboard-header.simple h1 {
                    font-size: 2.2rem;
                    font-weight: 800;
                    color: #1e293b;
                }

                .dashboard-header.simple p {
                    font-size: 1.1rem;
                    color: #64748b;
                }

                .comprobantes-list-simple {
                    display: flex;
                    flex-direction: column;
                    gap: 1.2rem;
                }

                .comprobante-card-simple {
                    background: white;
                    border-radius: 16px;
                    padding: 1.25rem 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.03);
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s ease;
                }

                .comprobante-card-simple:hover {
                    transform: translateX(5px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.06);
                    border-color: #A7313A40;
                }

                .card-left {
                    display: flex;
                    align-items: center;
                    gap: 1.5rem;
                }

                .doc-icon {
                    width: 52px;
                    height: 52px;
                    background: #f1f5f9;
                    color: #475569;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                }

                .pay-info {
                    display: flex;
                    flex-direction: column;
                }

                .pay-label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                }

                .pay-dates {
                    font-size: 1.1rem;
                    font-weight: 800;
                    color: #1e293b;
                }

                .card-middle {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-end;
                }

                .amount-label {
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: #94a3b8;
                    text-transform: uppercase;
                }

                .amount-value {
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: #A7313A;
                }

                .btn-download-simple {
                    background: #A7313A;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 10px;
                    font-weight: 700;
                    font-size: 0.85rem;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    box-shadow: 0 4px 10px rgba(167, 49, 58, 0.15);
                }

                .btn-download-simple:hover {
                    background: #8e2a31;
                    transform: translateY(-2px);
                    box-shadow: 0 6px 15px rgba(167, 49, 58, 0.25);
                }

                .empty-simple {
                    background: white;
                    border-radius: 24px;
                    padding: 5rem 2rem;
                    text-align: center;
                    border: 2px dashed #e2e8f0;
                }

                .empty-simple h3 {
                    margin-top: 1.5rem;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: #475569;
                }

                .empty-simple p {
                    color: #94a3b8;
                    font-size: 1rem;
                }
            `}</style>
        </div>
    );
};

export default MisComprobantes;
