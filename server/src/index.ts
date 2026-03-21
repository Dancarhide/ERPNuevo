import express from 'express';
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

const app = express();
dotenv.config();

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'] }));
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
app.use('/api/vacantes', vacantesRouter),
app.use('/api/areas', areasRouter);


// Otras rutas omitidas temporalmente para el ERPNuevo

export default app;
