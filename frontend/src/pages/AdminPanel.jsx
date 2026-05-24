// ============================================================
// Admin Panel — Teams, Categories, Users management
// ============================================================
import { useState, useEffect } from 'react';
import API from '../api/axios';
import {
    HiOutlineUserGroup, HiOutlineTag, HiOutlineUsers,
    HiOutlinePlus, HiOutlineCalendar, HiOutlineCog,
} from 'react-icons/hi';

const AdminPanel = ({ showNotification }) => {
    const [activeTab, setActiveTab] = useState('teams');
    const [teams, setTeams] = useState([]);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);

    // Create forms
    const [showTeamForm, setShowTeamForm] = useState(false);
    const [teamForm, setTeamForm] = useState({ name: '', description: '' });
    const [showCatForm, setShowCatForm] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', description: '' });
    const [showSubForm, setShowSubForm] = useState(false);
    const [subForm, setSubForm] = useState({ category_id: '', name: '', description: '', assigned_team_id: '' });
    const [showUserForm, setShowUserForm] = useState(false);
    const [userForm, setUserForm] = useState({ name: '', email: '', role: 'user', department: '', phone: '', team_id: '', password: '' });
    const [showBulkForm, setShowBulkForm] = useState(false);
    const [bulkFile, setBulkFile] = useState(null);
    const [showHolidayForm, setShowHolidayForm] = useState(false);
    const [holidayForm, setHolidayForm] = useState({ name: '', holiday_date: '', is_recurring: false });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'teams') {
                const res = await API.get('/admin/teams');
                setTeams(res.data.teams || []);
            } else if (activeTab === 'categories') {
                const res = await API.get('/admin/categories');
                setCategories(res.data.categories || []);
            } else if (activeTab === 'users') {
                const res = await API.get('/admin/users');
                setUsers(res.data.users || []);
            } else if (activeTab === 'holidays') {
                const res = await API.get('/admin/holidays');
                setHolidays(res.data.holidays || []);
            } else if (activeTab === 'settings') {
                const res = await API.get('/admin/settings');
                setSettings(res.data.settings || {});
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/teams', teamForm);
            setTeamForm({ name: '', description: '' });
            setShowTeamForm(false);
            showNotification('Team created!');
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed.', 'error');
        }
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/categories', catForm);
            setCatForm({ name: '', description: '' });
            setShowCatForm(false);
            showNotification('Category created!');
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed.', 'error');
        }
    };

    const handleCreateSubcategory = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/subcategories', {
                ...subForm,
                category_id: parseInt(subForm.category_id),
                assigned_team_id: subForm.assigned_team_id ? parseInt(subForm.assigned_team_id) : null,
            });
            setSubForm({ category_id: '', name: '', description: '', assigned_team_id: '' });
            setShowSubForm(false);
            showNotification('Subcategory created!');
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed.', 'error');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/users', userForm);
            setUserForm({ name: '', email: '', role: 'user', department: '', phone: '', team_id: '', password: '' });
            setShowUserForm(false);
            showNotification('User created! Welcome email sent.');
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed.', 'error');
        }
    };
    const handleCreateHoliday = async (e) => {
        e.preventDefault();
        try {
            await API.post('/admin/holidays', holidayForm);
            setHolidayForm({ name: '', holiday_date: '', is_recurring: false });
            setShowHolidayForm(false);
            showNotification('Holiday created successfully!');
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed to create holiday.', 'error');
        }
    };

    const handleBulkUpload = async (e) => {
        e.preventDefault();
        if (!bulkFile) return;
        const formData = new FormData();
        formData.append('csvFile', bulkFile);
        try {
            const res = await API.post('/admin/users/bulk', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setBulkFile(null);
            setShowBulkForm(false);
            showNotification(res.data.message);
            fetchData();
        } catch (err) {
            showNotification(err.response?.data?.error || 'Failed.', 'error');
        }
    };

    const tabs = [
        { id: 'teams', label: 'Teams', icon: HiOutlineUserGroup },
        { id: 'categories', label: 'Categories', icon: HiOutlineTag },
        { id: 'users', label: 'Users', icon: HiOutlineUsers },
        { id: 'holidays', label: 'Holidays', icon: HiOutlineCalendar },
        { id: 'settings', label: 'Settings', icon: HiOutlineCog },
    ];

    return (
        <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h1>

            {/* Tab Navigation */}
            <div className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-6 w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
              ${activeTab === tab.id
                                ? 'bg-primary-600 text-white shadow-lg'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-40">
                    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Teams Tab */}
                    {activeTab === 'teams' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-700">Teams ({teams.length})</h2>
                                <button onClick={() => setShowTeamForm(!showTeamForm)} className="btn-primary text-sm flex items-center gap-1">
                                    <HiOutlinePlus className="w-4 h-4" /> New Team
                                </button>
                            </div>

                            {showTeamForm && (
                                <form onSubmit={handleCreateTeam} className="glass-card p-4 mb-4 flex gap-3 items-end animate-fade-in">
                                    <div className="flex-1">
                                        <label className="input-label">Team Name *</label>
                                        <input type="text" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} className="input-field" required />
                                    </div>
                                    <div className="flex-1">
                                        <label className="input-label">Description</label>
                                        <input type="text" value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} className="input-field" />
                                    </div>
                                    <button type="submit" className="btn-primary text-sm">Create</button>
                                </form>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {teams.map((team) => (
                                    <div key={team.id} className="glass-card p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1">{team.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">{team.description || 'No description'}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-400">
                                            <span>Lead: {team.team_lead_name || 'None'}</span>
                                            <span>{team.member_count} member(s)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Categories Tab */}
                    {activeTab === 'categories' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-700">Categories</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowSubForm(!showSubForm)} className="btn-secondary text-sm flex items-center gap-1">
                                        <HiOutlinePlus className="w-4 h-4" /> Subcategory
                                    </button>
                                    <button onClick={() => setShowCatForm(!showCatForm)} className="btn-primary text-sm flex items-center gap-1">
                                        <HiOutlinePlus className="w-4 h-4" /> Category
                                    </button>
                                </div>
                            </div>

                            {showCatForm && (
                                <form onSubmit={handleCreateCategory} className="glass-card p-4 mb-4 flex gap-3 items-end animate-fade-in">
                                    <div className="flex-1">
                                        <label className="input-label">Category Name *</label>
                                        <input type="text" value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} className="input-field" required />
                                    </div>
                                    <div className="flex-1">
                                        <label className="input-label">Description</label>
                                        <input type="text" value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} className="input-field" />
                                    </div>
                                    <button type="submit" className="btn-primary text-sm">Create</button>
                                </form>
                            )}

                            {showSubForm && (
                                <form onSubmit={handleCreateSubcategory} className="glass-card p-4 mb-4 grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
                                    <div>
                                        <label className="input-label">Parent Category *</label>
                                        <select value={subForm.category_id} onChange={(e) => setSubForm({ ...subForm, category_id: e.target.value })} className="input-field" required>
                                            <option value="">Select</option>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Name *</label>
                                        <input type="text" value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value })} className="input-field" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Assigned Team</label>
                                        <select value={subForm.assigned_team_id} onChange={(e) => setSubForm({ ...subForm, assigned_team_id: e.target.value })} className="input-field">
                                            <option value="">None</option>
                                            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button type="submit" className="btn-primary text-sm w-full">Create</button>
                                    </div>
                                </form>
                            )}

                            <div className="space-y-4">
                                {categories.map((cat) => (
                                    <div key={cat.id} className="glass-card p-4">
                                        <h3 className="font-semibold text-gray-900 mb-1">{cat.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">{cat.description || ''}</p>
                                        {cat.subcategories?.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {cat.subcategories.map((sub) => (
                                                    <span key={sub.id} className="px-3 py-1 rounded-lg bg-gray-100 text-xs text-gray-600">
                                                        {sub.name}
                                                        {sub.assigned_team_name && <span className="text-primary-400 ml-1">→ {sub.assigned_team_name}</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-700">Users ({users.length})</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowBulkForm(!showBulkForm)} className="btn-secondary text-sm flex items-center gap-1">
                                        Upload CSV
                                    </button>
                                    <button onClick={() => setShowUserForm(!showUserForm)} className="btn-primary text-sm flex items-center gap-1">
                                        <HiOutlinePlus className="w-4 h-4" /> Add User
                                    </button>
                                </div>
                            </div>

                            {showUserForm && (
                                <form onSubmit={handleCreateUser} className="glass-card p-4 mb-4 grid grid-cols-2 lg:grid-cols-5 gap-3 animate-fade-in items-end">
                                    <div>
                                        <label className="input-label">Name *</label>
                                        <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} className="input-field" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Email *</label>
                                        <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} className="input-field" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Role</label>
                                        <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} className="input-field">
                                            <option value="user">User</option>
                                            <option value="technician">Technician</option>
                                            <option value="team_lead">Team Lead</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Password *</label>
                                        <input type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} className="input-field" required />
                                    </div>
                                    <div>
                                        <label className="input-label">Dept / Phone</label>
                                        <input type="text" placeholder="Dept" value={userForm.department} onChange={(e) => setUserForm({ ...userForm, department: e.target.value })} className="input-field mb-1" />
                                        <input type="text" placeholder="Phone" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} className="input-field" />
                                    </div>
                                    {(userForm.role === 'technician' || userForm.role === 'team_lead') && (
                                        <div className="animate-fade-in">
                                            <label className="input-label font-bold text-primary-400">Assign Team *</label>
                                            <select 
                                                value={userForm.team_id} 
                                                onChange={(e) => setUserForm({ ...userForm, team_id: e.target.value })} 
                                                className="input-field border-primary-500/30 bg-primary-500/5"
                                                required={userForm.role === 'technician' || userForm.role === 'team_lead'}
                                            >
                                                <option value="">Select Team</option>
                                                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div>
                                        <button type="submit" className="btn-primary text-sm w-full">Create</button>
                                    </div>
                                </form>
                            )}

                            {showBulkForm && (
                                <div className="glass-card p-4 mb-4 animate-fade-in">
                                    <h3 className="text-sm font-semibold mb-2">Bulk User Upload</h3>
                                    <p className="text-xs text-gray-500 mb-3">CSV Format: <code>name, email, role, department, phone</code></p>
                                    <form onSubmit={handleBulkUpload} className="flex gap-3 items-center">
                                        <input type="file" accept=".csv" onChange={(e) => setBulkFile(e.target.files[0])} className="text-xs" required />
                                        <button type="submit" disabled={!bulkFile} className="btn-primary text-sm disabled:opacity-50">Upload & Import</button>
                                    </form>
                                </div>
                            )}
                            <div className="glass-card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase">
                                            <th className="text-left py-3 px-4">Name</th>
                                            <th className="text-left py-3 px-4">Email</th>
                                            <th className="text-left py-3 px-4">Role</th>
                                            <th className="text-left py-3 px-4">Department</th>
                                            <th className="text-center py-3 px-4">Status</th>
                                            <th className="text-center py-3 px-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id} className="border-t border-gray-200 hover:bg-gray-50">
                                                <td className="py-3 px-4 text-gray-700">{u.name}</td>
                                                <td className="py-3 px-4 text-gray-500">{u.email}</td>
                                                <td className="py-3 px-4"><span className="badge badge-open capitalize">{u.role}</span></td>
                                                <td className="py-3 px-4 text-gray-500">{u.department || '—'}</td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className={`badge ${u.is_active ? 'badge-resolved' : 'badge-closed'}`}>
                                                        {u.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <button onClick={async () => {
                                                        if (window.confirm('Delete this user?')) {
                                                            try {
                                                                await API.delete(`/admin/users/${u.id}`);
                                                                showNotification('User deleted');
                                                                fetchData();
                                                            } catch (err) {
                                                                showNotification(err.response?.data?.error || 'Delete failed', 'error');
                                                            }
                                                        }
                                                    }} className="text-red-600 hover:underline">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Holidays Tab */}
                    {activeTab === 'holidays' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-700">Holidays</h2>
                                <button onClick={() => setShowHolidayForm(!showHolidayForm)} className="btn-primary text-sm flex items-center gap-1">
                                    <HiOutlinePlus className="w-4 h-4" /> New Holiday
                                </button>
                            </div>

                            {showHolidayForm && (
                                <form onSubmit={handleCreateHoliday} className="glass-card p-4 mb-4 flex flex-wrap gap-4 items-end animate-fade-in">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="input-label">Holiday Name *</label>
                                        <input type="text" value={holidayForm.name} onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })} className="input-field" required />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="input-label">Date *</label>
                                        <input type="date" value={holidayForm.holiday_date} onChange={(e) => setHolidayForm({ ...holidayForm, holiday_date: e.target.value })} className="input-field" required />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="is_recurring" checked={holidayForm.is_recurring} onChange={(e) => setHolidayForm({ ...holidayForm, is_recurring: e.target.checked })} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                                        <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700">Recurring annually</label>
                                    </div>
                                    <button type="submit" className="btn-primary text-sm">Create</button>
                                </form>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {holidays.map((h) => (
                                    <div key={h.id} className="glass-card p-4 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                                <HiOutlineCalendar className="w-5 h-5 text-amber-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-700">{h.name}</p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(h.holiday_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    {h.is_recurring && ' (Recurring)'}
                                                </p>
                                            </div>
                                        </div>
                                        <button onClick={async () => {
                                            if (window.confirm('Delete this holiday?')) {
                                                try {
                                                    await API.delete(`/admin/holidays/${h.id}`);
                                                    showNotification('Holiday deleted');
                                                    fetchData();
                                                } catch (err) {
                                                    showNotification(err.response?.data?.error || 'Delete failed', 'error');
                                                }
                                            }
                                        }} className="text-red-600 hover:text-red-800 text-xs font-medium hover:underline">
                                            Delete
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div>
                            <h2 className="text-lg font-semibold text-gray-700 mb-4">System Settings</h2>
                            <div className="glass-card p-6 max-w-lg">
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    try {
                                        await API.post('/admin/settings', { key: 'otp_enabled', value: settings.otp_enabled === 'true' || settings.otp_enabled === true ? 'false' : 'true' });
                                        showNotification('Settings saved!');
                                        fetchData();
                                    } catch (err) {
                                        showNotification('Failed to update settings', 'error');
                                    }
                                }}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">OTP Verification for Ticket Closure</h3>
                                            <p className="text-xs text-gray-500">Require users to verify a code sent to their email when a technician tries to close a ticket.</p>
                                        </div>
                                        <button 
                                            type="submit" 
                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.otp_enabled === 'true' || settings.otp_enabled === true ? 'bg-primary-600' : 'bg-gray-200'}`}
                                        >
                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.otp_enabled === 'true' || settings.otp_enabled === true ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminPanel;
