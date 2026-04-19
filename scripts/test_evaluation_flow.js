// using native fetch
const API_URL = 'http://localhost:5000/api';

async function testFlow() {
    try {
        console.log('1. Registering Test User...');
        const userEmail = `test${Date.now()}@example.com`;
        const registerRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: `Test User ${Date.now()}`,
                email: userEmail,
                password: 'password123',
                role: 'Employee'
            })
        });
        const registerData = await registerRes.json();
        console.log('Register Response:', registerData);

        console.log('\n2. Logging In...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Response:', loginData.message || 'Success');

        if (!loginData.token) {
            throw new Error('Login failed, no token received');
        }

        console.log('\n3. Submitting Self Evaluation...');
        const token = loginData.token;
        const evalRes = await fetch(`${API_URL}/evaluations/self`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                period: '2024-01',
                ratings: [{ kpiId: 1, rating: 5, comment: 'Great job' }],
                comments: 'Overall good'
            })
        });
        const evalData = await evalRes.json();
        console.log('Evaluation Response:', evalData);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testFlow();
