import { Router } from 'express';
import {
    getEvaluaciones,
    createEvaluacion,
    updateEvaluacion,
    deleteEvaluacion,
    submitRespuestas,
    getResultadosEmpleado,
    getResultadosEquipo,
    getEstadoEvaluacion
} from '../Controllers/evaluacionesDesempenoController';
import { authenticateToken, authorizePermission } from '../middleware/auth';

const router = Router();

// Preguntas / configuración
router.get('/', authenticateToken, getEvaluaciones);
router.post('/', authenticateToken, authorizePermission('employees.edit'), createEvaluacion);
router.put('/:id', authenticateToken, authorizePermission('employees.edit'), updateEvaluacion);
router.delete('/:id', authenticateToken, authorizePermission('employees.edit'), deleteEvaluacion);

// Respuestas
router.post('/respuestas', authenticateToken, submitRespuestas);

// Resultados
router.get('/resultados/:idempleado', authenticateToken, getResultadosEmpleado);
router.get('/equipo/:idarea', authenticateToken, getResultadosEquipo);
router.get('/estado/:idempleado', authenticateToken, getEstadoEvaluacion);

export default router;
