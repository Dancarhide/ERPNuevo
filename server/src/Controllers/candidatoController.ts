import { Request, Response } from 'express';
import { prisma } from '../prisma';

const INITIAL_CYI_STAGES = [
    'perfil_puesto',
    'publicacion',
    'filtro_cv',
    'entrevista_rh',
    'evaluacion_tecnica',
    'entrevista_final',
    'oferta',
    'onboarding'
];

const INITIAL_STAGE_ITEMS: Record<string, { id: string; text: string; completed: boolean; comment: string }[]> = {
    perfil_puesto: [
        { id: 'pp1', text: 'Perfil y competencias definidos', completed: false, comment: '' },
        { id: 'pp2', text: 'Rango salarial validado', completed: false, comment: '' }
    ],
    publicacion: [
        { id: 'pu1', text: 'Vacante publicada en portales', completed: false, comment: '' },
        { id: 'pu2', text: 'Difusion interna y externa', completed: false, comment: '' }
    ],
    filtro_cv: [
        { id: 'fc1', text: 'Revision curricular inicial', completed: false, comment: '' },
        { id: 'fc2', text: 'Preseleccion por requisitos', completed: false, comment: '' }
    ],
    entrevista_rh: [
        { id: 'er1', text: 'Entrevista inicial RH', completed: false, comment: '' },
        { id: 'er2', text: 'Validacion de expectativas', completed: false, comment: '' }
    ],
    evaluacion_tecnica: [
        { id: 'et1', text: 'Prueba tecnica aplicada', completed: false, comment: '' },
        { id: 'et2', text: 'Resultado documentado', completed: false, comment: '' }
    ],
    entrevista_final: [
        { id: 'ef1', text: 'Entrevista con lider del area', completed: false, comment: '' },
        { id: 'ef2', text: 'Retroalimentacion registrada', completed: false, comment: '' }
    ],
    oferta: [
        { id: 'of1', text: 'Oferta economica emitida', completed: false, comment: '' },
        { id: 'of2', text: 'Aceptacion o negociacion registrada', completed: false, comment: '' }
    ],
    onboarding: [
        { id: 'ob1', text: 'Documentos de ingreso completos', completed: false, comment: '' },
        { id: 'ob2', text: 'Plan de induccion programado', completed: false, comment: '' }
    ]
};

export const getCandidatos = async (req: Request, res: Response) => {
    try {
        const { idvacante } = req.query;
        const query: any = {};
        if (idvacante) query.idvacante = parseInt(idvacante as string);

        const candidatos = await (prisma as any).candidatos.findMany({
            where: query,
            include: {
                vacantes: true,
                puestos: true
            },
            orderBy: {
                fecha_postulacion: 'desc'
            }
        });
        res.json(candidatos);
    } catch (error) {
        console.error('Error fetching candidatos:', error);
        res.status(500).json({ error: 'Error al obtener candidatos' });
    }
};

export const createCandidato = async (req: Request, res: Response) => {
    try {
        const { nombre_completo, email, telefono, cv_url, idvacante, idpuesto, notas } = req.body;

        if (!nombre_completo || String(nombre_completo).trim() === '') {
            return res.status(400).json({ error: 'El nombre del candidato es obligatorio' });
        }

        let vacanteId = idvacante ? parseInt(String(idvacante), 10) : null;
        let puestoId = idpuesto ? parseInt(String(idpuesto), 10) : null;

        if (vacanteId && !puestoId) {
            const v = await (prisma as any).vacantes.findUnique({
                where: { idvacante: vacanteId },
                select: { idpuesto: true }
            });
            if (v?.idpuesto) puestoId = v.idpuesto;
        }

        if (!vacanteId && !puestoId) {
            return res.status(400).json({
                error: 'Debe vincular el candidato a una vacante abierta o a un puesto de la estructura'
            });
        }

        const nuevoCandidato = await (prisma as any).$transaction(async (tx: any) => {
            const candidato = await tx.candidatos.create({
                data: {
                    nombre_completo: String(nombre_completo).trim(),
                    email: email || null,
                    telefono: telefono || null,
                    cv_url: cv_url || null,
                    idvacante: vacanteId,
                    idpuesto: puestoId,
                    notas: notas || null,
                    estatus: 'Postulado'
                }
            });

            await tx.cyi_progreso.createMany({
                data: INITIAL_CYI_STAGES.map((etapa_id) => ({
                    idcandidato: candidato.idcandidato,
                    idpuesto: puestoId,
                    idvacante: vacanteId,
                    etapa_id,
                    status: 'pending',
                    items: INITIAL_STAGE_ITEMS[etapa_id],
                    notas: ''
                }))
            });

            return candidato;
        });

        const full = await (prisma as any).candidatos.findUnique({
            where: { idcandidato: nuevoCandidato.idcandidato },
            include: { vacantes: true, puestos: true }
        });

        res.status(201).json(full);
    } catch (error) {
        console.error('Error creating candidato:', error);
        res.status(500).json({ error: 'Error al registrar candidato' });
    }
};

export const deleteCandidato = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (!id) return res.status(400).json({ error: 'ID inválido' });

        await (prisma as any).cyi_progreso.deleteMany({ where: { idcandidato: id } });
        await (prisma as any).candidatos.delete({ where: { idcandidato: id } });

        res.json({ ok: true });
    } catch (error) {
        console.error('Error deleting candidato:', error);
        res.status(500).json({ error: 'Error al eliminar candidato' });
    }
};

export const updateCandidatoStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { estatus, notas } = req.body;

        const updated = await (prisma as any).candidatos.update({
            where: { idcandidato: parseInt(id as string) },
            data: { 
                estatus,
                notas: notas !== undefined ? notas : undefined
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Error updating candidato:', error);
        res.status(500).json({ error: 'Error al actualizar candidato' });
    }
};
