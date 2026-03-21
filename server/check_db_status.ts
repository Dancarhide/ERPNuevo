import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const roles = await prisma.roles.findMany();
        console.log('Current Roles in DB:');
        console.log(JSON.stringify(roles, null, 2));
        
        const vacaciones = await prisma.vacaciones.findMany();
        console.log('Current Vacaciones in DB:');
        console.log(JSON.stringify(vacaciones, null, 2));

        const areas = await prisma.areas.findMany();
        console.log('Current Areas in DB:');
        console.log(JSON.stringify(areas, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
