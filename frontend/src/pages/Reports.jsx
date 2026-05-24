// ============================================================
// Reports Page — Charts and metrics
// ============================================================
import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { HiOutlineChartBar, HiOutlineCalendar, HiOutlineDownload } from 'react-icons/hi';

const COLORS = ['#6366f1', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

const Reports = ({ showNotification }) => {
    const [activeReport, setActiveReport] = useState('category');
    const [categoryData, setCategoryData] = useState([]);
    const [subcategoryData, setSubcategoryData] = useState([]);
    const [techData, setTechData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start_date: '', end_date: '' });

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const params = {};
            if (dateRange.start_date) params.start_date = dateRange.start_date;
            if (dateRange.end_date) params.end_date = dateRange.end_date;

            const [catRes, subRes, techRes] = await Promise.all([
                API.get('/admin/reports/by-category', { params }),
                API.get('/admin/reports/by-subcategory', { params }),
                API.get('/admin/reports/by-technician', { params }).catch(() => ({ data: { report: [] } })),
            ]);

            setCategoryData(catRes.data.report || []);
            setSubcategoryData(subRes.data.report || []);
            setTechData(techRes.data.report || []);
        } catch (err) {
            console.error('Reports error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        fetchReports();
    };

    const reports = [
        { id: 'category', label: 'By Category' },
        { id: 'subcategory', label: 'By Subcategory' },
        { id: 'technician', label: 'By Technician' },
    ];

    const formatPieData = (data) => {
        return data.map((d) => ({
            name: d.category_name || d.team_name || d.technician_name,
            value: parseInt(d.total_tickets) || 0,
        }));
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <HiOutlineChartBar className="w-7 h-7 text-primary-400" /> Reports
                    </h1>
                    <p className="text-gray-500 mt-1">Analyze ticket metrics and performance</p>
                </div>
            </div>

            {/* Date Filter */}
            <div className="glass-card p-4 mb-6">
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="input-label flex items-center gap-1">
                            <HiOutlineCalendar className="w-4 h-4" /> From
                        </label>
                        <input
                            type="date"
                            value={dateRange.start_date}
                            onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                            className="input-field"
                        />
                    </div>
                    <div>
                        <label className="input-label flex items-center gap-1">
                            <HiOutlineCalendar className="w-4 h-4" /> To
                        </label>
                        <input
                            type="date"
                            value={dateRange.end_date}
                            onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                            className="input-field"
                        />
                    </div>
                    <button onClick={handleFilter} className="btn-primary text-sm">Apply Filter</button>
                    <button onClick={() => { setDateRange({ start_date: '', end_date: '' }); fetchReports(); }} className="btn-secondary text-sm">
                        Clear
                    </button>
                    <button 
                        onClick={async () => {
                            try {
                                const params = {};
                                if (dateRange.start_date) params.start_date = dateRange.start_date;
                                if (dateRange.end_date) params.end_date = dateRange.end_date;
                                const response = await API.get('/admin/reports/pdf', { 
                                    params,
                                    responseType: 'blob' 
                                });
                                const url = window.URL.createObjectURL(new Blob([response.data]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', 'Helpdesk_Report.pdf');
                                document.body.appendChild(link);
                                link.click();
                                window.URL.revokeObjectURL(url);
                                link.remove();
                            } catch (err) {
                                console.error('Failed to export PDF:', err);
                                if (typeof showNotification === 'function') {
                                    showNotification('Failed to generate PDF', 'error');
                                } else {
                                    alert('Failed to generate PDF');
                                }
                            }
                        }} 
                        className="btn-primary text-sm ml-auto flex items-center gap-1"
                    >
                        <HiOutlineDownload className="w-4 h-4" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Report Tabs */}
            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-6 w-fit">
                {reports.map((r) => (
                    <button
                        key={r.id}
                        onClick={() => setActiveReport(r.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all
              ${activeReport === r.id ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Category Report */}
                    {activeReport === 'category' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Bar Chart */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h3>
                                {categoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={categoryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="category_name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }}
                                            />
                                            <Bar dataKey="total_tickets" fill="#6366f1" radius={[4, 4, 0, 0]} name="Total" />
                                            <Bar dataKey="closed_tickets" fill="#10b981" radius={[4, 4, 0, 0]} name="Closed" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-gray-400 text-center py-8">No data available</p>}
                            </div>

                            {/* Pie Chart */}
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution</h3>
                                {categoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={formatPieData(categoryData)}
                                                cx="50%" cy="50%"
                                                innerRadius={60} outerRadius={100}
                                                paddingAngle={3}
                                                dataKey="value"
                                            >
                                                {formatPieData(categoryData).map((_, i) => (
                                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                                            <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-gray-400 text-center py-8">No data available</p>}
                            </div>

                            {/* Table */}
                            <div className="glass-card p-6 lg:col-span-2">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                                                <th className="text-left py-3 px-3">Category</th>
                                                <th className="text-center py-3 px-3">Total</th>
                                                <th className="text-center py-3 px-3">Open</th>
                                                <th className="text-center py-3 px-3">In Progress</th>
                                                <th className="text-center py-3 px-3">Closed</th>
                                                <th className="text-center py-3 px-3">Avg Resolution (hrs)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categoryData.map((row, i) => (
                                                <tr key={i} className="border-b border-dark-800/50 hover:bg-gray-50">
                                                    <td className="py-3 px-3 text-gray-700 font-medium">{row.category_name}</td>
                                                    <td className="py-3 px-3 text-center text-gray-600">{row.total_tickets}</td>
                                                    <td className="py-3 px-3 text-center text-blue-400">{row.open_tickets}</td>
                                                    <td className="py-3 px-3 text-center text-amber-400">{row.in_progress_tickets}</td>
                                                    <td className="py-3 px-3 text-center text-emerald-400">{row.closed_tickets}</td>
                                                    <td className="py-3 px-3 text-center text-gray-500">{row.avg_resolution_hours || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subcategory Report */}
                    {activeReport === 'subcategory' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Subcategory</h3>
                                {subcategoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={subcategoryData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                            <XAxis dataKey="subcategory_name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#e2e8f0' }} />
                                            <Bar dataKey="total_tickets" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total" />
                                            <Bar dataKey="closed_tickets" fill="#10b981" radius={[4, 4, 0, 0]} name="Closed" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : <p className="text-gray-400 text-center py-8">No data</p>}
                            </div>

                            <div className="glass-card p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subcategory Breakdown</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                                            <th className="text-left py-3 px-3">Subcategory</th>
                                            <th className="text-left py-3 px-3">Parent Category</th>
                                            <th className="text-center py-3 px-3">Total</th>
                                            <th className="text-center py-3 px-3">Open</th>
                                            <th className="text-center py-3 px-3">Closed</th>
                                        </tr></thead>
                                        <tbody>
                                            {subcategoryData.map((row, i) => (
                                                <tr key={i} className="border-b border-dark-800/50">
                                                    <td className="py-3 px-3 text-gray-700 font-medium">{row.subcategory_name}</td>
                                                    <td className="py-3 px-3 text-gray-500">{row.category_name}</td>
                                                    <td className="py-3 px-3 text-center">{row.total_tickets}</td>
                                                    <td className="py-3 px-3 text-center text-blue-400">{row.open_tickets}</td>
                                                    <td className="py-3 px-3 text-center text-emerald-400">{row.closed_tickets}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Technician Report */}
                    {activeReport === 'technician' && (
                        <div className="glass-card p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Technician (Categorized)</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="text-gray-500 text-xs uppercase border-b border-gray-200">
                                        <th className="text-left py-3 px-3">Category</th>
                                        <th className="text-left py-3 px-3">Technician</th>
                                        <th className="text-left py-3 px-3">Email</th>
                                        <th className="text-center py-3 px-3">Total</th>
                                        <th className="text-center py-3 px-3">Open</th>
                                        <th className="text-center py-3 px-3">In Progress</th>
                                        <th className="text-center py-3 px-3">Closed</th>
                                        <th className="text-center py-3 px-3">Avg Resolution (hrs)</th>
                                        <th className="text-center py-3 px-3">Avg Rating</th>
                                    </tr></thead>
                                    <tbody>
                                        {techData.length > 0 ? techData.map((row, i) => (
                                            <tr key={i} className="border-b border-dark-800/50 hover:bg-gray-50">
                                                <td className="py-3 px-3 text-gray-500">{row.category_name}</td>
                                                <td className="py-3 px-3 text-gray-700 font-medium">{row.technician_name}</td>
                                                <td className="py-3 px-3 text-gray-500">{row.technician_email}</td>
                                                <td className="py-3 px-3 text-center">{row.total_tickets}</td>
                                                <td className="py-3 px-3 text-center text-blue-400">{row.open_tickets}</td>
                                                <td className="py-3 px-3 text-center text-amber-400">{row.in_progress_tickets}</td>
                                                <td className="py-3 px-3 text-center text-emerald-400">{row.closed_tickets}</td>
                                                <td className="py-3 px-3 text-center text-gray-500">{row.avg_resolution_hours || '—'}</td>
                                                <td className="py-3 px-3 text-center text-amber-400">{row.avg_feedback_rating ? `⭐ ${row.avg_feedback_rating}` : '—'}</td>
                                            </tr>
                                        )) : (
                                            <tr><td colSpan={9} className="py-8 text-center text-gray-400">No data available</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Reports;
