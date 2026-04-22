import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
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
// dotenv ya fue llamado en server.ts antes de importar este módulo

const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

// Seguridad: headers HTTP seguros
app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '10mb' }));

// Logging estructurado: NO imprime headers completos ni body para evitar filtrar tokens
app.use((req: Request, _res: Response, next: NextFunction) => {
    const logData: Record<string, unknown> = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
    };
    // Solo loguear el body en desarrollo y solo si no es un endpoint de auth
    if (process.env.NODE_ENV !== 'production' && !req.originalUrl.includes('/auth')) {
        logData.body = req.body;
    }
    console.log('[REQ]', JSON.stringify(logData));
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

// Health check
app.get('/api/ping', (_req: Request, res: Response) => {
    res.json({ pong: true, time: new Date().toISOString() });
});

// Servir archivos estáticos (PDFs y XMLs de nómina)
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// Manejador de rutas no encontradas (404) para la API
app.use('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `Ruta de API no encontrada: ${req.originalUrl}` });
});

// Manejador de errores centralizado — última capa de defensa
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[ERROR]', err.message, err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

export default app;
