import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getPuestos = async (req: Request, res: Response) => {
    try {
        const puestos = await prisma.puestos.findMany({
            include: {
                areas: true,
                _count: {
                    select: { empleados: true }
                }
            }
        });
        const mapped = puestos.map(({ _count, ...p }) => ({
            ...p,
            personal_actual: _count.empleados
        }));
        res.json(mapped);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener puestos' });
    }
};

export const createPuesto = async (req: Request, res: Response) => {
    try {
        const { nombre_puesto, descripcion, requisitos, beneficios, sueldo_min, sueldo_max, cupo_maximo, idarea } = req.body;
        if (!nombre_puesto || String(nombre_puesto).trim() === '') {
            return res.status(400).json({ error: 'El nombre del puesto es obligatorio' });
        }
        const cupo = cupo_maximo !== undefined && cupo_maximo !== '' ? parseInt(String(cupo_maximo), 10) : 1;
        const nuevoPuesto = await prisma.puestos.create({
            data: {
                nombre_puesto: String(nombre_puesto).trim(),
                descripcion,
                requisitos,
                beneficios,
                sueldo_min: sueldo_min !== undefined && sueldo_min !== '' ? parseFloat(String(sueldo_min)) : null,
                sueldo_max: sueldo_max !== undefined && sueldo_max !== '' ? parseFloat(String(sueldo_max)) : null,
                cupo_maximo: Number.isFinite(cupo) && cupo > 0 ? cupo : 1,
                idarea: idarea ? parseInt(String(idarea), 10) : null
            },
            include: { areas: true }
        });
        res.status(201).json({ ...nuevoPuesto, personal_actual: 0 });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear puesto' });
    }
};

export const updatePuesto = async (req: Request, res: Response) => {
    try {
        const { idpuesto } = req.params;
        const { nombre_puesto, descripcion, requisitos, beneficios, sueldo_min, sueldo_max, idarea } = req.body;
        const updated = await prisma.puestos.update({
            where: { idpuesto: parseInt(idpuesto as string) },
            data: {
                nombre_puesto: nombre_puesto !== undefined ? String(nombre_puesto).trim() : undefined,
                descripcion,
                requisitos,
                beneficios,
                sueldo_min: sueldo_min !== undefined && sueldo_min !== '' ? parseFloat(String(sueldo_min)) : null,
                sueldo_max: sueldo_max !== undefined && sueldo_max !== '' ? parseFloat(String(sueldo_max)) : null,
                idarea: idarea !== undefined && idarea !== null && idarea !== '' ? parseInt(String(idarea), 10) : null
            }
        });
        const withCount = await prisma.puestos.findUnique({
            where: { idpuesto: updated.idpuesto },
            include: { areas: true, _count: { select: { empleados: true } } }
        });
        const { _count, ...rest } = withCount!;
        res.json({ ...rest, personal_actual: _count.empleados });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar puesto' });
    }
};


export const updateCupo = async (req: Request, res: Response) => {
    try {
        const { idpuesto, cupo_maximo } = req.body;
        const puesto = await prisma.puestos.update({
            where: { idpuesto: parseInt(idpuesto) },
            data: { cupo_maximo: parseInt(cupo_maximo) }
        });
        res.json(puesto);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar cupo' });
    }
};

export const syncPersonalActual = async (req: Request, res: Response) => {
    try {
        const allPuestos = await prisma.puestos.findMany({ include: { empleados: true } });
        for (const p of allPuestos) {
            await prisma.puestos.update({
                where: { idpuesto: p.idpuesto },
                data: { personal_actual: p.empleados.length }
            });
        }
        res.json({ message: 'Sincronización completada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al sincronizar' });
    }
};

export const assignPerson = async (req: Request, res: Response) => {
    try {
        const { nombreEmpleado, nombrePuesto } = req.body;
        
        const empleado = await prisma.empleados.findFirst({
            where: { nombre_completo_empleado: { contains: nombreEmpleado, mode: 'insensitive' } }
        });
        
        const puesto = await prisma.puestos.findFirst({
            where: { nombre_puesto: { contains: nombrePuesto, mode: 'insensitive' } }
        });

        if (!empleado || !puesto) {
            return res.status(404).json({ error: 'Empleado o Puesto no encontrado' });
        }

        await prisma.empleados.update({
            where: { idempleado: empleado.idempleado },
            data: { idpuesto: puesto.idpuesto }
        });

        // Recalcular personal_actual
        const count = await prisma.empleados.count({ where: { idpuesto: puesto.idpuesto } });
        await prisma.puestos.update({
            where: { idpuesto: puesto.idpuesto },
            data: { personal_actual: count }
        });

        res.json({ message: 'Asignación completada', empleado: empleado.nombre_completo_empleado, puesto: puesto.nombre_puesto });
    } catch (error) {
        res.status(500).json({ error: 'Error al asignar puesto' });
    }
};

