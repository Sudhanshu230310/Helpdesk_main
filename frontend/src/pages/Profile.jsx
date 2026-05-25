// ============================================================
// Profile Settings Page
// ============================================================
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../api/axios';
import { 
    HiOutlineUser, HiOutlineMail, HiOutlinePhone, 
    HiOutlineOfficeBuilding, HiOutlineBell, HiOutlineCheckCircle,
    HiOutlineSave, HiOutlineUserCircle
} from 'react-icons/hi';

const Profile = ({ showNotification }) => {
    const { user, setUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        department: '',
        email_notifications_enabled: true
    });


    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                department: user.department || '',
                email_notifications_enabled: user.email_notifications_enabled !== false
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await axios.put('/users/profile', formData);

            // Update local user context
            const updatedUser = { ...user, ...res.data.user };
            setUser(updatedUser);
            localStorage.setItem('helpdesk_user', JSON.stringify(updatedUser));
            
            showNotification('Profile updated successfully!');
        } catch (err) {
            console.error('Update failed:', err);
            showNotification(err.response?.data?.error || 'Failed to update profile.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-200">
                    {user?.name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
                    <p className="text-gray-500">Manage your account details and preferences</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Information Card */}
                <div className="lg:col-span-2 space-y-6">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="input-label">
                                        <HiOutlineUser className="inline w-4 h-4 mr-1" />
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        <HiOutlineMail className="inline w-4 h-4 mr-1" />
                                        Email Address (Read-only)
                                    </label>
                                    <input
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="input-field bg-gray-50 text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        <HiOutlinePhone className="inline w-4 h-4 mr-1" />
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="+91 XXXXX XXXXX"
                                    />
                                </div>
                                <div>
                                    <label className="input-label">
                                        <HiOutlineOfficeBuilding className="inline w-4 h-4 mr-1" />
                                        Department
                                    </label>
                                    <select
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className="input-field"
                                    >
                                        <option value="">Select Department</option>
                                        <option value="IT">Information Technology</option>
                                        <option value="HR">Human Resources</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Estate">Estate Office</option>
                                        <option value="Academic">Academic Affairs</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary flex items-center gap-2 px-8"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <HiOutlineSave className="w-5 h-5" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Preferences Card */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-lg bg-primary-50 text-primary-600">
                                <HiOutlineBell className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Communication Preferences</h3>
                        </div>

                        <div className="bg-primary-50/30 rounded-2xl p-6 border border-primary-100">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <h4 className="font-bold text-gray-900">Email Notifications</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Receive emails for ticket updates, message activity, and progress. 
                                        <span className="text-primary-600 font-medium ml-1">Critical OTPs will always be sent.</span>
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        name="email_notifications_enabled"
                                        checked={formData.email_notifications_enabled}
                                        onChange={handleChange}
                                        disabled={loading}
                                        className="sr-only peer" 
                                    />
                                    <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                             <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="text-sm font-bold text-primary-600 hover:text-primary-700"
                            >
                                Update Preferences
                            </button>
                        </div>
                    </div>
                </div>

                {/* Account Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-xl">
                            {user?.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{user?.name}</h3>
                        <p className="text-sm text-gray-400 capitalize mb-6">{user?.role}</p>
                        
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Status</span>
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">Active</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Account ID</span>
                                <span className="text-gray-700 font-mono text-[10px]">{user?.id?.substring(0, 8)}...</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-primary-900 rounded-3xl p-8 text-white">
                        <HiOutlineCheckCircle className="w-10 h-10 text-primary-400 mb-4" />
                        <h4 className="text-xl font-bold mb-2">Verified Account</h4>
                        <p className="text-primary-200 text-sm leading-relaxed opacity-80">
                            Your email has been verified. You can access all support features without a password.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
