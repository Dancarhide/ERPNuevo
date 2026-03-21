import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const roles = [
      { idrol: 1, nombre_rol: 'Admin', description: 'Todo', hierarchy_level: 1 },
      { idrol: 2, nombre_rol: 'RH', description: 'CRUD empleados, Aprobar o denegar vacaciones y proceso de captacion de induccion y captacion', hierarchy_level: 2 },
      { idrol: 3, nombre_rol: 'Directivo', description: 'Ver KPIS (aun no existen)', hierarchy_level: 3 },
      { idrol: 4, nombre_rol: 'Jefe de Area', description: 'Ver sus empleados que estan bajo el en el organigrama', hierarchy_level: 4 },
      { idrol: 5, nombre_rol: 'Contador', description: 'Funciones de empleado + Nominas', hierarchy_level: 5 },
      { idrol: 6, nombre_rol: 'Empleado Normal', description: 'Puede ver su pago de nomina', hierarchy_level: 6 },
      { idrol: 7, nombre_rol: 'Externo', description: 'Configurado por el admin', hierarchy_level: 7 },
    ];

    console.log('Clearing existing role-related data...');
    // We might have dependencies, so we use a transaction and raw SQL to force IDs
    await prisma.$transaction(async (tx) => {
      // 1. Temporarily set all employees to null role to avoid FK issues
      await tx.$executeRawUnsafe('UPDATE empleados SET idrol = NULL');
      
      // 2. Clear role-related tables
      await tx.$executeRawUnsafe('DELETE FROM role_permissions');
      await tx.$executeRawUnsafe('DELETE FROM field_permissions');
      await tx.$executeRawUnsafe('DELETE FROM roles');

      // 3. Insert new roles with explicit IDs
      for (const role of roles) {
        // Using OVERRIDING SYSTEM VALUE for Postgres identity columns if needed
        // Or just using standard insert if they are just serials. 
        // We'll try a more robust approach.
        try {
          await tx.$executeRawUnsafe(
            `INSERT INTO roles (idrol, nombre_rol, description, hierarchy_level, is_system) OVERRIDING SYSTEM VALUE VALUES ($1, $2, $3, $4, $5)`,
            role.idrol, role.nombre_rol, role.description, role.hierarchy_level, true
          );
        } catch (err) {
            // Fallback for non-identity columns
            await tx.$executeRawUnsafe(
                `INSERT INTO roles (idrol, nombre_rol, description, hierarchy_level, is_system) VALUES ($1, $2, $3, $4, $5)`,
                role.idrol, role.nombre_rol, role.description, role.hierarchy_level, true
            );
        }
      }

      // 4. Reset serial sequence for roles table
      await tx.$executeRawUnsafe("SELECT setval(pg_get_serial_sequence('roles', 'idrol'), (SELECT MAX(idrol) FROM roles))");
      
      // 5. Re-assign at least one admin if possible. 
      // For now, let's just assign any employee with ID 1 to Admin if they exist.
      await tx.$executeRawUnsafe('UPDATE empleados SET idrol = 1 WHERE idempleado = 1');
      // Set everyone else to Empleado Normal (ID 6) for safety if they were active
      await tx.$executeRawUnsafe('UPDATE empleados SET idrol = 6 WHERE idrol IS NULL');
    });

    console.log('Roles updated successfully.');
  } catch (e) {
    console.error('Error updating roles:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
