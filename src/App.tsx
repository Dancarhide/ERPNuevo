import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Home from './views/Home';
import Login from './views/Login';
import HRSetup from './views/HRSetup';
import Payroll from './views/Payroll';
import MisComprobantes from './views/MisComprobantes';
import MainLayout from './components/layout/MainLayout';
import Employees from './views/Employees';
import Vacations from './views/Vacations';
import Profile from './views/Profile';
import OrganizationChart from './views/OrganizationChart';
import AboutUs from './views/AboutUs';

import CyI from './views/CyI';
import Vacantes from './views/Vacantes';
import GestionTalento from './views/GestionTalento';
import Roles from './views/Roles';
import Incidencias from './views/Incidencias';
import HRInventory from './views/HRInventory';
import ClimateSurvey from './views/ClimateSurvey';
import SurveyAdmin from './views/SurveyAdmin';
import EventAdmin from './views/EventAdmin';
import AdminConfig from './views/AdminConfig';
import KPIs from './views/KPIs';
import { SysConfigProvider } from './contexts/SysConfigContext';

// Constantes de roles del sistema — centralizar para evitar strings hardcodeados dispersos
export const ROLES = {
    ADMIN: 'Admin',
    RH: 'RH',
    CONTADOR: 'Contador',
    DIRECTIVO: 'Directivo',
    JEFE_AREA: 'Jefe de Area',
} as const;

export type RoleName = typeof ROLES[keyof typeof ROLES];

// Wrapper to check permissions exactly when the route mounts
const ProtectedRoute = ({ requiredPermission = 'ALL' }: { requiredPermission?: string }) => {
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const isAuthenticated = !!userData;
    
    if (!isAuthenticated) return <Navigate to="/" replace />;
    if (requiredPermission === 'ALL') return <Outlet />;
    
    // Admins bypass everything
    if (userData?.rol === 'Admin' || userData?.rol === 'Administrador del Sistema') return <Outlet />;
    
    // El objeto userData ya contiene el array de permissions[]
    const userPermissions: string[] = userData?.permissions || [];
    const isAllowed = userPermissions.includes(requiredPermission);
    
    if (!isAllowed) {
        console.warn(`Acceso denegado: Se requiere permiso [${requiredPermission}]`);
        return <Navigate to="/home" replace />;
    }
    
    return <Outlet />;
};

const PublicRoute = () => {
    const isAuthenticated = !!(localStorage.getItem('user') || sessionStorage.getItem('user'));
    return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};

function App() {
    return (
        <SysConfigProvider>
        <Router>
            <Routes>
                {/* Public Route (Login Page) */}
                <Route element={<PublicRoute />}>
                    <Route path="/" element={<Login />} />
                </Route>
                
                {/* Protected Routes (Dashboard & Others) */}
                <Route element={<ProtectedRoute />}>
                    <Route element={<MainLayout />}>
                        <Route path="/home" element={<Home />} />
                        <Route element={<ProtectedRoute requiredPermission="employees.view" />}>
                            <Route path="/empleados" element={<Employees />} />
                        </Route>
                        <Route element={<ProtectedRoute requiredPermission="areas.manage" />}>
                            <Route path="/hr-config" element={<HRSetup />} />
                        </Route>

                        <Route element={<ProtectedRoute requiredPermission="vacations.view" />}>
                            <Route path="/vacaciones" element={<Vacations />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute requiredPermission="orgchart.view" />}>
                            <Route path="/organigrama" element={<OrganizationChart />} />
                        </Route>

                        <Route path="/quienes-somos" element={<AboutUs />} />
                        <Route path="/mi-perfil" element={<Profile />} />

                        <Route element={<ProtectedRoute requiredPermission="recruitment.manage" />}>
                            <Route path="/cyi" element={<CyI />} />
                            <Route path="/vacantes" element={<Vacantes />} />
                            <Route path="/estructura" element={<GestionTalento />} />
                        </Route>

                        {/* Roles — solo Admin */}
                        <Route element={<ProtectedRoute requiredPermission="roles.manage" />}>
                            <Route path="/roles" element={<Roles />} />
                        </Route>

                        {/* Incidencias */}
                        <Route element={<ProtectedRoute requiredPermission="incidents.view" />}>
                            <Route path="/incidencias" element={<Incidencias />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute requiredPermission="inventory.view" />}>
                            <Route path="/hr-inventory" element={<HRInventory />} />
                        </Route>
                        
                        <Route element={<ProtectedRoute requiredPermission="clima.view" />}>
                            <Route path="/clima-laboral" element={<ClimateSurvey />} />
                        </Route>

                        <Route element={<ProtectedRoute requiredPermission="surveys.manage" />}>
                            <Route path="/admin-encuestas" element={<SurveyAdmin />} />
                            <Route path="/admin-eventos" element={<EventAdmin />} />
                        </Route>

                        <Route element={<ProtectedRoute requiredPermission="admin.config" />}>
                            <Route path="/admin-config" element={<AdminConfig />} />
                        </Route>

                        {/* KPIs & Reportes */}
                        <Route element={<ProtectedRoute requiredPermission="kpis.view" />}>
                            <Route path="/reports" element={<KPIs />} />
                        </Route>

                        <Route element={<ProtectedRoute requiredPermission="payroll.view" />}>
                            <Route path="/payroll" element={<Payroll />} />
                        </Route>

                        <Route path="/mis-comprobantes" element={<MisComprobantes />} />
                    </Route>
                </Route>
                
                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
        </SysConfigProvider>
    );
}

export default App;
