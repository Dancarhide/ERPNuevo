import { Router } from 'express';
import { getEmpleadosParaNomina, crearNominasBulk, misNominas, obtenerHistorialNominas } from '../Controllers/nominaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Endpoint para el área de Contabilidad/Admin para obtener todos los empleados
router.get('/empleados', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), getEmpleadosParaNomina);

// Endpoint para obtener todo el historial de nóminas para reportes
router.get('/historial', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), obtenerHistorialNominas);

// Endpoint para crear nóminas masivamente
router.post('/bulk', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), crearNominasBulk);

// Endpoint para que cualquier empleado vea sus propias nóminas
router.get('/mis-nominas', authenticateToken, misNominas);

export default router;
