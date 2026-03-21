import { Router } from 'express';
import { getConceptos, createConcepto, updateConcepto, deleteConcepto } from '../Controllers/conceptosController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), getConceptos);
router.post('/', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), createConcepto);
router.put('/:id', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), updateConcepto);
router.delete('/:id', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), deleteConcepto);

export default router;
