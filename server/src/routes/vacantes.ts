import { Router } from 'express';
import { getVacantes, createVacante, updateVacante } from '../Controllers/vacanteController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getVacantes);
router.post('/', authenticateToken, createVacante);
router.put('/:id', authenticateToken, updateVacante);

export default router;
