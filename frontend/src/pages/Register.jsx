import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Pill, Mail, Lock, UserPlus, Activity, User } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await register(username, email, password);
      // Automatically navigate to login on success
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Username or email may exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-gray-900 bg-white">
      {/* Left side - Auth Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center pt-24 pb-12 px-8 sm:px-16 xl:px-32 relative">
        <div className="animate-fade-in w-full max-w-md mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-extrabold mb-3">Join PharmaCare</h1>
            <p className="text-gray-500 text-lg">Create your account to manage your health.</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-4 rounded-xl mb-6 flex items-start gap-3">
              <span className="shrink-0 pt-0.5">⚠️</span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" 
                  placeholder="Choose a username"
                  value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" 
                  placeholder="your@email.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required 
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" 
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all" 
                  placeholder="Create a strong password (min 6 chars)"
                  value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="mt-2 w-full flex items-center justify-center gap-2 bg-brand-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-brand-700 focus:ring-4 focus:ring-brand-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>Create Account <UserPlus size={20} /></>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600">
            Already have an account? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-500 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right side - Branding/Image */}
      <div className="hidden lg:flex w-1/2 bg-brand-900 relative p-12 overflow-hidden flex-col justify-between">
        <div className="absolute inset-0 z-0 opacity-40">
           <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-accent-500 blur-3xl opacity-40"></div>
           <div className="absolute top-1/4 right-1/4 w-72 h-72 rounded-full bg-brand-400 blur-3xl opacity-30"></div>
        </div>
        
        <div className="relative z-10 flex gap-2 items-center text-white/80">
          <Activity size={24} /> <span className="font-medium tracking-widest text-sm uppercase">Global Network</span>
        </div>

        <div className="relative z-10 text-white max-w-md ml-auto text-right">
          <h2 className="text-4xl font-bold leading-tight mb-6 mt-20">Your health is our priority.</h2>
          <p className="text-brand-100 text-lg leading-relaxed mb-8">
            Join thousands of users who trust PharmaCare for fast, reliable, and secure medication delivery right to their doorsteps.
          </p>
          
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-left shadow-2xl">
            <div className="flex gap-4 items-start">
               <div className="bg-brand-500 p-2 rounded-lg text-white">
                  <Pill size={24} />
               </div>
               <div>
                 <h4 className="font-bold text-lg">Authentic Medicines</h4>
                 <p className="text-brand-100 text-sm mt-1">We source directly from manufacturers to ensure 100% authenticity.</p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
