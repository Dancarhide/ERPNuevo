import { Router } from 'express';
import { getEventos, createEvento, deleteEvento } from '../Controllers/eventosController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas las rutas de eventos requieren autenticación
router.use(authenticateToken);

router.get('/', getEventos);
router.post('/', createEvento);
router.delete('/:id', deleteEvento);

export default router;
