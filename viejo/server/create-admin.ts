import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando creación de usuario administrador...');

    // 1. Buscar o crear el rol Admin
    let adminRol = await prisma.roles.findFirst({
        where: { nombre_rol: 'Admin' }
    });

    if (!adminRol) {
        console.log('Rol Admin no encontrado, creándolo...');
        adminRol = await prisma.roles.create({
            data: {
                nombre_rol: 'Admin',
                desc_rol: 'Administrador del Sistema',
                is_system: true,
                hierarchy_level: 0
            }
        });
        console.log('✅ Rol Admin creado con ID:', adminRol.idrol);
    } else {
        console.log('✅ Rol Admin encontrado con ID:', adminRol.idrol);
    }

    // 2. Buscar o crear el empleado
    const email = 'Sistemas@Startia.com';
    const password = 'StartiaSistemas_123';
    
    let user = await prisma.empleados.findFirst({
        where: { email_empleado: email }
    });

    if (!user) {
        console.log(`Usuario no encontrado, creando: ${email}`);
        user = await prisma.empleados.create({
            data: {
                nombre_completo_empleado: 'Administrador de Sistemas Startia',
                email_empleado: email,
                idrol: adminRol.idrol,
                estatus_empleado: 'Activo',
                sueldo: 25000,
                puesto: 'Administrador TI',
                curp: 'ADMI900101HMCXRR01',
                fecha_ingreso: new Date()
            }
        });
        console.log('✅ Usuario Admin creado con ID:', user.idempleado);
        
        // 3. Crear credenciales
        console.log('Generando hash de contraseña...');
        const passwordHash = await bcrypt.hash(password, 10);
        
        await prisma.credenciales.create({
            data: {
                idempleado: user.idempleado,
                username: 'sistemas.startia',
                user_password: passwordHash
            }
        });
        console.log('✅ Credenciales creadas con éxito.');
    } else {
        console.log('✅ El usuario ya existe en la base de datos.');
        // Opcional: Actualizar contraseña si ya existe
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.credenciales.updateMany({
            where: { idempleado: user.idempleado },
            data: { user_password: passwordHash }
        });
        console.log('🔄 Contraseña actualizada para el usuario existente.');
    }

    console.log('🎉 Proceso completado exitosamente.');
}

main()
  .catch(e => {
      console.error('❌ Error:', e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });
