import { Router } from 'express';
import * as puestosController from '../Controllers/puestosController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, puestosController.getPuestos);
router.post('/', authenticateToken, puestosController.createPuesto);
router.put('/:idpuesto', authenticateToken, puestosController.updatePuesto);
router.put('/cupo', authenticateToken, puestosController.updateCupo);
router.post('/sync', authenticateToken, puestosController.syncPersonalActual);
router.post('/assign', authenticateToken, puestosController.assignPerson);

export default router;
