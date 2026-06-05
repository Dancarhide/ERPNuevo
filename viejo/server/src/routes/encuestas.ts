import { Router } from 'express';
import { 
    saveHRInventory, 
    saveClimateSurvey, 
    getClimateResults, 
    getAdminConfig, 
    updateAdminConfig, 
    getDetailedClimateStats,
    getExpedienteStats,
    getClimateResponses 
} from '../Controllers/encuestasController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Employee Self-Service (Everyone can fill their own)
router.post('/hr-inventory', authenticateToken, saveHRInventory);

// Climate Survey (Anonymous/Authenticated)
router.get('/config', authenticateToken, getAdminConfig);
router.post('/climate-survey', authenticateToken, saveClimateSurvey);

// HR/Admin Only: view results and manage status
router.get('/climate-results', authenticateToken, authorizeRoles('RH', 'Admin'), getClimateResults);
router.get('/admin/stats', authenticateToken, authorizeRoles('RH', 'Admin'), getDetailedClimateStats);
router.get('/admin/expediente-stats', authenticateToken, authorizeRoles('RH', 'Admin'), getExpedienteStats);
router.get('/admin/responses', authenticateToken, authorizeRoles('RH', 'Admin'), getClimateResponses);
router.post('/admin/toggle', authenticateToken, authorizeRoles('RH', 'Admin'), updateAdminConfig);

export default router;
