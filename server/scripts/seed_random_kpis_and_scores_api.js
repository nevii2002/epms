const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@techznap.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const PERIOD = process.env.PERIOD || '2026-04';

function random(seed) {
    let value = seed;
    return () => {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
    };
}

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

function splitWeights(count, rng) {
    const chunks = Array.from({ length: count }, () => 8 + Math.floor(rng() * 25));
    const total = chunks.reduce((sum, item) => sum + item, 0);
    let weights = chunks.map((item) => Math.round((item / total) * 100));
    const diff = 100 - weights.reduce((sum, item) => sum + item, 0);
    weights[0] += diff;
    return weights;
}

function actualFor(kpi, performanceFactor) {
    if (!kpi.targetValue || kpi.targetValue <= 0) {
        return Math.min(5, Math.max(1, 5 * performanceFactor));
    }

    const value = kpi.targetValue * performanceFactor;
    return Number(value.toFixed(2));
}

function ratingFor(performanceFactor) {
    if (performanceFactor >= 1.15) return 5;
    if (performanceFactor >= 1.0) return 4;
    if (performanceFactor >= 0.82) return 3;
    if (performanceFactor >= 0.65) return 2;
    return 1;
}

async function seed() {
    const login = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        })
    });

    const authHeaders = {
        Authorization: `Bearer ${login.token}`
    };

    const users = await request('/staff', { headers: authHeaders });
    const employees = users.filter((user) => user.role === 'Employee' && user.status === 'Active');
    const kpis = await request('/kpis', { headers: authHeaders });
    const evaluationKpis = kpis.filter((kpi) => kpi.type === 'EVALUATION');
    const quantitativeKpis = evaluationKpis.filter((kpi) => kpi.category === 'Quantitative' && kpi.targetValue > 0);
    const noTargetQuantitativeKpis = evaluationKpis.filter((kpi) => kpi.category === 'Quantitative' && (!kpi.targetValue || kpi.targetValue <= 0));
    const qualitativeKpis = evaluationKpis.filter((kpi) => kpi.category === 'Qualitative');
    const bonusKpis = kpis.filter((kpi) => kpi.type === 'BONUS');
    const rng = random(202603);

    if (employees.length === 0) throw new Error('No active employees found.');
    if (evaluationKpis.length < 3) throw new Error('At least 3 evaluation KPIs are required.');

    // Clear old assignments first so the backend allocation validator starts from a clean slate.
    for (const employee of employees) {
        await request(`/staff/${employee.id}/kpis`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ assignments: [] })
        });
    }

    for (const employee of employees) {
        for (const kpi of noTargetQuantitativeKpis) {
            await request('/quantitative', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    employeeId: employee.id,
                    kpiId: kpi.id,
                    period: PERIOD,
                    actualValue: 0
                })
            });
        }
    }

    const kpiCapacity = new Map(evaluationKpis.map((kpi) => [kpi.id, 100]));
    const seededSummary = [];

    for (const employee of employees) {
        const availableQuantitative = quantitativeKpis.filter((kpi) => (kpiCapacity.get(kpi.id) || 0) >= 15);
        const availableQualitative = qualitativeKpis.filter((kpi) => (kpiCapacity.get(kpi.id) || 0) >= 15);
        const selectedQualitative = [...availableQualitative].sort(() => rng() - 0.5).slice(0, 1);
        const selectedQuantitative = [...availableQuantitative].sort(() => rng() - 0.5).slice(0, 4);
        const selected = [...selectedQualitative, ...selectedQuantitative];
        const weights = splitWeights(selected.length, rng);

        const assignments = selected.map((kpi, index) => ({
            kpiId: kpi.id,
            weight: Math.min(weights[index], kpiCapacity.get(kpi.id)),
            customBonus: 0
        }));

        // Top up or trim the first KPI so each employee has exactly 100% assigned.
        const assignmentTotal = assignments.reduce((sum, item) => sum + item.weight, 0);
        assignments[0].weight += 100 - assignmentTotal;

        for (const assignment of assignments) {
            kpiCapacity.set(assignment.kpiId, (kpiCapacity.get(assignment.kpiId) || 0) - assignment.weight);
        }

        if (bonusKpis.length > 0) {
            const bonus = bonusKpis[Math.floor(rng() * bonusKpis.length)];
            assignments.push({
                kpiId: bonus.id,
                weight: 10 + Math.floor(rng() * 21),
                customBonus: 10000 + Math.floor(rng() * 25000)
            });
        }

        await request(`/staff/${employee.id}/kpis`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ assignments })
        });

        const performanceFactor = 0.65 + (rng() * 0.35);
        const quantitativeDetails = [];
        const evaluationDetails = [];

        for (const assignment of assignments) {
            const kpi = kpis.find((item) => item.id === assignment.kpiId);
            if (!kpi || kpi.type !== 'EVALUATION') continue;

            evaluationDetails.push({
                kpiId: kpi.id,
                rating: ratingFor(performanceFactor),
                comment: 'Demo manager score generated from randomized KPI performance.'
            });

            if (kpi.category === 'Quantitative') {
                const actualValue = actualFor(kpi, performanceFactor);
                await request('/quantitative', {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        employeeId: employee.id,
                        kpiId: kpi.id,
                        period: PERIOD,
                        actualValue
                    })
                });
                quantitativeDetails.push(`${kpi.title}: ${actualValue}`);
            }
        }

        if (evaluationDetails.length > 0) {
            try {
                await request('/evaluations', {
                    method: 'POST',
                    headers: authHeaders,
                    body: JSON.stringify({
                        employeeId: employee.id,
                        type: 'Manager',
                        period: PERIOD,
                        details: evaluationDetails,
                        comments: 'Demo manager evaluation generated for KPI score calculation.'
                    })
                });
            } catch (error) {
                if (!error.message.includes('Evaluation already exists')) throw error;
            }
        }

        seededSummary.push({
            employee: employee.username,
            kpis: assignments.length,
            performance: Math.round(performanceFactor * 100),
            quantitativeLogs: quantitativeDetails.length
        });
    }

    const stats = await request('/evaluations/stats', { headers: authHeaders });
    console.log(`Seeded KPI allocations and ${PERIOD} scores for ${employees.length} employees through ${API_BASE}.`);
    console.log(`Dashboard average performance: ${stats.avgPerformance}%`);
    if (stats.employeeOfTheMonth) {
        console.log(`Employee of the month: ${stats.employeeOfTheMonth.username} (${stats.employeeOfTheMonth.avgRating}/5)`);
    }
    seededSummary.forEach((item) => {
        console.log(`${item.employee}: ${item.kpis} KPIs, ${item.performance}% performance factor, ${item.quantitativeLogs} quantitative logs`);
    });
}

seed().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
