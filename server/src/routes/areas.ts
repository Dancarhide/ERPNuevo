import { Router } from 'express';
import { getAreas, createArea, updateArea, deleteArea } from '../Controllers/areaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/',    authenticateToken, getAreas);
router.post('/',   authenticateToken, createArea);
router.put('/:id', authenticateToken, updateArea);
router.delete('/:id', authenticateToken, deleteArea);

export default router;
