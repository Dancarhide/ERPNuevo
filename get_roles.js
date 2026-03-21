import { PrismaClient } from './server/src/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
  try {
    const roles = await prisma.roles.findMany();
    console.log(JSON.stringify(roles, null, 2));
  } catch (e) {
    console.error('Debug Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
