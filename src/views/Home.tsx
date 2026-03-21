import React from 'react';
import { FaMoneyBillWave, FaUsers, FaBoxOpen, FaChartLine } from 'react-icons/fa';
import './styles/Dashboard.css';

const Home: React.FC = () => {

  // For demonstration, simulating data
  const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
  const userData = sessionData?.user || sessionData;
  const userName = userData?.nombre || 'Administrador';

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard Presidencial</h1>
        <p>Bienvenido de nuevo, {userName}. Aquí está el resumen de las operaciones de hoy.</p>
      </div>

      {/* High-level KPIs */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-info">
            <h3>Ingresos (Mes)</h3>
            <p className="stat-value">$124,500</p>
          </div>
          <div className="stat-icon"><FaMoneyBillWave /></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-info">
            <h3>Nuevos Empleados</h3>
            <p className="stat-value">12</p>
          </div>
          <div className="stat-icon"><FaUsers /></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-info">
            <h3>Alertas de Inventario</h3>
            <p className="stat-value">5</p>
          </div>
          <div className="stat-icon"><FaBoxOpen /></div>
        </div>
        
        <div className="stat-card">
          <div className="stat-info">
            <h3>Crecimiento</h3>
            <p className="stat-value">+14.2%</p>
          </div>
          <div className="stat-icon"><FaChartLine /></div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        {/* Main Chart / Activity Panel */}
        <div className="dashboard-panel">
          <h2>Métricas de Rendimiento</h2>
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)', borderRadius: '8px', backgroundColor: '#f9f9f9'}}>
             [Gráficos y Visualizaciones de datos irán aquí (Por ejemplo Recharts)]
          </div>
        </div>

        {/* Secondary Info / Logs Panel */}
        <div className="dashboard-panel">
          <h2>Actividad Reciente</h2>
          <ul className="activity-list">
            <li className="activity-item">
              <span className="activity-desc">Nuevo pedido #1034 registrado</span>
              <span className="activity-time">Hace 10 min</span>
            </li>
            <li className="activity-item">
              <span className="activity-desc">Inventario base actualizado</span>
              <span className="activity-time">Hace 1 hora</span>
            </li>
            <li className="activity-item">
              <span className="activity-desc">Reporte mensual generado</span>
              <span className="activity-time">Ayer, 18:30</span>
            </li>
            <li className="activity-item">
              <span className="activity-desc">Alerta: Nivel crítico Tinta B2</span>
              <span className="activity-time">Ayer, 14:15</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
