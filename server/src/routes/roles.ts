import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getRoles, createRol, updateRol, deleteRol } from '../Controllers/rolesController';

const router = Router();

router.get('/', authenticateToken, getRoles);
router.post('/', authenticateToken, createRol);
router.put('/:id', authenticateToken, updateRol);
router.delete('/:id', authenticateToken, deleteRol);

export default router;
