/**
 * Tests de integración — Nómina Controller
 * Prueba los endpoints de creación bulk y consulta de nóminas.
 * Usa mocks de Prisma para no conectar a la base de datos real.
 */

import { Request, Response } from 'express';

// ---- Mock del módulo Prisma (ruta desde src/__tests__/ → src/prisma) ----
const mockPrismaTransaction = jest.fn();
const mockNominasFindMany = jest.fn();
const mockNominasAggregate = jest.fn();
const mockNominasGroupBy = jest.fn();

jest.mock('../prisma', () => ({
    prisma: {
        nominas: {
            create: jest.fn(),
            findMany: mockNominasFindMany,
            aggregate: mockNominasAggregate,
            groupBy: mockNominasGroupBy
        },
        prestamos: {
            update: jest.fn()
        },
        $transaction: mockPrismaTransaction
    }
}));

process.env.NODE_ENV = 'test';

import {
    crearNominasBulk,
    misNominas,
    getLotesNominas
} from '../Controllers/nominaController';

function makeReqRes(body: Record<string, unknown> = {}, user?: Record<string, unknown>) {
    const req = { body, user } as unknown as Request;
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    } as unknown as Response;
    return { req, res };
}

describe('Nómina Controller', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // --- crearNominasBulk ---
    describe('crearNominasBulk', () => {
        it('debería retornar 400 si el array de nóminas está vacío', async () => {
            const { req, res } = makeReqRes({ nominas: [] });
            await crearNominasBulk(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería retornar 400 si "nominas" no es un array', async () => {
            const { req, res } = makeReqRes({ nominas: 'invalid' });
            await crearNominasBulk(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('debería crear nóminas en bulk y retornar success', async () => {
            mockPrismaTransaction.mockResolvedValue(undefined);

            const nominas = [{
                idempleado: 1,
                fecha_inicio: '2024-01-01',
                fecha_fin: '2024-01-15',
                sueldo_base: 10000,
                total_pagado: 9500,
                detalles: []
            }];

            const { req, res } = makeReqRes({ nominas });
            await crearNominasBulk(req, res);

            expect(mockPrismaTransaction).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                count: 1
            }));
        });
    });

    // --- misNominas ---
    describe('misNominas', () => {
        it('debería retornar 401 si no hay usuario autenticado', async () => {
            const { req, res } = makeReqRes({}, undefined);
            await misNominas(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('debería retornar las nóminas del usuario autenticado', async () => {
            const mockNominas = [{ idnomina: 1, total_pagado: 9500, detalles_nomina: [] }];
            mockNominasFindMany.mockResolvedValue(mockNominas);

            const { req, res } = makeReqRes({}, { id: 1 });
            await misNominas(req, res);

            expect(mockNominasFindMany).toHaveBeenCalledWith(
                expect.objectContaining({ where: { idempleado: 1 } })
            );
            expect(res.json).toHaveBeenCalledWith(mockNominas);
        });
    });

    // --- getLotesNominas ---
    describe('getLotesNominas', () => {
        it('debería retornar los lotes de nóminas formateados', async () => {
            mockNominasGroupBy.mockResolvedValue([{
                lote_id: 'LOTE-2024-01-01T00-00-00',
                fecha_emision: new Date('2024-01-15'),
                fecha_inicio: new Date('2024-01-01'),
                fecha_fin: new Date('2024-01-15'),
                _count: { idnomina: 3 },
                _sum: { total_pagado: 28500, monto_reportado_fiscal: 27000 }
            }]);

            const { req, res } = makeReqRes();
            await getLotesNominas(req, res);

            expect(res.json).toHaveBeenCalledWith([
                expect.objectContaining({
                    lote_id: 'LOTE-2024-01-01T00-00-00',
                    empleados: 3,
                    total_real: 28500
                })
            ]);
        });

        it('debería retornar 500 si hay un error de base de datos', async () => {
            mockNominasGroupBy.mockRejectedValue(new Error('DB connection failed'));

            const { req, res } = makeReqRes();
            await getLotesNominas(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });
});
