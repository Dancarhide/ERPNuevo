/**
 * Tests de integración — Vacaciones Controller
 * Prueba los endpoints de creación y actualización de estatus de vacaciones.
 * Usa mocks de Prisma para no conectar a la base de datos real.
 */

import { Request, Response } from 'express';

// ---- Mock del módulo Prisma (ruta desde src/__tests__/ → src/prisma) ----
const mockVacacionesCreate = jest.fn();
const mockVacacionesFindMany = jest.fn();
const mockVacacionesFindUnique = jest.fn();
const mockVacacionesUpdate = jest.fn();
const mockEmpleadosUpdate = jest.fn();
const mockAreasFindFirst = jest.fn();
const mockEmpleadosFindUnique = jest.fn();
const mockPrismaTransaction = jest.fn();

jest.mock('../prisma', () => ({
    prisma: {
        vacaciones: {
            create: mockVacacionesCreate,
            findMany: mockVacacionesFindMany,
            findUnique: mockVacacionesFindUnique,
            update: mockVacacionesUpdate
        },
        empleados: {
            update: mockEmpleadosUpdate,
            findUnique: mockEmpleadosFindUnique
        },
        areas: {
            findFirst: mockAreasFindFirst
        },
        $transaction: mockPrismaTransaction
    }
}));

process.env.NODE_ENV = 'test';

import { createVacacion, updateVacacionStatus } from '../Controllers/vacacionController';

function makeReqRes(
    body: Record<string, unknown> = {},
    params: Record<string, string> = {},
    user?: Record<string, unknown>
) {
    const req = { body, params, user, query: {} } as unknown as Request;
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    } as unknown as Response;
    return { req, res };
}

describe('Vacaciones Controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- createVacacion ---
    describe('createVacacion', () => {
        it('debería retornar 400 si faltan campos obligatorios', async () => {
            const { req, res } = makeReqRes({ idempleado: 1, fecha_inicio: '2024-06-01' }); // sin fecha_fin
            await createVacacion(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería crear una solicitud de vacaciones correctamente', async () => {
            const mockVacacion = {
                idvacacion: 1,
                idempleado: 1,
                fecha_inicio: new Date('2024-06-01'),
                fecha_fin: new Date('2024-06-07'),
                estatus_vacacion: 'Pendiente'
            };
            mockVacacionesCreate.mockResolvedValue(mockVacacion);

            const { req, res } = makeReqRes({
                idempleado: 1,
                fecha_inicio: '2024-06-01',
                fecha_fin: '2024-06-07',
                motivo: 'Descanso'
            });
            await createVacacion(req, res);

            expect(mockVacacionesCreate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockVacacion);
        });
    });

    // --- updateVacacionStatus ---
    describe('updateVacacionStatus', () => {
        it('debería retornar 400 si el ID de vacación es inválido', async () => {
            const { req, res } = makeReqRes(
                { estatus_vacacion: 'Aprobado' },
                { id: 'abc' } // ID no numérico
            );
            await updateVacacionStatus(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería retornar 400 si se rechaza sin motivo', async () => {
            mockVacacionesFindUnique.mockResolvedValue({ idvacacion: 1, estatus_vacacion: 'Pendiente' });

            const { req, res } = makeReqRes(
                { estatus_vacacion: 'Rechazado', motivo_rechazo: '' },
                { id: '1' }
            );
            await updateVacacionStatus(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería retornar 404 si la vacación no existe', async () => {
            mockVacacionesFindUnique.mockResolvedValue(null);

            const { req, res } = makeReqRes(
                { estatus_vacacion: 'Aprobado' },
                { id: '999' }
            );
            await updateVacacionStatus(req, res);
            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('debería aprobar vacaciones con transacción atómica ($transaction)', async () => {
            const vacacionOriginal = {
                idvacacion: 1,
                idempleado: 5,
                estatus_vacacion: 'Pendiente',
                fecha_inicio: new Date('2024-06-03'),
                fecha_fin: new Date('2024-06-07')
            };
            mockVacacionesFindUnique.mockResolvedValue(vacacionOriginal);

            const updatedVacacion = { ...vacacionOriginal, estatus_vacacion: 'Aprobado' };
            // La transacción retorna [vacacion_actualizada, empleado_actualizado]
            mockPrismaTransaction.mockResolvedValue([updatedVacacion, {}]);

            const { req, res } = makeReqRes(
                { estatus_vacacion: 'Aprobado' },
                { id: '1' }
            );
            await updateVacacionStatus(req, res);

            // Verificar que se usó $transaction (lógica atómica)
            expect(mockPrismaTransaction).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        it('debería rechazar vacaciones actualizando el motivo de rechazo', async () => {
            const vacacionOriginal = {
                idvacacion: 2,
                idempleado: 5,
                estatus_vacacion: 'Pendiente',
                fecha_inicio: new Date('2024-07-01'),
                fecha_fin: new Date('2024-07-05')
            };
            mockVacacionesFindUnique.mockResolvedValue(vacacionOriginal);
            mockVacacionesUpdate.mockResolvedValue({
                ...vacacionOriginal,
                estatus_vacacion: 'Rechazado',
                motivo_rechazo: 'Temporada alta'
            });

            const { req, res } = makeReqRes(
                { estatus_vacacion: 'Rechazado', motivo_rechazo: 'Temporada alta' },
                { id: '2' }
            );
            await updateVacacionStatus(req, res);

            expect(mockVacacionesUpdate).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ motivo_rechazo: 'Temporada alta' })
                })
            );
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });
});
