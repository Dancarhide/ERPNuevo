import { Router } from 'express';
import {
    getAsistencia,
    upsertAsistencia,
    bulkUpsertAsistencia,
    getResumenAsistencia,
    deleteAsistencia
} from '../Controllers/asistenciaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAsistencia);
router.post('/', authenticateToken, upsertAsistencia);
router.post('/bulk', authenticateToken, bulkUpsertAsistencia);
router.get('/resumen/:id', authenticateToken, getResumenAsistencia);
router.delete('/:id', authenticateToken, deleteAsistencia);

export default router;
