import { Request, Response } from 'express';
import { verificarCredenciales, cambiarPasswordYMarcarComoCambiado } from '../models/credenciales';
import { getEmpleadoPorId } from '../models/empleados';
import jwt from 'jsonwebtoken';
// dotenv ya está cargado en server.ts — no duplicar aquí

export async function loginController(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'El correo electrónico y la contraseña son obligatorios.' });
        }

        const validacion = await verificarCredenciales(email, password);

        if (validacion === null) {
            // Mensaje genérico para no dar pistas a posibles atacantes
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const { idempleado, requiereCambio } = validacion;

        // getEmpleadoPorId ahora incluye permissions[] del rol en una sola query
        const empleado = await getEmpleadoPorId(idempleado);

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado asociado no encontrado.' });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('La clave secreta para JWT no está configurada en el servidor.');
        }

        const token = jwt.sign(
            { 
                id: empleado.id, 
                email: empleado.email, 
                rol: empleado.rol, 
                idrol: empleado.idrol, 
                idroles: empleado.idroles,
                permissions: empleado.permissions // <--- Crucial para el middleware
            },
            secret,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            requiresPasswordChange: requiereCambio,
            // 'user' incluye permissions[] — el frontend los guarda en localStorage/sessionStorage
            // y los usa en hasPermission() sin necesitar una llamada adicional al servidor
            user: empleado
        });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}

export async function changePasswordController(req: Request, res: Response) {
    try {
        const { newPassword } = req.body;
        // Asumiendo que req.user viene del middleware `authenticateJWT`
        const userId = (req as any).user?.id;

        if (!userId || !newPassword) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const exitoso = await cambiarPasswordYMarcarComoCambiado(userId, newPassword);

        if (exitoso) {
            res.json({ message: 'Contraseña actualizada correctamente' });
        } else {
            res.status(400).json({ error: 'No se pudo actualizar la contraseña' });
        }
    } catch (error) {
        console.error('Error cambiando la contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}