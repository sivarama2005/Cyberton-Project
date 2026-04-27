import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useReward } from '../context/RewardContext';
import api from '../services/api';
import { Package, Clock, ShieldCheck, MapPin, Gift, Star, X, Ticket, CheckCircle, Trash2, CreditCard, Truck, Navigation, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { rewardStatus, claimReward } = useReward();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [appliedCouponCode, setAppliedCouponCode] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get('/orders/user');
        setOrders(response.data);
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/coupons');
        // Only show non-expired coupons
        const today = new Date();
        setCoupons(res.data.filter(c => !c.expiryDate || new Date(c.expiryDate) >= today));
      } catch (e) { console.error(e); }
    };
    fetchOrders();
    fetchCoupons();
  }, []);

  const handleClaimReward = async () => {
    try {
      const data = await claimReward();
      alert(`Claimed ${data.pointsGiven} points!`);
    } catch (error) {
      alert("Failed to claim reward: " + (error.response?.data?.message || error.message));
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Cancel this order? Any coupon usage and loyalty points will be refunded to your account.')) return;
    try {
      const res = await api.delete(`/orders/${orderId}`);
      alert(res.data?.message || 'Order cancelled successfully.');
      const response = await api.get('/orders/user');
      setOrders(response.data);
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || error.message || 'Failed to cancel order.';
      alert('Error: ' + msg);
    }
  };

  const handleReorder = async (orderId) => {
    if (window.confirm('Do you want to duplicate this order and re-purchase the exact same items?')) {
      try {
        await api.post(`/orders/${orderId}/reorder`);
        alert("Success! Reorder has been placed.");
        const response = await api.get('/orders/user');
        setOrders(response.data);
      } catch (error) {
        alert("Failed to reorder: " + (error.response?.data?.message || error.message));
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ORDER_CREATED': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'PENDING_PAYMENT': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAID': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INITIATED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'DISPATCHED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'FAILED': return 'bg-red-100 text-red-800 border-red-200';
      // Legacy statuses
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Order timeline steps
  const ORDER_STEPS = [
    { key: 'ORDER_CREATED', label: 'Order Created', icon: Package },
    { key: 'PAID', label: 'Payment Done', icon: CreditCard },
    { key: 'INITIATED', label: 'Order Initiated', icon: CheckCircle2 },
    { key: 'DISPATCHED', label: 'Dispatched', icon: Truck },
    { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ];

  const getStepIndex = (status) => {
    const map = {
      'ORDER_CREATED': 0, 'PENDING_PAYMENT': 0,
      'PAID': 1,
      'INITIATED': 2,
      'DISPATCHED': 3,
      'DELIVERED': 4,
      // Legacy
      'PENDING': 0, 'APPROVED': 2, 'SHIPPED': 3,
    };
    return map[status] ?? 0;
  };

  const OrderTimeline = ({ status }) => {
    const currentStep = getStepIndex(status);
    const isCancelled = status === 'CANCELLED' || status === 'FAILED';
    return (
      <div className="mt-4">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Order Progress</p>
        <div className="flex items-center gap-0">
          {ORDER_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            const isDone = !isCancelled && idx <= currentStep;
            const isCurrent = !isCancelled && idx === currentStep;
            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center" style={{ minWidth: 48 }}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCancelled ? 'border-red-200 bg-red-50 text-red-300' :
                    isDone ? (isCurrent ? 'border-brand-600 bg-brand-600 text-white shadow-md' : 'border-brand-400 bg-brand-100 text-brand-600') :
                    'border-gray-200 bg-gray-50 text-gray-300'
                  }`}>
                    <StepIcon size={16} />
                  </div>
                  <p className={`text-[9px] font-bold mt-1 text-center leading-tight ${
                    isCancelled ? 'text-red-400' :
                    isDone ? (isCurrent ? 'text-brand-700' : 'text-brand-500') : 'text-gray-400'
                  }`} style={{ maxWidth: 44 }}>
                    {step.label}
                  </p>
                </div>
                {idx < ORDER_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-5 transition-colors ${
                    isCancelled ? 'bg-red-100' :
                    idx < currentStep ? 'bg-brand-400' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        {isCancelled && (
          <p className="text-xs text-red-500 font-bold mt-2 text-center">
            {status === 'FAILED' ? '⚠ Payment failed' : '✕ Order cancelled'}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900">Welcome, {user.username}!</h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <ShieldCheck size={18} className="text-brand-500"/> Verified Account
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm text-gray-400 font-medium tracking-wider uppercase mb-1">Email Linked</p>
            <p className="font-semibold text-gray-700">{user.email}</p>
          </div>
        </div>

        {/* User Stats / Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="bg-blue-50 p-3 rounded-lg text-blue-500"><Package size={24}/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{orders.length}</h3>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
            <div className="bg-orange-50 p-3 rounded-lg text-orange-500"><Clock size={24}/></div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Pending Delivery</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length}
              </h3>
            </div>
          </div>
        </div>

        {/* Rewards Section */}
        {rewardStatus && (
          <div className="bg-gradient-to-r from-brand-50 to-emerald-50 rounded-2xl shadow-sm border border-emerald-100 p-8 mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md">
                <Star className="text-yellow-500 w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {rewardStatus.loyaltyPoints} <span className="text-lg text-gray-600 font-medium">Loyalty Points</span>
                </h2>
                <p className="text-emerald-700 font-medium mt-1">
                  Login Streak: 🔥 {rewardStatus.loginStreak || 0} days &nbsp;·&nbsp; 10 pts = ₹1
                </p>
              </div>
            </div>
            <div>
              {rewardStatus.claimedToday ? (
                <button disabled className="bg-gray-300 text-gray-600 font-bold py-3 px-8 rounded-xl cursor-not-allowed flex items-center gap-2">
                  <Gift /> Claimed Today
                </button>
              ) : (
                <button onClick={handleClaimReward} className="bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl hover:bg-emerald-600 transition-colors shadow-lg flex items-center gap-2 animate-bounce">
                  <Gift /> Claim Daily Reward
                </button>
              )}
            </div>
          </div>
        )}

        {/* Available Coupons */}
        {coupons.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Ticket className="text-emerald-500" size={24} />
              <h2 className="text-xl font-bold text-gray-900">Available Coupons</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coupons.map(coupon => (
                <div key={coupon.id} className="border-2 border-dashed border-emerald-200 rounded-xl p-4 relative hover:border-emerald-400 transition-all">
                  <div className="absolute top-1/2 -left-2.5 w-5 h-5 bg-gray-50 rounded-full border-r-2 border-emerald-200 -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-2.5 w-5 h-5 bg-gray-50 rounded-full border-l-2 border-emerald-200 -translate-y-1/2" />
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 font-black text-base tracking-widest rounded-lg mb-2">
                      {coupon.code}
                    </span>
                    <p className="font-bold text-gray-800 text-sm">
                      {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} OFF`}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {coupon.minOrderAmount > 0 ? `Min order ₹${coupon.minOrderAmount}` : 'No minimum'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Valid till {new Date(coupon.expiryDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setAppliedCouponCode(coupon.code);
                      navigator.clipboard?.writeText(coupon.code);
                    }}
                    className="mt-3 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1"
                  >
                    {appliedCouponCode === coupon.code
                      ? <><CheckCircle size={14}/> Copied!</>
                      : 'Copy Code'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order History */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="text-center py-12 flex flex-col items-center">
                <div className="animate-spin w-8 h-8 border-4 border-brand-200 border-t-brand-600 rounded-full mb-4"></div>
                <p className="text-gray-500">Loading your history...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Looks like you haven't placed any pharmacy orders yet. Start browsing the catalog to find what you need.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50 text-gray-500 text-sm tracking-wider uppercase">
                      <th className="px-8 py-4 font-medium">Order ID</th>
                      <th className="px-8 py-4 font-medium">Date</th>
                      <th className="px-8 py-4 font-medium">Total Amount</th>
                      <th className="px-8 py-4 font-medium">Status</th>
                      <th className="px-8 py-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5 font-semibold text-gray-900">#PHR-{order.id.toString().padStart(4, '0')}</td>
                        <td className="px-8 py-5 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td className="px-8 py-5 font-bold text-gray-900">₹{order.totalAmount.toFixed(2)}</td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right flex justify-end gap-3">
                          <button 
                            onClick={() => handleReorder(order.id)}
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-800 transition-colors bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded">
                            Reorder
                          </button>
                          <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-sm font-semibold text-brand-600 hover:text-brand-800 transition-colors bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded">
                            View Details
                          </button>
                          {(order.status === 'ORDER_CREATED' || order.status === 'PENDING_PAYMENT' || order.status === 'PENDING') && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-sm font-semibold text-red-600 hover:text-red-800 transition-colors bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded flex items-center gap-1">
                              <Trash2 size={14} /> Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative animate-fade-in">
            <button onClick={() => setSelectedOrder(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Package className="text-brand-500" /> Order Details
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Order ID:</span>
                <span className="font-extrabold text-gray-900">#PHR-{selectedOrder.id.toString().padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Date:</span>
                <span className="font-semibold text-gray-900">{new Date(selectedOrder.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-3">
                <span className="text-gray-500 font-medium">Status:</span>
                <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>
              
              <div className="pt-2">
                <OrderTimeline status={selectedOrder.status} />
              </div>

              <div className="pt-2">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><MapPin size={18} className="text-gray-500" /> Shipping Information</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 font-medium leading-relaxed">
                  {selectedOrder.address}<br/>
                  <div className="mt-2 pt-2 border-t border-gray-200 flex items-center gap-2">
                    <span className="text-gray-500">Contact:</span> <span className="font-bold">{selectedOrder.contactNumber}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2 border-t border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Payment Summary</h3>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="text-gray-900">₹{(selectedOrder.totalAmount + (selectedOrder.discountAmount || 0)).toFixed(2)}</span>
                  </div>
                  {(selectedOrder.discountAmount > 0) && (
                    <div className="flex justify-between text-sm font-bold text-emerald-600">
                      <span>Discount {(selectedOrder.couponCode ? `(${selectedOrder.couponCode})` : '')}:</span>
                      <span>-₹{selectedOrder.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  {(selectedOrder.pointsUsed > 0) && (
                    <div className="flex justify-between text-sm font-bold text-brand-600">
                      <span>Loyalty Points Used:</span>
                      <span>-₹{selectedOrder.pointsUsed.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-black text-gray-900 mt-3 pt-3 border-t border-gray-200">
                    <span>Total Paid:</span>
                    <span className="text-brand-600">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
