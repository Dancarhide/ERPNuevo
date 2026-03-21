import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const empleados = await prisma.empleados.findMany({
        where: { idrol: 6 },
        take: 10
    });
    
    for (let i = 0; i < empleados.length; i++) {
        // Assign roles 2, 3, 4, 5 to some users
        const newRole = (i % 4) + 2; 
        await prisma.empleados.update({
            where: { idempleado: empleados[i].idempleado },
            data: { idrol: newRole }
        });
    }
    console.log('Distributed some roles.');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
