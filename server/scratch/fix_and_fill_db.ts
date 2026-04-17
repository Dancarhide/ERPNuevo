import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando optimización de base de datos para Nómina Ocotlán ---');

  // 1. Asegurar que los empleados tengan un sueldo fiscal digno
  // Usamos strings para Decimal para mayor estabilidad
  const minFiscalStr = "7600.00";

  const updateResult = await prisma.empleados.updateMany({
    where: {
      OR: [
        { sueldo_fiscal: { lt: 2000 } }, 
        { sueldo_fiscal: null }
      ]
    },
    data: {
      sueldo_fiscal: minFiscalStr
    }
  });

  console.log(`✅ Se actualizaron sueldos fiscales de ${updateResult.count} empleados.`);

  // 2. Generar préstamos de prueba
  const empleadosActivos = await prisma.empleados.findMany({
    where: { estatus_empleado: 'Activo' }
  });

  let prestamosCreados = 0;
  for (const emp of empleadosActivos.slice(0, 10)) {
      const check = await prisma.prestamos.findFirst({
          where: { idempleado: emp.idempleado, estatus: 'Activo' }
      });

      if (!check) {
          await prisma.prestamos.create({
              data: {
                  idempleado: emp.idempleado,
                  monto_total: "6000.00",
                  saldo_pendiente: "3000.00",
                  abono_periodo: "500.00",
                  notas: 'Préstamo de prueba para equipo/muebles',
                  estatus: 'Activo'
              }
          });
          prestamosCreados++;
      }
  }
  console.log(`✅ Se generaron ${prestamosCreados} préstamos de prueba.`);

  // 3. Crear conceptos básicos indispensable
  const conceptosPredefinidos = [
    { clave: 'ISR', nombre_concepto: 'ISR (Retención)', tipo: 'Deduccion', es_fiscal: true, monto_defecto: "0.00" },
    { clave: 'IMSS', nombre_concepto: 'IMSS Obrero', tipo: 'Deduccion', es_fiscal: true, monto_defecto: "0.00" },
    { clave: 'VALES_D', nombre_concepto: 'Vales de Despensa (Cash)', tipo: 'Percepcion', es_fiscal: false, monto_defecto: "500.00" }
  ];

  for (const c of conceptosPredefinidos) {
    await prisma.conceptos_nomina.upsert({
      where: { clave: c.clave },
      update: {},
      create: c
    });
  }
  console.log('✅ Conceptos de nómina verificados.');

  // 4. GENERACIÓN DE NÓMINA DE PRUEBA PARA TODOS LOS ACTIVOS
  let nominasGeneradas = 0;
  for (const emp of empleadosActivos) {
      // Solo crear si no tiene ninguna
      const hasNomina = await prisma.nominas.findFirst({ where: { idempleado: emp.idempleado } });
      if (!hasNomina) {
          const sReal = Number(emp.sueldo || 10000);
          const sFiscal = Number(emp.sueldo_fiscal || 7600);
          
          await prisma.nominas.create({
              data: {
                  idempleado: emp.idempleado,
                  fecha_inicio: new Date('2024-03-16'),
                  fecha_fin: new Date('2024-03-31'),
                  sueldo_base: sReal.toString(),
                  total_pagado: sReal.toString(),
                  estado: 'Pagado',
                  metodo_pago: 'Transferencia',
                  monto_reportado_fiscal: sFiscal.toString(),
                  monto_variacion_complemento: (sReal - sFiscal).toString(),
                  dias_trabajados: 15
              }
          });
          nominasGeneradas++;
      }
  }
  console.log(`✅ Se generaron ${nominasGeneradas} recibos de historial para que todos los empleados vean datos.`);

  console.log('--- Proceso de llenado y corrección completado ---');
}

main()
  .catch((e) => {
    console.error('❌ Error detectado en el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


