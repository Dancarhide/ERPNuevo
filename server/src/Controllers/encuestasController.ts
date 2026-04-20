import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Saves or updates the Employee Inventory (HR Survey 1)
 */
export const saveHRInventory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { idempleado, ...data } = req.body;

        if (!idempleado) {
            res.status(400).json({ error: 'ID de empleado es requerido' });
            return;
        }

        // We update the main employee record with the inventory data
        const updated = await prisma.empleados.update({
            where: { idempleado: parseInt(idempleado) },
            data: {
                sexo: data.sexo,
                fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : null,
                lugar_nacimiento: data.lugar_nacimiento,
                ciudad: data.ciudad,
                colonia: data.colonia,
                cp: data.cp,
                entidad_federativa: data.entidad_federativa,
                estado_civil: data.estado_civil,
                ultimo_grado_escolar: data.ultimo_grado_escolar,
                aspiraciones_profesionales: data.aspiraciones_profesionales,
                cartilla_militar: data.cartilla_militar === 'Si' || data.cartilla_militar === true,
                direccion_empleado: data.direccion_completa // Optional reuse of existing field
            }
        });

        // Handle family contact (if provided in survey)
        if (data.contacto_emergencia) {
            await prisma.empleados_familiar.upsert({
                where: { idempleado: updated.idempleado } as any, // Simplifying for the demo
                create: {
                    idempleado: updated.idempleado,
                    nombre_completo_familiar: data.contacto_emergencia,
                    parentesco_familiar: data.parentesco_emergencia,
                    telefono_familiar: data.telefono_emergencia
                },
                update: {
                    nombre_completo_familiar: data.contacto_emergencia,
                    parentesco_familiar: data.parentesco_emergencia,
                    telefono_familiar: data.telefono_emergencia
                }
            });
        }

        res.json({ message: 'Inventario de RRHH guardado exitosamente', data: updated });
    } catch (error) {
        console.error('Error saving HR Inventory:', error);
        res.status(500).json({ error: 'Error al guardar el inventario' });
    }
};

/**
 * Saves Climate Survey responses (HR Survey 2)
 */
export const saveClimateSurvey = async (req: Request, res: Response): Promise<void> => {
    try {
        const { 
            idempleado, 
            nivel_jerarquico, 
            ubicacion, 
            hijos, 
            antiguedad, 
            genero,
            orientacion_org,
            admin_talento,
            estilo_direccion,
            comunicacion_int,
            trabajo_equipo,
            capacidad_prof,
            medio_ambiente
        } = req.body;

        console.log('--- RECIBIENDO ENCUESTA DE CLIMA ---');
        console.log('Empleado ID:', idempleado);
        console.log('Metadatos:', { nivel_jerarquico, ubicacion, hijos, antiguedad });

        const surveyData = {
            nivel_jerarquico,
            ubicacion,
            hijos,
            antiguedad,
            genero,
            orientacion_org: orientacion_org || {},
            admin_talento: admin_talento || {},
            estilo_direccion: estilo_direccion || {},
            comunicacion_int: comunicacion_int || {},
            trabajo_equipo: trabajo_equipo || {},
            capacidad_prof: capacidad_prof || {},
            medio_ambiente: medio_ambiente || {}
        };

        let response;
        if (idempleado) {
            // If we have an ID, we UPSERT (replace if exists)
            response = await (prisma as any).encuesta_clima.upsert({
                where: { idempleado: parseInt(idempleado) },
                update: { ...surveyData, fecha: new Date() },
                create: { ...surveyData, idempleado: parseInt(idempleado) }
            });
        } else {
            // Anonymous fallback
            response = await (prisma as any).encuesta_clima.create({
                data: surveyData
            });
        }

        res.json({ message: 'Encuesta procesada exitosamente', id: response.id });
    } catch (error) {
        console.error('Error saving Climate Survey:', error);
        res.status(500).json({ error: 'Error al procesar la encuesta de clima' });
    }
};

/**
 * Gets results for the dashboard
 */
export const getClimateResults = async (req: Request, res: Response): Promise<void> => {
    try {
        const results = await (prisma as any).encuesta_clima.findMany({
            orderBy: { fecha: 'desc' }
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener resultados' });
    }
};

/**
 * Gets the current administration configuration (e.g., active status)
 */
export const getAdminConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const configs = await prisma.sys_config.findMany({
            where: {
                key: { in: ['expediente_active', 'clima_active'] }
            }
        });
        
        const configMap = configs.reduce((acc, curr) => {
            acc[curr.key] = curr.value === 'true';
            return acc;
        }, {} as Record<string, boolean>);

        res.json({
            expediente_active: configMap['expediente_active'] ?? false,
            clima_active: configMap['clima_active'] ?? false
        });
    } catch (error) {
        console.error('Error in getAdminConfig:', error);
        res.status(500).json({ error: 'Error al obtener configuración admin' });
    }
};

/**
 * Updates administration settings
 */
export const updateAdminConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const { key, value } = req.body; // e.g., key: 'clima_active', value: true
        
        if (!key) {
            res.status(400).json({ error: 'Key es requerida' });
            return;
        }

        await prisma.sys_config.upsert({
            where: { key },
            update: { value: value.toString() },
            create: { key, value: value.toString() }
        });
        res.json({ success: true, key, value });
    } catch (error) {
        console.error('Error in updateAdminConfig:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};

/**
 * Gets aggregated stats for the Climate Survey dashboard
 */
export const getDetailedClimateStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const results = await (prisma as any).encuesta_clima.findMany({
            include: {
                empleados: {
                    select: {
                        nombre_completo_empleado: true
                    }
                }
            },
            orderBy: { fecha: 'desc' }
        });
        
        const getAvg = (obj: any) => {
            if (!obj || typeof obj !== 'object') return 0;
            const vals = Object.values(obj).filter(v => typeof v === 'number') as number[];
            if (vals.length === 0) return 0;
            return vals.reduce((a, b) => a + b, 0) / vals.length;
        };

        // Format detailed responses for the table
        const detailedResponses = results.map((r: any) => {
            const categories = [
                r.orientacion_org, r.admin_talento, r.estilo_direccion,
                r.comunicacion_int, r.trabajo_equipo, r.capacidad_prof
            ];
            
            const catAverages = categories.map(c => getAvg(c)).filter(a => a > 0);
            const totalAvg = catAverages.length > 0 
                ? catAverages.reduce((a, b) => a + b, 0) / catAverages.length 
                : 0;

            return {
                id: r.id,
                fecha: r.fecha,
                colaborador: r.empleados?.nombre_completo_empleado || 'Anónimo',
                nivel_jerarquico: r.nivel_jerarquico || 'No especificado',
                ubicacion: r.ubicacion || 'No especificada',
                antiguedad: r.antiguedad || 'No especificada',
                promedio: parseFloat(totalAvg.toFixed(2))
            };
        });

        const stats = {
            total_responses: results.length,
            averages: {
                orientacion_org: 0,
                admin_talento: 0,
                estilo_direccion: 0,
                comunicacion_int: 0,
                trabajo_equipo: 0,
                capacidad_prof: 0
            },
            responses: detailedResponses // We add the detailed list here
        };

        if (results.length > 0) {
            results.forEach((r: any) => {
                stats.averages.orientacion_org += getAvg(r.orientacion_org);
                stats.averages.admin_talento += getAvg(r.admin_talento);
                stats.averages.estilo_direccion += getAvg(r.estilo_direccion);
                stats.averages.comunicacion_int += getAvg(r.comunicacion_int);
                stats.averages.trabajo_equipo += getAvg(r.trabajo_equipo);
                stats.averages.capacidad_prof += getAvg(r.capacidad_prof);
            });

            // Divide by total to get the final mean
            Object.keys(stats.averages).forEach(k => {
                (stats.averages as any)[k] = parseFloat(((stats.averages as any)[k] / results.length).toFixed(2));
            });
        }

        res.json(stats);
    } catch (error) {
        console.error('Error in getDetailedClimateStats:', error);
        res.status(500).json({ error: 'Error al calcular estadísticas' });
    }
};

/**
 * Gets aggregated stats for the E-Expediente (Profile completion)
 */
export const getExpedienteStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const total = await prisma.empleados.count();
        
        // We consider "completed" if they have the core survey fields
        const completed = await prisma.empleados.count({
            where: {
                AND: [
                    { rfc: { not: null } },
                    { rfc: { not: '' } },
                    { curp: { not: null } },
                    { curp: { not: '' } },
                    { direccion_empleado: { not: null } },
                    { direccion_empleado: { not: '' } }
                ]
            }
        });

        res.json({
            total,
            completed,
            pending: total - completed
        });
    } catch (error) {
        console.error('Error calculating expediente stats:', error);
        res.status(500).json({ error: 'Error al calcular estadísticas de expediente' });
    }
};

export const getClimateResponses = async (req: Request, res: Response): Promise<void> => {
    try {
        const results = await (prisma as any).encuesta_clima.findMany({
            orderBy: { fecha: 'desc' },
            take: 10 // Show last 10
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener respuestas' });
    }
};
