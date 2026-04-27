import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Truck, MapPin, Phone, Package, CheckCircle2, Clock,
  Navigation, AlertCircle, RefreshCw, User
} from 'lucide-react';

const STATUS_FLOW = ['ASSIGNED', 'ACCEPTED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const statusConfig = {
  ASSIGNED: { label: 'Assigned', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
  ACCEPTED: { label: 'Accepted', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle2 },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Navigation },
  DELIVERED: { label: 'Delivered', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
};

const DeliveryDashboard = () => {
  const { user, logout } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('active'); // active | completed

  const fetchAssignments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/delivery/orders');
      setAssignments(data);
    } catch (err) {
      setError('Failed to load assignments. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleAccept = async (assignmentId) => {
    setActionLoading(assignmentId + '_accept');
    try {
      await api.put(`/delivery/${assignmentId}/accept`);
      await fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to accept order');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (assignmentId, newStatus) => {
    setActionLoading(assignmentId + '_' + newStatus);
    try {
      await api.put(`/delivery/${assignmentId}/status`, { status: newStatus });
      await fetchAssignments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const activeAssignments = assignments.filter(a => a.status !== 'DELIVERED');
  const completedAssignments = assignments.filter(a => a.status === 'DELIVERED');
  const displayList = activeTab === 'active' ? activeAssignments : completedAssignments;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="text-blue-600" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Delivery Dashboard</h1>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-0.5">
                <User size={14} /> {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchAssignments}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={logout}
              className="text-sm font-semibold text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-lg"><Package className="text-blue-500" size={22} /></div>
            <div>
              <p className="text-sm text-gray-500">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900">{activeAssignments.length}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-lg"><CheckCircle2 className="text-green-500" size={22} /></div>
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">{completedAssignments.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {['active', 'completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab === 'active' ? `Active (${activeAssignments.length})` : `Completed (${completedAssignments.length})`}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <AlertCircle className="text-red-500 shrink-0" size={18} />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Assignment Cards */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading assignments...</p>
          </div>
        ) : displayList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <Truck size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">
              {activeTab === 'active' ? 'No active deliveries assigned to you.' : 'No completed deliveries yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayList.map(assignment => {
              const cfg = statusConfig[assignment.status] || statusConfig.ASSIGNED;
              const StatusIcon = cfg.icon;
              const isLoading = (key) => actionLoading === assignment.id + '_' + key;

              return (
                <div key={assignment.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  {/* Card Header */}
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                      <Package className="text-gray-400" size={18} />
                      <span className="font-bold text-gray-900">
                        Order #PHR-{String(assignment.orderId).padStart(4, '0')}
                      </span>
                    </div>
                    <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full border ${cfg.color}`}>
                      <StatusIcon size={12} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="px-6 py-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <User size={16} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Customer</p>
                        <p className="font-semibold text-gray-800">{assignment.userName || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Delivery Address</p>
                        <p className="font-semibold text-gray-800 leading-relaxed">{assignment.deliveryAddress || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-gray-400 shrink-0" />
                      <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Contact</p>
                        <p className="font-semibold text-gray-800">{assignment.contactNumber || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Status Progress */}
                    <div className="pt-3">
                      <div className="flex items-center gap-1">
                        {STATUS_FLOW.map((s, idx) => {
                          const currentIdx = STATUS_FLOW.indexOf(assignment.status);
                          const isDone = idx <= currentIdx;
                          return (
                            <React.Fragment key={s}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                                isDone ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                              }`}>
                                {idx + 1}
                              </div>
                              {idx < STATUS_FLOW.length - 1 && (
                                <div className={`flex-1 h-1 rounded transition-colors ${isDone && idx < currentIdx ? 'bg-blue-600' : 'bg-gray-100'}`} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-1">
                        {STATUS_FLOW.map(s => (
                          <span key={s} className="text-xs text-gray-400" style={{ width: '25%', textAlign: 'center' }}>
                            {statusConfig[s]?.label.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {assignment.status !== 'DELIVERED' && (
                    <div className="px-6 pb-5 flex gap-3 flex-wrap">
                      {assignment.status === 'ASSIGNED' && (
                        <button
                          onClick={() => handleAccept(assignment.id)}
                          disabled={isLoading('accept')}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isLoading('accept') ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Accept Order
                        </button>
                      )}

                      {assignment.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleStatusUpdate(assignment.id, 'OUT_FOR_DELIVERY')}
                          disabled={isLoading('OUT_FOR_DELIVERY')}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isLoading('OUT_FOR_DELIVERY') ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Navigation size={16} />
                          )}
                          Mark Out for Delivery
                        </button>
                      )}

                      {assignment.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleStatusUpdate(assignment.id, 'DELIVERED')}
                          disabled={isLoading('DELIVERED')}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                        >
                          {isLoading('DELIVERED') ? (
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <CheckCircle2 size={16} />
                          )}
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDashboard;
