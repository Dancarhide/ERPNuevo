import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { generatePayrollPDF } from '../Services/nominaPDFService';

// ── Tablas de cuotas estimadas (configurable) ──────────────────────────────
// IMSS cuota obrera: ~6.25% sobre sueldo fiscal (simplificado)
// ISR: tabla progresiva simplificada (estimación para sueldo mensual)
function calcularImssObrero(sueldoFiscal: number): number {
    return +(sueldoFiscal * 0.0625).toFixed(2);
}

function calcularISREstimado(sueldoMensual: number): number {
    // Tabla ISR mensual 2025 — rangos principales (aproximación)
    if (sueldoMensual <= 746.04) return 0;
    if (sueldoMensual <= 6332.05) return +((sueldoMensual - 746.04) * 0.0640).toFixed(2);
    if (sueldoMensual <= 11128.01) return +((sueldoMensual - 6332.05) * 0.1088 + 357.44).toFixed(2);
    if (sueldoMensual <= 12935.82) return +((sueldoMensual - 11128.01) * 0.1600 + 879.18).toFixed(2);
    if (sueldoMensual <= 15487.71) return +((sueldoMensual - 12935.82) * 0.1792 + 1168.50).toFixed(2);
    if (sueldoMensual <= 31236.49) return +((sueldoMensual - 15487.71) * 0.2136 + 1624.98).toFixed(2);
    if (sueldoMensual <= 62473.38) return +((sueldoMensual - 31236.49) * 0.2352 + 5044.52).toFixed(2);
    if (sueldoMensual <= 83333.33) return +((sueldoMensual - 62473.38) * 0.3000 + 12393.74).toFixed(2);
    return +((sueldoMensual - 83333.33) * 0.3200 + 18651.74).toFixed(2);
}

// ── GET /api/nominas/previa ────────────────────────────────────────────────
export const getPreviaNomina = async (req: Request, res: Response) => {
    try {
        const empleados = await prisma.empleados.findMany({
            where: { 
                estatus_empleado: { in: ['Activo', 'Vacaciones'] } 
            },
            select: {
                idempleado: true,
                nombre_completo_empleado: true,
                sueldo: true,
                sueldo_fiscal: true,
                infonavit_mensual: true,
                vales_despensa_pct: true,
                fondo_ahorro_pct: true,
                rfc: true,
                curp: true
            }
        });

        const previa = empleados.map(emp => {
            const sueldoBase = Number(emp.sueldo || 0);
            const sueldoFiscal = Number(emp.sueldo_fiscal || 0);
            
            const fondoAhorro = sueldoBase * (Number(emp.fondo_ahorro_pct || 0) / 100);
            const valesDespensa = sueldoBase * (Number(emp.vales_despensa_pct || 0) / 100);
            const infonavit = Number(emp.infonavit_mensual || 0) / 2; // quincenal
            const imssObrero = calcularImssObrero(sueldoFiscal) / 2; // quincenal
            const isr = calcularISREstimado(sueldoFiscal) / 2; // quincenal

            const totalDeducciones = fondoAhorro + infonavit + imssObrero + isr;
            const totalPercep = sueldoBase + valesDespensa;
            const totalPagado = totalPercep - totalDeducciones;

            return {
                idempleado: emp.idempleado,
                nombre: emp.nombre_completo_empleado,
                rfc: emp.rfc,
                sueldo_base: sueldoBase,
                sueldo_fiscal: sueldoFiscal,
                fondo_ahorro: +fondoAhorro.toFixed(2),
                vales_despensa: +valesDespensa.toFixed(2),
                infonavit: +infonavit.toFixed(2),
                imss_obrero: +imssObrero.toFixed(2),
                isr_estimado: +isr.toFixed(2),
                total_percepciones: +totalPercep.toFixed(2),
                total_deducciones: +totalDeducciones.toFixed(2),
                total_pagado: +totalPagado.toFixed(2),
                // Para manipulación en frontend
                bonos: 0,
                deducciones_extra: 0
            };
        });

        res.json(previa);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular previa' });
    }
};

// ── POST /api/nominas/lote ─────────────────────────────────────────────────
export const crearLoteNomina = async (req: Request, res: Response) => {
    const { periodo_inicio, periodo_fin, tipo_nomina, nominas } = req.body;
    
    try {
        // Obtener o crear los conceptos estándar
        const conceptosSeed = [
            { clave: 'P001', nombre_concepto: 'Sueldo Base', tipo: 'Percepcion', es_fiscal: true },
            { clave: 'P002', nombre_concepto: 'Vales de Despensa', tipo: 'Percepcion', es_fiscal: false },
            { clave: 'P003', nombre_concepto: 'Bonos y Compensaciones', tipo: 'Percepcion', es_fiscal: true },
            { clave: 'D001', nombre_concepto: 'Fondo de Ahorro', tipo: 'Deduccion', es_fiscal: false },
            { clave: 'D002', nombre_concepto: 'INFONAVIT', tipo: 'Deduccion', es_fiscal: false },
            { clave: 'D003', nombre_concepto: 'IMSS Obrero', tipo: 'Deduccion', es_fiscal: true },
            { clave: 'D004', nombre_concepto: 'ISR Estimado', tipo: 'Deduccion', es_fiscal: true },
            { clave: 'D005', nombre_concepto: 'Otras Deducciones', tipo: 'Deduccion', es_fiscal: false },
        ];

        // Upsert de conceptos base
        for (const c of conceptosSeed) {
            await prisma.conceptos_nomina.upsert({
                where: { clave: c.clave },
                update: {},
                create: { ...c }
            });
        }

        const conceptos = await prisma.conceptos_nomina.findMany();
        const cMap = new Map(conceptos.map(c => [c.clave, c.idconcepto]));

        const result = await (prisma as any).$transaction(async (tx: any) => {
            const loteId = `LOTE-${Date.now()}`;
            const totalLote = nominas.reduce((acc: number, curr: any) => acc + curr.total_pagado, 0);

            const lote = await tx.lotes_nomina.create({
                data: {
                    id_lote: loteId,
                    periodo_inicio: new Date(periodo_inicio),
                    periodo_fin: new Date(periodo_fin),
                    tipo_nomina,
                    total_lote: totalLote,
                    estatus: 'Cerrado'
                }
            });

            for (const n of nominas) {
                const nomina = await tx.nominas.create({
                    data: {
                        idempleado: n.idempleado,
                        lote_id: loteId,
                        fecha_emision: new Date(),
                        fecha_inicio: new Date(periodo_inicio),
                        fecha_fin: new Date(periodo_fin),
                        sueldo_base: n.sueldo_base,
                        bonos: (n.bonos || 0) + (n.vales_despensa || 0),
                        deducciones: (n.fondo_ahorro || 0) + (n.infonavit || 0) + (n.imss_obrero || 0) + (n.isr_estimado || 0) + (n.deducciones_extra || 0),
                        total_pagado: n.total_pagado,
                        estado: 'Pagado'
                    }
                });

                // Guardar detalles por concepto
                const detalles = [
                    { clave: 'P001', monto: n.sueldo_base },
                    { clave: 'P002', monto: n.vales_despensa || 0 },
                    { clave: 'P003', monto: n.bonos || 0 },
                    { clave: 'D001', monto: n.fondo_ahorro || 0 },
                    { clave: 'D002', monto: n.infonavit || 0 },
                    { clave: 'D003', monto: n.imss_obrero || 0 },
                    { clave: 'D004', monto: n.isr_estimado || 0 },
                    { clave: 'D005', monto: n.deducciones_extra || 0 },
                ].filter(d => d.monto > 0);

                if (detalles.length > 0) {
                    await tx.detalles_nomina.createMany({
                        data: detalles.map(d => ({
                            idnomina: nomina.idnomina,
                            idconcepto: cMap.get(d.clave)!,
                            monto_aplicado: d.monto
                        }))
                    });
                }
            }

            return lote;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear lote' });
    }
};

// ── GET /api/nominas/lotes ─────────────────────────────────────────────────
export const getLotesNomina = async (req: Request, res: Response) => {
    try {
        const lotes = await prisma.lotes_nomina.findMany({
            orderBy: { fecha_creacion: 'desc' }
        });
        res.json(lotes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener lotes' });
    }
};

// ── GET /api/nominas/lote/:idlote ─────────────────────────────────────────
export const getNominasPorLote = async (req: Request, res: Response) => {
    const { idlote } = req.params;
    try {
        const nominas = await prisma.nominas.findMany({
            where: { lote_id: idlote as string },
            include: { empleados: true, detalles_nomina: { include: { conceptos_nomina: true } } }
        });
        res.json(nominas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener nóminas del lote' });
    }
};

// ── GET /api/nominas/mis-nominas ──────────────────────────────────────────
export const getMisNominas = async (req: Request, res: Response) => {
    const idempleado = (req as any).user?.id;
    
    if (!idempleado) {
        return res.status(401).json({ error: 'No autorizado' });
    }

    try {
        const nominas = await prisma.nominas.findMany({
            where: { idempleado: parseInt(idempleado) },
            include: { lotes_nomina: true },
            orderBy: { fecha_inicio: 'desc' }
        });
        res.json(nominas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener mis nóminas' });
    }
};

// ── GET /api/nominas/:idnomina/pdf ────────────────────────────────────────
export const descargarPDFNomina = async (req: Request, res: Response) => {
    const { idnomina } = req.params;
    try {
        console.log('Solicitando PDF para ID:', idnomina);
        const nomina = await prisma.nominas.findUnique({
            where: { idnomina: parseInt(idnomina as string) },
            include: { 
                empleados: true, 
                lotes_nomina: true,
                detalles_nomina: { include: { conceptos_nomina: true } }
            }
        });

        if (!nomina) {
            console.log('Nómina no encontrada');
            return res.status(404).json({ error: 'Nómina no encontrada' });
        }

        console.log('Iniciando generación de PDF...');
        await generatePayrollPDF(res, nomina);
        console.log('PDF enviado con éxito');
    } catch (error: any) {
        console.error('ERROR CRÍTICO PDF:', error);
        res.status(500).json({ 
            error: 'Error al generar PDF', 
            details: error.message,
            stack: error.stack 
        });
    }
};

// ── GET /api/nominas/config/company-name ──────────────────────────────────
export const getCompanyName = async (req: Request, res: Response) => {
    try {
        const config = await prisma.sys_config.findUnique({ where: { key: 'COMPANY_NAME' } });
        res.json({ companyName: config?.value || 'STARTIA' });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener nombre de empresa' });
    }
};

// ── PUT /api/nominas/config/company-name ──────────────────────────────────
export const updateCompanyName = async (req: Request, res: Response) => {
    const { companyName } = req.body;
    try {
        await prisma.sys_config.upsert({
            where: { key: 'COMPANY_NAME' },
            update: { value: companyName },
            create: { key: 'COMPANY_NAME', value: companyName }
        });
        res.json({ message: 'Nombre de empresa actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar nombre de empresa' });
    }
};
