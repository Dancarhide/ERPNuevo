import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

async function main() {
  try {
    const admin = await prisma.empleados.findFirst({
        where: { idempleado: 1 }
    });
    console.log('Admin Candidate:', admin?.nombre_completo_empleado, admin?.email_empleado, 'Role ID:', admin?.idrol);
    
    // Also check for any user that might be the admin
    const anyAdmin = await prisma.empleados.findMany({
        where: { OR: [ { email_empleado: { contains: 'admin' } }, { nombre_completo_empleado: { contains: 'Admin' } } ] }
    });
    console.log('Other Admin Candidates:', anyAdmin.map(a => `${a.email_empleado} (Role: ${a.idrol})`));

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
