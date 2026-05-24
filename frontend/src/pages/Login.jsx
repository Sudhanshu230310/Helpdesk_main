// ============================================================
// Login Page
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OtpModal from '../components/OtpModal';
import { HiOutlineSupport, HiOutlineMail, HiOutlineLockClosed, HiOutlineUserGroup, HiOutlineUser } from 'react-icons/hi';
import iitrprLogo from '../assets/iitrprlogo.png';

const Login = ({ showNotification }) => {
    const { login, verifyOtp, resendOtp, requestAccessOtp, verifyAccessOtp } = useAuth();
    const navigate = useNavigate();

    const [authType, setAuthType] = useState('user'); // 'user' or 'staff'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // OTP verification
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpPurpose, setOtpPurpose] = useState('login'); // 'login' or 'registration'

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (authType === 'user') {
                // Passwordless Email+OTP flow for End-Users
                await requestAccessOtp(email);
                setOtpEmail(email);
                setOtpPurpose('login');
                setShowOtp(true);
                showNotification('Welcome! We sent an OTP to your email.');
            } else {
                // Email+Password logic (Staff)
                await login(email, password);
                showNotification('Login successful!');
                navigate('/dashboard');
            }
        } catch (error) {
            const data = error.response?.data;
            if (data?.requiresVerification) {
                setOtpEmail(email);
                setOtpPurpose('registration');
                setShowOtp(true);
                showNotification('Please verify your email first.', 'error');
            } else {
                showNotification(data?.error || 'Login failed.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleOtpVerify = async (otp) => {
        try {
            if (authType === 'user' && otpPurpose === 'login') {
                await verifyAccessOtp(otpEmail, otp);
                setShowOtp(false);
                showNotification('Login successful via OTP!');
                navigate('/dashboard');
            } else {
                // Staff legacy verification
                await verifyOtp(otpEmail, otp);
                setShowOtp(false);
                showNotification('Email verified! Please login again.');
            }
        } catch (error) {
            showNotification(error.response?.data?.error || 'Invalid OTP.', 'error');
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left — Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 items-center justify-center p-12">
                <div className="max-w-md">
                    <div className="w-24 h-24 rounded-2xl bg-primary-600/30 flex items-center justify-center mb-8 animate-pulse-glow">
                        <img src={iitrprLogo} alt='logo' className="w-24 h-24 object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4 leading-tight">
                        Helpdesk Support<br />
                        <span className="text-white">IIT ROPAR</span>
                    </h1>
                    <p className="text-primary-100 text-lg leading-relaxed">
                        Streamline your IT support — raise tickets, track progress, and get solutions faster.
                    </p>
                </div>
            </div>

            {/* Right — Login Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <div className="lg:hidden w-12 h-12 rounded-xl bg-primary-600/30 flex items-center justify-center mx-auto mb-4">
                            <HiOutlineSupport className="w-6 h-6 text-primary-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                        <p className="text-gray-500 mt-1">Select your portal to sign in</p>
                    </div>

                    {/* Quick login type toggles */}
                    <div className="flex gap-1 p-1 bg-gray-50 rounded-xl mb-6">
                        <button
                            onClick={() => setAuthType('user')}
                            className={`flex-1 flex py-2 items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-all
                ${authType === 'user' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <HiOutlineUser className="w-4 h-4" /> User
                        </button>
                        <button
                            onClick={() => setAuthType('staff')}
                            className={`flex-1 flex py-2 items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-all
                ${authType === 'staff' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <HiOutlineUserGroup className="w-4 h-4" /> Staff
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="input-label">
                                <HiOutlineMail className="inline w-4 h-4 mr-1" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        {/* Password field only shown for Staff and LDAP */}
                        {authType !== 'user' && (
                            <div className="animate-fade-in">
                                <label className="input-label">
                                    <HiOutlineLockClosed className="inline w-4 h-4 mr-1" />
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field"
                                    placeholder="••••••••"
                                    required={authType !== 'user'}
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                authType === 'user' ? 'Send OTP' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {authType === 'user' && (
                        <p className="text-center text-sm text-gray-400 mt-6 animate-fade-in">
                            No registration needed. Enter your email and verify with OTP to begin.
                        </p>
                    )}


                </div>
            </div>

            {/* OTP Modal */}
            <OtpModal
                isOpen={showOtp}
                onClose={() => setShowOtp(false)}
                onVerify={handleOtpVerify}
                onResend={() => {
                   if(authType === 'user') requestAccessOtp(otpEmail);
                   else resendOtp(otpEmail);
                }}
                email={otpEmail}
                title={authType === 'user' ? "Enter Login OTP" : "Verify Email"}
            />
        </div>
    );
};

export default Login;
