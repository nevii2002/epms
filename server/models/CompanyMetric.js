const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyMetric = sequelize.define('CompanyMetric', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING,
        allowNull: true
    },
    weight: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        allowNull: false
    }
});

module.exports = CompanyMetric;
