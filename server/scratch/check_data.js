
const { PrismaClient } = require('../src/generated/prisma');
const prisma = new PrismaClient();

async function main() {
    const surveys = await prisma.encuesta_clima.findMany();
    console.log('SURVEYS IN DB:', surveys.length);
    console.log(JSON.stringify(surveys, null, 2));
    await prisma.$disconnect();
}

main().catch(console.error);
