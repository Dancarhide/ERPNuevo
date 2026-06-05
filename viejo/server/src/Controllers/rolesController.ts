import { Request, Response } from 'express';
import { prisma } from '../prisma';

/**
 * Obtiene todos los roles ordenados por ID.
 */
export const getRoles = async (_req: Request, res: Response): Promise<void> => {
    try {
        const roles = await prisma.roles.findMany({
            orderBy: { idrol: 'asc' }
        });
        res.json(roles);
    } catch (error) {
        console.error('Error al obtener roles:', error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
};

/**
 * Crea un nuevo rol.
 */
export const createRol = async (req: Request, res: Response): Promise<void> => {
    try {
        const { nombre_rol, desc_rol, idarea, hierarchy_level } = req.body;
        if (!nombre_rol) {
            res.status(400).json({ error: 'Nombre de rol es requerido' });
            return;
        }

        const nuevoRol = await prisma.roles.create({
            data: {
                nombre_rol,
                desc_rol,
                idarea: idarea ? parseInt(idarea) : null,
                is_system: false,
                hierarchy_level: hierarchy_level ? parseInt(hierarchy_level) : 10
            }
        });
        res.json(nuevoRol);
    } catch (error) {
        console.error('Error al crear rol:', error);
        res.status(500).json({ error: 'Error al crear el rol' });
    }
};

/**
 * Actualiza un rol existente.
 */
export const updateRol = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { nombre_rol, desc_rol, idarea, hierarchy_level } = req.body;

        const updated = await prisma.roles.update({
            where: { idrol: parseInt(id as string) },
            data: {
                nombre_rol,
                desc_rol,
                idarea: idarea ? parseInt(idarea) : null,
                hierarchy_level: hierarchy_level ? parseInt(hierarchy_level) : undefined
            }
        });
        res.json(updated);
    } catch (error) {
        console.error('Error al actualizar rol:', error);
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
};

/**
 * Elimina un rol, verificando que no tenga empleados asignados.
 */
export const deleteRol = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const rolId = parseInt(id as string);

        // Safety check: no eliminar si hay empleados con este rol
        const empleadosConRol = await prisma.empleados.count({
            where: { idrol: rolId }
        });

        if (empleadosConRol > 0) {
            res.status(400).json({
                error: `No se puede eliminar: ${empleadosConRol} empleado(s) tienen este rol asignado`
            });
            return;
        }

        await prisma.roles.delete({ where: { idrol: rolId } });
        res.status(204).send();
    } catch (error) {
        console.error('Error al eliminar rol:', error);
        res.status(500).json({ error: 'Error al eliminar el rol' });
    }
};

/**
 * Obtiene todos los permisos del sistema y marca cuáles tiene el rol solicitado.
 */
export const getRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idrol = parseInt(id as string);

        // 1. Obtener todos los recursos y permisos disponibles
        const allPermissions = await prisma.resources.findMany({
            include: {
                permissions: true
            }
        });

        // 2. Obtener los IDs de permisos que ya tiene este rol
        const rolePerms = await prisma.role_permissions.findMany({
            where: { role_id: idrol },
            select: { permission_id: true }
        });

        const activePermIds = rolePerms.map(rp => rp.permission_id);

        res.json({
            catalog: allPermissions,
            activeIds: activePermIds
        });
    } catch (error) {
        console.error('Error al obtener permisos del rol:', error);
        res.status(500).json({ error: 'Error al obtener el catálogo de permisos' });
    }
};

/**
 * Sincroniza los permisos de un rol (borra los actuales y crea los nuevos).
 */
export const updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const idrol = parseInt(id as string);
        const { permissionIds } = req.body; // Array de números

        if (!Array.isArray(permissionIds)) {
            res.status(400).json({ error: 'permissionIds debe ser un arreglo' });
            return;
        }

        // Usamos una transacción para asegurar que no se quede a medias
        await prisma.$transaction([
            // 1. Eliminar permisos actuales
            prisma.role_permissions.deleteMany({
                where: { role_id: idrol }
            }),
            // 2. Crear los nuevos vínculos
            prisma.role_permissions.createMany({
                data: permissionIds.map(pid => ({
                    role_id: idrol,
                    permission_id: pid,
                    scope: 'global'
                }))
            })
        ]);

        res.json({ message: 'Permisos actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar permisos:', error);
        res.status(500).json({ error: 'Error al sincronizar permisos' });
    }
};
