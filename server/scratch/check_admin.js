const { PrismaClient } = require('@prisma/client');
const path = require('path');
const generatedPath = path.join(__dirname, '../src/generated/prisma');
const { PrismaClient: CustomClient } = require(generatedPath);
const prisma = new CustomClient();

async function checkAdminBase() {
    try {
        console.log('--- ROLES ---');
        const roles = await prisma.roles.findMany();
        console.log(JSON.stringify(roles, null, 2));

        console.log('\n--- PERMISSIONS ---');
        const perms = await prisma.permissions.findMany();
        console.log(JSON.stringify(perms, null, 2));

        console.log('\n--- SYS CONFIG ---');
        const config = await prisma.sys_config.findMany();
        console.log(JSON.stringify(config, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdminBase();
