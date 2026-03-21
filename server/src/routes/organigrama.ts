import { Router } from 'express';
import { getOrganigrama } from '../Controllers/organigramaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getOrganigrama);

export default router;
