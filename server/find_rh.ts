import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const rhUsers = await prisma.empleados.findMany({
      where: { idrol: 2 },
      select: {
          idempleado: true,
          nombre_completo_empleado: true,
          email_empleado: true
      }
    });
    console.log('RH Users:', JSON.stringify(rhUsers, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
