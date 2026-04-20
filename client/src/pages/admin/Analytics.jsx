import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { BarChart2, PieChart as PieChartIcon, Activity, TrendingUp } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const MONTHS = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' }
];

const COMPANY_TARGETS = {
    'Total New Orders': 50,
    'Net Profit': 10000,
    'Average Order Value': 500,
    'Return on Investment (ROI)': 120,
    'Order Completion Rate': 95,
    'On-Time Delivery Rate': 98,
    'Cancellation Rate': 2,
    'Average Response Time': 2,
    'Customer Satisfaction Score': 4.5,
    'Repeat Customer Rate': 30,
    'Quality of Work Product': 5,
    'Dispute Rate': 1,
    'Disputes Converted to Satisfied': 5,
    'Tips or Recognition': 100,
    'Adaptability & Learning': 5
};

const LOWER_IS_BETTER = new Set(['Cancellation Rate', 'Average Response Time', 'Dispute Rate']);

const getCompanyScore = (name, value) => {
    const target = COMPANY_TARGETS[name];
    if (!target || value === undefined || value === null) return null;
    const rawScore = LOWER_IS_BETTER.has(name) ? (target / Math.max(value, 0.01)) * 100 : (value / target) * 100;
    return Math.min(rawScore, 100);
};

const Analytics = () => {
    const [data, setData] = useState({
        jobCategories: [],
        roles: [],
        evaluationStatuses: [],
        bonusesByReason: []
    });
    const [companyYear, setCompanyYear] = useState(2026);
    const [fromMonth, setFromMonth] = useState(1);
    const [toMonth, setToMonth] = useState(4);
    const [companyLogsByPeriod, setCompanyLogsByPeriod] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchAnalyticsData = useCallback(async () => {
        try {
            const periods = MONTHS
                .filter(month => month.value >= fromMonth && month.value <= toMonth)
                .map(month => `${companyYear}-${String(month.value).padStart(2, '0')}`);
            const [res, ...companyLogResponses] = await Promise.all([
                api.get('/analytics/dashboard'),
                ...periods.map(period => api.get(`/company-data/logs?period=${period}`))
            ]);

            const nextCompanyLogs = {};
            periods.forEach((period, index) => {
                nextCompanyLogs[period] = companyLogResponses[index].data;
            });

            setData(res.data);
            setCompanyLogsByPeriod(nextCompanyLogs);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching analytics data:", error);
            setLoading(false);
        }
    }, [companyYear, fromMonth, toMonth]);

    useEffect(() => {
        Promise.resolve().then(fetchAnalyticsData);
    }, [fetchAnalyticsData]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full min-h-[400px]">
                <Activity className="animate-spin text-blue-600 w-12 h-12" />
            </div>
        );
    }

    // Prepare data for UI
    const jobData = data.jobCategories.map(item => ({ name: item.jobCategory, value: Number(item.count) }));
    const roleData = data.roles.map(item => ({ name: item.role, value: Number(item.count) }));
    const evalData = data.evaluationStatuses.map(item => ({ name: item.status, count: Number(item.count) }));
    const bonusData = data.bonusesByReason.map(item => ({ name: item.reason, amount: Number(item.totalAmount) }));
    const companyPeriods = Object.keys(companyLogsByPeriod).sort();
    const companyMetrics = Array.from(new Set(companyPeriods.flatMap(period => companyLogsByPeriod[period].map(log => log.metric?.name).filter(Boolean))));
    const companyMetricRows = companyMetrics.map(name => {
        const values = companyPeriods.map(period => {
            const log = companyLogsByPeriod[period].find(item => item.metric?.name === name);
            return {
                period,
                value: log ? Number(log.value) : null,
                score: log ? getCompanyScore(name, Number(log.value)) : null
            };
        });
        const validScores = values.filter(item => item.score !== null);
        const latest = [...values].reverse().find(item => item.value !== null);

        return {
            name,
            target: COMPANY_TARGETS[name],
            latestValue: latest?.value ?? null,
            latestPeriod: latest?.period,
            avgScore: validScores.length ? validScores.reduce((sum, item) => sum + item.score, 0) / validScores.length : null,
            values
        };
    });
    const companyScore = companyMetricRows.filter(row => row.avgScore !== null);
    const averageCompanyPerformance = companyScore.length
        ? companyScore.reduce((sum, row) => sum + row.avgScore, 0) / companyScore.length
        : 0;
    const improvingMetrics = companyMetricRows.filter(row => {
        const validValues = row.values.filter(item => item.value !== null);
        if (validValues.length < 2) return false;
        const first = validValues[0].value;
        const last = validValues[validValues.length - 1].value;
        return LOWER_IS_BETTER.has(row.name) ? last < first : last > first;
    }).length;
    const companyTrendData = companyPeriods.map(period => {
        const logs = companyLogsByPeriod[period] || [];
        const scoredLogs = logs
            .map(log => getCompanyScore(log.metric?.name, Number(log.value)))
            .filter(score => score !== null);
        return {
            period,
            performance: scoredLogs.length ? Number((scoredLogs.reduce((sum, score) => sum + score, 0) / scoredLogs.length).toFixed(1)) : 0
        };
    });
    const latestCompanyPeriod = companyPeriods[companyPeriods.length - 1];
    const latestCompanyLogs = latestCompanyPeriod ? companyLogsByPeriod[latestCompanyPeriod] || [] : [];
    const latestCompanyBarData = latestCompanyLogs
        .map(log => ({
            name: log.metric?.name,
            value: Number(log.value),
            score: getCompanyScore(log.metric?.name, Number(log.value))
        }))
        .filter(item => item.name && item.score !== null)
        .sort((a, b) => a.score - b.score)
        .slice(0, 8);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <BarChart2 className="mr-2 text-blue-600" />
                System Analytics
            </h2>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                            Company Performance Analysis
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">Based on values entered in Company Data for the selected period.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <select
                            value={companyYear}
                            onChange={(e) => setCompanyYear(parseInt(e.target.value))}
                            className="p-2 border border-gray-300 rounded-md bg-white text-sm font-medium"
                        >
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                            <option value={2027}>2027</option>
                        </select>
                        <select
                            value={fromMonth}
                            onChange={(e) => setFromMonth(Math.min(parseInt(e.target.value), toMonth))}
                            className="p-2 border border-gray-300 rounded-md bg-white text-sm font-medium"
                        >
                            {MONTHS.map(month => <option key={month.value} value={month.value}>From {month.label}</option>)}
                        </select>
                        <select
                            value={toMonth}
                            onChange={(e) => setToMonth(Math.max(parseInt(e.target.value), fromMonth))}
                            className="p-2 border border-gray-300 rounded-md bg-white text-sm font-medium"
                        >
                            {MONTHS.map(month => <option key={month.value} value={month.value}>To {month.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="rounded-lg border border-green-100 bg-green-50 p-4">
                        <p className="text-xs font-semibold text-green-600 uppercase">Average Company Performance</p>
                        <p className="text-3xl font-bold text-green-800 mt-1">{averageCompanyPerformance.toFixed(1)}%</p>
                    </div>
                    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase">Tracked Metrics</p>
                        <p className="text-3xl font-bold text-blue-800 mt-1">{companyMetricRows.length}</p>
                    </div>
                    <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
                        <p className="text-xs font-semibold text-purple-600 uppercase">Improving Metrics</p>
                        <p className="text-3xl font-bold text-purple-800 mt-1">{improvingMetrics}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div className="border border-gray-100 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">Company Performance Trend</h4>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={companyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="period" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Legend />
                                    <Line type="monotone" dataKey="performance" name="Performance %" stroke="#16a34a" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="border border-gray-100 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-4">Lowest Performing Metrics {latestCompanyPeriod ? `(${latestCompanyPeriod})` : ''}</h4>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={latestCompanyBarData} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 100]} />
                                    <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(value, name) => name === 'score' ? `${value.toFixed(1)}%` : value} />
                                    <Bar dataKey="score" name="Target Achievement" fill="#2563eb" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-semibold text-gray-600">Metric</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-600">Target</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-600">Latest Value</th>
                                <th className="px-4 py-2 text-right font-semibold text-gray-600">Avg Achievement</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {companyMetricRows.map(row => (
                                <tr key={row.name}>
                                    <td className="px-4 py-2 font-medium text-gray-800">{row.name}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">{row.target ?? '-'}</td>
                                    <td className="px-4 py-2 text-right text-gray-600">{row.latestValue ?? '-'}</td>
                                    <td className="px-4 py-2 text-right font-bold text-blue-700">{row.avgScore !== null ? `${row.avgScore.toFixed(1)}%` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Job Categories Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <PieChartIcon className="w-5 h-5 mr-2 text-indigo-500" />
                        Employees by Job Category
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={jobData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {jobData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Roles Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <PieChartIcon className="w-5 h-5 mr-2 text-green-500" />
                        Users by Access Role
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    fill="#82ca9d"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Evaluation Status Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <BarChart2 className="w-5 h-5 mr-2 text-blue-500" />
                        Performance Evaluations Status
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={evalData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis allowDecimals={false} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" name="Evaluations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bonuses Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-yellow-500" />
                        Total Bonus Allocation by Reason
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={bonusData}
                                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `LKR ${value.toLocaleString()}`} />
                                <Legend />
                                <Bar dataKey="amount" name="Total Amount (LKR)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
