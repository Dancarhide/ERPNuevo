import { Request, Response } from 'express';
import { prisma } from '../prisma';

const DEFAULT_CYI_STAGES = [
    {
        etapa_id: 'perfil_puesto',
        items: [
            { id: 'pp1', text: 'Perfil y competencias definidos', completed: false, comment: '' },
            { id: 'pp2', text: 'Rango salarial validado', completed: false, comment: '' }
        ]
    },
    {
        etapa_id: 'publicacion',
        items: [
            { id: 'pu1', text: 'Vacante publicada en portales', completed: false, comment: '' },
            { id: 'pu2', text: 'Difusion interna y externa', completed: false, comment: '' }
        ]
    },
    {
        etapa_id: 'filtro_cv',
        items: [
            { id: 'fc1', text: 'Revision curricular inicial', completed: false, comment: '' },
            { id: 'fc2', text: 'Preseleccion por requisitos', completed: false, comment: '' }
        ]
    },
    {
        etapa_id: 'entrevista_rh',
        items: [
            { id: 'er1', text: 'Entrevista inicial RH', completed: false, comment: '' },
            { id: 'er2', text: 'Validacion de expectativas', completed: false, comment: '' }
        ]
    },
    {
        etapa_id: 'evaluacion_tecnica',
        items: [
            { id: 'et1', text: 'Prueba tecnica aplicada', completed: false, comment: '' },
            { id: 'et2', text: 'Resultado documentado', completed: false, comment: '' }
        ]
    },
    {
        etapa_id: 'entrevista_final',
        items: [
            { id: 'ef1', text: 'Entrevista con lider del area', completed: false, comment: '' },
            { id: 'ef2', text: 'Retroalimentacion registrada', completed: false, comment: '' }
        ]
    },
    {
        etapa_id: 'oferta',
        items: [
            { id: 'of1', text: 'Oferta economica emitida', completed: false, comment: '' },
            { id: 'of2', text: 'Aceptacion o negociacion registrada', completed: false, comment: '' }
        ]
    },
    {
        etapa_id: 'onboarding',
        items: [
            { id: 'ob1', text: 'Documentos de ingreso completos', completed: false, comment: '' },
            { id: 'ob2', text: 'Plan de induccion programado', completed: false, comment: '' }
        ]
    }
];

export const getCyiProgress = async (req: Request, res: Response) => {
    try {
        const { idempleado, idvacante, idcandidato } = req.query;
        const where: any = {};
        if (idempleado) where.idempleado = parseInt(idempleado as string);
        if (idvacante) where.idvacante = parseInt(idvacante as string);
        if (idcandidato) where.idcandidato = parseInt(idcandidato as string);

        const progress = await (prisma as any).cyi_progreso.findMany({
            where: Object.keys(where).length > 0 ? where : {},
            orderBy: { id: 'asc' }
        });
        res.json(progress);
    } catch (error) {
        console.error('Error fetching CyI progress:', error);
        res.status(500).json({ error: 'Error al obtener el progreso de CyI' });
    }
};

export const updateCyiProgress = async (req: Request, res: Response) => {
    try {
        const { idempleado, idvacante, idcandidato, idpuesto, etapa_id, status, items, notas } = req.body;

        if (!etapa_id || (!idempleado && !idvacante && !idcandidato)) {
            return res.status(400).json({ error: 'Etapa y (Empleado, Vacante o Candidato) son requeridos' });
        }

        const idEmp = idempleado ? parseInt(idempleado as string) : null;
        const idVac = idvacante ? parseInt(idvacante as string) : null;
        const idCan = idcandidato ? parseInt(idcandidato as string) : null;
        const idPue = idpuesto ? parseInt(idpuesto as string) : null;

        const existing = await (prisma as any).cyi_progreso.findFirst({
            where: {
                etapa_id,
                ...(idCan ? { idcandidato: idCan } : {}),
                ...(idEmp ? { idempleado: idEmp } : {}),
                ...(idVac ? { idvacante: idVac } : {})
            }
        });

        let updated;
        if (existing) {
            updated = await (prisma as any).cyi_progreso.update({
                where: { id: existing.id },
                data: {
                    status,
                    items,
                    notas,
                    ...(idPue ? { idpuesto: idPue } : {})
                }
            });
        } else {
            updated = await (prisma as any).cyi_progreso.create({
                data: {
                    idempleado: idEmp,
                    idvacante: idVac,
                    idcandidato: idCan,
                    idpuesto: idPue,
                    etapa_id,
                    status,
                    items,
                    notas
                } as any
            });
        }

        // Final stage approval logic: Candidate -> Employee conversion
        if (etapa_id === 'onboarding' && status === 'approved' && idCan) {
            const candidate = await prisma.candidatos.findUnique({
                where: { idcandidato: idCan }
            });

            if (candidate && candidate.estatus !== 'Contratado') {
                await prisma.$transaction([
                    // 1. Create Employee
                    prisma.empleados.create({
                        data: {
                            nombre_completo_empleado: candidate.nombre_completo,
                            email_empleado: candidate.email,
                            telefono_empleado: candidate.telefono,
                            idpuesto: candidate.idpuesto || idPue,
                            idvacante: candidate.idvacante || idVac,
                            estatus_empleado: 'Activo',
                            fecha_ingreso: new Date()
                        }
                    }),
                    // 2. Update Candidate status
                    prisma.candidatos.update({
                        where: { idcandidato: idCan },
                        data: { estatus: 'Contratado' }
                    })
                ]);
                console.log(`Candidate ${idCan} (${candidate.nombre_completo}) promoted to Employee.`);
            }
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating CyI progress:', error);
        res.status(500).json({ error: 'Error al actualizar el progreso de CyI' });
    }
};

export const bootstrapCandidateCyi = async (req: Request, res: Response) => {
    try {
        const { idcandidato, idpuesto, idvacante } = req.body;

        if (!idcandidato) {
            return res.status(400).json({ error: 'idcandidato es requerido' });
        }

        const candidateId = parseInt(idcandidato as string);
        const puestoId = idpuesto ? parseInt(idpuesto as string) : null;
        const vacanteId = idvacante ? parseInt(idvacante as string) : null;

        const existing = await (prisma as any).cyi_progreso.count({
            where: { idcandidato: candidateId }
        });

        if (existing > 0) {
            return res.status(200).json({ created: false, message: 'El candidato ya tiene un proceso C y I' });
        }

        await (prisma as any).$transaction(
            DEFAULT_CYI_STAGES.map((stage) =>
                (prisma as any).cyi_progreso.create({
                    data: {
                        idcandidato: candidateId,
                        idpuesto: puestoId,
                        idvacante: vacanteId,
                        etapa_id: stage.etapa_id,
                        status: 'pending',
                        items: stage.items,
                        notas: ''
                    }
                })
            )
        );

        res.status(201).json({ created: true, message: 'Proceso C y I creado para el candidato' });
    } catch (error) {
        console.error('Error bootstrapping candidate CyI:', error);
        res.status(500).json({ error: 'Error al crear proceso C y I para el candidato' });
    }
};
