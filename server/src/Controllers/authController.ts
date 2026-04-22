import { Request, Response } from 'express';
import { verificarCredenciales } from '../models/credenciales';
import { getEmpleadoPorId } from '../models/empleados';
import jwt from 'jsonwebtoken';
// dotenv ya está cargado en server.ts — no duplicar aquí

export async function loginController(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'El correo electrónico y la contraseña son obligatorios.' });
        }

        const idEmpleado = await verificarCredenciales(email, password);

        if (idEmpleado === null) {
            // Mensaje genérico para no dar pistas a posibles atacantes
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // getEmpleadoPorId ahora incluye permissions[] del rol en una sola query
        const empleado = await getEmpleadoPorId(idEmpleado);

        if (!empleado) {
            return res.status(404).json({ error: 'Empleado asociado no encontrado.' });
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('La clave secreta para JWT no está configurada en el servidor.');
        }

        const token = jwt.sign(
            { id: empleado.id, email: empleado.email, rol: empleado.rol, idrol: empleado.idrol },
            secret,
            { expiresIn: '8h' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            // 'user' incluye permissions[] — el frontend los guarda en localStorage/sessionStorage
            // y los usa en hasPermission() sin necesitar una llamada adicional al servidor
            user: empleado
        });
    } catch (error) {
        console.error('Error en el inicio de sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}