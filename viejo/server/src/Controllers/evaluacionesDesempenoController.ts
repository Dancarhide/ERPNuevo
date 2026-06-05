import { Request, Response } from 'express';
import { prisma } from '../prisma';

// ── GET /api/evaluaciones?tipo= ────────────────────────────────────────────
export const getEvaluaciones = async (req: Request, res: Response): Promise<void> => {
    try {
        const { tipo } = req.query;
        const where: any = {};
        if (tipo) where.evaluation_type = tipo;

        const preguntas = await prisma.evaluaciones.findMany({
            where,
            orderBy: { idquestion: 'asc' }
        });
        res.json(preguntas);
    } catch (error) {
        console.error('Error al obtener evaluaciones:', error);
        res.status(500).json({ error: 'Error al obtener evaluaciones' });
    }
};

// ── POST /api/evaluaciones ─────────────────────────────────────────────────
export const createEvaluacion = async (req: Request, res: Response): Promise<void> => {
    try {
        const { pregunta, evaluation_type } = req.body;

        if (!pregunta || !evaluation_type) {
            res.status(400).json({ error: 'pregunta y evaluation_type son requeridos' });
            return;
        }

        const nueva = await prisma.evaluaciones.create({
            data: {
                pregunta,
                evaluation_type,
                create_time: new Date(),
                modification_time: new Date()
            }
        });

        res.status(201).json(nueva);
    } catch (error) {
        console.error('Error al crear evaluación:', error);
        res.status(500).json({ error: 'Error al crear evaluación' });
    }
};

// ── PUT /api/evaluaciones/:id ──────────────────────────────────────────────
export const updateEvaluacion = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        const { pregunta, evaluation_type } = req.body;

        const updated = await prisma.evaluaciones.update({
            where: { idquestion: id },
            data: { pregunta, evaluation_type, modification_time: new Date() }
        });
        res.json(updated);
    } catch (error) {
        console.error('Error al actualizar evaluación:', error);
        res.status(500).json({ error: 'Error al actualizar evaluación' });
    }
};

// ── DELETE /api/evaluaciones/:id ───────────────────────────────────────────
export const deleteEvaluacion = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.id));
        // Borra respuestas asociadas primero
        await prisma.respuestas_evaluacion.deleteMany({ where: { id_pregunta: id } });
        await prisma.evaluaciones.delete({ where: { idquestion: id } });
        res.json({ ok: true });
    } catch (error) {
        console.error('Error al eliminar evaluación:', error);
        res.status(500).json({ error: 'Error al eliminar evaluación' });
    }
};

// ── POST /api/evaluaciones/respuestas ─────────────────────────────────────
// Guarda respuestas de un empleado; reemplaza si ya respondió este bloque
export const submitRespuestas = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            id_empleado,
            respuestas // Array<{ id_pregunta: number; respuesta: string }>
        } = req.body;

        if (!id_empleado || !Array.isArray(respuestas) || respuestas.length === 0) {
            res.status(400).json({ error: 'id_empleado y respuestas son requeridos' });
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Borrar respuestas previas del mismo empleado para las mismas preguntas
        const idsPreguntas = respuestas.map((r: any) => r.id_pregunta);
        await prisma.respuestas_evaluacion.deleteMany({
            where: {
                id_empleado: parseInt(id_empleado),
                id_pregunta: { in: idsPreguntas }
            }
        });

        await prisma.respuestas_evaluacion.createMany({
            data: respuestas.map((r: any) => ({
                id_pregunta: parseInt(r.id_pregunta),
                id_empleado: parseInt(id_empleado),
                respuesta: String(r.respuesta),
                fecha_respuesta: hoy
            }))
        });

        res.json({ ok: true, total: respuestas.length });
    } catch (error) {
        console.error('Error al guardar respuestas:', error);
        res.status(500).json({ error: 'Error al guardar respuestas de evaluación' });
    }
};

// ── GET /api/evaluaciones/resultados/:idempleado ──────────────────────────
export const getResultadosEmpleado = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.idempleado));

        const respuestas = await prisma.respuestas_evaluacion.findMany({
            where: { id_empleado: id },
            include: {
                evaluaciones: true
            },
            orderBy: { fecha_respuesta: 'desc' }
        });

        // Calcular promedio numérico (si las respuestas son 1-5)
        const porPregunta = respuestas.map(r => ({
            pregunta: r.evaluaciones.pregunta,
            tipo: r.evaluaciones.evaluation_type,
            respuesta: r.respuesta,
            fecha: r.fecha_respuesta,
            valor_numerico: isNaN(Number(r.respuesta)) ? null : Number(r.respuesta)
        }));

        const promedio = porPregunta
            .filter(r => r.valor_numerico !== null)
            .reduce((acc, r, _, arr) => acc + (r.valor_numerico! / arr.length), 0);

        res.json({ respuestas: porPregunta, promedio: +promedio.toFixed(2) });
    } catch (error) {
        console.error('Error al obtener resultados:', error);
        res.status(500).json({ error: 'Error al obtener resultados del empleado' });
    }
};

// ── GET /api/evaluaciones/equipo/:idarea ──────────────────────────────────
export const getResultadosEquipo = async (req: Request, res: Response): Promise<void> => {
    try {
        const idarea = parseInt(String(req.params.idarea));

        // Empleados del área
        const empleados = await prisma.empleados.findMany({
            where: { idarea, estatus_empleado: 'Activo' },
            select: { idempleado: true, nombre_completo_empleado: true }
        });

        const ids = empleados.map(e => e.idempleado);

        const respuestas = await prisma.respuestas_evaluacion.findMany({
            where: { id_empleado: { in: ids } },
            include: { evaluaciones: true }
        });

        // Agrupar por tipo de evaluación y calcular promedio
        const agrupado: Record<string, { total: number; count: number }> = {};
        for (const r of respuestas) {
            const tipo = r.evaluaciones.evaluation_type ?? 'General';
            if (!agrupado[tipo]) agrupado[tipo] = { total: 0, count: 0 };
            if (!isNaN(Number(r.respuesta))) {
                agrupado[tipo].total += Number(r.respuesta);
                agrupado[tipo].count++;
            }
        }

        const resultados = Object.entries(agrupado).map(([tipo, data]) => ({
            tipo,
            promedio: data.count > 0 ? +(data.total / data.count).toFixed(2) : 0,
            total_respuestas: data.count
        }));

        res.json({
            idarea,
            total_empleados: empleados.length,
            empleados_evaluados: new Set(respuestas.map(r => r.id_empleado)).size,
            resultados
        });
    } catch (error) {
        console.error('Error al obtener resultados del equipo:', error);
        res.status(500).json({ error: 'Error al obtener resultados del equipo' });
    }
};

// ── GET /api/evaluaciones/estado/:idempleado — saber si ya respondió ─────
export const getEstadoEvaluacion = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = parseInt(String(req.params.idempleado));

        const totalPreguntas = await prisma.evaluaciones.count();
        const totalRespondidas = await prisma.respuestas_evaluacion.count({
            where: { id_empleado: id }
        });

        res.json({
            total_preguntas: totalPreguntas,
            total_respondidas: totalRespondidas,
            completado: totalPreguntas > 0 && totalRespondidas >= totalPreguntas
        });
    } catch (error) {
        console.error('Error al obtener estado de evaluación:', error);
        res.status(500).json({ error: 'Error al obtener estado de evaluación' });
    }
};
