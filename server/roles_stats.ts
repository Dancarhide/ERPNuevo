import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const stats = await prisma.empleados.groupBy({
        by: ['idrol'],
        _count: { idrol: true }
    });
    console.log('Role Distribution:', JSON.stringify(stats, null, 2));
    
    const firstUsers = await prisma.empleados.findMany({
        take: 10,
        select: { idempleado: true, email_empleado: true, idrol: true }
    });
    console.log('First users:', JSON.stringify(firstUsers, null, 2));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
