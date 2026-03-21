import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    console.log('Fixing roles assignment...');
    
    // 1. Ensure idempleado 1 is Admin
    await prisma.empleados.update({
        where: { idempleado: 1 },
        data: { idrol: 1 }
    });
    
    // 2. Ensure any user with "admin" in email is also Admin for safety
    await prisma.empleados.updateMany({
        where: { email_empleado: { contains: 'admin' } },
        data: { idrol: 1 }
    });

    console.log('Roles assignment fixed.');
  } catch (e) {
    console.error('Error fixing roles:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
