const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@techznap.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';

const metrics = [
    {
        name: 'Total New Orders',
        description: 'Weight: 10%. Number of new business generated. Target: 50 Count.',
        unit: 'Count',
        values: { '2026-01': 42, '2026-02': 51, '2026-03': 58 }
    },
    {
        name: 'Net Profit',
        description: 'Weight: 15%. Financial impact and profitability. Target: 10000 Currency.',
        unit: 'Currency',
        values: { '2026-01': 8200, '2026-02': 10850, '2026-03': 12400 }
    },
    {
        name: 'Average Order Value',
        description: 'Weight: 10%. Mean revenue per order. Target: 500 Currency.',
        unit: 'Currency',
        values: { '2026-01': 460, '2026-02': 515, '2026-03': 540 }
    },
    {
        name: 'Return on Investment (ROI)',
        description: 'Weight: 10%. Efficiency and financial gain of resources. Target: 120 Percentage.',
        unit: 'Percentage',
        values: { '2026-01': 105, '2026-02': 118, '2026-03': 126 }
    },
    {
        name: 'Order Completion Rate',
        description: 'Weight: 10%. Percentage of successfully delivered orders. Target: 95 Percentage.',
        unit: 'Percentage',
        values: { '2026-01': 91, '2026-02': 94, '2026-03': 96 }
    },
    {
        name: 'On-Time Delivery Rate',
        description: 'Weight: 10%. Ability to meet project deadlines. Target: 98 Percentage.',
        unit: 'Percentage',
        values: { '2026-01': 93, '2026-02': 96, '2026-03': 98 }
    },
    {
        name: 'Cancellation Rate',
        description: 'Weight: 5%. Percentage of failed/cancelled tasks. Target: 2 Percentage.',
        unit: 'Percentage',
        values: { '2026-01': 3.8, '2026-02': 2.5, '2026-03': 1.9 }
    },
    {
        name: 'Average Response Time',
        description: 'Weight: 5%. Speed of communication with stakeholders. Target: 2 Hours.',
        unit: 'Hours',
        values: { '2026-01': 3.1, '2026-02': 2.4, '2026-03': 1.8 }
    },
    {
        name: 'Customer Satisfaction Score',
        description: 'Weight: 10%. Direct ratings from clients. Target: 4.5 Score (1-5).',
        unit: 'Score (1-5)',
        values: { '2026-01': 4.1, '2026-02': 4.4, '2026-03': 4.6 }
    },
    {
        name: 'Repeat Customer Rate',
        description: 'Weight: 10%. Frequency of returning clients. Target: 30 Percentage.',
        unit: 'Percentage',
        values: { '2026-01': 24, '2026-02': 29, '2026-03': 33 }
    },
    {
        name: 'Quality of Work Product',
        description: 'Weight: 10%. Subjective rating of accuracy and thoroughness. Target: Rating.',
        unit: 'Rating',
        values: { '2026-01': 4.0, '2026-02': 4.2, '2026-03': 4.5 }
    },
    {
        name: 'Dispute Rate',
        description: 'Weight: 5%. Tasks resulting in formal complaints. Target: 1 Percentage.',
        unit: 'Percentage',
        values: { '2026-01': 1.8, '2026-02': 1.2, '2026-03': 0.9 }
    },
    {
        name: 'Disputes Converted to Satisfied',
        description: 'Weight: 5%. Problem-solving skills in conflicts. Target: 5 Count.',
        unit: 'Count',
        values: { '2026-01': 3, '2026-02': 5, '2026-03': 6 }
    },
    {
        name: 'Tips or Recognition',
        description: 'Weight: 5%. External positive feedback or rewards. Target: 100 Currency/Count.',
        unit: 'Currency/Count',
        values: { '2026-01': 75, '2026-02': 110, '2026-03': 135 }
    },
    {
        name: 'Adaptability & Learning',
        description: 'Weight: 10%. Speed of mastering new technologies.',
        unit: 'Rating',
        values: { '2026-01': 3.9, '2026-02': 4.2, '2026-03': 4.4 }
    }
];

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

async function seedViaApi() {
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

    let existingMetrics = await request('/company-data/metrics', { headers: authHeaders });

    for (const metricData of metrics) {
        let metric = existingMetrics.find((item) => item.name === metricData.name);

        if (!metric) {
            metric = await request('/company-data/metrics', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    name: metricData.name,
                    description: metricData.description,
                    unit: metricData.unit
                })
            });
            existingMetrics.push(metric);
        } else {
            metric = await request(`/company-data/metrics/${metric.id}`, {
                method: 'PUT',
                headers: authHeaders,
                body: JSON.stringify({
                    name: metricData.name,
                    description: metricData.description,
                    unit: metricData.unit
                })
            });
        }

        for (const [period, value] of Object.entries(metricData.values)) {
            await request('/company-data/logs', {
                method: 'POST',
                headers: authHeaders,
                body: JSON.stringify({
                    metricId: metric.id,
                    period,
                    value
                })
            });
        }
    }

    console.log(`Seeded ${metrics.length} metrics through ${API_BASE}.`);
}

seedViaApi().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
