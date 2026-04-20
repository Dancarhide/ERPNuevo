const { PrismaClient } = require('@prisma/client');
// We use the default client if generated there, or try the custom path
const path = require('path');

async function testIncidencias() {
    let prisma;
    try {
        // Try the generated path from the server
        const generatedPath = path.join(__dirname, '../src/generated/prisma');
        const { PrismaClient: CustomClient } = require(generatedPath);
        prisma = new CustomClient();
    } catch (e) {
        console.log('Using default PrismaClient');
        prisma = new PrismaClient();
    }

    try {
        console.log('Testing Incidencias fetch...');
        const count = await prisma.incidencias.count();
        console.log('INCIDENCIAS COUNT:', count);
        
        const first = await prisma.incidencias.findFirst({
            include: {
                empleados_incidencias_id_empleado_reportadoToempleados: true,
                empleados_incidencias_id_reportanteToempleados: true
            }
        });
        console.log('FIRST INCIDENCIA:', first);
    } catch (err) {
        console.error('DATABASE ERROR:', err.message);
    } finally {
        await prisma?.$disconnect();
    }
}

testIncidencias();
