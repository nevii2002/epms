import React, { useState, useEffect } from 'react';
import { Save, BarChart2 } from 'lucide-react';
import api from '../../api/axios';

const EmployeeKPITracking = () => {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonth, setSelectedMonth] = useState(4);
    const [trackingKpis, setTrackingKpis] = useState([]);
    const [logs, setLogs] = useState({});
    const [saving, setSaving] = useState(false);
    const [trackingMessage, setTrackingMessage] = useState('');

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await api.get('/staff');
                const employeeRoles = ['Employee', 'HR'];
                setEmployees(res.data.filter(u => employeeRoles.includes(u.role)));
            } catch (err) { console.error(err); }
        };
        fetchEmployees();
    }, []);

    useEffect(() => {
        if (!selectedEmployee) return;
        const fetchData = async () => {
            try {
                const kpiRes = await api.get(`/staff/${selectedEmployee}/kpis`);
                setTrackingKpis(kpiRes.data || []);

                const period = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
                const logsRes = await api.get(`/quantitative/${selectedEmployee}?period=${period}`);
                const newLogs = {};
                logsRes.data.forEach(log => newLogs[log.kpiId] = log.actualValue);
                setLogs(newLogs);
            } catch (err) { console.error('Failed to load tracking data', err); }
        };
        fetchData();
    }, [selectedEmployee, selectedYear, selectedMonth]);

    const handleSaveTrack = async (kpiId) => {
        setSaving(true);
        setTrackingMessage('');
        try {
            const period = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
            const actualValue = parseFloat(logs[kpiId]);
            if (isNaN(actualValue)) {
                setSaving(false);
                return;
            }

            await api.post('/quantitative', { employeeId: selectedEmployee, kpiId, period, actualValue });
            setTrackingMessage('Score saved successfully');
            setTimeout(() => setTrackingMessage(''), 3000);
        } catch {
            setTrackingMessage('Failed to save score');
        } finally {
            setSaving(false);
        }
    };

    const scoreRows = trackingKpis
        .filter(kpi => kpi.type === 'EVALUATION')
        .map(kpi => {
            const actual = parseFloat(logs[kpi.id]);
            const target = parseFloat(kpi.targetValue);
            const weight = parseFloat(kpi.EmployeeKPI?.customWeight) || parseFloat(kpi.weight) || 0;
            const hasValidScore = !Number.isNaN(actual) && !Number.isNaN(target) && target > 0;
            const rawScore = hasValidScore ? (actual / target) * 100 : 0;
            const cappedScore = Math.min(rawScore, 100);

            return {
                id: kpi.id,
                title: kpi.title,
                actual,
                target,
                weight,
                rawScore,
                cappedScore,
                weightedScore: cappedScore * (weight / 100),
                hasValidScore
            };
        });

    const scoredRows = scoreRows.filter(row => row.hasValidScore);
    const totalWeight = scoredRows.reduce((sum, row) => sum + row.weight, 0);
    const overallScore = totalWeight > 0
        ? scoredRows.reduce((sum, row) => sum + row.weightedScore, 0)
        : 0;
    const normalizedScore = totalWeight > 0
        ? (overallScore / totalWeight) * 100
        : 0;
    const selectedEmployeeName = employees.find(employee => String(employee.id) === String(selectedEmployee))?.username;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                        <BarChart2 className="w-6 h-6 mr-3 text-blue-600" />
                        Employee KPI Tracking
                    </h2>
                    <p className="text-sm text-gray-500">Log actual values for an employee's assigned Quantitative KPIs.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-center">
                    <select
                        className="w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm font-medium"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                        <option value="">Select Employee...</option>
                        {employees.map(e => (
                            <option key={e.id} value={e.id}>
                                {e.username} {e.status ? `(${e.status})` : ''}
                            </option>
                        ))}
                    </select>

                    <select
                        className="w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm font-medium"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        <option value={2025}>2025</option>
                        <option value={2026}>2026</option>
                    </select>

                    <select
                        className="w-full md:w-auto p-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm font-medium"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(2025, i, 1).toLocaleString('default', { month: 'short' })}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {trackingMessage && (
                <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 font-medium border border-green-200 shadow-sm">{trackingMessage}</div>
            )}

            {selectedEmployee && trackingKpis.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">KPI Score Summary</h3>
                            <p className="text-sm text-gray-500">
                                {selectedEmployeeName || 'Selected employee'} - {selectedYear}-{String(selectedMonth).padStart(2, '0')}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto">
                            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-center">
                                <p className="text-xs font-semibold uppercase text-blue-500">Overall Score</p>
                                <p className="text-2xl font-bold text-blue-700">{normalizedScore.toFixed(1)}%</p>
                            </div>
                            <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-center">
                                <p className="text-xs font-semibold uppercase text-green-500">Weighted Points</p>
                                <p className="text-2xl font-bold text-green-700">{overallScore.toFixed(1)}</p>
                            </div>
                            <div className="rounded-lg border border-purple-100 bg-purple-50 px-4 py-3 text-center">
                                <p className="text-xs font-semibold uppercase text-purple-500">Logged Weight</p>
                                <p className="text-2xl font-bold text-purple-700">{totalWeight.toFixed(0)}%</p>
                            </div>
                        </div>
                    </div>

                    {scoredRows.length > 0 ? (
                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold text-gray-600">KPI</th>
                                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Actual</th>
                                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Target</th>
                                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Weight</th>
                                        <th className="px-4 py-2 text-right font-semibold text-gray-600">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {scoredRows.map(row => (
                                        <tr key={row.id}>
                                            <td className="px-4 py-2 font-medium text-gray-800">{row.title}</td>
                                            <td className="px-4 py-2 text-right text-gray-600">{row.actual}</td>
                                            <td className="px-4 py-2 text-right text-gray-600">{row.target}</td>
                                            <td className="px-4 py-2 text-right text-gray-600">{row.weight}%</td>
                                            <td className="px-4 py-2 text-right font-bold text-blue-700">{row.cappedScore.toFixed(1)}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-gray-500">No valid quantitative KPI logs are available for this employee and period yet.</p>
                    )}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {!selectedEmployee ? (
                    <div className="text-center py-10">
                        <BarChart2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">Select an employee to view their KPI targets.</p>
                    </div>
                ) : trackingKpis.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 italic">No KPIs assigned to this employee.</div>
                ) : (
                    <div className="space-y-4">
                        {trackingKpis.map(kpi => (
                            <div key={kpi.id} className="border border-gray-100 rounded-lg p-5 border-l-4 border-l-blue-500 bg-gray-50/50 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-lg">{kpi.title}</h3>
                                    <div className="text-sm font-semibold text-gray-600 flex gap-6 mt-3 bg-white inline-block p-2 rounded-md border border-gray-100">
                                        <span>Target: <span className="text-blue-600 font-bold">{kpi.targetValue} {kpi.unit}</span></span>
                                        <span>Allocated Weight: <span className="text-purple-600 font-bold">{kpi.EmployeeKPI?.customWeight}%</span></span>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center space-x-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                                    <input
                                        type="number"
                                        className="w-28 border border-gray-200 rounded-md px-3 py-2 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                                        placeholder={`Actual`}
                                        value={logs[kpi.id] !== undefined ? logs[kpi.id] : ''}
                                        onChange={(e) => setLogs({ ...logs, [kpi.id]: e.target.value })}
                                    />
                                    <span className="text-xs font-bold text-gray-500 px-2">{kpi.unit}</span>
                                    <button
                                        onClick={() => handleSaveTrack(kpi.id)}
                                        disabled={saving || logs[kpi.id] === undefined || logs[kpi.id] === ''}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2.5 rounded-md flex items-center justify-center transition-colors shadow-sm"
                                        title="Save Score"
                                    >
                                        <Save className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmployeeKPITracking;
