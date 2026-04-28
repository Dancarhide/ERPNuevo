/**
 * seed-demo-users.ts
 * Crea 5 empleados de prueba por cada rol existente en la base de datos.
 *
 * Ejecutar con:
 *   npm run db:seed:demo
 *
 * - Lee los roles directamente de la BD (no hardcodeados)
 * - Genera nombres, emails y usernames únicos automáticamente
 * - Es seguro correrlo varias veces: omite empleados si el email ya existe
 * - Todos los usuarios de prueba tienen la contraseña: Demo1234!
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Pool de nombres mexicanos para generar empleados realistas ───────────────

const NOMBRES = [
    'Alejandro', 'Andrés', 'Beatriz', 'Carlos', 'Carmen',
    'Daniel', 'Diana', 'Eduardo', 'Elena', 'Fernando',
    'Gabriela', 'Gerardo', 'Isabel', 'Javier', 'Jessica',
    'Jorge', 'José', 'Karen', 'Laura', 'Luis',
    'Mariana', 'Mario', 'Miguel', 'Mónica', 'Natalia',
    'Oscar', 'Patricia', 'Pedro', 'Raúl', 'Ricardo',
    'Rosa', 'Sandra', 'Sergio', 'Sofía', 'Valentina',
];

const APELLIDOS = [
    'García', 'Hernández', 'López', 'Martínez', 'González',
    'Pérez', 'Rodríguez', 'Sánchez', 'Ramírez', 'Torres',
    'Flores', 'Rivera', 'Gómez', 'Díaz', 'Reyes',
    'Cruz', 'Morales', 'Ortiz', 'Gutiérrez', 'Chávez',
    'Ramos', 'Vargas', 'Castillo', 'Jiménez', 'Moreno',
];

const PUESTOS_POR_ROL: Record<string, string[]> = {
    'Admin':           ['Administrador del Sistema', 'Superusuario', 'Administrador TI', 'Admin ERP', 'Soporte TI'],
    'RH':              ['Coordinador RH', 'Analista de Personal', 'Especialista RRHH', 'Reclutador', 'Gestor de Talento'],
    'Directivo':       ['Director General', 'Director Operativo', 'Director Comercial', 'Director Financiero', 'Subdirector'],
    'Jefe de Area':    ['Jefe de Producción', 'Jefe de Logística', 'Jefe de Operaciones', 'Jefe de Planta', 'Supervisor Senior'],
    'Contador':        ['Contador General', 'Analista Fiscal', 'Auxiliar Contable', 'Contador Junior', 'Especialista Fiscal'],
    'Empleado Normal': ['Operador', 'Auxiliar General', 'Técnico', 'Asistente', 'Analista Jr'],
    'Externo':         ['Consultor Externo', 'Asesor', 'Proveedor', 'Auditor Externo', 'Colaborador Freelance'],
};

const SUELDOS_POR_ROL: Record<string, [number, number]> = {
    'Admin':           [18000, 25000],
    'RH':              [14000, 20000],
    'Directivo':       [40000, 80000],
    'Jefe de Area':    [20000, 35000],
    'Contador':        [16000, 28000],
    'Empleado Normal': [10000, 16000],
    'Externo':         [8000,  15000],
};

const DEMO_PASSWORD = 'Demo1234!';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Selecciona un elemento aleatorio de un array */
function pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/** Genera un número entre min y max (inclusive) */
function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Genera un email único basado en nombre + apellido + número */
function generarEmail(nombre: string, apellido: string, index: number): string {
    const n = nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quita tildes
        .replace(/\s+/g, '.');
    const a = apellido.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '.');
    // Añadimos un número para evitar colisiones
    return `${n}.${a}.${index}@demo.erp`;
}

/** Genera un username único */
function generarUsername(nombre: string, apellido: string, index: number): string {
    const n = nombre.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const a = apellido.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return `${n}.${a}${index}`;
}

/** Genera una CURP de formato válido (simulada) */
function generarCurp(nombre: string, apellido: string): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const n = nombre[0].toUpperCase();
    const a = apellido[0].toUpperCase();
    const year = randInt(70, 99);
    const month = String(randInt(1, 12)).padStart(2, '0');
    const day   = String(randInt(1, 28)).padStart(2, '0');
    const state = pick(['DF', 'JA', 'NL', 'BC', 'VE', 'PU', 'ME']);
    const sex   = pick(['H', 'M']);
    const rand4 = Array.from({ length: 4 }, () => pick([...chars, ...digits])).join('');
    return `${n}${a}X${year}${month}${day}${sex}${state}${rand4}`.substring(0, 18);
}

// ─── Seed principal ───────────────────────────────────────────────────────────

async function main() {
    console.log('\n👥 Iniciando seed de usuarios de demostración...\n');
    console.log(`🔐 Contraseña para todos los usuarios demo: ${DEMO_PASSWORD}\n`);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    // 1. Leer todos los roles de la BD
    const roles = await prisma.roles.findMany({
        include: { areas: true }
    });

    if (roles.length === 0) {
        console.error('❌ No hay roles en la base de datos. Corre primero: npm run db:seed');
        process.exit(1);
    }

    console.log(`📋 Roles encontrados: ${roles.map(r => r.nombre_rol).join(', ')}\n`);

    // ─── Crear el usuario Admin específico solicitado ────────────────────────
    const adminEmail = 'Sistemas@Startia.com';
    const adminPassword = 'StartiaSistemas_123';
    const adminRol = roles.find(r => r.nombre_rol === 'Admin');

    if (adminRol) {
        const existeAdmin = await prisma.empleados.findFirst({
            where: { email_empleado: adminEmail }
        });

        if (!existeAdmin) {
            console.log(`👤 Creando usuario administrador especial: ${adminEmail}`);
            const adminHash = await bcrypt.hash(adminPassword, 10);
            const adminPuesto = 'Administrador del Sistema';
            const adminSueldo = 25000;

            const empleadoAdmin = await prisma.empleados.create({
                data: {
                    nombre_completo_empleado: 'Administrador Startia',
                    email_empleado: adminEmail,
                    idrol: adminRol.idrol,
                    idarea: adminRol.idarea ?? null,
                    estatus_empleado: 'Activo',
                    sueldo: adminSueldo,
                    puesto: adminPuesto,
                    dias_vacaciones_disponibles: 15,
                    curp: generarCurp('Admin', 'Startia'),
                    fecha_ingreso: new Date(),
                }
            });

            await prisma.credenciales.create({
                data: {
                    idempleado: empleadoAdmin.idempleado,
                    username: 'sistemas.admin',
                    user_password: adminHash,
                }
            });
            console.log(`   ✅ Administrador creado con éxito: ${adminEmail}\n`);
        } else {
            console.log(`   ⏭  El usuario administrador especial ya existe: ${adminEmail}\n`);
        }
    } else {
        console.log(`   ⚠️  No se encontró el rol 'Admin', no se pudo crear el usuario especial.\n`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    let totalCreados = 0;
    let totalOmitidos = 0;
    let globalIndex = 1; // índice global para evitar colisiones de email/username

    for (const rol of roles) {
        const rolNombre = rol.nombre_rol ?? 'Empleado Normal';
        const puestosDisponibles = PUESTOS_POR_ROL[rolNombre] ?? ['Empleado'];
        const [sueldoMin, sueldoMax] = SUELDOS_POR_ROL[rolNombre] ?? [10000, 15000];

        console.log(`\n🎭 Rol: ${rolNombre} (ID: ${rol.idrol})`);

        for (let i = 0; i < 5; i++) {
            const nombre   = pick(NOMBRES);
            const apellido = pick(APELLIDOS);
            const email    = generarEmail(nombre, apellido, globalIndex);
            const username = generarUsername(nombre, apellido, globalIndex);
            const puesto   = puestosDisponibles[i % puestosDisponibles.length];
            const sueldo   = randInt(sueldoMin, sueldoMax);
            const curp     = generarCurp(nombre, apellido);

            globalIndex++;

            // Verificar si el email ya existe
            const existe = await prisma.empleados.findFirst({
                where: { email_empleado: email }
            });

            if (existe) {
                console.log(`   ⏭  Omitido (ya existe): ${nombre} ${apellido} <${email}>`);
                totalOmitidos++;
                continue;
            }

            // Crear empleado
            const empleado = await prisma.empleados.create({
                data: {
                    nombre_completo_empleado: `${nombre} ${apellido}`,
                    email_empleado:           email,
                    idrol:                    rol.idrol,
                    idarea:                   rol.idarea ?? null,
                    estatus_empleado:         'Activo',
                    sueldo:                   sueldo,
                    puesto:                   puesto,
                    dias_vacaciones_disponibles: 12,
                    curp,
                    fecha_ingreso: new Date(
                        new Date().setMonth(new Date().getMonth() - randInt(1, 36))
                    ),
                }
            });

            // Crear credenciales
            await prisma.credenciales.create({
                data: {
                    idempleado:    empleado.idempleado,
                    username:      username,
                    user_password: passwordHash,
                }
            });

            console.log(`   ✅ ${nombre} ${apellido} | ${puesto} | $${sueldo.toLocaleString()} | ${email}`);
            totalCreados++;
        }
    }

    // ─── Resumen ─────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60));
    console.log('✨ Seed de usuarios demo completado!');
    console.log('═'.repeat(60));
    console.log(`  Roles procesados:      ${roles.length}`);
    console.log(`  Usuarios creados:      ${totalCreados}`);
    console.log(`  Usuarios omitidos:     ${totalOmitidos} (ya existían)`);
    console.log(`  Contraseña global:     ${DEMO_PASSWORD}`);
    console.log('═'.repeat(60));
    console.log('\n💡 Tip: Puedes hacer login con cualquier email @demo.erp');
    console.log('   Formato: nombre.apellido.N@demo.erp\n');
}

main()
    .catch((e) => {
        console.error('❌ Error en seed de demo:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
