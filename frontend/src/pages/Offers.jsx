import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import { useCart } from '../context/CartContext';
import api from '../services/api';
import { Ticket, Star, Gift, ShoppingBag, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Offers = () => {
  const { user } = useAuth();
  const { rewardStatus, availablePoints, fetchRewards, claimReward, setAppliedCoupon, setCouponDiscount, appliedCoupon } = useReward();
  const { setIsCartOpen } = useCart();
  const navigate = useNavigate();
  
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await api.get('/coupons');
        setCoupons(response.data);
      } catch (error) {
        console.error("Failed to fetch coupons", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
    if (user) {
      fetchRewards();
    }
  }, [user]);

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const handleApplyCoupon = (coupon) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAppliedCoupon(coupon.code);
    setCouponDiscount(0); // Assuming Cart will validate it on checkout, or we can just apply a mock UI logic for now. 
    // Actually wait, let's just use it as "Selected Coupon" and open cart
    setIsCartOpen(true);
    navigate('/');
    showToast(`Coupon ${coupon.code} applied!`);
  };

  const handleClaimReward = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await claimReward();
      showToast("Reward claimed successfully!");
    } catch (error) {
      showToast(error.response?.data?.message || "Failed to claim reward", true);
    }
  };

  if (loading) {
    return <div className="min-h-screen pt-24 pb-12 flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-24 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 animate-fade-in ${toast.isError ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {toast.isError ? <XCircle size={24} /> : <CheckCircle size={24} />}
          <span className="font-semibold">{toast.msg}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Special Offers & Rewards</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Unlock exclusive discounts, earn loyalty points, and save on your healthcare needs.</p>
        </div>

        {/* Section 1 & 2: Loyalty Points & Login Rewards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Loyalty Points */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-brand-100/50 border border-brand-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-brand-100 to-emerald-100 rounded-bl-full opacity-50 transition-transform duration-500 group-hover:scale-110 -z-10"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-brand-100 rounded-2xl text-brand-600">
                <Star size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Loyalty Points</h2>
            </div>
            
            {user ? (
              <>
                <div className="text-5xl font-black text-brand-600 mb-4">{availablePoints} <span className="text-lg font-medium text-gray-500">pts</span></div>
                <p className="text-gray-600 mb-8">Earn 1 point for every ₹100 spent. Redeem 10 points for ₹1 discount at checkout.</p>
                <button 
                  onClick={() => { setIsCartOpen(true); navigate('/'); }}
                  className="w-full py-4 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={20} /> Use Points in Checkout
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Log in to view your loyalty points balance.</p>
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-brand-500 text-white font-bold rounded-full hover:bg-brand-600">Log In</button>
              </div>
            )}
          </div>

          {/* Daily Login Rewards */}
          <div className="bg-white rounded-3xl p-8 shadow-xl shadow-amber-100/50 border border-amber-50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-100 to-orange-100 rounded-bl-full opacity-50 transition-transform duration-500 group-hover:scale-110 -z-10"></div>
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                <Gift size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Daily Reward</h2>
            </div>

            {user ? (
              <>
                <div className="flex items-center justify-between mb-8 bg-amber-50 p-4 rounded-2xl">
                  <div>
                    <p className="text-sm font-medium text-amber-800 uppercase tracking-wide">Current Streak</p>
                    <p className="text-3xl font-black text-amber-600">{rewardStatus?.loginStreak || 0} <span className="text-lg font-bold">Days 🔥</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-amber-800 uppercase tracking-wide">Next Bonus</p>
                    <p className="text-lg font-bold text-amber-600">50 pts</p>
                  </div>
                </div>
                
                <button 
                  onClick={handleClaimReward}
                  disabled={rewardStatus?.claimedToday}
                  className={`w-full py-4 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                    rewardStatus?.claimedToday 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 hover:-translate-y-1'
                  }`}
                >
                  {rewardStatus?.claimedToday ? <><CheckCircle size={20} /> Claimed Today</> : <><Gift size={20} /> Claim 10 Points</>}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Log in to claim your daily rewards and build your streak.</p>
                <button onClick={() => navigate('/login')} className="px-6 py-2 bg-amber-500 text-white font-bold rounded-full hover:bg-amber-600">Log In</button>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Available Coupons */}
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Ticket className="text-emerald-500" size={28} />
            <h2 className="text-3xl font-extrabold text-gray-900">Active Coupons</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-white border-2 border-dashed border-emerald-200 rounded-2xl p-6 relative flex flex-col hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-100 transition-all">
                {/* Decoration */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full border-r-2 border-emerald-200 transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full border-l-2 border-emerald-200 transform -translate-y-1/2"></div>
                
                <div className="text-center mb-6">
                  <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-800 font-black text-xl tracking-widest rounded-lg mb-4">
                    {coupon.code}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {coupon.minOrderAmount > 0 ? `On orders above ₹${coupon.minOrderAmount}` : 'No minimum order value'}
                  </p>
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100">
                  <p className="text-xs text-center text-gray-400 mb-4">
                    Valid till {new Date(coupon.expiryDate).toLocaleDateString()}
                  </p>
                  <button 
                    onClick={() => handleApplyCoupon(coupon)}
                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-xl transition-colors flex justify-center items-center gap-2"
                  >
                    {appliedCoupon === coupon.code ? <><CheckCircle size={18}/> Applied</> : 'Apply Coupon'}
                  </button>
                </div>
              </div>
            ))}
            {coupons.length === 0 && (
              <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-500">No active coupons available at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Special Offers Banners */}
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Special Promotions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Banner 1: Health Packages */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl group cursor-pointer" onClick={() => { navigate('/'); }}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-700 z-0"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] opacity-20 mix-blend-overlay bg-cover bg-center transition-transform duration-700 group-hover:scale-110 z-0"></div>
              <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-center">
                <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 w-fit backdrop-blur-sm border border-white/30">New Addition</span>
                <h3 className="text-3xl font-black text-white mb-2 leading-tight">Comprehensive<br/>Health Packages</h3>
                <p className="text-blue-100 mb-8 max-w-sm">Preventive care starting at just ₹999. Includes full body screening and vital checks.</p>
                <button className="w-fit px-8 py-3 bg-white text-blue-700 font-bold rounded-full hover:bg-blue-50 transition-colors shadow-lg">Shop Packages</button>
              </div>
            </div>

            {/* Banner 2: Seasonal Offer */}
            <div className="relative rounded-3xl overflow-hidden shadow-xl group cursor-pointer" onClick={() => { handleApplyCoupon({code: 'WELLNESS20'}); }}>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-600 z-0"></div>
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80')] opacity-20 mix-blend-overlay bg-cover bg-center transition-transform duration-700 group-hover:scale-110 z-0"></div>
              <div className="relative z-10 p-8 md:p-10 h-full flex flex-col justify-center">
                <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-full mb-4 w-fit backdrop-blur-sm border border-white/30">Limited Time</span>
                <h3 className="text-3xl font-black text-white mb-2 leading-tight">Seasonal<br/>Wellness Sale</h3>
                <p className="text-emerald-100 mb-8 max-w-sm">Use code <strong className="text-white">WELLNESS20</strong> for a flat 20% off on all health packages above ₹1000.</p>
                <button className="w-fit px-8 py-3 bg-white text-emerald-700 font-bold rounded-full hover:bg-emerald-50 transition-colors shadow-lg">Apply Coupon</button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Offers;
