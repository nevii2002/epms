const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@techznap.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const PERIODS = (process.env.PERIODS || '2026-02,2026-03,2026-04').split(',').map((period) => period.trim());

async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) {
        throw new Error(`${options.method || 'GET'} ${path} failed: ${response.status} ${text}`);
    }
    return data;
}

function factorFor(employeeId, period, index) {
    const month = parseInt(period.split('-')[1], 10);
    const raw = 0.72 + (((employeeId * 17) + (month * 11) + (index * 7)) % 28) / 100;
    return Math.min(raw, 1);
}

function actualFor(kpi, factor) {
    const target = parseFloat(kpi.targetValue);
    if (!target || target <= 0) return 0;
    return Number((target * factor).toFixed(2));
}

function ratingFor(factor) {
    if (factor >= 0.95) return 5;
    if (factor >= 0.85) return 4;
    if (factor >= 0.75) return 3;
    if (factor >= 0.65) return 2;
    return 1;
}

async function seedScores() {
    const login = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        })
    });
    const authHeaders = { Authorization: `Bearer ${login.token}` };
    const staff = await request('/staff', { headers: authHeaders });
    const employees = staff.filter((user) => user.role === 'Employee' && user.status === 'Active');

    for (const employee of employees) {
        const assignedKpis = await request(`/staff/${employee.id}/kpis`, { headers: authHeaders });
        const evaluationKpis = assignedKpis.filter((kpi) => kpi.type === 'EVALUATION');

        for (const period of PERIODS) {
            const details = [];

            for (const [index, kpi] of evaluationKpis.entries()) {
                const factor = factorFor(employee.id, period, index);
                details.push({
                    kpiId: kpi.id,
                    rating: ratingFor(factor),
                    comment: 'Demo manager score generated for this period.'
                });

                if (kpi.category === 'Quantitative' && kpi.targetValue > 0) {
                    await request('/quantitative', {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                            employeeId: employee.id,
                            kpiId: kpi.id,
                            period,
                            actualValue: actualFor(kpi, factor)
                        })
                    });
                }
            }

            if (details.length > 0) {
                try {
                    await request('/evaluations', {
                        method: 'POST',
                        headers: authHeaders,
                        body: JSON.stringify({
                            employeeId: employee.id,
                            type: 'Manager',
                            period,
                            details,
                            comments: 'Demo manager evaluation generated for KPI tracking.'
                        })
                    });
                } catch (error) {
                    if (!error.message.includes('Evaluation already exists')) throw error;
                }
            }
        }
    }

    console.log(`Seeded scores for ${employees.length} employees for ${PERIODS.join(', ')} through ${API_BASE}.`);
}

seedScores().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
