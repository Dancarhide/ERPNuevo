import { Router } from 'express';
import { bootstrapCandidateCyi, getCyiProgress, updateCyiProgress } from '../Controllers/cyiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getCyiProgress);
router.post('/update', authenticateToken, updateCyiProgress);
router.post('/bootstrap-candidato', authenticateToken, bootstrapCandidateCyi);

export default router;
