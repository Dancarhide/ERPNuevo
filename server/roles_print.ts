import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { idrol: 'asc' }
    });
    console.log('--- ALL ROLES IN DB ---');
    roles.forEach(r => {
      console.log(`ID:[${r.idrol}] NAME:[${r.nombre_rol}]`);
    });
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
