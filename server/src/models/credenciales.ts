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
export async function crearCredenciales(idempleado: number, nombreCompleto: string, passwordPlano: string, tx?: any, email?: string | null): Promise<string> {
    const db = tx || prisma;
    let username = '';
    
    if (email && email.trim() !== '') {
        // Usar email como username. Verificar que sea único (por si acaso).
        let contador = 0;
        let esUnico = false;
        username = email.toLowerCase().trim();
        const baseUsername = username;

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
    } else {
        username = await generarUsername(nombreCompleto, db);
    }
    
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
 * @returns Objeto con ID y flag de cambio si las credenciales son válidas, de lo contrario null.
 */
export async function verificarCredenciales(email: string, passwordPlano: string): Promise<{ idempleado: number, requiereCambio: boolean } | null> {
    // Buscar empleado por email
    const empleado = await prisma.empleados.findFirst({
        where: { email_empleado: email },
        include: {
            credenciales: true
        }
    });

    if (!empleado) {
        return null;
    }

    const creds = Array.isArray(empleado.credenciales) ? empleado.credenciales[0] : (empleado.credenciales as any);

    if (!creds || !creds.user_password) {
        return null;
    }

    const passwordValido = await bcrypt.compare(passwordPlano, creds.user_password);
    return passwordValido ? { idempleado: empleado.idempleado, requiereCambio: creds.requiere_cambio_password ?? false } : null;
}

/**
 * Cambia la contraseña y marca que ya no se requiere cambio en el primer inicio.
 * @param idempleado ID del empleado.
 * @param passwordPlano Nueva contraseña sin encriptar.
 */
export async function cambiarPasswordYMarcarComoCambiado(idempleado: number, passwordPlano: string): Promise<boolean> {
    const passwordHash = await bcrypt.hash(passwordPlano, 10);
    const result = await prisma.credenciales.updateMany({
        where: { idempleado: idempleado },
        data: { 
            user_password: passwordHash,
            requiere_cambio_password: false
        }
    });
    return result.count > 0;
}