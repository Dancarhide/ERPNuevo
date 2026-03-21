import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const result = await prisma.$queryRaw`
            SELECT conname, pg_get_constraintdef(oid) 
            FROM pg_constraint 
            WHERE conname = 'vacaciones_estatus_vacacion_check';
        `;
        console.log('Constraint Definition:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
