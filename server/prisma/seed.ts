/**
 * Prisma Seed Script — ERP Sistema de Gestión
 *
 * Seed MÍNIMO de producción:
 *   - Un único rol: Administrador del Sistema (hierarchy_level: 0)
 *   - El catálogo de resources y permissions (estructura del sistema)
 *   - El usuario administrador con credenciales iniciales
 *
 * El administrador crea desde la app:
 *   - Roles de la empresa
 *   - Áreas de la empresa
 *   - Asignación de permisos a roles
 *   - Empleados
 *
 * Ejecutar con: npx prisma db seed  ó  npm run db:seed
 *
 * Variables de entorno en server/.env:
 *   ADMIN_EMAIL=<correo del admin>
 *   ADMIN_PASSWORD=<contraseña inicial>
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─── Módulos del sistema (resources) ─────────────────────────────────────────
// Datos estructurales — representan los módulos del ERP, no datos de la empresa

const RESOURCES = [
    { key: 'employees',   name: 'Empleados' },
    { key: 'payroll',     name: 'Nómina' },
    { key: 'vacations',   name: 'Vacaciones' },
    { key: 'roles',       name: 'Roles y Permisos' },
    { key: 'areas',       name: 'Áreas' },
    { key: 'admin',       name: 'Configuración Admin' },
    { key: 'recruitment', name: 'Reclutamiento' },
    { key: 'incidents',   name: 'Incidencias' },
    { key: 'surveys',     name: 'Encuestas de Clima' },
    { key: 'dashboard',   name: 'Dashboard' },
    { key: 'orgchart',    name: 'Organigrama' },
    { key: 'chat',        name: 'Chat' },
    { key: 'inventory',   name: 'Inventario RH' },
    { key: 'events',      name: 'Eventos' },
    { key: 'kpis',        name: 'KPIs y Reportes' },
];

// ─── Permisos del sistema ─────────────────────────────────────────────────────
// Datos estructurales — catálogo de acciones posibles por módulo

const PERMISSIONS_DATA = [
    // Empleados
    { resource_key: 'employees', action: 'view',   slug: 'employees.view',   name: 'Ver empleados' },
    { resource_key: 'employees', action: 'create', slug: 'employees.create', name: 'Crear empleados' },
    { resource_key: 'employees', action: 'edit',   slug: 'employees.edit',   name: 'Editar empleados' },
    { resource_key: 'employees', action: 'delete', slug: 'employees.delete', name: 'Eliminar empleados' },
    // Nómina
    { resource_key: 'payroll', action: 'view',    slug: 'payroll.view',    name: 'Ver nóminas' },
    { resource_key: 'payroll', action: 'create',  slug: 'payroll.create',  name: 'Crear nóminas' },
    { resource_key: 'payroll', action: 'stamp',   slug: 'payroll.stamp',   name: 'Timbrar nóminas' },
    { resource_key: 'payroll', action: 'history', slug: 'payroll.history', name: 'Historial de nóminas' },
    // Vacaciones
    { resource_key: 'vacations', action: 'view',    slug: 'vacations.view',    name: 'Ver vacaciones' },
    { resource_key: 'vacations', action: 'approve', slug: 'vacations.approve', name: 'Aprobar/rechazar vacaciones' },
    // Roles y permisos
    { resource_key: 'roles', action: 'manage', slug: 'roles.manage', name: 'Gestionar roles y permisos' },
    // Áreas
    { resource_key: 'areas', action: 'manage', slug: 'areas.manage', name: 'Gestionar áreas' },
    // Admin
    { resource_key: 'admin', action: 'config', slug: 'admin.config', name: 'Configuración del sistema' },
    // Reclutamiento
    { resource_key: 'recruitment', action: 'view',   slug: 'recruitment.view',   name: 'Ver reclutamiento' },
    { resource_key: 'recruitment', action: 'manage', slug: 'recruitment.manage', name: 'Gestionar reclutamiento' },
    // Incidencias
    { resource_key: 'incidents', action: 'view',   slug: 'incidents.view',   name: 'Ver incidencias' },
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
    // KPIs
    { resource_key: 'kpis', action: 'view', slug: 'kpis.view', name: 'Ver KPIs y reportes' },
];

// ─── Seed principal ───────────────────────────────────────────────────────────

async function main() {
    console.log('\n🌱 Iniciando seed del ERP (modo producción limpio)...\n');

    const adminEmail    = process.env.ADMIN_EMAIL    ?? 'admin@erp.com';
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin1234!';

    // ── 1. Rol de Administrador del Sistema ────────────────────────────────
    console.log('👤 Creando rol de Administrador del Sistema...');

    let adminRole = await prisma.roles.findFirst({ where: { nombre_rol: 'Admin' } });
    if (!adminRole) {
        adminRole = await prisma.roles.create({
            data: {
                nombre_rol:      'Admin',
                desc_rol:        'Administrador del sistema — acceso total',
                hierarchy_level: 0,     // nivel 0: oculto del organigrama
                is_system:       true,
                idarea:          null,  // no pertenece a ningún área de empresa
            }
        });
    } else {
        adminRole = await prisma.roles.update({
            where: { idrol: adminRole.idrol },
            data:  { hierarchy_level: 0, is_system: true }
        });
    }
    console.log(`   ✅ Rol Admin (ID: ${adminRole.idrol}, level: 0)`);

    // ── 2. Resources (módulos del sistema) ────────────────────────────────
    console.log('📦 Registrando módulos del sistema...');
    const resourceMap = new Map<string, number>();

    for (const res of RESOURCES) {
        const created = await prisma.resources.upsert({
            where:  { key: res.key },
            update: { name: res.name },
            create: { key: res.key, name: res.name },
        });
        resourceMap.set(res.key, created.id);
    }
    console.log(`   ✅ ${resourceMap.size} módulos registrados`);

    // ── 3. Permissions (catálogo de acciones) ─────────────────────────────
    console.log('🔑 Registrando permisos del sistema...');
    const permMap = new Map<string, number>();

    for (const perm of PERMISSIONS_DATA) {
        const resource_id = resourceMap.get(perm.resource_key);
        if (!resource_id) continue;

        const created = await prisma.permissions.upsert({
            where:  { slug: perm.slug },
            update: { name: perm.name, action: perm.action, resource_id },
            create: { slug: perm.slug, name: perm.name, action: perm.action, resource_id },
        });
        permMap.set(perm.slug, created.id);
    }
    console.log(`   ✅ ${permMap.size} permisos registrados`);

    // ── 4. Asignar TODOS los permisos al Admin ────────────────────────────
    console.log('🔗 Asignando todos los permisos al Administrador...');
    let assigned = 0;

    for (const [, permId] of permMap) {
        await prisma.role_permissions.upsert({
            where:  { role_id_permission_id: { role_id: adminRole.idrol, permission_id: permId } },
            update: {},
            create: { role_id: adminRole.idrol, permission_id: permId, scope: 'global' },
        });
        assigned++;
    }
    console.log(`   ✅ ${assigned} permisos asignados al Admin`);

    // ── 5. Empleado Administrador ─────────────────────────────────────────
    console.log('👤 Verificando cuenta de administrador...');

    let adminEmpleado = await prisma.empleados.findFirst({ where: { email_empleado: adminEmail } });

    if (!adminEmpleado) {
        adminEmpleado = await prisma.empleados.create({
            data: {
                nombre_completo_empleado: 'Administrador del Sistema',
                email_empleado:           adminEmail,
                idrol:                    adminRole.idrol,
                idarea:                   null,
                estatus_empleado:         'Activo',
                sueldo:                   0,
                puesto:                   'Administrador del Sistema',
                dias_vacaciones_disponibles: 0,
            }
        });

        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await prisma.credenciales.create({
            data: {
                idempleado:    adminEmpleado.idempleado,
                username:      'admin',
                user_password: passwordHash,
            }
        });

        console.log(`   ✅ Admin creado: ${adminEmail}`);
        console.log(`   🔑 Usuario: admin`);
        console.log(`   🔐 Contraseña inicial: ${adminPassword}`);
        console.log(`   ⚠️  CAMBIA ESTA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN`);
    } else {
        console.log(`   ℹ️  Admin ya existe (${adminEmail}) — credenciales sin cambios`);
    }

    // ── Resumen ───────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55));
    console.log('✨ Seed completado — sistema listo para configurar');
    console.log('═'.repeat(55));
    console.log('  Próximos pasos desde el panel de Ajustes Maestros:');
    console.log('  1. Crear los roles de la empresa');
    console.log('  2. Crear las áreas de la empresa');
    console.log('  3. Asignar permisos a cada rol');
    console.log('  4. Crear empleados y asignarles rol y área');
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
