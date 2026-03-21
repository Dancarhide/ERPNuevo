import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { idrol: 'asc' }
    });
    console.log('--- ROLES ---');
    roles.forEach(r => {
      console.log(`ID: ${r.idrol} | Name: ${r.nombre_rol}`);
    });

    const empleados = await prisma.empleados.findMany({
      select: {
        idempleado: true,
        nombre_completo_empleado: true,
        idrol: true
      },
      take: 5
    });
    console.log('--- EMPLEADOS ---');
    empleados.forEach(e => {
        console.log(`Emp ID: ${e.idempleado} | Name: ${e.nombre_completo_empleado} | Role ID: ${e.idrol}`);
    });
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
