const { CompanyMetric, CompanyMetricLog } = require('../models');

const toWeight = (value) => {
    const weight = parseFloat(value);
    return Number.isFinite(weight) ? weight : 0;
};

const validateWeight = (weight) => weight >= 0 && weight <= 100;

// Fetch all metrics
exports.getMetrics = async (req, res) => {
    try {
        const metrics = await CompanyMetric.findAll({ order: [['id', 'ASC']] });
        res.json(metrics);
    } catch (error) {
        console.error("Get Metrics Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a new metric
exports.createMetric = async (req, res) => {
    try {
        const { name, description, unit } = req.body;
        const weight = toWeight(req.body.weight);
        if (!name) return res.status(400).json({ message: 'Metric name is required' });
        if (!validateWeight(weight)) return res.status(400).json({ message: 'Weight must be between 0 and 100.' });
        const newMetric = await CompanyMetric.create({ name, description, unit, weight });
        res.status(201).json(newMetric);
    } catch (error) {
        console.error("Create Metric Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateMetricWeights = async (req, res) => {
    try {
        const { weights } = req.body;
        if (!Array.isArray(weights)) {
            return res.status(400).json({ message: 'Weights must be provided as an array.' });
        }

        const metrics = await CompanyMetric.findAll();
        const nextWeights = new Map(metrics.map(metric => [metric.id, toWeight(metric.weight)]));

        for (const item of weights) {
            const metricId = parseInt(item.metricId);
            const weight = toWeight(item.weight);
            if (!nextWeights.has(metricId)) {
                return res.status(404).json({ message: `Metric ${metricId} not found.` });
            }
            if (!validateWeight(weight)) {
                return res.status(400).json({ message: 'Each metric weight must be between 0 and 100.' });
            }
            nextWeights.set(metricId, weight);
        }

        const totalWeight = Array.from(nextWeights.values()).reduce((sum, weight) => sum + weight, 0);
        if (Math.abs(totalWeight - 100) > 0.01) {
            return res.status(400).json({ message: `Company metric weights must total exactly 100%. Current total: ${totalWeight.toFixed(2)}%.` });
        }

        await CompanyMetric.sequelize.transaction(async (transaction) => {
            for (const [metricId, weight] of nextWeights.entries()) {
                await CompanyMetric.update({ weight }, { where: { id: metricId }, transaction });
            }
        });

        const updatedMetrics = await CompanyMetric.findAll({ order: [['id', 'ASC']] });
        res.json({ message: 'Company metric weights saved successfully.', totalWeight, metrics: updatedMetrics });
    } catch (error) {
        console.error('Update Metric Weights Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Fetch logs for a specific period
exports.getLogs = async (req, res) => {
    try {
        const { period } = req.query; // format: YYYY-MM
        if (!period) return res.status(400).json({ message: 'Period is required' });

        const logs = await CompanyMetricLog.findAll({
            where: { period },
            include: [{ model: CompanyMetric, as: 'metric' }]
        });
        res.json(logs);
    } catch (error) {
        console.error("Get Logs Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create or update a log for a specific metric and period
exports.upsertLog = async (req, res) => {
    try {
        const { metricId, period, value } = req.body;
        if (!metricId || !period || value === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if log already exists
        let log = await CompanyMetricLog.findOne({ where: { metricId, period } });
        if (log) {
            log.value = value;
            await log.save();
        } else {
            log = await CompanyMetricLog.create({ metricId, period, value });
        }

        res.status(200).json(log);
    } catch (error) {
        console.error("Upsert Log Error:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Update a metric
exports.updateMetric = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, unit } = req.body;
        const weight = toWeight(req.body.weight);
        if (!name) return res.status(400).json({ message: 'Metric name is required' });
        if (!validateWeight(weight)) return res.status(400).json({ message: 'Weight must be between 0 and 100.' });
        const metric = await CompanyMetric.findByPk(id);
        if (!metric) return res.status(404).json({ message: 'Metric not found' });
        await metric.update({ name, description, unit, weight });
        res.json(metric);
    } catch (error) {
        console.error('Update Metric Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a metric and all its logs
exports.deleteMetric = async (req, res) => {
    try {
        const { id } = req.params;
        await CompanyMetricLog.destroy({ where: { metricId: id } });
        await CompanyMetric.destroy({ where: { id } });
        res.json({ message: 'Metric deleted successfully' });
    } catch (error) {
        console.error('Delete Metric Error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
