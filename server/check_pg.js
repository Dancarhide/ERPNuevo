const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:1234@localhost:5432/erp'
});

client.connect();
client.query("SELECT pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'vacaciones_estatus_vacacion_check';", (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Constraint Definition:');
    if (res.rows.length > 0) {
      console.log(res.rows[0].def);
    } else {
      console.log('Constraint not found');
    }
  }
  client.end();
});
