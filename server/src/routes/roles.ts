import { Router } from 'express';
import { prisma } from '../prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all roles
router.get('/', authenticateToken, async (_req, res) => {
    try {
        const roles = await prisma.roles.findMany({
            orderBy: { idrol: 'asc' }
        });
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Error al obtener roles' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { nombre_rol, desc_rol, idarea } = req.body;
        if (!nombre_rol) {
            return res.status(400).json({ error: 'Nombre de rol es requerido' });
        }

        const nuevoRol = await prisma.roles.create({
            data: {
                nombre_rol,
                desc_rol,
                idarea: idarea ? parseInt(idarea) : null,
                is_system: false,
                hierarchy_level: 10
            }
        });
        res.json(nuevoRol);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Error al crear el rol' });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
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
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Error al actualizar el rol' });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const rolId = parseInt(id as string);

        // Safety check: don't delete if employees are assigned
        const empleadosConRol = await prisma.empleados.count({
            where: { idrol: rolId }
        });

        if (empleadosConRol > 0) {
            return res.status(400).json({
                error: `No se puede eliminar: ${empleadosConRol} empleado(s) tienen este rol asignado`
            });
        }

        await prisma.roles.delete({ where: { idrol: rolId } });
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Error al eliminar el rol' });
    }
});

export default router;
