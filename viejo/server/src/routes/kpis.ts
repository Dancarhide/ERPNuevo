import { Router } from 'express';
import { getKPIs } from '../Controllers/kpisController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/kpis — Dashboard ejecutivo de KPIs y métricas HR
// Accesible para Admin, RH, Directivo, Contador (cualquier usuario autenticado con permisos de dashboard)
router.get('/', authenticateToken, getKPIs);

export default router;
