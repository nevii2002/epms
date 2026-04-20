import React, { useEffect, useState } from 'react';
import StarRating from '../../components/StarRating';
import { evaluationCriteria } from '../../constants/evaluationCriteria';
import api from '../../api/axios';
import { useAuth } from '../../context/useAuth';

const SelfEvaluation = () => {
    const { user } = useAuth();
    const [specificKPIs, setSpecificKPIs] = useState([]);
    const [missingCriteria, setMissingCriteria] = useState([]);
    const [ratings, setRatings] = useState({});
    const [globalComment, setGlobalComment] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedYear, setSelectedYear] = useState(2026);
    const [selectedMonth, setSelectedMonth] = useState(4);
    const selectedPeriod = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;

    useEffect(() => {
        const fetchCriteria = async () => {
            setLoading(true);
            try {
                const response = await api.get('/kpis');
                const qualitativeKpis = response.data.filter(k => k.category === 'Qualitative');
                const normalizedKpis = evaluationCriteria
                    .map((criterion) => {
                        const savedKpi = qualitativeKpis.find(k => k.title === criterion.title);
                        return savedKpi ? { ...savedKpi, description: criterion.description } : null;
                    })
                    .filter(Boolean);
                setSpecificKPIs(normalizedKpis);
                setMissingCriteria(evaluationCriteria
                    .filter((criterion) => !qualitativeKpis.some(k => k.title === criterion.title))
                    .map((criterion) => criterion.title));
            } catch (err) {
                console.error('Failed to load self evaluation criteria', err);
                setErrorMessage('Failed to load evaluation criteria.');
            } finally {
                setLoading(false);
            }
        };

        fetchCriteria();
    }, []);

    const handleRatingChange = (kpiId, rating) => {
        setRatings(prev => ({
            ...prev,
            [kpiId]: rating
        }));
    };

    const calculateAverage = () => {
        const values = Object.values(ratings);
        if (values.length === 0) return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return (sum / specificKPIs.length).toFixed(1);
    };

    const currentScore = calculateAverage();

    const handleSubmit = async () => {
        if (!user?.id) {
            setErrorMessage('You must be logged in to submit a self evaluation.');
            return;
        }
        if (specificKPIs.length === 0) {
            setErrorMessage('No evaluation criteria are available yet.');
            return;
        }
        setLoading(true);
        setErrorMessage('');

        const details = Object.entries(ratings).map(([kpiId, rating]) => ({
            kpiId: parseInt(kpiId),
            rating,
            comment: ''
        }));

        try {
            await api.post('/evaluations', {
                employeeId: user.id,
                type: 'Self',
                period: selectedPeriod,
                details,
                comments: globalComment
            });
            setSubmitted(true);
        } catch (err) {
            console.error('Submit Error:', err);
            setErrorMessage(err.response?.data?.message || 'Failed to submit self evaluation.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md w-full border-t-4 border-blue-500">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Evaluation Submitted</h2>
                    <p className="text-gray-600 mb-4">Your self-evaluation has been successfully recorded.</p>
                    <p className="text-sm text-gray-500 mb-4">Period: {selectedPeriod}</p>

                    <div className="bg-blue-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Your Final Mark</p>
                        <p className="text-4xl font-extrabold text-blue-900">{currentScore} <span className="text-lg text-blue-400">/ 5.0</span></p>
                    </div>

                    <button onClick={() => setSubmitted(false)} className="mt-2 text-blue-600 hover:text-blue-800 font-medium">Return to Form</button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-8 px-4 font-sans">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Employee Self-Evaluation Form</h2>
                        <p className="mt-1 text-sm text-gray-500">Rate your performance on the displayed KPIs.</p>
                        {errorMessage && <div className="mt-4 bg-red-100 text-red-700 p-3 rounded text-sm">{errorMessage}</div>}
                        {missingCriteria.length > 0 && (
                            <div className="mt-4 bg-amber-100 text-amber-800 p-3 rounded text-sm">
                                Missing KPI Framework items: {missingCriteria.join(', ')}. They will appear after the backend seed runs.
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <select
                            className="p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        >
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                            <option value={2027}>2027</option>
                        </select>
                        <select
                            className="p-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                        >
                            {Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>
                                    {new Date(2025, i, 1).toLocaleString('default', { month: 'short' })}
                                </option>
                            ))}
                        </select>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold">Current Score</p>
                            <p className="text-2xl font-bold text-indigo-600">{currentScore}</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {loading && specificKPIs.length === 0 ? (
                        <p className="text-gray-500 text-center">Loading evaluation criteria...</p>
                    ) : specificKPIs.length === 0 ? (
                        <p className="text-gray-500 text-center">No qualitative evaluation criteria found. Please add them in KPI Framework.</p>
                    ) : (
                        specificKPIs.map((kpi) => (
                            <div key={kpi.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-800 text-md">{kpi.title}</h3>
                                    <StarRating
                                        rating={ratings[kpi.id] || 0}
                                        onRatingChange={(r) => handleRatingChange(kpi.id, r)}
                                    />
                                </div>
                                <p className="text-sm text-gray-600 mb-0">{kpi.description}</p>
                            </div>
                        ))
                    )}

                    <div className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-bold text-gray-800 text-md mb-2">Additional Comments</h3>
                        <p className="text-xs text-gray-500 mb-2">Overall, I believe my performance has been strong, particularly in problem-solving. I aim to improve my project deadline consistency in the next quarter.</p>
                        <textarea
                            rows={3}
                            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none"
                            placeholder="Type your comments here..."
                            value={globalComment}
                            onChange={(e) => setGlobalComment(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                        <div>
                            <span className="text-sm font-medium text-gray-500">Final Mark: </span>
                            <span className="text-xl font-bold text-gray-900">{currentScore} / 5.0</span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg shadow transition duration-200 flex items-center"
                        >
                            {loading ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SelfEvaluation;
