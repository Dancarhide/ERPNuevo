import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Home from './views/Home';
import Login from './views/Login';
import Employees from './views/Employees';
import Vacations from './views/Vacations';
import Profile from './views/Profile';
import OrganizationChart from './views/OrganizationChart';
import AboutUs from './views/AboutUs';
import PayrollAdmin from './views/PayrollAdmin';
import MyPayroll from './views/MyPayroll';
import PayrollConcepts from './views/PayrollConcepts';
import PayrollHistory from './views/PayrollHistory';
import PayrollBatches from './views/PayrollBatches';
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
import MainLayout from './components/layout/MainLayout';

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
const ProtectedRoute = ({ allowedRoles = ['ALL'] }: { allowedRoles?: string[] }) => {
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    const sessionData = userDataStr ? JSON.parse(userDataStr) : null;
    const userData = sessionData?.user || sessionData;
    const isAuthenticated = !!userData;
    
    if (!isAuthenticated) return <Navigate to="/" replace />;
    
    // Check roles if they are defined
    if (allowedRoles.includes('ALL')) return <Outlet />;
    
    const userRole = userData.rol;
    const isAllowed = allowedRoles.includes(userRole);
    
    if (!isAllowed) {
        console.warn(`Acceso denegado a ruta protegida para el rol: ${userRole}`);
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
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RH]} />}>
                            <Route path="/empleados" element={<Employees />} />
                        </Route>

                        <Route path="/vacaciones" element={<Vacations />} />
                        
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RH, ROLES.DIRECTIVO, ROLES.JEFE_AREA]} />}>
                            <Route path="/organigrama" element={<OrganizationChart />} />
                        </Route>

                        <Route path="/quienes-somos" element={<AboutUs />} />
                        <Route path="/mi-perfil" element={<Profile />} />

                        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.CONTADOR]} />}>
                            <Route path="/payroll-admin" element={<PayrollAdmin />} />
                            <Route path="/payroll-concepts" element={<PayrollConcepts />} />
                            <Route path="/payroll-history" element={<PayrollHistory />} />
                            <Route path="/payroll-batches" element={<PayrollBatches />} />
                        </Route>

                        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RH]} />}>
                            <Route path="/cyi" element={<CyI />} />
                            <Route path="/vacantes" element={<Vacantes />} />
                            <Route path="/estructura" element={<GestionTalento />} />
                        </Route>
                        <Route path="/my-payroll" element={<MyPayroll />} />

                        {/* Roles — solo Admin */}
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                            <Route path="/roles" element={<Roles />} />
                        </Route>

                        {/* Incidencias — todos los usuarios autenticados */}
                        <Route path="/incidencias" element={<Incidencias />} />
                        <Route path="/hr-inventory" element={<HRInventory />} />
                        <Route path="/clima-laboral" element={<ClimateSurvey />} />
                        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.RH]} />}>
                            <Route path="/admin-encuestas" element={<SurveyAdmin />} />
                            <Route path="/admin-eventos" element={<EventAdmin />} />
                        </Route>

                        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
                            <Route path="/admin-config" element={<AdminConfig />} />
                        </Route>


                        {/* More secure routes later */}
                    </Route>
                </Route>
                
                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    );
}

export default App;
