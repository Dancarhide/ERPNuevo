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
    estatus: string;
    curp: string | null;
    rfc: string | null;
    telefono: string | null;
    direccion: string | null;
    puesto: string | null;
}

function mapPrismaToEmpleado(e: any): Empleado {
    const area = e.areas_empleados_idareaToareas;
    return {
        id: e.idempleado,
        nombre: e.nombre_completo_empleado,
        email: e.email_empleado,
        departamento: area?.nombre_area || null,
        idarea: e.idarea || null,
        foto: e.foto ? `data:image/webp;base64,${e.foto}` : null,
        rol: e.roles?.nombre_rol || null,
        idrol: e.idrol || null,
        estatus: e.estatus_empleado,
        curp: e.curp || null,
        rfc: e.rfc || null,
        telefono: e.telefono_empleado || null,
        direccion: e.direccion_empleado || null,
        puesto: e.puesto || null
    };
}

export async function getEmpleadoPorId(id: number): Promise<Empleado | null> {
    const empleado = await prisma.empleados.findUnique({
        where: { idempleado: id },
        include: {
            areas_empleados_idareaToareas: true,
            roles: true,
            empleados_salud: true,
            empleados_familiar: true
        }
    });

    if (!empleado) return null;
    return mapPrismaToEmpleado(empleado);
}