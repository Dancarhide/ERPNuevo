import { PrismaClient } from './server/src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  try {
    const roles = await prisma.roles.findMany();
    console.log('Roles:');
    console.table(roles.map(r => ({ idrol: r.idrol, nombre: r.nombre_rol })));
    
    const employees = await prisma.empleados.findMany({
        take: 10,
        select: { idrol: true, puesto: true }
    });
    console.log('Sample Empleados:');
    console.table(employees);
  } catch (e) {
    console.error('Debug Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
