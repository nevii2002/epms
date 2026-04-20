import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Edit, Save } from 'lucide-react';

const emptyRow = () => ({
    id: `temp-${Math.random()}`,
    kpiId: '',
    project: '',
    kpi: 'Quantitative',
    target: '',
    weight: '',
    bonusAt100: '',
    unit: 'Currency'
});

const BonusConfiguration = () => {
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [employees, setEmployees] = useState([]);
    const [rows, setRows] = useState([]);
    const [allKpis, setAllKpis] = useState([]);
    const [existingAssignments, setExistingAssignments] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    const fetchEmployees = async () => {
        try {
            const response = await api.get('/staff');
            const staff = response.data.filter(user => user.role === 'Employee');
            setEmployees(staff);
            if (staff.length > 0) {
                setSelectedEmployee(staff[0].id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchKpis = async () => {
        try {
            const response = await api.get('/kpis');
            setAllKpis(response.data || []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchEmployeeData = async (empId) => {
        try {
            const res = await api.get(`/staff/${empId}/kpis`);
            const assigned = res.data || [];
            setExistingAssignments(assigned);

            const bonusRows = assigned
                .filter(kpi => kpi.type === 'BONUS' || Number(kpi.EmployeeKPI?.customBonus || 0) > 0)
                .map(kpi => ({
                    id: kpi.id,
                    kpiId: kpi.id,
                    project: kpi.title,
                    kpi: kpi.category,
                    target: kpi.targetValue ?? '',
                    weight: kpi.EmployeeKPI?.customWeight ?? '',
                    bonusAt100: kpi.EmployeeKPI?.customBonus ?? '',
                    unit: kpi.unit || ''
                }));

            while (bonusRows.length < 5) bonusRows.push(emptyRow());
            setRows(bonusRows);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        Promise.resolve().then(fetchEmployees);
        Promise.resolve().then(fetchKpis);
    }, []);

    useEffect(() => {
        if (selectedEmployee) {
            Promise.resolve().then(() => fetchEmployeeData(selectedEmployee));
        }
    }, [selectedEmployee]);

    const handleInputChange = (id, field, value) => {
        setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
    };

    const handleSave = async () => {
        if (!selectedEmployee) return alert('Please select an employee first.');

        const rowsToSave = rows.filter(row => row.project && Number(row.bonusAt100 || 0) > 0);
        if (rowsToSave.length === 0) return alert('Please add at least one bonus target with a bonus amount.');

        for (const row of rowsToSave) {
            const weight = Number(row.weight);
            const bonusAt100 = Number(row.bonusAt100);
            const target = Number(row.target);
            if (!Number.isFinite(weight) || weight < 0 || weight > 100) {
                return alert(`Weight must be between 0 and 100 for ${row.project}.`);
            }
            if (!Number.isFinite(bonusAt100) || bonusAt100 <= 0) {
                return alert(`Bonus at 100% must be greater than 0 for ${row.project}.`);
            }
            if (!Number.isFinite(target) || target <= 0) {
                return alert(`Target must be greater than 0 for ${row.project}.`);
            }
        }

        setIsSaving(true);
        try {
            const savedBonusAssignments = [];

            for (const row of rowsToSave) {
                let kpiId = row.kpiId;
                if (!kpiId) {
                    const created = await api.post('/kpis', {
                        title: row.project,
                        description: `Bonus target for ${row.project}`,
                        category: row.kpi || 'Quantitative',
                        type: 'BONUS',
                        unit: row.unit || 'Currency',
                        weight: Number(row.weight) || 0,
                        targetValue: Number(row.target) || 0
                    });
                    kpiId = created.data.id;
                }

                savedBonusAssignments.push({
                    kpiId: Number(kpiId),
                    weight: Number(row.weight) || 0,
                    customBonus: Number(row.bonusAt100) || 0
                });
            }

            const preservedAssignments = existingAssignments
                .filter(kpi => kpi.type !== 'BONUS' && Number(kpi.EmployeeKPI?.customBonus || 0) === 0)
                .map(kpi => ({
                    kpiId: kpi.id,
                    weight: Number(kpi.EmployeeKPI?.customWeight || kpi.weight || 0),
                    customBonus: Number(kpi.EmployeeKPI?.customBonus || 0)
                }));

            await api.post(`/staff/${selectedEmployee}/kpis`, {
                assignments: [...preservedAssignments, ...savedBonusAssignments]
            });

            alert(`Configuration saved successfully for ${employees.find(e => e.id == selectedEmployee)?.username}`);
            await fetchKpis();
            await fetchEmployeeData(selectedEmployee);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to save configuration.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen font-sans">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center">
                    <label className="mr-3 text-sm font-semibold text-gray-600">Configuring for:</label>
                    <select
                        className="p-2 border rounded shadow-sm bg-white min-w-[200px]"
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                    >
                        <option value="">Select Employee</option>
                        {employees.map(e => <option key={e.id} value={e.id}>{e.username}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Bonus Structure</h2>
                    <p className="text-sm text-gray-500 mt-1">Saved targets will appear in the employee portal under My Bonuses.</p>
                </div>

                <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-white border-b border-gray-100 text-sm font-bold text-gray-900 text-center items-center">
                    <div className="col-span-3 text-left pl-8">Project</div>
                    <div className="col-span-2">KPI</div>
                    <div className="col-span-2">Target</div>
                    <div className="col-span-2">Weight (%)</div>
                    <div className="col-span-3">Bonus at 100%</div>
                </div>

                <div className="p-6 space-y-4">
                    {rows.map((row) => (
                        <div key={row.id} className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-3 flex items-center space-x-2">
                                <div className="p-1.5 bg-blue-500 rounded text-white">
                                    <Edit size={14} />
                                </div>
                                <input
                                    type="text"
                                    value={row.project}
                                    placeholder="Project Name"
                                    list="bonus-kpi-options"
                                    onChange={(e) => {
                                        const matched = allKpis.find(kpi => kpi.title === e.target.value && kpi.type === 'BONUS');
                                        setRows(prev => prev.map(item => item.id === row.id ? {
                                            ...item,
                                            project: e.target.value,
                                            kpiId: matched?.id || '',
                                            kpi: matched?.category || item.kpi,
                                            target: matched?.targetValue ?? item.target,
                                            unit: matched?.unit || item.unit
                                        } : item));
                                    }}
                                    className="w-full text-sm text-gray-800 bg-transparent border-none focus:ring-0 placeholder-gray-300"
                                />
                            </div>

                            <div className="col-span-2">
                                <input
                                    type="text"
                                    value={row.kpi}
                                    onChange={(e) => handleInputChange(row.id, 'kpi', e.target.value)}
                                    className="w-full h-10 px-3 bg-blue-50 border border-blue-100 rounded-full text-sm text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            <div className="col-span-2">
                                <input
                                    type="number"
                                    value={row.target}
                                    onChange={(e) => handleInputChange(row.id, 'target', e.target.value)}
                                    className="w-full h-10 px-3 bg-blue-50 border border-blue-100 rounded-full text-sm text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>

                            <div className="col-span-2">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={row.weight}
                                    onChange={(e) => handleInputChange(row.id, 'weight', e.target.value)}
                                    className="w-full h-10 px-3 bg-blue-50 border border-blue-100 rounded-full text-sm text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    placeholder="%"
                                />
                            </div>

                            <div className="col-span-3">
                                <input
                                    type="number"
                                    min="0"
                                    value={row.bonusAt100}
                                    onChange={(e) => handleInputChange(row.id, 'bonusAt100', e.target.value)}
                                    className="w-full h-10 px-3 bg-blue-50 border border-blue-100 rounded-full text-sm text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <datalist id="bonus-kpi-options">
                    {allKpis.filter(kpi => kpi.type === 'BONUS').map(kpi => (
                        <option key={kpi.id} value={kpi.title} />
                    ))}
                </datalist>

                <div className="p-6 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-200 flex items-center"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {isSaving ? 'Saving...' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BonusConfiguration;
