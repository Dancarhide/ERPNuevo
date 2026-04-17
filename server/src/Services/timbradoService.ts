import { create } from 'xmlbuilder2';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

export interface TimbradoResult {
    uuid: string;
    xml: string;
    fechaTimbrado: Date;
    sello: string;
    certificado: string;
}

/**
 * Simulates the timbrado (stamping) process of a payroll receipt.
 * In a real scenario, this would call a PAC (Authorized Certification Provider) API.
 */
export const timbrarNominaSimulation = async (payoutData: any): Promise<TimbradoResult> => {
    const uuid = uuidv4().toUpperCase();
    const fechaTimbrado = new Date();
    
    // Build a mock CFDI 4.0 object
    const doc = create({ version: '1.0', encoding: 'UTF-8' })
        .ele('cfdi:Comprobante', {
            'xmlns:cfdi': 'http://www.sat.gob.mx/cfd/4',
            'xmlns:nom12': 'http://www.sat.gob.mx/nomina12',
            'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            Version: '4.0',
            Serie: 'NOM',
            Folio: payoutData.idnomina.toString(),
            Fecha: payoutData.fecha_emision?.toISOString() || new Date().toISOString(),
            Sello: 'MOCK_SELLO_' + Math.random().toString(36).substring(7),
            NoCertificado: '00001000000504465928',
            SubTotal: payoutData.sueldo_base,
            Descuento: payoutData.deducciones,
            Moneda: 'MXN',
            Total: payoutData.total_pagado,
            TipoDeComprobante: 'N',
            Exportacion: '01',
            LugarExpedicion: '45800' // Ocotlán ZIP
        })
        .ele('cfdi:Emisor', {
            Rfc: 'AAA010101AAA', // Generic SAT RFC
            Nombre: 'EMPRESA MUEBLERA OCOTLAN SA DE CV',
            RegimenFiscal: '601'
        }).up()
        .ele('cfdi:Receptor', {
            Rfc: payoutData.empleado_rfc || 'XAXX010101000',
            Nombre: payoutData.empleado_nombre,
            DomicilioFiscalReceptor: '45800',
            RegimenFiscalReceptor: '605',
            UsoCFDI: 'CN01'
        }).up()
        .ele('cfdi:Complemento')
            .ele('nom12:Nomina', {
                Version: '1.2',
                TipoNomina: 'O',
                FechaPago: payoutData.fecha_fin.toISOString().split('T')[0],
                FechaInicialPago: payoutData.fecha_inicio.toISOString().split('T')[0],
                FechaFinalPago: payoutData.fecha_fin.toISOString().split('T')[0],
                NumDiasPagados: payoutData.dias_trabajados.toString()
            })
                .ele('nom12:Emisor', { RegistroPatronal: 'MOCK-REG-123' }).up()
                .ele('nom12:Receptor', {
                    Curp: payoutData.empleado_curp || 'MOCK_CURP_123',
                    NumSeguridadSocial: '12345678901',
                    FechaInicioRelLaboral: '2020-01-01',
                    Antiguedad: 'P1Y',
                    TipoContrato: '01',
                    TipoJornada: '01',
                    TipoRegimen: '02',
                    NumEmpleado: payoutData.idempleado.toString(),
                    PeriodicidadPago: '04', // Quincenal
                    ClaveEntFed: 'JAL',
                    SalarioDiarioIntegrado: payoutData.sdi
                }).up()
            .up()
            .ele('tfd:TimbreFiscalDigital', {
                'xmlns:tfd': 'http://www.sat.gob.mx/TimbreFiscalDigital',
                Version: '1.1',
                UUID: uuid,
                FechaTimbrado: fechaTimbrado.toISOString(),
                SelloCFD: 'MOCK_SELLO_CFD_123',
                NoCertificadoSAT: '00001000000504465928'
            }).up()
        .up();

    const xml = doc.end({ prettyPrint: true });
    
    return {
        uuid,
        xml,
        fechaTimbrado,
        sello: 'MOCK_SELLO_SAT',
        certificado: '00001000000504465928'
    };
};

/**
 * Saves the generated XML to the storage directory.
 */
export const saveXmlToStorage = async (idnomina: number, xml: string): Promise<string> => {
    const storageDir = path.join(process.cwd(), 'storage', 'cfdi', 'xml');
    if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
    }
    
    const fileName = `nomina_${idnomina}_${Date.now()}.xml`;
    const filePath = path.join(storageDir, fileName);
    fs.writeFileSync(filePath, xml);
    
    return `/storage/cfdi/xml/${fileName}`;
};
