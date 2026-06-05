import { prisma } from '../prisma';

export interface Empleado {
    id: number;
    nombre: string;
    email: string;
    departamento: string | null;
    idarea: number | null;
    foto: string | null;
    rol: string | null;
    idrol: number | null;
    idroles: number[];
    estatus: string;
    curp: string | null;
    rfc: string | null;
    telefono: string | null;
    direccion: string | null;
    puesto: string | null;
    /** Slugs de permisos unificados (rol principal + roles adicionales + delegados + excepciones) */
    permissions: string[];
}

function mapPrismaToEmpleado(e: any): Empleado {
    const area = e.areas_empleados_idareaToareas;
    
    // 1. Permisos del rol principal
    const basePermissions: string[] = e.roles?.role_permissions
        ?.map((rp: any) => rp.permissions?.slug)
        .filter(Boolean) ?? [];

    // 2. Permisos de roles adicionales
    const additionalRolePermissions: string[] = [];
    const idroles: number[] = [];
    
    if (e.idrol) idroles.push(e.idrol);

    if (e.empleado_roles) {
        for (const er of e.empleado_roles) {
            if (er.idrol) idroles.push(er.idrol);
            const perms = er.roles?.role_permissions?.map((rp: any) => rp.permissions?.slug) || [];
            additionalRolePermissions.push(...perms);
        }
    }

    // 3. Permisos delegados activos
    const delegatedPermissions: string[] = [];
    if (e.roles_recibidos) {
        for (const dr of e.roles_recibidos) {
            if (dr.rol_id) idroles.push(dr.rol_id);
            const perms = dr.roles?.role_permissions?.map((rp: any) => rp.permissions?.slug) || [];
            delegatedPermissions.push(...perms);
        }
    }

    // 4. Overrides específicos del empleado
    const grantedOverrides = e.empleado_permissions?.filter((ep: any) => ep.concedido).map((ep: any) => ep.permissions?.slug) || [];
    const deniedOverrides = e.empleado_permissions?.filter((ep: any) => !ep.concedido).map((ep: any) => ep.permissions?.slug) || [];

    // Combinar todo
    let finalPermissions = new Set([
        ...basePermissions,
        ...additionalRolePermissions,
        ...delegatedPermissions,
        ...grantedOverrides
    ]);

    // Quitar explícitamente los denegados
    for (const denied of deniedOverrides) {
        finalPermissions.delete(denied);
    }

    return {
        id: e.idempleado,
        nombre: e.nombre_completo_empleado,
        email: e.email_empleado,
        departamento: area?.nombre_area || null,
        idarea: e.idarea || null,
        foto: e.foto ? `data:image/webp;base64,${e.foto}` : null,
        rol: e.roles?.nombre_rol || null,
        idrol: e.idrol || null,
        idroles: Array.from(new Set(idroles)),
        estatus: e.estatus_empleado,
        curp: e.curp || null,
        rfc: e.rfc || null,
        telefono: e.telefono_empleado || null,
        direccion: e.direccion_empleado || null,
        puesto: e.puesto || null,
        permissions: Array.from(finalPermissions)
    };
}

export async function getEmpleadoPorId(id: number): Promise<Empleado | null> {
    const empleado = await prisma.empleados.findUnique({
        where: { idempleado: id },
        include: {
            areas_empleados_idareaToareas: true,
            roles: {
                include: {
                    role_permissions: {
                        include: {
                            permissions: {
                                select: { slug: true }
                            }
                        }
                    }
                }
            },
            empleado_roles: {
                include: {
                    roles: {
                        include: {
                            role_permissions: {
                                include: { permissions: { select: { slug: true } } }
                            }
                        }
                    }
                }
            },
            empleado_permissions: {
                include: { permissions: { select: { slug: true } } }
            },
            roles_recibidos: {
                where: {
                    estatus: 'Activa',
                    fecha_inicio: { lte: new Date() },
                    fecha_fin: { gte: new Date() }
                },
                include: {
                    roles: {
                        include: {
                            role_permissions: {
                                include: { permissions: { select: { slug: true } } }
                            }
                        }
                    }
                }
            },
            empleados_salud: true,
            empleados_familiar: true
        }
    });

    if (!empleado) return null;
    return mapPrismaToEmpleado(empleado);
}