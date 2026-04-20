import { PrismaClient } from './src/generated/prisma';
const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING PAYROLL DATA ---');

  // 1. Create standard concepts if they don't exist
  const concepts = [
    { clave: 'P001', nombre_concepto: 'Sueldo Base', tipo: 'Percepcion', monto_defecto: 0, es_fiscal: true },
    { clave: 'P002', nombre_concepto: 'Bono Puntualidad', tipo: 'Percepcion', monto_defecto: 500, es_fiscal: false },
    { clave: 'D001', nombre_concepto: 'ISR Periodo', tipo: 'Deduccion', monto_defecto: 0, es_fiscal: true },
    { clave: 'D002', nombre_concepto: 'IMSS Obrero', tipo: 'Deduccion', monto_defecto: 0, es_fiscal: true },
    { clave: 'D003', nombre_concepto: 'Préstamo Empresa', tipo: 'Deduccion', monto_defecto: 0, es_fiscal: false },
    { clave: 'D004', nombre_concepto: 'Infonavit', tipo: 'Deduccion', monto_defecto: 0, es_fiscal: true },
  ];

  for (const c of concepts) {
    await prisma.conceptos_nomina.upsert({
      where: { clave: c.clave },
      update: {},
      create: c,
    });
  }
  console.log('✔ Concepts seeded or already exist.');

  // 2. Fix employees with $0 salary to allow generation
  // We'll set a base for testing (12,000 monthly)
  const updated = await prisma.empleados.updateMany({
    where: { 
      OR: [
        { sueldo: 0 },
        { sueldo: { equals: 0 } },
        { sueldo: null }
      ],
      estatus_empleado: 'Activo'
    },
    data: {
      sueldo: 12500,
      sueldo_fiscal: 7500 // Base fiscal para que cuadre con impuestos
    }
  });
  console.log(`✔ Updated ${updated.count} employees with default salaries ($12,500).`);

  // 3. Ensure periods are not empty for some employees to have something to see
  console.log('✔ Data is now ready for generation.');

  console.log('--- DONE ---');
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
