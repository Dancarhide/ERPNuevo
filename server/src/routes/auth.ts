import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { loginController } from '../Controllers/authController';

const router = Router();

// Rate limiting: máximo 10 intentos de login por IP cada 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos.' }
});

router.post('/login', loginLimiter, loginController);

export default router;
