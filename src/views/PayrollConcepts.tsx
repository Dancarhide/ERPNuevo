import React, { useState, useEffect } from 'react';
import { FaTags, FaPlus, FaEdit, FaTrash, FaCheckCircle } from 'react-icons/fa';
import './styles/Dashboard.css';

interface ConceptoNomina {
  idconcepto: number;
  clave: string;
  nombre_concepto: string;
  tipo: string;
  monto_defecto: number;
  activo: boolean;
}

const PayrollConcepts: React.FC = () => {
  const [conceptos, setConceptos] = useState<ConceptoNomina[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<ConceptoNomina>>({
    clave: '', nombre_concepto: '', tipo: 'Percepcion', monto_defecto: 0
  });
  const [isEditing, setIsEditing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const host = window.location.hostname;
  const sessionData = JSON.parse(localStorage.getItem('user') || sessionStorage.getItem('user') || '{}');
  const token = sessionData?.token;

  useEffect(() => {
    fetchConceptos();
  }, []);

  const fetchConceptos = async () => {
    try {
      const res = await fetch(`http://${host}:4000/api/conceptos-nomina`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConceptos(data);
      }
    } catch (error) {
      console.error('Error fetching conceptos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (concepto?: ConceptoNomina) => {
    if (concepto) {
      setFormData(concepto);
      setIsEditing(true);
    } else {
      setFormData({ clave: '', nombre_concepto: '', tipo: 'Percepcion', monto_defecto: 0 });
      setIsEditing(false);
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditing ? `http://${host}:4000/api/conceptos-nomina/${formData.idconcepto}` : `http://${host}:4000/api/conceptos-nomina`;
      const method = isEditing ? 'PUT' : 'POST';
      
      const payload = { ...formData, monto_defecto: parseFloat(String(formData.monto_defecto)) || 0 };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setSuccessMsg(isEditing ? 'Concepto actualizado correctamente.' : 'Concepto creado correctamente.');
        setShowModal(false);
        fetchConceptos();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        alert('Error al guardar concepto.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Eliminar este concepto? Ya no aparecerá para nuevas nóminas.')) return;
    try {
      const res = await fetch(`http://${host}:4000/api/conceptos-nomina/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccessMsg('Concepto eliminado correctamente.');
        fetchConceptos();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="dashboard-container" style={{ padding: '20px' }}>
      <div className="dashboard-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaTags style={{ color: 'var(--color-accent)' }}/> Configuración de Conceptos
          </h1>
          <p>Administra los Bonos, Deducciones, Faltas y Retardos que aplicarán en Nóminas.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          style={{
            backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', padding: '10px 15px',
            borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold'
          }}
        >
          <FaPlus /> Nuevo Concepto
        </button>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCheckCircle /> {successMsg}
        </div>
      )}

      <div className="dashboard-panel" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-bg-light)', color: 'var(--color-text-muted)' }}>
              <th style={{ padding: '12px 8px' }}>Clave</th>
              <th style={{ padding: '12px 8px' }}>Nombre del Concepto</th>
              <th style={{ padding: '12px 8px' }}>Tipo</th>
              <th style={{ padding: '12px 8px' }}>Monto por Defecto ($)</th>
              <th style={{ padding: '12px 8px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>Cargando conceptos...</td></tr>
            ) : conceptos.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>No hay conceptos registrados.</td></tr>
            ) : (
              conceptos.map(c => (
                <tr key={c.idconcepto} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 'bold', color: 'var(--color-text-muted)' }}>{c.clave}</td>
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>{c.nombre_concepto}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold',
                      backgroundColor: c.tipo === 'Percepcion' ? '#e2f5e9' : '#fceaea',
                      color: c.tipo === 'Percepcion' ? '#1f854b' : '#d9534f'
                    }}>
                      {c.tipo}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>${parseFloat(String(c.monto_defecto)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <button onClick={() => handleOpenModal(c)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginRight: '10px' }}><FaEdit size={18} /></button>
                    <button onClick={() => handleDelete(c.idconcepto)} style={{ background: 'none', border: 'none', color: '#d9534f', cursor: 'pointer' }}><FaTrash size={18} /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2>{isEditing ? 'Editar Concepto' : 'Nuevo Concepto'}</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Clave (Ej. BON-01)</label>
                <input required type="text" value={formData.clave} onChange={e => setFormData({...formData, clave: e.target.value.toUpperCase()})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Nombre (Ej. Bono Puntualidad)</label>
                <input required type="text" value={formData.nombre_concepto} onChange={e => setFormData({...formData, nombre_concepto: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Tipo</label>
                <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                  <option value="Percepcion">Percepción (Suma)</option>
                  <option value="Deduccion">Deducción (Resta)</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '5px' }}>Monto por Defecto ($)</label>
                <input required type="number" step="0.01" value={formData.monto_defecto} onChange={e => setFormData({...formData, monto_defecto: parseFloat(e.target.value)})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 15px', borderRadius: '6px', border: '1px solid #ccc', background: 'white', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" style={{ padding: '10px 15px', borderRadius: '6px', border: 'none', background: 'var(--color-accent)', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Guardar Concepto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollConcepts;
