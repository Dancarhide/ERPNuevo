import { Router } from 'express';
import {
    getIncidencias,
    createIncidencia,
    updateIncidenciaStatus,
    deleteIncidencia
} from '../Controllers/incidenciaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getIncidencias);
router.post('/', authenticateToken, createIncidencia);
router.patch('/:id/status', authenticateToken, authorizeRoles('Admin', 'RH', 'Administrador', 'Recursos Humanos'), updateIncidenciaStatus);
router.delete('/:id', authenticateToken, authorizeRoles('Admin', 'Administrador'), deleteIncidencia);

export default router;
