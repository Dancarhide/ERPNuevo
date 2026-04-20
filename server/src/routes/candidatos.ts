import { Router } from 'express';
import * as candidatoController from '../Controllers/candidatoController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, candidatoController.getCandidatos);
router.post('/', authenticateToken, candidatoController.createCandidato);
router.put('/:id/status', authenticateToken, candidatoController.updateCandidatoStatus);
router.delete('/:id', authenticateToken, candidatoController.deleteCandidato);

export default router;
