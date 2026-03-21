const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/erp'
  });

  await client.connect();
  const roles = await client.query('SELECT idrol, nombre_rol FROM roles ORDER BY idrol;');
  console.log('--- ROLES ---');
  console.table(roles.rows);
  
  const employees = await client.query('SELECT idrol, puesto FROM empleados LIMIT 10;');
  console.log('--- EMPLEADOS SAMPLE ---');
  console.table(employees.rows);
  
  await client.end();
}

main().catch(console.error);
