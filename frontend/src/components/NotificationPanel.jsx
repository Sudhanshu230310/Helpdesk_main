import React from 'react';
import { HiOutlineMail, HiOutlineCheckCircle, HiOutlineClock, HiOutlineX } from 'react-icons/hi';

const formatTime = (date) => {
    const diff = new Date() - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
};

const NotificationPanel = ({ notifications, onMarkRead, onMarkAllRead, onClose }) => {
    const unreadCount = notifications.filter(n => !n.is_read).length;

    const getIcon = (type) => {
        switch (type) {
            case 'message': return <HiOutlineMail className="w-5 h-5 text-blue-500" />;
            case 'status_change': return <HiOutlineCheckCircle className="w-5 h-5 text-green-500" />;
            case 'assignment': return <HiOutlineClock className="w-5 h-5 text-purple-500" />;
            default: return <HiOutlineCheckCircle className="w-5 h-5 text-primary-500" />;
        }
    };

    return (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-lg border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-primary-100 text-primary-600 text-[10px] font-bold rounded-full">
                            {unreadCount} NEW
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button 
                            onClick={onMarkAllRead}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Mark all read
                        </button>
                    )}
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-lg text-gray-400">
                        <HiOutlineX className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                        <HiOutlineMail className="w-12 h-12 opacity-10 mb-2" />
                        <p className="text-sm">No notifications yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {notifications.map((n) => (
                            <div 
                                key={n.id} 
                                onClick={() => !n.is_read && onMarkRead(n.id)}
                                className={`px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3
                                    ${n.is_read ? 'opacity-60' : 'bg-primary-50/10'}`}
                            >
                                <div className="mt-1 flex-shrink-0">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm leading-tight mb-0.5 ${n.is_read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                                        {n.title}
                                    </p>
                                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">
                                        {formatTime(n.created_at)}
                                    </p>
                                </div>
                                {!n.is_read && (
                                    <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
                <div className="px-4 py-2 bg-gray-50/50 border-t border-gray-100 text-center">
                    <button className="text-xs text-gray-400 hover:text-gray-600">View all activity</button>
                </div>
            )}
        </div>
    );
};

export default NotificationPanel;
