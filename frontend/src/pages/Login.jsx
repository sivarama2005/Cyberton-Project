import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Lock, ArrowRight, Activity, User, Truck } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('USER'); // USER | ADMIN | DELIVERY
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const loginUsername = loginType === 'ADMIN' ? 'admin' : username;
      const data = await login(loginUsername, password);

      if (data.roles?.includes('ROLE_DELIVERY_AGENT')) {
        navigate('/delivery/dashboard');
      } else if (data.roles?.includes('ROLE_ADMIN')) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Tab config
  const tabs = [
    { key: 'USER',     label: 'Customer',       icon: User  },
    { key: 'ADMIN',    label: 'Administrator',   icon: null  },
    { key: 'DELIVERY', label: 'Delivery Agent',  icon: Truck },
  ];

  const isDelivery = loginType === 'DELIVERY';
  const isAdmin    = loginType === 'ADMIN';

  // Button colour changes per role
  const btnClass = isDelivery
    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/30 shadow-blue-500/20'
    : 'bg-brand-600 hover:bg-brand-700 focus:ring-brand-500/30 shadow-brand-500/20';

  const activeTabClass = isDelivery
    ? 'bg-white shadow-sm text-blue-700'
    : 'bg-white shadow-sm text-brand-700';

  return (
    <div className="min-h-screen flex text-gray-900 bg-white">
      {/* Left side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col pt-24 pb-12 px-8 sm:px-16 xl:px-32 relative">
        <div className="flex-grow flex flex-col justify-center animate-fade-in">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold mb-3">Welcome Back</h1>
            <p className="text-gray-500 text-lg">Please enter your details to sign in.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
              <span className="shrink-0 pt-0.5">⚠️</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* 3-tab switcher */}
          <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8 gap-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setLoginType(key); setUsername(''); setPassword(''); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-bold text-sm rounded-lg transition-all ${
                  loginType === key ? activeTabClass : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {Icon && <Icon size={14} />}
                {label}
              </button>
            ))}
          </div>

          {/* Delivery agent hint */}
          {isDelivery && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
              <Truck size={18} className="text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700 font-medium">
                Sign in with your delivery agent credentials.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {isAdmin ? 'Admin ID' : 'Username'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  {isDelivery ? <Truck size={20} /> : <User size={20} />}
                </div>
                <input
                  type="text"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all ${
                    isAdmin ? 'opacity-70 cursor-not-allowed bg-gray-100' : ''
                  }`}
                  placeholder={
                    isAdmin    ? 'Administrator' :
                    isDelivery ? 'Enter agent username' :
                                 'Enter your username'
                  }
                  value={isAdmin ? 'admin' : username}
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={isAdmin}
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                {!isDelivery && (
                  <Link to="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-500">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 text-white font-bold py-3.5 px-4 rounded-xl focus:ring-4 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg ${btnClass}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isDelivery && <Truck size={18} />}
                  Sign In
                  {!isDelivery && <ArrowRight size={20} />}
                </>
              )}
            </button>
          </form>

          {loginType === 'USER' && (
            <p className="mt-8 text-center text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-500 hover:underline">
                Sign up for free
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Right side - Branding/Image */}
      <div className="hidden lg:flex w-1/2 relative p-12 overflow-hidden flex-col justify-between">
        <div className="absolute inset-0 z-0">
          <img src="/login-medical.png" alt="Medical Care" className="w-full h-full object-cover scale-105 animate-float" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/60 via-brand-800/40 to-teal-900/60 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 flex gap-2 items-center text-white/90">
          <Activity size={24} className="text-brand-400" />
          <span className="font-bold tracking-widest text-xs uppercase">Secure Healthcare Portal</span>
        </div>

        <div className="relative z-10 text-white max-w-md">
          <h2 className="text-5xl font-black leading-tight mb-6 font-display">
            Take control of your health journey.
          </h2>
          <p className="text-brand-50 text-xl leading-relaxed mb-10 font-medium opacity-90">
            Access your prescriptions, track orders, and discover new wellness products all in one beautifully designed platform.
          </p>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/20 w-fit">
            <div className="flex -space-x-3">
              {[32, 47, 12, 68].map(imgId => (
                <img key={imgId} className="w-12 h-12 rounded-full border-2 border-brand-800 shadow-sm"
                  src={`https://i.pravatar.cc/100?img=${imgId}`} alt="user" />
              ))}
            </div>
            <div className="text-brand-100 font-medium pr-4">
              <span className="text-white font-black block text-2xl">10k+</span>
              <span className="text-xs uppercase tracking-widest font-bold opacity-60">Active Users</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
