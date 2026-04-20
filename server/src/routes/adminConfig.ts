import { Router } from 'express';
import * as adminConfigController from '../Controllers/adminConfigController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas estas rutas requieren estar autenticado
router.use(authenticateToken);

// Solo el rol 'Admin' puede gestionar la configuración global
// Nota: Más adelante podemos refinar esto si queremos que RH también toque algunos permisos
router.get('/my-permissions', adminConfigController.getMyPermissions);
router.get('/roles-permissions', adminConfigController.getRolesWithPermissions);
router.get('/permissions-list', adminConfigController.getAllPermissionsList);
router.post('/permissions', adminConfigController.updateRolePermissions);

router.get('/system', adminConfigController.getSystemConfig);
router.post('/system', adminConfigController.updateSystemConfig);

export default router;
