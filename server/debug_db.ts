import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const empleados = await prisma.empleados.findMany({
      select: {
        idempleado: true,
        nombre_completo_empleado: true,
        idrol: true,
        email_empleado: true
      },
      take: 10
    });
    console.log('Sample Employees:', JSON.stringify(empleados, null, 2));
    
    const roles = await prisma.roles.findMany();
    console.log('Roles in DB:', JSON.stringify(roles, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
