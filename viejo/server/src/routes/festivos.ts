import { Router } from 'express';
import { getFestivos, createFestivo, deleteFestivo } from '../Controllers/festivoController';

const router = Router();

router.get('/', getFestivos);
router.post('/', createFestivo);
router.delete('/:id', deleteFestivo);

export default router;
