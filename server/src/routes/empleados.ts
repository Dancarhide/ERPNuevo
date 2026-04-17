import { Router } from 'express';
import { getEmpleados, createEmpleado, updateEmpleado, getEmpleadoById } from '../Controllers/empleadoController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getEmpleados);
router.post('/', authenticateToken, authorizeRoles('Administrador', 'Admin', 'RH', 'Recursos Humanos'), createEmpleado);
router.get('/:id', authenticateToken, getEmpleadoById);
router.put('/:id', authenticateToken, authorizeRoles('Administrador', 'Admin', 'RH', 'Recursos Humanos', 'Gerente'), updateEmpleado);

export default router;

