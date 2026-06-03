import { Router } from 'express';
import { getEmpleados, createEmpleado, updateEmpleado, getEmpleadoById, deleteEmpleado, updateFotoEmpleado } from '../Controllers/empleadoController';
import { authenticateToken, authorizePermission } from '../middleware/auth';
import { uploadFoto } from '../Services/uploadService';

const router = Router();

router.get('/', authenticateToken, authorizePermission('employees.view'), getEmpleados);
router.post('/', authenticateToken, authorizePermission('employees.create'), createEmpleado);
router.get('/:id', authenticateToken, authorizePermission('employees.view'), getEmpleadoById);
router.put('/:id', authenticateToken, authorizePermission('employees.edit'), updateEmpleado);
router.put('/:id/foto', authenticateToken, authorizePermission('employees.edit'), uploadFoto.single('foto'), updateFotoEmpleado);
router.delete('/:id', authenticateToken, authorizePermission('employees.delete'), deleteEmpleado);

export default router;

