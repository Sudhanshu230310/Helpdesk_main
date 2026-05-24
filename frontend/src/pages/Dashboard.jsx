// ============================================================
// Dashboard Page — Role-based dashboard with stats
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import TicketCard from '../components/TicketCard';
import {
    HiOutlineTicket, HiOutlineClock, HiOutlineCheckCircle,
    HiOutlineExclamation, HiOutlineStar, HiOutlineTrendingUp,
} from 'react-icons/hi';
import AdminDashboard from '../components/dashboards/AdminDashboard';
import TechnicianDashboard from '../components/dashboards/TechnicianDashboard';
import TeamLeadDashboard from '../components/dashboards/TeamLeadDashboard';
import UserDashboard from '../components/dashboards/UserDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentTickets, setRecentTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, ticketsRes] = await Promise.all([
                    API.get('/admin/dashboard'),
                    API.get('/tickets', { params: { limit: 100 } }),
                ]);
                setStats(statsRes.data.stats);
                setRecentTickets(ticketsRes.data.tickets);
            } catch (err) {
                console.error('Dashboard error:', err);
            } finally {
                setLoading(false);
            }
        };
        if (user) fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">
                    Welcome back, <span className="text-primary-400">{user?.name}</span>
                </p>
            </div>

            {/* Role-based Dashboard Content */}
            {user?.role === 'admin' && (
                <AdminDashboard stats={stats} recentTickets={recentTickets} />
            )}
            {user?.role === 'technician' && (
                <TechnicianDashboard stats={stats} recentTickets={recentTickets} />
            )}
            {user?.role === 'team_lead' && (
                <TeamLeadDashboard stats={stats} recentTickets={recentTickets} />
            )}
            {user?.role === 'user' && (
                <UserDashboard stats={stats} recentTickets={recentTickets} />
            )}
        </div>
    );
};

export default Dashboard;
