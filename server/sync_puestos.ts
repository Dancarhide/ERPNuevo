import { PrismaClient } from './src/generated/prisma';

const prisma = new PrismaClient();

async function syncPuestos() {
    console.log('--- Iniciando Sincronización de Puestos ---');

    // 1. Obtener puestos únicos de empleados
    const empleados = await prisma.empleados.findMany({
        where: { NOT: { puesto: null } },
        select: { puesto: true }
    });

    const uniquePuestos = Array.from(new Set(empleados.map(e => e.puesto).filter(Boolean)));

    for (const pName of uniquePuestos) {
        if (!pName) continue;
        
        // Crear el puesto si no existe
        const puesto = await prisma.puestos.upsert({
            where: { idpuesto: 0 }, // Dummy where for upsert without unique name (better use findFirst + create)
            update: {},
            create: {
                nombre_puesto: pName,
                cupo_maximo: 5, // Default for now
            },
        });
        
        // This is a bit brute force because puestos doesn't have a unique name yet in my schema
        // Fixed: Use findUnique/findFirst
    }

    // Refactored logic:
    for (const pName of uniquePuestos) {
        if (!pName) continue;
        let p = await prisma.puestos.findFirst({ where: { nombre_puesto: pName } });
        if (!p) {
            p = await prisma.puestos.create({
                data: {
                    nombre_puesto: pName,
                    cupo_maximo: 10,
                    descripcion: `Puesto de ${pName} migrado automáticamente.`
                }
            });
            console.log(`Puesto creado: ${pName}`);
        }

        // Actualizar empleados
        await prisma.empleados.updateMany({
            where: { puesto: pName },
            data: { idpuesto: p.idpuesto }
        });
        console.log(`Empleados vinculados a: ${pName}`);
    }

    // 2. Actualizar personal_actual en tiempo real
    const allPuestos = await prisma.puestos.findMany({ include: { empleados: true } });
    for (const p of allPuestos) {
        await prisma.puestos.update({
            where: { idpuesto: p.idpuesto },
            data: { personal_actual: p.empleados.length }
        });
    }

    console.log('--- Sincronización Completada ---');
}

syncPuestos()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
