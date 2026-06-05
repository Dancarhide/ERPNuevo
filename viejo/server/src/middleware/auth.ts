
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
                idroles?: number[]; // Soporte para múltiples roles
                permissions?: string[]; // Slugs de permisos del usuario
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

/**
 * Middleware para autorizar por ROL (Legacy / Roles principales)
 */
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
        const userIdRoles = req.user.idroles || [];

        const isAllowed = allowedRoles.some(role => 
            role === userRole || 
            (typeof role === 'number' && role === userIdRole) ||
            (typeof role === 'number' && userIdRoles.includes(role))
        );

        if (!isAllowed) {
            console.warn(`Intento de acceso denegado para rol: ${userRole} (ID: ${userIdRole})`);
            return res.status(403).json({ message: 'No tiene permisos para realizar esta acción' });
        }

        next();
    };
};

/**
 * Middleware para autorizar por PERMISO ESPECÍFICO (Recomendado)
 * @param requiredPermission Slug del permiso (ej: 'employees.view', 'payroll.create')
 */
export const authorizePermission = (requiredPermission: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }

        // El rol Admin (ID 1) siempre tiene acceso total
        if (req.user.idrol === 1 || req.user.rol === 'Admin') {
            return next();
        }

        const userPermissions = req.user.permissions || [];

        if (!userPermissions.includes(requiredPermission)) {
            console.warn(`Intento de acceso denegado. Permiso requerido: ${requiredPermission}`);
            return res.status(403).json({ 
                message: `No tiene el permiso necesario (${requiredPermission}) para realizar esta acción.` 
            });
        }

        next();
    };
};

