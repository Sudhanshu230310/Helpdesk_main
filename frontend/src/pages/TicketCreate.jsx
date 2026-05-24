// ============================================================
// Ticket Creation Page — Dynamic forms, file upload, behalf
// ============================================================
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import DynamicForm from '../components/DynamicForm';
import FileUpload from '../components/FileUpload';
import { HiOutlinePlusCircle } from 'react-icons/hi';

const TicketCreate = ({ showNotification }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        description: '',
        category_id: '',
        subcategory_id: '',
        priority: 'medium',
        on_behalf: false,
        behalf_user_email: '',
    });
    const [formData, setFormData] = useState({}); // dynamic form fields

    // Load categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await API.get('/tickets/categories');
                setCategories(res.data.categories || []);
            } catch (err) {
                console.error('Failed to load categories:', err);
            }
        };
        fetchCategories();
    }, []);

    // Update subcategories when category changes
    useEffect(() => {
        if (form.category_id) {
            const cat = categories.find((c) => c.id === parseInt(form.category_id));
            setSubcategories(cat?.subcategories || []);
        } else {
            setSubcategories([]);
        }
        setForm((prev) => ({ ...prev, subcategory_id: '' }));
        setFormData({});
    }, [form.category_id, categories]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleDynamicFieldChange = (fieldName, value) => {
        setFormData((prev) => ({ ...prev, [fieldName]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.title || !form.description || !form.category_id) {
            showNotification('Please fill in title, description, and category.', 'error');
            return;
        }

        setLoading(true);
        try {
            // Create ticket
            const res = await API.post('/tickets', {
                ...form,
                category_id: parseInt(form.category_id),
                subcategory_id: form.subcategory_id ? parseInt(form.subcategory_id) : null,
                form_data: Object.keys(formData).length > 0 ? formData : null,
            });

            const ticketId = res.data.ticket.id;

            // Upload files if any
            if (files.length > 0) {
                const fd = new FormData();
                files.forEach((file) => fd.append('files', file));
                await API.post(`/tickets/${ticketId}/upload`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }

            showNotification(`Ticket ${res.data.ticket.ticket_number} created successfully!`);
            navigate(`/tickets/${ticketId}`);
        } catch (error) {
            showNotification(error.response?.data?.error || 'Failed to create ticket.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isTechOrAdmin = user?.role === 'technician' || user?.role === 'admin' || user?.role === 'team_lead';

    return (
        <div className="max-w-3xl mx-auto animate-fade-in">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Create New Ticket</h1>
                <p className="text-gray-500 mt-1">Fill in the details to raise a support request</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-6">
                {/* On behalf toggle (for techs/admins) */}
                {isTechOrAdmin && (
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="on_behalf"
                                checked={form.on_behalf}
                                onChange={handleChange}
                                className="w-4 h-4 accent-primary-500 rounded"
                            />
                            <span className="text-sm text-gray-600">
                                Raise this ticket on behalf of a user
                            </span>
                        </label>
                        {form.on_behalf && (
                            <div className="mt-3 animate-fade-in">
                                <label className="input-label">User's Email *</label>
                                <input
                                    type="email"
                                    name="behalf_user_email"
                                    value={form.behalf_user_email}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="user@example.com"
                                    required={form.on_behalf}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Title */}
                <div>
                    <label className="input-label">Ticket Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={form.title}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Brief summary of the issue"
                        required
                    />
                </div>

                {/* Category & Subcategory */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="input-label">Category *</label>
                        <select
                            name="category_id"
                            value={form.category_id}
                            onChange={handleChange}
                            className="input-field"
                            required
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="input-label">Subcategory</label>
                        <select
                            name="subcategory_id"
                            value={form.subcategory_id}
                            onChange={handleChange}
                            className="input-field"
                            disabled={!form.category_id}
                        >
                            <option value="">Select Subcategory</option>
                            {subcategories.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                    {sub.name}
                                    {sub.assigned_team_name ? ` (→ ${sub.assigned_team_name})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Priority */}
                <div>
                    <label className="input-label">Priority</label>
                    <div className="flex gap-3 flex-wrap">
                        {['low', 'medium', 'high', 'critical'].map((p) => (
                            <label
                                key={p}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer border transition-all text-sm
                  ${form.priority === p
                                        ? `badge-${p} border-current`
                                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="priority"
                                    value={p}
                                    checked={form.priority === p}
                                    onChange={handleChange}
                                    className="hidden"
                                />
                                {p.charAt(0).toUpperCase() + p.slice(1)}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="input-label">Description *</label>
                    <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="input-field resize-none"
                        rows={4}
                        placeholder="Describe the issue in detail..."
                        required
                    />
                </div>

                {/* Dynamic Form Fields */}
                {form.subcategory_id && (
                    <DynamicForm
                        subcategoryId={parseInt(form.subcategory_id)}
                        formData={formData}
                        onChange={handleDynamicFieldChange}
                    />
                )}

                {/* File Upload */}
                <div>
                    <label className="input-label">Attachments</label>
                    <FileUpload files={files} onChange={setFiles} />
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <><HiOutlinePlusCircle className="w-5 h-5" /> Create Ticket</>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TicketCreate;
