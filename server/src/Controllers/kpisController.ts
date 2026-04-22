import { Request, Response } from 'express';
import { prisma } from '../prisma';

// ─────────────────────────────────────────────────────────────────
// Helper: rango de los últimos N meses
// ─────────────────────────────────────────────────────────────────
function lastNMonths(n: number): Date {
    const d = new Date();
    d.setMonth(d.getMonth() - n);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
}

function monthLabel(date: Date): string {
    return date.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });
}

// ─────────────────────────────────────────────────────────────────
// GET /api/kpis — Dashboard ejecutivo completo
// ─────────────────────────────────────────────────────────────────
export const getKPIs = async (_req: Request, res: Response): Promise<void> => {
    try {
        const hoy = new Date();
        const inicioMesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const hace12Meses = lastNMonths(12);
        const hace6Meses  = lastNMonths(6);

        const [
            // 1. Headcount por estatus
            headcountStats,
            // 2. Distribución por área
            headcountPorArea,
            // 3. Distribución por rol
            headcountPorRol,
            // 4. Antigüedad (fecha_ingreso)
            empleadosConIngreso,
            // 5. Vacaciones por estatus (total histórico)
            vacacionesPorEstatus,
            // 6. Vacaciones mes actual
            vacacionesMesActual,
            // 7. Nómina: últimos 6 meses agrupados por mes
            nominaUltimos6Meses,
            // 8. Nómina: costo por área
            nominaPorArea,
            // 9. Incidencias por tipo (últimos 3 meses)
            incidenciasPorTipo,
            // 10. Vacantes activas
            vacantesStats,
            // 11. Candidatos por estatus
            candidatosPorEstatus,
            // 12. Contrataciones últimos 12 meses
            nuevasContrataciones,
            // 13. Total de empleados activos
            totalActivos,
        ] = await Promise.all([
            // 1. Headcount por estatus
            prisma.empleados.groupBy({
                by: ['estatus_empleado'],
                _count: { idempleado: true },
            }),

            // 2. Headcount por área
            prisma.empleados.groupBy({
                by: ['idarea'],
                _count: { idempleado: true },
                where: { estatus_empleado: 'Activo' },
            }),

            // 3. Headcount por rol
            prisma.empleados.groupBy({
                by: ['idrol'],
                _count: { idempleado: true },
                where: { estatus_empleado: 'Activo' },
            }),

            // 4. Empleados activos con fecha de ingreso para calcular antigüedad
            prisma.empleados.findMany({
                where: { estatus_empleado: 'Activo', fecha_ingreso: { not: null } },
                select: { fecha_ingreso: true },
            }),

            // 5. Vacaciones por estatus (general)
            prisma.vacaciones.groupBy({
                by: ['estatus_vacacion'],
                _count: { idvacacion: true },
            }),

            // 6. Vacaciones en el mes actual
            prisma.vacaciones.count({
                where: {
                    fecha_inicio: { gte: inicioMesActual },
                    estatus_vacacion: 'Aprobado',
                },
            }),

            // 7. Nómina mensual últimos 6 meses
            prisma.nominas.findMany({
                where: { fecha_inicio: { gte: hace6Meses } },
                select: { fecha_inicio: true, total_pagado: true, idempleado: true },
                orderBy: { fecha_inicio: 'asc' },
            }),

            // 8. Nómina por área (mes actual)
            prisma.nominas.findMany({
                where: { fecha_inicio: { gte: inicioMesActual } },
                select: {
                    total_pagado: true,
                    empleados: { select: { idarea: true } },
                },
            }),

            // 9. Incidencias por tipo (últimos 3 meses)
            (prisma as any).incidencias.groupBy({
                by: ['tipo'],
                _count: { idincidencia: true },
                where: { fecha_registro: { gte: lastNMonths(3) } },
            }),

            // 10. Vacantes por estatus
            prisma.vacantes.groupBy({
                by: ['estatus'],
                _count: { idvacante: true },
            }),

            // 11. Candidatos por estatus
            prisma.candidatos.groupBy({
                by: ['estatus'],
                _count: { idcandidato: true },
            }),

            // 12. Empleados contratados en los últimos 12 meses (fecha_ingreso)
            prisma.empleados.findMany({
                where: { fecha_ingreso: { gte: hace12Meses } },
                select: { fecha_ingreso: true },
                orderBy: { fecha_ingreso: 'asc' },
            }),

            // 13. Total activos
            prisma.empleados.count({ where: { estatus_empleado: 'Activo' } }),
        ]);

        // ─── Lookups de nombres ────────────────────────────────────────────
        const [areas, roles] = await Promise.all([
            prisma.areas.findMany({ select: { idarea: true, nombre_area: true } }),
            prisma.roles.findMany({ select: { idrol: true, nombre_rol: true } }),
        ]);

        const areaMap = new Map(areas.map(a => [a.idarea, a.nombre_area ?? 'Sin área']));
        const rolMap  = new Map(roles.map(r => [r.idrol, r.nombre_rol ?? 'Sin rol']));

        // ─── 1. Headcount summary ─────────────────────────────────────────
        const headcount: Record<string, number> = {};
        for (const row of headcountStats) {
            headcount[row.estatus_empleado ?? 'Sin estatus'] = row._count.idempleado;
        }

        // ─── 2. Por área ──────────────────────────────────────────────────
        const porArea = headcountPorArea
            .map(row => ({
                area: areaMap.get(row.idarea ?? -1) ?? 'Sin área',
                empleados: row._count.idempleado,
            }))
            .sort((a, b) => b.empleados - a.empleados);

        // ─── 3. Por rol ───────────────────────────────────────────────────
        const porRol = headcountPorRol
            .map(row => ({
                rol: rolMap.get(row.idrol ?? -1) ?? 'Sin rol',
                empleados: row._count.idempleado,
            }))
            .sort((a, b) => b.empleados - a.empleados);

        // ─── 4. Antigüedad (buckets) ──────────────────────────────────────
        const buckets = { '<1 año': 0, '1-2 años': 0, '2-5 años': 0, '>5 años': 0 };
        for (const emp of empleadosConIngreso) {
            if (!emp.fecha_ingreso) continue;
            const años = (hoy.getTime() - new Date(emp.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24 * 365);
            if      (años < 1) buckets['<1 año']++;
            else if (años < 2) buckets['1-2 años']++;
            else if (años < 5) buckets['2-5 años']++;
            else               buckets['>5 años']++;
        }
        const antiguedad = Object.entries(buckets).map(([rango, count]) => ({ rango, count }));

        // ─── 5. Vacaciones por estatus ────────────────────────────────────
        const vacaciones = vacacionesPorEstatus.map(v => ({
            estatus: v.estatus_vacacion ?? 'Desconocido',
            total: v._count.idvacacion,
        }));

        // ─── 6. Tasa de ausentismo mensual ────────────────────────────────
        const tasaAusentismo = totalActivos > 0
            ? +((vacacionesMesActual / totalActivos) * 100).toFixed(1)
            : 0;

        // ─── 7. Nómina: tendencia mensual ─────────────────────────────────
        const nominaPorMes: Record<string, { total: number; empleados: Set<number> }> = {};
        for (const n of nominaUltimos6Meses) {
            const key = monthLabel(new Date(n.fecha_inicio));
            if (!nominaPorMes[key]) nominaPorMes[key] = { total: 0, empleados: new Set() };
            nominaPorMes[key].total += Number(n.total_pagado);
            nominaPorMes[key].empleados.add(n.idempleado);
        }
        const tendenciaNomina = Object.entries(nominaPorMes).map(([mes, data]) => ({
            mes,
            total: +data.total.toFixed(2),
            empleados: data.empleados.size,
            promedio: data.empleados.size > 0 ? +(data.total / data.empleados.size).toFixed(2) : 0,
        }));

        // ─── 8. Nómina por área ───────────────────────────────────────────
        const nominaAreaMap: Record<string, number> = {};
        for (const n of nominaPorArea) {
            const areaNombre = areaMap.get(n.empleados?.idarea ?? -1) ?? 'Sin área';
            nominaAreaMap[areaNombre] = (nominaAreaMap[areaNombre] ?? 0) + Number(n.total_pagado);
        }
        const nominaPorAreaArr = Object.entries(nominaAreaMap)
            .map(([area, total]) => ({ area, total: +total.toFixed(2) }))
            .sort((a, b) => b.total - a.total);

        // ─── 9. Incidencias por tipo ──────────────────────────────────────
        const incidencias = (incidenciasPorTipo as any[]).map((i: any) => ({
            tipo: i.tipo ?? 'Sin tipo',
            total: i._count.idincidencia,
        }));

        // ─── 10. Reclutamiento ────────────────────────────────────────────
        const reclutamiento = {
            vacantes: vacantesStats.map(v => ({ estatus: v.estatus, total: v._count.idvacante })),
            candidatos: candidatosPorEstatus.map(c => ({ estatus: c.estatus, total: c._count.idcandidato })),
            totalVacantesAbiertas: vacantesStats.find(v => v.estatus === 'Abierta')?._count.idvacante ?? 0,
            totalCandidatos: candidatosPorEstatus.reduce((s, c) => s + c._count.idcandidato, 0),
        };

        // ─── 11. Nuevas contrataciones por mes (últimos 12 meses) ─────────
        const contratacionesPorMes: Record<string, number> = {};
        for (const emp of nuevasContrataciones) {
            if (!emp.fecha_ingreso) continue;
            const key = monthLabel(new Date(emp.fecha_ingreso));
            contratacionesPorMes[key] = (contratacionesPorMes[key] ?? 0) + 1;
        }
        const tendenciaContrataciones = Object.entries(contratacionesPorMes)
            .map(([mes, total]) => ({ mes, total }));

        // ─── Respuesta final ──────────────────────────────────────────────
        res.json({
            // Resumen ejecutivo (tarjetas)
            resumen: {
                totalActivos,
                headcount,
                tasaAusentismo,
                totalVacantesAbiertas: reclutamiento.totalVacantesAbiertas,
                nominaMesActual: tendenciaNomina[tendenciaNomina.length - 1]?.total ?? 0,
            },
            // Gráficas
            headcountPorArea: porArea,
            headcountPorRol: porRol,
            antiguedad,
            vacaciones,
            tendenciaNomina,
            nominaPorArea: nominaPorAreaArr,
            incidencias,
            reclutamiento,
            tendenciaContrataciones,
        });

    } catch (error) {
        console.error('Error fetching KPIs:', error);
        res.status(500).json({ error: 'Error al obtener los KPIs' });
    }
};
