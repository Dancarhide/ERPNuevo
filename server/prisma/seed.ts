/**
 * Prisma Seed Script — ERP Sistema de Gestión
 *
 * Pobla la base de datos con todos los datos necesarios para arrancar el sistema desde cero.
 * Es IDEMPOTENTE: usa upsert para poder correr múltiples veces sin duplicar datos.
 *
 * Ejecutar con:
 *   npx prisma db seed
 *   — o —
 *   npm run db:seed
 *
 * Variables de entorno necesarias en server/.env:
 *   ADMIN_PASSWORD=<contraseña inicial del admin>
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────
// DATOS MAESTROS
// ─────────────────────────────────────────────────────────────────

const AREAS = [
    { nombre_area: 'Dirección General' },
    { nombre_area: 'Recursos Humanos' },
    { nombre_area: 'Administración y Finanzas' },
    { nombre_area: 'Operaciones y Producción' },
    { nombre_area: 'Tecnología y Sistemas' },
];

const ROLES = [
    { nombre_rol: 'Admin', desc_rol: 'Acceso total al sistema', hierarchy_level: 1, is_system: true, area_key: 'Dirección General' },
    { nombre_rol: 'RH', desc_rol: 'Gestión de personal, vacaciones y reclutamiento', hierarchy_level: 2, is_system: true, area_key: 'Recursos Humanos' },
    { nombre_rol: 'Directivo', desc_rol: 'Visualización de KPIs y reportes ejecutivos', hierarchy_level: 3, is_system: true, area_key: 'Dirección General' },
    { nombre_rol: 'Jefe de Area', desc_rol: 'Gestión de empleados a su cargo en el organigrama', hierarchy_level: 4, is_system: true, area_key: 'Operaciones y Producción' },
    { nombre_rol: 'Contador', desc_rol: 'Acceso a nóminas, conceptos y reportes fiscales', hierarchy_level: 5, is_system: true, area_key: 'Administración y Finanzas' },
    { nombre_rol: 'Empleado Normal', desc_rol: 'Acceso básico: perfil, mis nóminas, vacaciones e incidencias', hierarchy_level: 6, is_system: true, area_key: 'Operaciones y Producción' },
    { nombre_rol: 'Externo', desc_rol: 'Acceso mínimo configurable por el administrador', hierarchy_level: 7, is_system: false, area_key: 'Operaciones y Producción' },
];

// Resources son los módulos/entidades del sistema
const RESOURCES = [
    { key: 'employees', name: 'Empleados' },
    { key: 'payroll', name: 'Nómina' },
    { key: 'vacations', name: 'Vacaciones' },
    { key: 'roles', name: 'Roles y Permisos' },
    { key: 'admin', name: 'Configuración Admin' },
    { key: 'recruitment', name: 'Reclutamiento' },
    { key: 'incidents', name: 'Incidencias' },
    { key: 'surveys', name: 'Encuestas de Clima' },
    { key: 'dashboard', name: 'Dashboard' },
    { key: 'orgchart', name: 'Organigrama' },
    { key: 'chat', name: 'Chat' },
    { key: 'inventory', name: 'Inventario RH' },
    { key: 'events', name: 'Eventos' },
];

// Permisos por recurso — slug debe coincidir con src/utils/permissions.ts PERMISSIONS
const PERMISSIONS_DATA = [
    // Empleados
    { resource_key: 'employees', action: 'view', slug: 'employees.view', name: 'Ver empleados' },
    { resource_key: 'employees', action: 'create', slug: 'employees.create', name: 'Crear empleados' },
    { resource_key: 'employees', action: 'edit', slug: 'employees.edit', name: 'Editar empleados' },
    { resource_key: 'employees', action: 'delete', slug: 'employees.delete', name: 'Eliminar empleados' },
    // Nómina
    { resource_key: 'payroll', action: 'view', slug: 'payroll.view', name: 'Ver nóminas' },
    { resource_key: 'payroll', action: 'create', slug: 'payroll.create', name: 'Crear nóminas' },
    { resource_key: 'payroll', action: 'stamp', slug: 'payroll.stamp', name: 'Timbrar nóminas' },
    { resource_key: 'payroll', action: 'history', slug: 'payroll.history', name: 'Historial de nóminas' },
    // Vacaciones
    { resource_key: 'vacations', action: 'view', slug: 'vacations.view', name: 'Ver vacaciones' },
    { resource_key: 'vacations', action: 'approve', slug: 'vacations.approve', name: 'Aprobar/rechazar vacaciones' },
    // Roles
    { resource_key: 'roles', action: 'manage', slug: 'roles.manage', name: 'Gestionar roles y permisos' },
    // Admin
    { resource_key: 'admin', action: 'config', slug: 'admin.config', name: 'Configuración del sistema' },
    // Reclutamiento
    { resource_key: 'recruitment', action: 'view', slug: 'recruitment.view', name: 'Ver reclutamiento' },
    { resource_key: 'recruitment', action: 'manage', slug: 'recruitment.manage', name: 'Gestionar reclutamiento' },
    // Incidencias
    { resource_key: 'incidents', action: 'view', slug: 'incidents.view', name: 'Ver incidencias' },
    { resource_key: 'incidents', action: 'manage', slug: 'incidents.manage', name: 'Gestionar incidencias' },
    // Encuestas
    { resource_key: 'surveys', action: 'admin', slug: 'surveys.admin', name: 'Administrar encuestas de clima' },
    // Dashboard
    { resource_key: 'dashboard', action: 'view', slug: 'dashboard.view', name: 'Ver dashboard' },
    // Organigrama
    { resource_key: 'orgchart', action: 'view', slug: 'orgchart.view', name: 'Ver organigrama' },
    // Chat
    { resource_key: 'chat', action: 'use', slug: 'chat.use', name: 'Usar chat interno' },
    // Inventario
    { resource_key: 'inventory', action: 'view', slug: 'inventory.view', name: 'Ver inventario RH' },
    // Eventos
    { resource_key: 'events', action: 'manage', slug: 'events.manage', name: 'Gestionar eventos' },
];

// Asignación de permisos por rol — qué slugs tiene cada rol
const ROLE_PERMISSIONS_MAP: Record<string, string[]> = {
    'Admin': [
        // Admin tiene todo
        'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
        'payroll.view', 'payroll.create', 'payroll.stamp', 'payroll.history',
        'vacations.view', 'vacations.approve',
        'roles.manage', 'admin.config',
        'recruitment.view', 'recruitment.manage',
        'incidents.view', 'incidents.manage',
        'surveys.admin',
        'dashboard.view', 'orgchart.view', 'chat.use', 'inventory.view', 'events.manage',
    ],
    'RH': [
        'employees.view', 'employees.create', 'employees.edit',
        'vacations.view', 'vacations.approve',
        'recruitment.view', 'recruitment.manage',
        'incidents.view', 'incidents.manage',
        'surveys.admin',
        'dashboard.view', 'orgchart.view', 'chat.use', 'inventory.view', 'events.manage',
    ],
    'Directivo': [
        'employees.view',
        'payroll.view', 'payroll.history',
        'vacations.view',
        'dashboard.view', 'orgchart.view', 'chat.use',
    ],
    'Jefe de Area': [
        'employees.view',
        'vacations.view', 'vacations.approve',
        'incidents.view',
        'dashboard.view', 'orgchart.view', 'chat.use',
    ],
    'Contador': [
        'employees.view',
        'payroll.view', 'payroll.create', 'payroll.stamp', 'payroll.history',
        'dashboard.view', 'chat.use',
    ],
    'Empleado Normal': [
        'payroll.history',
        'vacations.view',
        'incidents.view',
        'chat.use',
    ],
    'Externo': [
        'chat.use',
    ],
};

// Conceptos de nómina estándar
const CONCEPTOS_NOMINA = [
    { clave: 'P001', nombre_concepto: 'Sueldo Quincenal', tipo: 'Percepcion', monto_defecto: 0, activo: true, es_fiscal: true },
    { clave: 'P002', nombre_concepto: 'Bono de Productividad', tipo: 'Percepcion', monto_defecto: 0, activo: true, es_fiscal: true },
    { clave: 'P003', nombre_concepto: 'Vales de Despensa', tipo: 'Percepcion', monto_defecto: 0, activo: true, es_fiscal: false },
    { clave: 'P004', nombre_concepto: 'Fondo de Ahorro', tipo: 'Percepcion', monto_defecto: 0, activo: true, es_fiscal: false },
    { clave: 'P005', nombre_concepto: 'Prima Dominical', tipo: 'Percepcion', monto_defecto: 0, activo: true, es_fiscal: true },
    { clave: 'D001', nombre_concepto: 'IMSS Cuota Obrera', tipo: 'Deduccion', monto_defecto: 0, activo: true, es_fiscal: true },
    { clave: 'D002', nombre_concepto: 'ISR', tipo: 'Deduccion', monto_defecto: 0, activo: true, es_fiscal: true },
    { clave: 'D003', nombre_concepto: 'Descuento Préstamo', tipo: 'Deduccion', monto_defecto: 0, activo: true, es_fiscal: false },
    { clave: 'D004', nombre_concepto: 'INFONAVIT', tipo: 'Deduccion', monto_defecto: 0, activo: true, es_fiscal: true },
    { clave: 'D005', nombre_concepto: 'Fondo de Ahorro Desc.', tipo: 'Deduccion', monto_defecto: 0, activo: true, es_fiscal: false },
];

// Días festivos oficiales de México
function getDiasFestivos(year: number) {
    return [
        { fecha: new Date(`${year}-01-01`), nombre: 'Año Nuevo' },
        { fecha: new Date(`${year}-02-03`), nombre: 'Día de la Constitución (1er lunes de febrero)' },
        { fecha: new Date(`${year}-03-17`), nombre: 'Natalicio de Benito Juárez (3er lunes de marzo)' },
        { fecha: new Date(`${year}-05-01`), nombre: 'Día del Trabajo' },
        { fecha: new Date(`${year}-09-16`), nombre: 'Día de la Independencia' },
        { fecha: new Date(`${year}-11-17`), nombre: 'Día de la Revolución (3er lunes de noviembre)' },
        { fecha: new Date(`${year}-12-25`), nombre: 'Navidad' },
    ];
}

// ─────────────────────────────────────────────────────────────────
// SEED PRINCIPAL
// ─────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🌱 Iniciando seed del ERP...\n');

    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';
    const defaultPassword = process.env.DEFAULT_EMPLOYEE_PASSWORD ?? 'Bienvenido1!';

    // ── 1. Áreas ──────────────────────────────────────────────────
    console.log('📍 Creando áreas...');
    const areaMap = new Map<string, number>(); // nombre -> id

    for (const area of AREAS) {
        const created = await prisma.areas.upsert({
            where: { nombre_area: area.nombre_area } as any,
            update: {},
            create: { nombre_area: area.nombre_area },
        }).catch(async () => {
            // Si no hay unique constraint en nombre_area, buscamos o creamos
            const existing = await prisma.areas.findFirst({ where: { nombre_area: area.nombre_area } });
            if (existing) return existing;
            return prisma.areas.create({ data: { nombre_area: area.nombre_area } });
        });
        areaMap.set(area.nombre_area, created.idarea);
    }
    console.log(`   ✅ ${areaMap.size} áreas configuradas`);

    // ── 2. Roles ──────────────────────────────────────────────────
    console.log('👥 Creando roles del sistema...');
    const roleMap = new Map<string, number>(); // nombre_rol -> idrol

    for (const rol of ROLES) {
        const idarea = areaMap.get(rol.area_key) ?? null;
        const existing = await prisma.roles.findFirst({ where: { nombre_rol: rol.nombre_rol } });

        let created;
        if (existing) {
            created = await prisma.roles.update({
                where: { idrol: existing.idrol },
                data: { desc_rol: rol.desc_rol, hierarchy_level: rol.hierarchy_level, is_system: rol.is_system, idarea }
            });
        } else {
            created = await prisma.roles.create({
                data: { nombre_rol: rol.nombre_rol, desc_rol: rol.desc_rol, hierarchy_level: rol.hierarchy_level, is_system: rol.is_system, idarea }
            });
        }
        roleMap.set(rol.nombre_rol, created.idrol);
    }
    console.log(`   ✅ ${roleMap.size} roles configurados`);

    // ── 3. Resources (módulos) ─────────────────────────────────────
    console.log('📦 Creando resources (módulos del sistema)...');
    const resourceMap = new Map<string, number>(); // key -> id

    for (const res of RESOURCES) {
        const created = await prisma.resources.upsert({
            where: { key: res.key },
            update: { name: res.name },
            create: { key: res.key, name: res.name },
        });
        resourceMap.set(res.key, created.id);
    }
    console.log(`   ✅ ${resourceMap.size} resources configurados`);

    // ── 4. Permissions ────────────────────────────────────────────
    console.log('🔑 Creando permisos del sistema...');
    const permMap = new Map<string, number>(); // slug -> id

    for (const perm of PERMISSIONS_DATA) {
        const resource_id = resourceMap.get(perm.resource_key);
        if (!resource_id) continue;

        const created = await prisma.permissions.upsert({
            where: { slug: perm.slug },
            update: { name: perm.name, action: perm.action, resource_id },
            create: { slug: perm.slug, name: perm.name, action: perm.action, resource_id },
        });
        permMap.set(perm.slug, created.id);
    }
    console.log(`   ✅ ${permMap.size} permisos configurados`);

    // ── 5. Role → Permissions ─────────────────────────────────────
    console.log('🔗 Asignando permisos a roles...');
    let assignedCount = 0;

    for (const [roleName, slugs] of Object.entries(ROLE_PERMISSIONS_MAP)) {
        const roleId = roleMap.get(roleName);
        if (!roleId) continue;

        for (const slug of slugs) {
            const permId = permMap.get(slug);
            if (!permId) continue;

            // Upsert: si ya existe la asignación, no duplicar
            await prisma.role_permissions.upsert({
                where: { role_id_permission_id: { role_id: roleId, permission_id: permId } },
                update: {},
                create: { role_id: roleId, permission_id: permId, scope: 'global' },
            });
            assignedCount++;
        }
    }
    console.log(`   ✅ ${assignedCount} asignaciones de permisos configuradas`);

    // ── 6. Conceptos de Nómina ────────────────────────────────────
    console.log('💰 Creando conceptos de nómina estándar...');
    for (const concepto of CONCEPTOS_NOMINA) {
        await prisma.conceptos_nomina.upsert({
            where: { clave: concepto.clave },
            update: {
                nombre_concepto: concepto.nombre_concepto,
                tipo: concepto.tipo,
                activo: concepto.activo,
                es_fiscal: concepto.es_fiscal,
            },
            create: {
                clave: concepto.clave,
                nombre_concepto: concepto.nombre_concepto,
                tipo: concepto.tipo,
                monto_defecto: concepto.monto_defecto,
                activo: concepto.activo,
                es_fiscal: concepto.es_fiscal,
            },
        });
    }
    console.log(`   ✅ ${CONCEPTOS_NOMINA.length} conceptos de nómina configurados`);

    // ── 7. Días Festivos ──────────────────────────────────────────
    console.log('📅 Creando días festivos...');
    const currentYear = new Date().getFullYear();
    const nextYear = currentYear + 1;
    const festivos = [...getDiasFestivos(currentYear), ...getDiasFestivos(nextYear)];

    for (const festivo of festivos) {
        const existing = await prisma.dias_festivos.findFirst({ where: { fecha: festivo.fecha } });
        if (!existing) {
            await prisma.dias_festivos.create({ data: { fecha: festivo.fecha, nombre: festivo.nombre } });
        }
    }
    console.log(`   ✅ ${festivos.length} días festivos configurados (${currentYear}-${nextYear})`);

    // ── 8. Empleado Administrador ─────────────────────────────────
    console.log('👤 Verificando usuario administrador...');
    const adminRoleId = roleMap.get('Admin');
    const adminAreaId = areaMap.get('Dirección General');
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@erp.com';

    let adminEmpleado = await prisma.empleados.findFirst({ where: { email_empleado: ADMIN_EMAIL } });

    if (!adminEmpleado) {
        adminEmpleado = await prisma.empleados.create({
            data: {
                nombre_completo_empleado: 'Administrador del Sistema',
                email_empleado: ADMIN_EMAIL,
                idrol: adminRoleId,
                idarea: adminAreaId,
                estatus_empleado: 'Activo',
                sueldo: 0,
                puesto: 'Administrador',
                dias_vacaciones_disponibles: 0,
            }
        });

        // Crear credenciales con bcrypt real — no hash literal
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.credenciales.create({
            data: {
                idempleado: adminEmpleado.idempleado,
                username: 'admin',
                user_password: passwordHash,
            }
        });

        console.log(`   ✅ Admin creado: ${ADMIN_EMAIL} / usuario: admin`);
        console.log(`   🔐 Contraseña inicial: ${adminPassword}`);
        console.log(`   ⚠️  CAMBIA ESTA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN EN PRODUCCIÓN`);
    } else {
        console.log(`   ℹ️  Admin ya existe (${ADMIN_EMAIL}) — no se modifican sus credenciales`);
    }

    // ── Resumen ───────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55));
    console.log('✨ Seed completado exitosamente!');
    console.log('═'.repeat(55));
    console.log(`  Áreas:             ${areaMap.size}`);
    console.log(`  Roles:             ${roleMap.size}`);
    console.log(`  Permisos:          ${permMap.size}`);
    console.log(`  Conceptos nómina:  ${CONCEPTOS_NOMINA.length}`);
    console.log(`  Días festivos:     ${festivos.length}`);
    console.log(`  Admin email:       ${ADMIN_EMAIL}`);
    console.log('═'.repeat(55) + '\n');
}

main()
    .catch((e) => {
        console.error('❌ Error en el seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
