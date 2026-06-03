import { Router } from 'express';
import * as candidatoController from '../Controllers/candidatoController';
import { authenticateToken } from '../middleware/auth';
import { uploadCV } from '../Services/uploadService';

const router = Router();

router.get('/', authenticateToken, candidatoController.getCandidatos);
router.post('/', authenticateToken, candidatoController.createCandidato);
router.put('/:id/status', authenticateToken, candidatoController.updateCandidatoStatus);
router.post('/:id/cv', authenticateToken, uploadCV.single('cv'), candidatoController.uploadCvCandidato);
router.delete('/:id', authenticateToken, candidatoController.deleteCandidato);

export default router;

