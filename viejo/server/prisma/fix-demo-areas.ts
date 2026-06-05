/**
 * fix-demo-areas.ts
 * Asigna áreas a los empleados de demostración y define jefes de área
 * basándose en el rol y hierarchy_level de cada empleado.
 *
 * Lógica:
 * - Admin / Directivo → Dirección General (área 1)
 * - RH                → Recursos Humanos (área 2)
 * - Contador          → Administración y Finanzas (área 3)
 * - Jefe de Area      → Operaciones y Producción (área 4)
 * - Empleado Normal   → Operaciones y Producción (área 4)
 * - Externo           → Tecnología y Sistemas (área 5)
 *
 * También establece el jefe_area de cada área como el empleado
 * con el hierarchy_level más bajo (más senior) en esa área.
 *
 * Ejecutar con:
 *   npx tsx --env-file=.env prisma/fix-demo-areas.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n🔧 Asignando áreas a empleados de demo...\n');

    // 1. Obtener áreas
    const areas = await prisma.areas.findMany();
    const areaMap = new Map(areas.map(a => [a.nombre_area ?? '', a.idarea]));

    const DIR_GRAL = areaMap.get('Dirección General')!;
    const RH       = areaMap.get('Recursos Humanos')!;
    const ADMIN_FIN = areaMap.get('Administración y Finanzas')!;
    const OPS      = areaMap.get('Operaciones y Producción')!;
    const TI       = areaMap.get('Tecnología y Sistemas')!;

    // 2. Obtener todos los roles
    const roles = await prisma.roles.findMany();
    const rolMap = new Map(roles.map(r => [r.nombre_rol ?? '', r]));

    console.log('📋 Áreas disponibles:');
    areas.forEach(a => console.log(`   ${a.idarea}: ${a.nombre_area}`));
    console.log('');

    // 3. Definir qué área corresponde a cada rol
    const rolToArea: Record<string, number> = {
        'Admin':           DIR_GRAL,
        'Directivo':       DIR_GRAL,
        'RH':              RH,
        'Contador':        ADMIN_FIN,
        'Jefe de Area':    OPS,
        'Empleado Normal': OPS,
        'Externo':         TI,
    };

    // 4. Actualizar idarea de todos los empleados según su rol
    let updated = 0;
    for (const [rolNombre, idarea] of Object.entries(rolToArea)) {
        const rol = rolMap.get(rolNombre);
        if (!rol) continue;

        const result = await prisma.empleados.updateMany({
            where: { idrol: rol.idrol },
            data:  { idarea },
        });
        console.log(`   ✅ ${rolNombre} (${result.count} empleados) → área ${idarea}`);
        updated += result.count;
    }

    console.log(`\n👥 Total actualizado: ${updated} empleados\n`);

    // 5. Para cada área, asignar el jefe como el empleado con el
    //    hierarchy_level más bajo (más senior) que pertenece a esa área
    console.log('👑 Asignando jefes de área...\n');

    for (const area of areas) {
        // Buscar el empleado más senior del área
        const jefeCandidate = await prisma.empleados.findFirst({
            where:   { idarea: area.idarea, estatus_empleado: 'Activo' },
            include: { roles: true },
            orderBy: { roles: { hierarchy_level: 'asc' } },
        });

        if (jefeCandidate) {
            await prisma.areas.update({
                where: { idarea: area.idarea },
                data:  { jefe_area: jefeCandidate.idempleado },
            });
            console.log(`   ✅ ${area.nombre_area}: jefe → ${jefeCandidate.nombre_completo_empleado} (${jefeCandidate.roles?.nombre_rol})`);
        } else {
            console.log(`   ⚠️  ${area.nombre_area}: sin empleados activos, jefe no asignado`);
        }
    }

    console.log('\n' + '═'.repeat(55));
    console.log('✨ Áreas y jefes configurados correctamente!');
    console.log('═'.repeat(55));
    console.log('💡 El organigrama ahora mostrará la jerarquía real.');
    console.log('   Abre /organigrama para verlo.\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
