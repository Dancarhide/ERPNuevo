import { Router } from 'express';
import { getAreas, createArea } from '../Controllers/areaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getAreas);
router.post('/', authenticateToken, createArea);

export default router;
