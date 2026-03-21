import { Router } from 'express';
import { getCyiProgress, updateCyiProgress } from '../Controllers/cyiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getCyiProgress);
router.post('/update', authenticateToken, updateCyiProgress);

export default router;
