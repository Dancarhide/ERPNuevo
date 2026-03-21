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

export default router;
