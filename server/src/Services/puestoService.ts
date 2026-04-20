import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Recalcula el personal actual de un puesto basado en los empleados con estatus 'Activo'.
 * @param idpuesto ID del puesto a recalcular
 */
export const recountPuesto = async (idpuesto: number) => {
    try {
        const count = await prisma.empleados.count({
            where: {
                idpuesto: idpuesto,
                estatus_empleado: 'Activo'
            }
        });

        await prisma.puestos.update({
            where: { idpuesto: idpuesto },
            data: { personal_actual: count }
        });

        return count;
    } catch (error) {
        console.error(`Error al recalcular cupo para puesto ${idpuesto}:`, error);
        throw error;
    }
};

/**
 * Sincroniza todos los puestos de la base de datos.
 */
export const syncAllPuestos = async () => {
    const allPuestos = await prisma.puestos.findMany({ select: { idpuesto: true } });
    for (const p of allPuestos) {
        await recountPuesto(p.idpuesto);
    }
};
