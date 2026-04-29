import { Router } from 'express';
import { authenticateToken, authorizePermission } from '../middleware/auth';
import { getRoles, createRol, updateRol, deleteRol, getRolePermissions, updateRolePermissions } from '../Controllers/rolesController';

const router = Router();

router.get('/', authenticateToken, getRoles);
router.post('/', authenticateToken, authorizePermission('roles.manage'), createRol);
router.put('/:id', authenticateToken, authorizePermission('roles.manage'), updateRol);
router.delete('/:id', authenticateToken, authorizePermission('roles.manage'), deleteRol);

// Gestión de permisos del rol
router.get('/:id/permissions', authenticateToken, authorizePermission('roles.manage'), getRolePermissions);
router.post('/:id/permissions', authenticateToken, authorizePermission('roles.manage'), updateRolePermissions);

export default router;
