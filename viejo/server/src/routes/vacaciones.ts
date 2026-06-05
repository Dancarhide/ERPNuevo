import { Router } from 'express';
import { getVacaciones, createVacacion, updateVacacionStatus } from '../Controllers/vacacionController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getVacaciones);
router.post('/', authenticateToken, createVacacion);
router.patch('/:id/status', authenticateToken, authorizeRoles('Administrador', 'Admin', 'RH', 'Recursos Humanos'), updateVacacionStatus);


export default router;

