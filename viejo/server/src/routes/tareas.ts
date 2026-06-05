import { Router } from 'express';
import { getTareas, createTarea, toggleTarea, deleteTarea } from '../Controllers/tareaController';

const router = Router();

router.get('/:id', getTareas);
router.post('/', createTarea);
router.patch('/:id/toggle', toggleTarea);
router.delete('/:id', deleteTarea);

export default router;
