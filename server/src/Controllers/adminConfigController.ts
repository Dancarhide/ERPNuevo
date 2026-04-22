import { Request, Response } from 'express';
import { prisma } from '../prisma';

export const getRolesWithPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const roles = await prisma.roles.findMany({
            include: {
                role_permissions: {
                    include: {
                        permissions: true
                    }
                }
            },
            orderBy: { hierarchy_level: 'asc' }
        });
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles and permissions:', error);
        res.status(500).json({ error: 'Error al obtener roles y permisos' });
    }
};

export const getAllPermissionsList = async (req: Request, res: Response): Promise<void> => {
    try {
        const permissions = await prisma.permissions.findMany({
            include: { resources: true },
            orderBy: [{ resource_id: 'asc' }, { slug: 'asc' }],
        });
        res.json(permissions);
    } catch (error) {
        console.error('Error fetching permissions list:', error);
        res.status(500).json({ error: 'Error al obtener catálogo de permisos' });
    }
};

export const updateRolePermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { roleId, permissionIds } = req.body; // permissionIds is an array of IDs

        if (!roleId || !Array.isArray(permissionIds)) {
            res.status(400).json({ error: 'ID de rol y lista de permisos son requeridos' });
            return;
        }

        // Transactions to clear and set new permissions
        await prisma.$transaction([
            prisma.role_permissions.deleteMany({
                where: { role_id: parseInt(roleId) }
            }),
            prisma.role_permissions.createMany({
                data: permissionIds.map((pId: number) => ({
                    role_id: parseInt(roleId),
                    permission_id: pId,
                    scope: 'global'
                }))
            })
        ]);

        res.json({ message: 'Permisos actualizados correctamente' });
    } catch (error) {
        console.error('Error updating role permissions:', error);
        res.status(500).json({ error: 'Error al salvar permisos' });
    }
};

export const getSystemConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const config = await prisma.sys_config.findMany();
        // Convert to key-value object for easier frontend handling
        const configObj = config.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});
        res.json(configObj);
    } catch (error) {
        console.error('Error fetching system config:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};

export const updateSystemConfig = async (req: Request, res: Response): Promise<void> => {
    try {
        const configs = req.body; // Object with key-value pairs

        const operations = Object.entries(configs).map(([key, value]) => {
            return prisma.sys_config.upsert({
                where: { key },
                update: { value: String(value) },
                create: { key, value: String(value) }
            });
        });

        await prisma.$transaction(operations);
        res.json({ message: 'Configuración actualizada' });
    } catch (error) {
        console.error('Error updating system config:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};

export const getMyPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        // req.user.id está definido en el middleware auth.ts
        const userId = (req as any).user?.id;
        const employee = await prisma.empleados.findUnique({
            where: { idempleado: userId },
            include: {
                roles: {
                    include: {
                        role_permissions: {
                            include: {
                                permissions: true
                            }
                        }
                    }
                }
            }
        });

        if (!employee || !employee.roles) {
            res.json([]);
            return;
        }

        const perms = employee.roles.role_permissions.map(rp => rp.permissions.slug);
        res.json(perms);
    } catch (error) {
        console.error('Error fetching my permissions:', error);
        res.status(500).json({ error: 'Error al obtener mis permisos' });
    }
};
