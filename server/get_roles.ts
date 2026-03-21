import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from './src/prisma';

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
