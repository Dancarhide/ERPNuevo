import { Router } from 'express';
import { getEmpleadosParaNomina, crearNominasBulk, misNominas, obtenerHistorialNominas, getLotesNominas } from '../Controllers/nominaController';
import { timbrarNomina, timbrarNominasBulk, timbrarLote } from '../Controllers/nominaTimbradoController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Endpoint para el área de Contabilidad/Admin para obtener todos los empleados
router.get('/empleados', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), getEmpleadosParaNomina);

// Endpoint para obtener todo el historial de nóminas para reportes
router.get('/historial', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), obtenerHistorialNominas);

// Endpoint para obtener los lotes generados
router.get('/lotes', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), getLotesNominas);

// Endpoint para crear nóminas masivamente
router.post('/bulk', authenticateToken, authorizeRoles('Admin', 'RH', 'RRHH', 'Contador', 'Contabilidad'), crearNominasBulk);

// Endpoint para que cualquier empleado vea sus propias nóminas
router.get('/mis-nominas', authenticateToken, misNominas);

// Endpoints de Timbrado (SAT)
router.post('/:idnomina/timbrar', authenticateToken, authorizeRoles('Admin', 'RH', 'Contador'), timbrarNomina);
router.post('/timbrar-bulk', authenticateToken, authorizeRoles('Admin', 'RH', 'Contador'), timbrarNominasBulk);
router.post('/lote/:loteId/timbrar', authenticateToken, authorizeRoles('Admin', 'RH', 'Contador'), timbrarLote);

export default router;
