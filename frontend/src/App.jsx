// ============================================================
// App.jsx — Main application with routing
// ============================================================
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Notification from './components/Notification';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ContactDetails from './pages/ContactDetails';
import TicketCreate from './pages/TicketCreate';
import TicketList from './pages/TicketList';
import TicketDetail from './pages/TicketDetail';
import AdminPanel from './pages/AdminPanel';
import Reports from './pages/Reports';
import { useState, useEffect } from 'react';

function App() {
    const { isAuthenticated, loading } = useAuth();
    const [notification, setNotification] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // Public routes (login/register)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Notification notification={notification} onClose={() => setNotification(null)} />
                <Routes>
                    <Route path="/login" element={<Login showNotification={showNotification} />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </div>
        );
    }

    // Authenticated layout
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Overlay for mobile wrapper */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-gray-900/50 z-30 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
            <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${sidebarOpen ? 'md:ml-64' : 'md:ml-16'}`}>
                <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
                <main className="flex-1 p-4 sm:p-6 overflow-auto">
                    <Notification notification={notification} onClose={() => setNotification(null)} />
                    <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<Dashboard showNotification={showNotification} />} />
                        <Route path="/profile" element={<Profile showNotification={showNotification} />} />
                        <Route path="/contact" element={<ContactDetails showNotification={showNotification} />} />
                        <Route path="/tickets" element={<TicketList showNotification={showNotification} />} />
                        <Route path="/tickets/new" element={<TicketCreate showNotification={showNotification} />} />
                        <Route path="/tickets/:id" element={<TicketDetail showNotification={showNotification} />} />
                        <Route path="/admin" element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminPanel showNotification={showNotification} />
                            </ProtectedRoute>
                        } />
                        <Route path="/reports" element={
                            <ProtectedRoute roles={['admin', 'technician', 'team_lead']}>
                                <Reports showNotification={showNotification} />
                            </ProtectedRoute>
                        } />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

export default App;
