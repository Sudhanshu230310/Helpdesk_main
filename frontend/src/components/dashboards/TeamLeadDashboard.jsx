import { HiOutlineTicket, HiOutlineClock, HiOutlineCheckCircle, HiOutlineExclamation, HiOutlineStar, HiOutlineTrendingUp, HiOutlineUserGroup } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import TicketCard from '../TicketCard';

const TeamLeadDashboard = ({ stats, recentTickets }) => {
    const statCards = [
        { label: 'Total Tickets', value: stats?.total_tickets || 0, icon: HiOutlineTicket, color: 'primary' },
        { label: 'Open', value: stats?.open_tickets || 0, icon: HiOutlineExclamation, color: 'blue' },
        { label: 'In Progress', value: stats?.in_progress_tickets || 0, icon: HiOutlineClock, color: 'amber' },
        { label: 'Closed', value: stats?.closed_tickets || 0, icon: HiOutlineCheckCircle, color: 'emerald' },
        { label: 'Avg Resolution (hrs)', value: stats?.avg_resolution_hours != null ? parseFloat(stats.avg_resolution_hours).toFixed(2) : '—', icon: HiOutlineTrendingUp, color: 'purple' },
        { label: 'Avg Rating', value: stats?.avg_feedback_rating || '—', icon: HiOutlineStar, color: 'amber' },
    ];

    const colorMap = {
        primary: { bg: 'bg-primary-500/10', text: 'text-primary-400', border: 'border-primary-500/20' },
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
        amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
    };

    return (
        <div className="animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {statCards.map((stat, index) => {
                    const colors = colorMap[stat.color] || colorMap.primary;
                    return (
                        <div
                            key={stat.label}
                            className={`glass-card p-4 border ${colors.border} hover:scale-[1.02] transition-transform`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className={`w-9 h-9 rounded-xl ${colors.bg} flex items-center justify-center mb-3`}>
                                <stat.icon className={`w-5 h-5 ${colors.text}`} />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                        </div>
                    );
                })}
            </div>

            {/* Recent Tickets */}
            <div className="grid grid-cols-1 gap-6">
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <HiOutlineUserGroup className="w-5 h-5 text-gray-500" /> Team Tickets ({recentTickets.length})
                        </h2>
                        <Link to="/tickets" className="text-sm text-primary-400 hover:text-primary-300">View All →</Link>
                    </div>
                    <div className="space-y-3">
                        {recentTickets.length > 0 ? (
                            recentTickets.map((ticket) => (
                                <TicketCard key={ticket.id} ticket={ticket} />
                            ))
                        ) : (
                            <div className="glass-card p-8 text-center">
                                <HiOutlineTicket className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                                <p className="text-gray-500">No team tickets found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeamLeadDashboard;
