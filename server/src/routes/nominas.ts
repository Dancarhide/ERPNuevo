import { Router } from 'express';
import { 
    getPreviaNomina, 
    crearLoteNomina, 
    getLotesNomina, 
    getNominasPorLote, 
    getMisNominas,
    descargarPDFNomina,
    getCompanyName,
    updateCompanyName
} from '../Controllers/nominaController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Rutas administrativas (RH, Admin, Contador)
router.get('/previa', authenticateToken, authorizeRoles('Admin', 'RH', 'Contador'), getPreviaNomina);
router.post('/lote', authenticateToken, authorizeRoles('Admin', 'RH', 'Contador'), crearLoteNomina);
router.get('/lotes', authenticateToken, authorizeRoles('Admin', 'RH', 'Contador'), getLotesNomina);
router.get('/lote/:loteId', authenticateToken, authorizeRoles('Admin', 'RH', 'Contador'), getNominasPorLote);
router.get('/download/:idnomina', authenticateToken, descargarPDFNomina);

// Configuración
router.get('/config/company-name', authenticateToken, getCompanyName);
router.put('/config/company-name', authenticateToken, authorizeRoles('Admin'), updateCompanyName);

// Rutas de autoservicio para empleados
router.get('/mis-comprobantes', authenticateToken, getMisNominas);

export default router;
