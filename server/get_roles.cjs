const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:1234@localhost:5432/erp'
  });

  await client.connect();
  const res = await client.query('SELECT * FROM roles;');
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

main().catch(console.error);
