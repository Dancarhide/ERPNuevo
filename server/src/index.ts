import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import authRouter from './routes/auth';
import chatRouter from './routes/chat';
import tareasRouter from './routes/tareas';
import empleadosRouter from './routes/empleados';
import vacacionesRouter from './routes/vacaciones';
import organigramaRouter from './routes/organigrama';
import rolesRouter from './routes/roles';
import nominaRouter from './routes/nominaRoutes';
import conceptosRouter from './routes/conceptosRoutes';
import cyiRouter from './routes/cyi';
import vacantesRouter from './routes/vacantes';
import areasRouter from './routes/areas';
import puestosRouter from './routes/puestos';
import candidatosRouter from './routes/candidatos';
import dashboardRouter from './routes/dashboard';
import incidenciasRouter from './routes/incidencias';
import encuestasRouter from './routes/encuestas';
import notificationRouter from './routes/notificationRoutes';
import eventosRouter from './routes/eventos';
import adminConfigRouter from './routes/adminConfig';

// Fix para serialización de BigInt y Decimal (Prisma)
(BigInt.prototype as any).toJSON = function () {
    return this.toString();
};

const app = express();
dotenv.config();

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

app.use((req, _res, next) => {
    console.log(`${req.method} ${req.originalUrl}`, { headers: req.headers, body: req.body });
    next();
});

app.use('/api/auth', authRouter);
app.use('/api/chat', chatRouter);
app.use('/api/tareas', tareasRouter);
app.use('/api/empleados', empleadosRouter);
app.use('/api/vacaciones', vacacionesRouter);
app.use('/api/organigrama', organigramaRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/nominas', nominaRouter);
app.use('/api/conceptos-nomina', conceptosRouter);
app.use('/api/cyi', cyiRouter);
app.use('/api/vacantes', vacantesRouter);
app.use('/api/areas', areasRouter);
app.use('/api/puestos', puestosRouter);
app.use('/api/candidatos', candidatosRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/incidencias', incidenciasRouter);
app.use('/api/encuestas', encuestasRouter);
app.use('/api/notificaciones', notificationRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/admin/config', adminConfigRouter);

// Health check and debug
app.get('/api/ping', (req, res) => {
    console.log('PING received');
    res.json({ pong: true, time: new Date().toISOString() });
});

// Servir archivos estáticos (PDFs y XMLs de nómina)
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// Manejador de rutas no encontradas (404) para la API
app.use('/api/*', (req, res) => {
    console.warn(`404 at ${req.originalUrl}`);
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.originalUrl}` });
});


// Otras rutas omitidas temporalmente para el ERPNuevo

export default app;
