import { prisma } from '../prisma';
import bcrypt from 'bcrypt';

/**
 * Genera un nombre de usuario único basado en el nombre completo del empleado.
 * Ejemplo: "Juan Perez" -> "juan.perez"
 * Si el username ya existe, añade un número al final (ej. "juan.perez1").
 * @param nombreCompleto El nombre completo del empleado.
 * @returns Un nombre de usuario único.
 */
async function generarUsername(nombreCompleto: string, tx?: any): Promise<string> {
    const partes = nombreCompleto.split(' ');
    const baseUsername = partes.length > 1
        ? `${partes[0]}.${partes[partes.length - 1]}`.toLowerCase()
        : partes[0].toLowerCase();

    let username = baseUsername;
    let contador = 0;
    let esUnico = false;
    const db = tx || prisma;

    while (!esUnico) {
        const count = await db.credenciales.count({
            where: { username: username }
        });

        if (count === 0) {
            esUnico = true;
        } else {
            contador++;
            username = `${baseUsername}${contador}`;
        }
    }
    return username;
}

/**
 * Crea las credenciales para un nuevo empleado.
 * @param idempleado ID del empleado.
 * @param nombreCompleto Nombre para generar el username.
 * @param passwordPlano Contraseña sin encriptar.
 * @returns El username generado.
 */
export async function crearCredenciales(idempleado: number, nombreCompleto: string, passwordPlano: string, tx?: any): Promise<string> {
    const db = tx || prisma;
    const username = await generarUsername(nombreCompleto, db);
    const passwordHash = await bcrypt.hash(passwordPlano, 10);

    await db.credenciales.create({
        data: {
            idempleado,
            username,
            user_password: passwordHash
        }
    });

    return username;
}

/**
 * Actualiza la contraseña en la tabla de credenciales.
 * @param idempleado ID del empleado.
 * @param passwordPlano Nueva contraseña sin encriptar.
 * @returns `true` si la actualización fue exitosa.
 */
export async function resetearPasswordCredenciales(idempleado: number, passwordPlano: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(passwordPlano, 10);
    const result = await prisma.credenciales.updateMany({
        where: { idempleado: idempleado },
        data: { user_password: passwordHash }
    });
    return result.count > 0;
}

/**
 * Verifica las credenciales de un usuario.
 * @param email El correo electrónico del empleado.
 * @param passwordPlano La contraseña sin encriptar.
 * @returns El ID del empleado si las credenciales son válidas, de lo contrario null.
 */
export async function verificarCredenciales(email: string, passwordPlano: string): Promise<number | null> {
    // Buscar empleado por email
    const empleado = await prisma.empleados.findFirst({
        where: { email_empleado: email },
        include: {
            credenciales: true
        }
    });

    // Validar si existe empleado y si tiene credenciales asociadas
    // Nota: Como es relación 1-1 o 1-N, credenciales podría ser un array o un objeto único dependiendo del esquema.
    // Según introspección previa, credenciales parece ser 1-1 o 1-N inversa.
    // Asumiremos que credenciales es un array si la relación no es única, o objeto si lo es.
    // En 'schema.prisma' generado, 'credenciales' suele ser un array [] si no se definió @unique.
    // PERO, en el SQL original: `FROM empleados e LEFT JOIN credenciales c ON c.idempleado = e.idempleado`
    // Si credenciales es un array en Prisma client (relation One-to-Many), tomamos el primero.

    if (!empleado) {
        return null;
    }

    // Adaptación: si `credenciales` es un array, tomamos el primer elemento. 
    // Si es un objeto (relación 1-1), lo usamos directo.
    // TypeScript nos dirá el tipo, pero para ser seguros en runtime:
    const creds = Array.isArray(empleado.credenciales) ? empleado.credenciales[0] : empleado.credenciales;

    if (!creds || !creds.user_password) {
        return null;
    }

    const passwordValido = await bcrypt.compare(passwordPlano, creds.user_password);
    return passwordValido ? empleado.idempleado : null;
}