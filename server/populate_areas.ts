import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const areas = [
      { idarea: 1, nombre_area: 'Dirección General' },
      { idarea: 2, nombre_area: 'Recursos Humanos' },
      { idarea: 3, nombre_area: 'Administración y Finanzas' },
      { idarea: 4, nombre_area: 'Operaciones y Producción' },
      { idarea: 5, nombre_area: 'Tecnología y Sistemas' },
    ];

    console.log('🚀 Iniciando población de áreas...');

    await prisma.$transaction(async (tx) => {
      // 1. Limpiar áreas existentes (Opcional, pero para consistencia en este script forcing IDs)
      // Primero desasignamos de empleados para evitar errores de FK
      await tx.$executeRawUnsafe('UPDATE empleados SET idarea = NULL');
      await tx.$executeRawUnsafe('UPDATE roles SET idarea = NULL');
      await tx.$executeRawUnsafe('UPDATE vacantes SET idarea = NULL');
      await tx.$executeRawUnsafe('DELETE FROM areas');

      // 2. Insertar nuevas áreas
      for (const area of areas) {
        try {
          await tx.$executeRawUnsafe(
            'INSERT INTO areas (idarea, nombre_area) OVERRIDING SYSTEM VALUE VALUES ($1, $2)',
            area.idarea, area.nombre_area
          );
        } catch (err) {
            // Fallback for non-identity columns or different PG versions
            await tx.$executeRawUnsafe(
                'INSERT INTO areas (idarea, nombre_area) VALUES ($1, $2)',
                area.idarea, area.nombre_area
            );
        }
      }

      // 3. Resetear secuencia de IDs para áreas
      await tx.$executeRawUnsafe("SELECT setval(pg_get_serial_sequence('areas', 'idarea'), (SELECT MAX(idarea) FROM areas))");

      console.log('✅ Áreas creadas con éxito.');

      // 4. Mapear Roles a Áreas
      console.log('🔗 Vinculando roles a sus áreas correspondientes...');
      
      // Admin -> Dirección
      await tx.roles.updateMany({ where: { idrol: 1 }, data: { idarea: 1 } });
      // RH -> Recursos Humanos
      await tx.roles.updateMany({ where: { idrol: 2 }, data: { idarea: 2 } });
      // Directivo -> Dirección
      await tx.roles.updateMany({ where: { idrol: 3 }, data: { idarea: 1 } });
      // Jefe de Area -> Operaciones (Generalmente)
      await tx.roles.updateMany({ where: { idrol: 4 }, data: { idarea: 4 } });
      // Contador -> Administración y Finanzas
      await tx.roles.updateMany({ where: { idrol: 5 }, data: { idarea: 3 } });
      // Empleado Normal -> Operaciones
      await tx.roles.updateMany({ where: { idrol: 6 }, data: { idarea: 4 } });
      // Externo -> Operaciones
      await tx.roles.updateMany({ where: { idrol: 7 }, data: { idarea: 4 } });

      console.log('✅ Roles vinculados.');

      // 5. Asignar áreas a empleados existentes basado en su rol
      console.log('👥 Asignando áreas a empleados según su rol actual...');

      // Obtenemos todos los empleados con su rol
      const empleados = await tx.empleados.findMany({
        select: { idempleado: true, idrol: true }
      });

      for (const emp of empleados) {
        if (emp.idrol) {
          // Buscamos el idarea que tiene ese rol ahora
          const role = await tx.roles.findUnique({
            where: { idrol: emp.idrol },
            select: { idarea: true }
          });

          if (role && role.idarea) {
            await tx.empleados.update({
              where: { idempleado: emp.idempleado },
              data: { idarea: role.idarea }
            });
          }
        }
      }

      console.log('✅ Empleados asignados a sus áreas.');
    });

    console.log('✨ Proceso de población completado correctamente.');
  } catch (error) {
    console.error('❌ Error en el proceso:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
