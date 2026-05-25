import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineMenuAlt2, HiOutlineBell, HiOutlineLogout, HiOutlinePlus } from 'react-icons/hi';
import axios from '../api/axios';
import NotificationPanel from './NotificationPanel';

const Navbar = ({ onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const panelRef = useRef(null);


    useEffect(() => {
        if (user) {
            fetchNotifications();
            // Polling for notifications every 30 seconds
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Close panel on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const res = await axios.get('/notifications');
            setNotifications(res.data.notifications);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markRead = async (id) => {
        try {
            await axios.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (err) {
            console.error('Failed to mark read:', err);
        }
    };

    const markAllRead = async () => {
        try {
            await axios.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error('Failed to mark all read:', err);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
            <div className="flex items-center justify-between px-6 py-3">
                {/* Left: Hamburger */}
                <button
                    onClick={onToggleSidebar}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                >
                    <HiOutlineMenuAlt2 className="w-5 h-5" />
                </button>

                {/* Right: User info */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Quick Add Ticket */}
                    <Link
                        to="/tickets/new"
                        className="p-2 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-600 hover:text-white transition-all flex items-center justify-center"
                        title="Create New Ticket"
                    >
                        <HiOutlinePlus className="w-5 h-5" />
                    </Link>

                    {/* Notification bell */}
                    <div className="relative" ref={panelRef}>
                        <button 
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`p-2 rounded-lg transition-colors ${showNotifications ? 'bg-primary-50 text-primary-600' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                        >
                            <HiOutlineBell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <NotificationPanel 
                                notifications={notifications}
                                onMarkRead={markRead}
                                onMarkAllRead={markAllRead}
                                onClose={() => setShowNotifications(false)}
                            />
                        )}
                    </div>

                    {/* User badge */}
                    <div className="flex items-center gap-3 border-l border-gray-100 pl-2 sm:pl-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-semibold text-sm">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden md:block">
                            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
                            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        title="Logout"
                    >
                        <HiOutlineLogout className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
