import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { RewardProvider } from './context/RewardContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Offers from './pages/Offers';
import ForgotPassword from './pages/ForgotPassword';
import PaymentPage from './pages/PaymentPage';
import DeliveryLogin from './pages/DeliveryLogin';
import DeliveryDashboard from './pages/DeliveryDashboard';
import ChatButton from './components/Chatbot/ChatButton';
import { Pill, User, LogOut, ShoppingBag, Menu, X, Tag } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const DeliveryRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/delivery/login" replace />;
  if (!user.roles?.includes('ROLE_DELIVERY_AGENT')) return <Navigate to="/" replace />;
  return children;
};

// Extracted Navbar component to use location
const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartTotalItems, setIsCartOpen } = useCart();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
    scrolled ? 'py-3 px-4' : 'py-5 px-6'
  }`;

  const innerNavClasses = `container mx-auto flex justify-between items-center transition-all duration-500 ${
    scrolled ? 'glass rounded-full px-8 py-3 shadow-lg' : 'bg-transparent'
  }`;

  const textClass = scrolled ? 'text-gray-800' : 'text-gray-800';
  const logoTextClass = 'text-brand-600';

  return (
    <nav className={navClasses}>
      <div className={innerNavClasses}>
        <Link to="/" className={`flex items-center gap-2 font-extrabold text-2xl tracking-tight ${logoTextClass} transition-colors hover:scale-105 duration-300`}>
          <Pill size={32} className="text-brand-500 animate-pulse-glow rounded-full" />
          <span>PharmaCare</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className={`hidden md:flex items-center gap-8 font-medium ${textClass}`}>
          <Link to="/" className="hover:text-brand-400 transition-colors">Catalog</Link>
          <Link to="/offers" className="hover:text-brand-400 transition-colors flex items-center gap-1 text-emerald-600 font-bold"><Tag size={16}/> Offers</Link>
          
          {user ? (
            <>
              {user.roles?.includes('ROLE_ADMIN') ? (
                <Link to="/admin" className="hover:text-brand-400 transition-colors font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">Admin Panel</Link>
              ) : user.roles?.includes('ROLE_DELIVERY_AGENT') ? (
                <Link to="/delivery/dashboard" className="hover:text-brand-400 transition-colors font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Delivery Dashboard</Link>
              ) : (
                <Link to="/dashboard" className="hover:text-brand-400 transition-colors">Dashboard</Link>
              )}
              <button 
                className="relative p-2 rounded-full hover:bg-brand-50 hover:text-brand-600 transition-all duration-300 transform hover:scale-110 cursor-pointer"
                aria-label="Cart"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingBag size={24} />
                {cartTotalItems > 0 && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-brand-500 text-white text-xs flex items-center justify-center rounded-full font-bold animate-bounce shadow-md">
                    {cartTotalItems}
                  </span>
                )}
              </button>
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-gray-300/30">
                <div className="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <button onClick={logout} className="flex items-center gap-2 hover:text-brand-400 transition-colors">
                  <LogOut size={20} /> <span className="sr-only">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/login" className="hover:text-brand-500 font-semibold transition-colors px-2">Log In</Link>
              <Link to="/register" className="relative group overflow-hidden bg-brand-600 text-white px-6 py-2.5 rounded-full shadow-lg shadow-brand-500/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-brand-500/50">
                <span className="relative z-10 font-bold tracking-wide">Get Started</span>
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} className={textClass} /> : <Menu size={28} className={textClass} />}
        </button>
      </div>
    </nav>
  );
};

function App() {
  return (
    <CartProvider>
      <RewardProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-brand-200">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/offers" element={<Offers />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/payment" 
                  element={
                    <ProtectedRoute>
                      <PaymentPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/delivery/login" element={<DeliveryLogin />} />
                <Route 
                  path="/delivery/dashboard" 
                  element={
                    <DeliveryRoute>
                      <DeliveryDashboard />
                    </DeliveryRoute>
                  } 
                />
              </Routes>
            </main>
            <ChatButton />
          </div>
        </Router>
      </RewardProvider>
    </CartProvider>
  );
}

export default App;
