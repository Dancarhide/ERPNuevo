import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const rolesData = [
      { id: 1, name: 'Admin', desc: 'Todo', level: 1 },
      { id: 2, name: 'RH', desc: 'CRUD empleados, Aprobar o denegar vacaciones y proceso de captacion de induccion y captacion', level: 2 },
      { id: 3, name: 'Directivo', desc: 'Ver KPIS (aun no existen)', level: 3 },
      { id: 4, name: 'Jefe de Area', desc: 'Ver sus empleados que estan bajo el en el organigrama', level: 4 },
      { id: 5, name: 'Contador', desc: 'Funciones de empleado + Nominas', level: 5 },
      { id: 6, name: 'Empleado Normal', desc: 'Puede ver su pago de nomina', level: 6 },
      { id: 7, name: 'Externo', desc: 'Configurado por el admin', level: 7 },
    ];

    await prisma.$transaction(async (tx) => {
      // 1. Unset roles
      await tx.$executeRawUnsafe('UPDATE empleados SET idrol = NULL');
      
      // 2. Delete everything
      await tx.$executeRawUnsafe('DELETE FROM role_permissions');
      await tx.$executeRawUnsafe('DELETE FROM field_permissions');
      await tx.$executeRawUnsafe('DELETE FROM roles');

      // 3. Insert with explicit IDs
      for (const r of rolesData) {
        // We use OVERRIDING SYSTEM VALUE for Postgres identity columns
        await tx.$executeRawUnsafe(
          `INSERT INTO roles (idrol, nombre_rol, description, hierarchy_level, is_system) 
           OVERRIDING SYSTEM VALUE 
           VALUES ($1, $2, $3, $4, $5)`,
          r.id, r.name, r.desc, r.level, true
        );
      }

      // 4. Reset sequence
      await tx.$executeRawUnsafe("SELECT setval(pg_get_serial_sequence('roles', 'idrol'), (SELECT MAX(idrol) FROM roles))");

      // 5. Assign roles to users
      // Roberto (1) -> Admin (1)
      await tx.empleados.update({ where: { idempleado: 1 }, data: { idrol: 1 } });
      
      // Assign someone to RH (idrol 2) - maybe idempleado 2
      await tx.empleados.update({ where: { idempleado: 2 }, data: { idrol: 2 } });
      
      // Anyone else with "admin" in email -> Admin
      await tx.empleados.updateMany({
        where: { email_empleado: { contains: 'admin' }, NOT: { idempleado: 1 } },
        data: { idrol: 1 }
      });

      // Default everyone else to 6
      await tx.$executeRawUnsafe('UPDATE empleados SET idrol = 6 WHERE idrol IS NULL');
    });

    console.log('RE-SYNC COMPLETED SUCCESSFULLY');
  } catch (e) {
    console.error('FAILED TO RE-SYNC:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
