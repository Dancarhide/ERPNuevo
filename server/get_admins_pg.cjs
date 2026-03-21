const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/erp'
  });

  await client.connect();
  const res = await client.query(`
    SELECT e.nombre_completo_empleado, e.email_empleado, r.nombre_rol 
    FROM empleados e 
    JOIN roles r ON e.idrol = r.idrol 
    WHERE e.nombre_completo_empleado = 'Admin' OR r.nombre_rol = 'Administrador' OR r.nombre_rol = 'Recursos Humanos';
  `);
  
  res.rows.forEach(r => {
    process.stdout.write(`>>> ${r.nombre_completo_empleado} | ${r.email_empleado} | ${r.nombre_rol} <<<\n`);
  });
  
  await client.end();
}

main().catch(console.error);
