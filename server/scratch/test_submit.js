const axios = require('axios');

async function testSubmit() {
    const host = 'localhost'; // Adjust if needed
    const token = ''; // We'll ignore auth if possible or just test the logic
    
    const payload = {
        idempleado: 1,
        nivel_jerarquico: 'Administrativo',
        ubicacion: 'Corporativo',
        hijos: 'No',
        antiguedad: '1-3 años',
        orientacion_org: { q1: 4, q2: 5, q3: 3, q4: 4 },
        admin_talento: { q5: 5, q6: 4, q7: 5, q8: 3 },
        estilo_direccion: { q9: 4, q10: 5, q11: 5, q12: 4 },
        comunicacion_int: { q13: 4, q14: 3, q15: 4, q16: 5 },
        trabajo_equipo: { q17: 5, q18: 4, q19: 5, q20: 4 },
        capacidad_prof: { q21: 4, q22: 4, q23: 5, q24: 5 }
    };

    try {
        const res = await axios.post(`http://localhost:4000/api/encuestas/climate-survey`, payload);
        console.log('SUBMISSION SUCCESS:', res.data);
    } catch (err) {
        console.error('SUBMISSION FAILED:', err.response?.data || err.message);
    }
}

testSubmit();
