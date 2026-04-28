import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';
import { generatePayrollPDF } from '../Services/nominaPDFService';

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
            const infonavit = Number(emp.infonavit_mensual || 0) / 2; 
            
            const totalPagado = sueldoBase + valesDespensa - fondoAhorro - infonavit;

            return {
                idempleado: emp.idempleado,
                nombre: emp.nombre_completo_empleado,
                rfc: emp.rfc,
                sueldo_base: sueldoBase,
                sueldo_fiscal: sueldoFiscal,
                fondo_ahorro: fondoAhorro,
                vales_despensa: vales_despensa,
                infonavit: infonavit,
                total_pagado: totalPagado
            };
        });

        res.json(previa);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al calcular previa' });
    }
};

export const crearLoteNomina = async (req: Request, res: Response) => {
    const { periodo_inicio, periodo_fin, tipo_nomina, nominas } = req.body;
    
    try {
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

            const nominasData = nominas.map((n: any) => ({
                idempleado: n.idempleado,
                lote_id: loteId,
                fecha_emision: new Date(),
                fecha_inicio: new Date(periodo_inicio),
                fecha_fin: new Date(periodo_fin),
                sueldo_base: n.sueldo_base,
                bonos: n.bonos || 0,
                deducciones: n.deducciones || 0,
                total_pagado: n.total_pagado,
                estado: 'Pagado'
            }));

            await tx.nominas.createMany({
                data: nominasData
            });

            return lote;
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al crear lote' });
    }
};

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

export const getNominasPorLote = async (req: Request, res: Response) => {
    const { idlote } = req.params;
    try {
        const nominas = await prisma.nominas.findMany({
            where: { lote_id: idlote },
            include: { empleados: true }
        });
        res.json(nominas);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener nóminas del lote' });
    }
};

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

export const descargarPDFNomina = async (req: Request, res: Response) => {
    const { idnomina } = req.params;
    try {
        console.log('Solicitando PDF para ID:', idnomina);
        const nomina = await prisma.nominas.findUnique({
            where: { idnomina: parseInt(idnomina) },
            include: { empleados: true, lotes_nomina: true }
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

export const getCompanyName = async (req: Request, res: Response) => {
    try {
        const config = await prisma.sys_config.findUnique({ where: { key: 'COMPANY_NAME' } });
        res.json({ companyName: config?.value || 'STARTIA' });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener nombre de empresa' });
    }
};

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
