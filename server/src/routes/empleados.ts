import { Router } from 'express';
import { getEmpleados, createEmpleado, updateEmpleado, getEmpleadoById, deleteEmpleado } from '../Controllers/empleadoController';
import { authenticateToken, authorizePermission } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, authorizePermission('employees.view'), getEmpleados);
router.post('/', authenticateToken, authorizePermission('employees.create'), createEmpleado);
router.get('/:id', authenticateToken, authorizePermission('employees.view'), getEmpleadoById);
router.put('/:id', authenticateToken, authorizePermission('employees.edit'), updateEmpleado);
router.delete('/:id', authenticateToken, authorizePermission('employees.delete'), deleteEmpleado);

export default router;

