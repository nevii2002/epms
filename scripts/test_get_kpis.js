const API_URL = 'http://localhost:5000/api';

async function testKPIs() {
    try {
        console.log('Fetching KPIs...');
        const res = await fetch(`${API_URL}/kpis`);
        if (!res.ok) {
            throw new Error(`Status: ${res.status}`);
        }
        const data = await res.json();
        console.log('KPIs Found:', data);
    } catch (err) {
        console.error('Fetch Failed:', err);
    }
}

testKPIs();
