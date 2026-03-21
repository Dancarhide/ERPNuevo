import { Router } from 'express';
import { getEmpleados, updateEmpleado, createEmpleado } from '../Controllers/empleadoController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getEmpleados);
router.post('/', authenticateToken, authorizeRoles('Administrador', 'Admin', 'RH', 'Recursos Humanos'), createEmpleado);
router.put('/:id', authenticateToken, authorizeRoles('Administrador', 'Admin', 'RH', 'Recursos Humanos', 'Gerente'), updateEmpleado);

export default router;

