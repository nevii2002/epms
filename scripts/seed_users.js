const { sequelize, User } = require('../server/models');
const bcrypt = require('bcryptjs');

async function seedUsers() {
    try {
        await sequelize.authenticate();
        await sequelize.sync();

        const hashedPassword = await bcrypt.hash('password123', 10);

        const admin = await User.create({
            username: 'Admin User',
            email: 'admin@techznap.com',
            password: hashedPassword,
            role: 'Admin',
            jobCategory: 'Management'
        });

        const employee = await User.create({
            username: 'John Doe',
            email: 'john@techznap.com',
            password: hashedPassword,
            role: 'Employee',
            jobCategory: 'Full time'
        });

        console.log('Users seeded successfully!');
        console.log('Admin: admin@techznap.com / password123');
        console.log('Employee: john@techznap.com / password123');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await sequelize.close();
    }
}

seedUsers();
