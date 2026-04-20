export const normalizeMetricName = (name = '') =>
    name.toLowerCase().replace(/[^a-z0-9]/g, '');

export const buildCompanyMetricMap = (companyLogs = []) => {
    const metricMap = {};

    companyLogs.forEach((log) => {
        if (log.metric?.name) {
            metricMap[normalizeMetricName(log.metric.name)] = log.value;
        }
    });

    return metricMap;
};

export const getCompanyMetricValue = (metricMap, kpiTitle) => {
    const normalizedTitle = normalizeMetricName(kpiTitle);
    return metricMap[normalizedTitle];
};
