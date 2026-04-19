const { sequelize, KPI } = require('../server/models');

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');
        await sequelize.sync(); // Ensure tables 

        const kpi = await KPI.create({
            title: 'Test KPI',
            description: 'Test Description',
            category: 'Quantitative',
            unit: 'Score',
            weight: 10,
            targetValue: 100,
            role: 'Employee'
        });
        console.log('Seeded KPI:', kpi.toJSON());
    } catch (err) {
        console.error('Seed failed:', err);
    } finally {
        await sequelize.close();
    }
}

seed();
