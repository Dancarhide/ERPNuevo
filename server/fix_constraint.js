const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:1234@localhost:5432/erp'
});

async function run() {
  await client.connect();
  try {
    console.log('Dropping existing constraint...');
    await client.query('ALTER TABLE vacaciones DROP CONSTRAINT IF EXISTS vacaciones_estatus_vacacion_check;');
    
    console.log('Adding updated constraint...');
    await client.query("ALTER TABLE vacaciones ADD CONSTRAINT vacaciones_estatus_vacacion_check CHECK (estatus_vacacion IN ('Pendiente', 'Aprobado', 'Rechazado', 'Cancelado'));");
    
    console.log('Constraint updated successfully.');
  } catch (err) {
    console.error('Error updating constraint:', err);
  } finally {
    await client.end();
  }
}

run();
