import { prisma } from '../prisma';

async function seed() {
    try {
        console.log('Seeding COMPANY_NAME...');
        const res = await prisma.sys_config.upsert({
            where: { key: 'COMPANY_NAME' },
            update: { value: 'STARTIA' },
            create: { key: 'COMPANY_NAME', value: 'STARTIA' }
        });
        console.log('Result:', res);
    } catch (error: any) {
        console.error('Error seeding:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
