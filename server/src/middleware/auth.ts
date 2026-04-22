
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
// dotenv ya está cargado en server.ts — no duplicar aquí

// Extender la interfaz Request para incluir el usuario decodificado
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                rol: string;
                idrol?: number; // Asegurar compatibilidad
                iat?: number;
                exp?: number;
            };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // formato: "Bearer TOKEN"

    if (!token) {
        return res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.error("JWT_SECRET no está configurado en el servidor");
        return res.status(500).json({ message: 'Error de configuración del servidor' });
    }

    jwt.verify(token, secret, (err, user) => {
        if (err) {
            console.error("Error verificando token:", err.message);
            return res.status(403).json({ message: 'Token inválido o expirado' });
        }

        // Asignar el usuario decodificado a req.user
        req.user = user as any;
        next();
    });
};

export const authorizeRoles = (...allowedRoles: (string | number)[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        // 'ALL' allows any authenticated user
        if (allowedRoles.includes('ALL')) {
            return next();
        }

        const userRole = req.user.rol;
        const userIdRole = req.user.idrol;

        const isAllowed = allowedRoles.some(role => 
            role === userRole || (typeof role === 'number' && role === userIdRole)
        );

        if (!isAllowed) {
            console.warn(`Intento de acceso denegado para rol: ${userRole} (ID: ${userIdRole})`);
            return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
        }

        next();
    };
};

