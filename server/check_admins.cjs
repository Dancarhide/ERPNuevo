const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.empleados.findMany({
    where: {
      roles: {
        nombre_rol: {
          in: ['Administrador', 'Admin', 'RH', 'Recursos Humanos', 'Gerente']
        }
      }
    },
    include: {
      roles: true
    }
  });

  console.log(users.map(u => ({
    nombre: u.nombre_completo_empleado,
    email: u.email_empleado,
    rol: u.roles.nombre_rol
  })));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
