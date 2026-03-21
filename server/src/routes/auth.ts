import { Router } from 'express';
import { loginController } from '../Controllers/authController';

const router = Router();

// La ruta POST /api/auth/login ahora es manejada por el controlador de autenticación.
router.post('/login', loginController);

export default router;
