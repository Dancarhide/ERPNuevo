/**
 * Utilidades para el cálculo de Nómina Profesional y Empresarial (Estilo CONTPAQi)
 * Incluye tablas de ISR 2024, Subsidio 2024, INFONAVIT y Costo Patronal.
 */

const TABLA_ISR_MENSUAL = [
    { limiteInferior: 0.01, cuotaFija: 0, porcentaje: 0.0192 },
    { limiteInferior: 895.21, cuotaFija: 17.15, porcentaje: 0.064 },
    { limiteInferior: 7599.17, cuotaFija: 446.19, porcentaje: 0.1088 },
    { limiteInferior: 13346.51, cuotaFija: 1071.43, porcentaje: 0.16 },
    { limiteInferior: 15512.94, cuotaFija: 1418.01, porcentaje: 0.1792 },
    { limiteInferior: 18546.30, cuotaFija: 1961.43, porcentaje: 0.2136 },
    { limiteInferior: 37411.91, cuotaFija: 5990.13, porcentaje: 0.2352 },
    { limiteInferior: 58922.17, cuotaFija: 11049.20, porcentaje: 0.30 },
    { limiteInferior: 112418.23, cuotaFija: 27097.90, porcentaje: 0.32 },
    { limiteInferior: 149890.99, cuotaFija: 39089.10, porcentaje: 0.34 },
    { limiteInferior: 449673.11, cuotaFija: 141014.10, porcentaje: 0.35 }
];

export const calcularISR = (ingresoMensual: number): number => {
    const rango = [...TABLA_ISR_MENSUAL].reverse().find(r => ingresoMensual >= r.limiteInferior);
    if (!rango) return 0;
    
    const excedente = ingresoMensual - rango.limiteInferior;
    const impuestoMarginal = excedente * rango.porcentaje;
    return rango.cuotaFija + impuestoMarginal;
};

/**
 * Subsidio al Empleo 2024 (Reforma Mayo 2024)
 * Si el ingreso mensual <= $9,081.00 se otorga un subsidio fijo de $390.12
 */
export const calcularSubsidio2024 = (ingresoMensual: number): number => {
    if (ingresoMensual > 0 && ingresoMensual <= 9081) {
        return 390.12;
    }
    return 0;
};

/**
 * Cálculo de IMSS Obrero (Ramas obligatorias)
 */
export const calcularIMSSObrero = (sdi: number, dias: number): number => {
    const basico = sdi * dias;
    const pctTotal = 0.02375; // ~2.375% total obrero
    return basico * pctTotal;
};

/**
 * Costo Patronal (Lo que la empresa paga adicional al sueldo)
 * Incluye IMSS Patronal, Infonavit (5%), ISN (3%)
 */
export const calcularCostoPatronal = (sdi: number, dias: number, sueldoBruto: number): number => {
    const sbc = sdi * dias;
    
    const imssPatronal = sbc * 0.22; // ~22% promedio IMSS Patronal (Riesgo Clase II)
    const infonavit = sbc * 0.05;   // 5% Infonavit
    const isn = sueldoBruto * 0.03;  // 3% Impuesto Sobre Nómina
    
    return imssPatronal + infonavit + isn;
};

export const obtenerFactorIntegracion = (fechaIngreso: string): number => {
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    const diff = hoy.getTime() - ingreso.getTime();
    const antiguedad = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    
    if (antiguedad < 1) return 1.0493;
    if (antiguedad < 2) return 1.0507;
    if (antiguedad < 3) return 1.0521;
    if (antiguedad < 4) return 1.0534;
    return 1.0548;
};

export const calcularSDI = (sueldoDiario: number, factor: number): number => {
    return sueldoDiario * factor;
};

/**
 * Provisionamiento de Aguinaldo (15 días de salario / 365) x Días del Periodo
 */
export const calcularProvisionAguinaldo = (sueldoMensual: number, diasPeriodo: number): number => {
    const sDiario = sueldoMensual / 30;
    return (sDiario * 15 / 365) * diasPeriodo;
};

/**
 * Provisionamiento de Prima Vacacional (25% de Días de Vacaciones / 365) x Días del Periodo
 */
export const calcularProvisionVacaciones = (sueldoMensual: number, factor: number, diasPeriodo: number): number => {
    const sDiario = sueldoMensual / 30;
    // Factor de integración aproximado para prima vacacional (%)
    const pctPrima = (factor - 1) * 0.8; // Fracción del factor que corresponde a prima
    return (sDiario * pctPrima) * diasPeriodo;
};


/**
 * Constantes Legales 2024
 */
export const UMA_2024 = 108.57;
export const SALARIO_MINIMO_2024 = 248.93;

/**
 * Cálculo de Vales de Despensa
 * Límite exento IMSS: 40% de la UMA mensual
 */
export const calcularValesDespensa = (sueldoFiscal: number, pct: number): number => {
    if (pct <= 0) return 0;
    const montoCalculado = sueldoFiscal * (pct / 100);
    const mensualUMA = UMA_2024 * 30.4;
    const topeMensual = mensualUMA * 0.40;
    return Math.min(montoCalculado, topeMensual);
};

/**
 * Cálculo de Fondo de Ahorro
 * Típico: 13% del sueldo, topado a 1.3 veces la UMA
 */
export const calcularFondoAhorro = (sueldoMensual: number, pct: number): number => {
    if (pct <= 0) return 0;
    const montoCalculado = sueldoMensual * (pct / 100);
    const topeMensual = (UMA_2024 * 1.3) * 30.4;
    return Math.min(montoCalculado, topeMensual);
};

/**
 * Tabla de Vacaciones Dignas (Ley 2023)
 */
export const calcularDiasVacaciones = (fechaIngreso: string): number => {
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    const diff = hoy.getTime() - ingreso.getTime();
    const años = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));

    if (años < 1) return 12;
    if (años === 1) return 12;
    if (años === 2) return 14;
    if (años === 3) return 16;
    if (años === 4) return 18;
    if (años === 5) return 20;
    if (años <= 10) return 22;
    if (años <= 15) return 24;
    if (años <= 20) return 26;
    return 30; // Máximo aproximado
};

/**
 * Validadores de Identidad Fiscal
 */
export const validarRFC = (rfc: string): boolean => {
    const re = /^[A-Z&Ñ]{3,4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[A-Z0-9]{3}$/;
    return re.test(rfc.toUpperCase());
};

export const validarCURP = (curp: string): boolean => {
    const re = /^[A-Z][AEIOUX][A-Z]{2}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM][A-Z]{2}[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z][0-9]$/;
    return re.test(curp.toUpperCase());
};
