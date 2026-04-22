/**
 * Tests de integración — Auth Controller
 * Prueba el endpoint POST /api/auth/login con casos válidos e inválidos.
 * Usa mocks para no conectar a la base de datos real.
 */

import { Request, Response } from 'express';

// ---- Mocks (rutas relativas desde src/__tests__/ hacia src/) ----
jest.mock('../models/credenciales', () => ({
    verificarCredenciales: jest.fn()
}));

jest.mock('../models/empleados', () => ({
    getEmpleadoPorId: jest.fn()
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn().mockReturnValue('mock.jwt.token')
}));

// Asegurar que JWT_SECRET esté disponible antes de importar el controller
process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';
process.env.NODE_ENV = 'test';

import { loginController } from '../Controllers/authController';
import { verificarCredenciales } from '../models/credenciales';
import { getEmpleadoPorId } from '../models/empleados';

const mockEmpleado = {
    id: 1,
    nombre: 'Juan Pérez',
    email: 'juan@empresa.com',
    rol: 'Admin',
    idrol: 1,
    departamento: 'IT',
    idarea: 1,
    foto: null,
    estatus: 'Activo',
    curp: null,
    rfc: null,
    telefono: null,
    direccion: null,
    puesto: 'Gerente',
    permissions: ['employees.view', 'payroll.view']
};

function makeReqRes(body: Record<string, unknown> = {}) {
    const req = { body } as Request;
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    } as unknown as Response;
    return { req, res };
}

describe('Auth Controller — loginController', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('debería retornar 400 si faltan email o password', async () => {
        const { req, res } = makeReqRes({ email: 'test@test.com' }); // sin password
        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('debería retornar 401 si las credenciales son inválidas', async () => {
        (verificarCredenciales as jest.Mock).mockResolvedValue(null);
        const { req, res } = makeReqRes({ email: 'wrong@test.com', password: 'wrongpass' });
        await loginController(req, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Credenciales inválidas' }));
    });

    it('debería retornar token y usuario con permissions en login exitoso', async () => {
        (verificarCredenciales as jest.Mock).mockResolvedValue(1);
        (getEmpleadoPorId as jest.Mock).mockResolvedValue(mockEmpleado);

        const { req, res } = makeReqRes({ email: 'juan@empresa.com', password: 'Bienvenido1!' });
        await loginController(req, res);

        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
            token: 'mock.jwt.token',
            user: expect.objectContaining({
                id: 1,
                rol: 'Admin',
                permissions: expect.arrayContaining(['employees.view', 'payroll.view'])
            })
        }));
    });

    it('debería retornar 404 si el empleado no existe en la BD', async () => {
        (verificarCredenciales as jest.Mock).mockResolvedValue(99);
        (getEmpleadoPorId as jest.Mock).mockResolvedValue(null);

        const { req, res } = makeReqRes({ email: 'ghost@test.com', password: 'pass' });
        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('debería retornar 500 si falta JWT_SECRET', async () => {
        const originalSecret = process.env.JWT_SECRET;
        delete process.env.JWT_SECRET;

        (verificarCredenciales as jest.Mock).mockResolvedValue(1);
        (getEmpleadoPorId as jest.Mock).mockResolvedValue(mockEmpleado);

        const { req, res } = makeReqRes({ email: 'juan@empresa.com', password: 'Bienvenido1!' });
        await loginController(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        process.env.JWT_SECRET = originalSecret; // restaurar
    });
});
