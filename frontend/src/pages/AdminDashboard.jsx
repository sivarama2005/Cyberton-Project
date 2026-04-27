import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Package, Truck, CheckCircle, XCircle, FileText, X, Ticket, Plus, Pencil, Trash2, ImagePlus, Pill, FolderPlus, Users } from 'lucide-react';

const EMPTY_MED = { name: '', description: '', price: '', stock: '', dosage: '', packaging: '', requiresPrescription: false, categoryId: '' };

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Delivery agent state
  const [agents, setAgents] = useState([]);
  const [assignModal, setAssignModal] = useState(null); // order object
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Coupon state
  const [coupons, setCoupons] = useState([]);
  const [couponModal, setCouponModal] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', expiryDate: '', minOrderAmount: '', usageLimit: '' });
  const [couponSaving, setCouponSaving] = useState(false);

  // Medicine + category state
  const [medicines, setMedicines] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imgUploading, setImgUploading] = useState(null);

  // Medicine CRUD modal
  const [medModal, setMedModal] = useState(null); // null | 'create' | medicine object
  const [medForm, setMedForm] = useState(EMPTY_MED);
  const [medSaving, setMedSaving] = useState(false);
  const [medDeleting, setMedDeleting] = useState(null);

  // New category modal
  const [catModal, setCatModal] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [catSaving, setCatSaving] = useState(false);

  // Medicine search/filter
  const [medSearch, setMedSearch] = useState('');
  const [medFilterCat, setMedFilterCat] = useState('');

  useEffect(() => {
    fetchOrders();
    fetchCoupons();
    fetchMedicines();
    fetchCategories();
    fetchAgents();
  }, []);

  const fetchMedicines = async () => {
    try { const res = await api.get('/medicines'); setMedicines(res.data); } catch (e) { console.error(e); }
  };

  const fetchCategories = async () => {
    try { const res = await api.get('/categories'); setCategories(res.data); } catch (e) { console.error(e); }
  };

  // ── Medicine CRUD ──────────────────────────────────────────────
  const openCreateMed = () => { setMedForm(EMPTY_MED); setMedModal('create'); };
  const openEditMed = (med) => {
    setMedForm({
      name: med.name, description: med.description || '', price: med.price,
      stock: med.stock, dosage: med.dosage || '', packaging: med.packaging || '',
      requiresPrescription: med.requiresPrescription || false,
      categoryId: med.category?.id || ''
    });
    setMedModal(med);
  };

  const saveMed = async () => {
    if (!medForm.name || !medForm.price || !medForm.stock || !medForm.categoryId) {
      alert('Name, price, stock and category are required.'); return;
    }
    setMedSaving(true);
    try {
      const payload = {
        name: medForm.name, description: medForm.description,
        price: parseFloat(medForm.price), stock: parseInt(medForm.stock),
        dosage: medForm.dosage, packaging: medForm.packaging,
        requiresPrescription: medForm.requiresPrescription,
        category: { id: parseInt(medForm.categoryId) }
      };
      if (medModal === 'create') {
        await api.post('/medicines', payload);
      } else {
        await api.put(`/medicines/${medModal.id}`, payload);
      }
      await fetchMedicines();
      setMedModal(null);
    } catch (e) { alert(e.response?.data?.message || 'Failed to save medicine'); }
    finally { setMedSaving(false); }
  };

  const deleteMed = async (id) => {
    if (!window.confirm('Delete this medicine?')) return;
    setMedDeleting(id);
    try { await api.delete(`/medicines/${id}`); await fetchMedicines(); }
    catch (e) { alert('Failed to delete medicine'); }
    finally { setMedDeleting(null); }
  };

  // ── Image upload ───────────────────────────────────────────────
  const handleImageUpload = async (medicineId, file) => {
    if (!file) return;
    setImgUploading(medicineId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(`/medicines/${medicineId}/image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchMedicines();
    } catch (e) {
      alert('Failed to upload image: ' + (e.response?.data?.error || e.response?.data?.message || e.message));
    } finally { setImgUploading(null); }
  };

  // ── Category create ────────────────────────────────────────────
  const saveCategory = async () => {
    if (!catForm.name) { alert('Category name is required.'); return; }
    setCatSaving(true);
    try {
      await api.post('/categories', catForm);
      await fetchCategories();
      setCatModal(false);
      setCatForm({ name: '', description: '' });
    } catch (e) { alert('Failed to create category'); }
    finally { setCatSaving(false); }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Delete this category? All medicines in it will lose their category.')) return;
    try { await api.delete(`/categories/${id}`); await fetchCategories(); }
    catch (e) { alert('Failed to delete category'); }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, JSON.stringify(status), { headers: { 'Content-Type': 'application/json' } });
      fetchOrders();
    } catch (err) { alert('Failed to update order status'); }
  };

  const fetchCoupons = async () => {
    try { const res = await api.get('/coupons'); setCoupons(res.data); } catch (e) { console.error(e); }
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
      // Legacy
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SHIPPED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const fetchAgents = async () => {
    try { const res = await api.get('/delivery/agents'); setAgents(res.data); } catch (e) { console.error(e); }
  };

  const handleAssignAgent = async () => {
    if (!selectedAgentId) { alert('Please select a delivery agent'); return; }
    setAssigning(true);
    try {
      await api.post('/delivery/assign', { orderId: assignModal.id, agentId: parseInt(selectedAgentId) });
      setAssignModal(null);
      setSelectedAgentId('');
      fetchOrders();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to assign agent');
    } finally { setAssigning(false); }
  };

  const openCreateCoupon = () => {
    setCouponForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', expiryDate: '', minOrderAmount: '', usageLimit: '' });
    setCouponModal('create');
  };

  const openEditCoupon = (coupon) => {
    setCouponForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      expiryDate: coupon.expiryDate || '',
      minOrderAmount: coupon.minOrderAmount || '',
      usageLimit: coupon.usageLimit || ''
    });
    setCouponModal(coupon);
  };

  const saveCoupon = async () => {
    setCouponSaving(true);
    try {
      const payload = {
        ...couponForm,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : 0,
        usageLimit: couponForm.usageLimit ? parseInt(couponForm.usageLimit) : null,
        expiryDate: couponForm.expiryDate || null,
      };
      if (couponModal === 'create') {
        await api.post('/coupons', payload);
      } else {
        await api.put(`/coupons/${couponModal.id}`, payload);
      }
      await fetchCoupons();
      setCouponModal(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to save coupon');
    } finally {
      setCouponSaving(false);
    }
  };

  const deleteCoupon = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await api.delete(`/coupons/${id}`);
      fetchCoupons();
    } catch (e) { alert('Failed to delete coupon'); }
  };

  if (loading) {
    return <div className="flex justify-center items-center py-20"><div className="animate-spin w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full"></div></div>;
  }

  return (
    <div className="container mx-auto px-6 pt-32 pb-12 max-w-7xl animate-fade-in">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8 flex items-center gap-3">
        <Package className="text-brand-600" size={32} />
        Admin Dashboard
      </h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'orders' ? 'bg-white border border-b-white border-gray-200 text-brand-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Package size={18} /> Orders
        </button>
        <button
          onClick={() => setActiveTab('coupons')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'coupons' ? 'bg-white border border-b-white border-gray-200 text-brand-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Ticket size={18} /> Coupons
        </button>
        <button
          onClick={() => setActiveTab('medicines')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'medicines' ? 'bg-white border border-b-white border-gray-200 text-brand-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Pill size={18} /> Medicines
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'categories' ? 'bg-white border border-b-white border-gray-200 text-brand-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <FolderPlus size={18} /> Categories
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-all ${activeTab === 'delivery' ? 'bg-white border border-b-white border-gray-200 text-brand-600 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Truck size={18} /> Delivery
        </button>
      </div>

      {/* Orders Tab */}
      {activeTab === 'orders' && (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm uppercase tracking-wider text-gray-500 font-bold">
                <th className="p-4">Order ID</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4">Shipping Address</th>
                <th className="p-4">Total Amount</th>
                <th className="p-4">Status</th>
                <th className="p-4">Prescription</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-semibold text-gray-900">
                    #{order.id}
                    <div className="text-xs text-gray-500 mt-1 font-normal">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <div className="font-bold text-gray-800">{order.userName || order.user?.username || 'Guest'}</div>
                    <div className="text-gray-500 font-medium mt-1">📞 {order.contactNumber || 'N/A'}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-xs">{order.address || 'N/A'}</td>
                  <td className="p-4 font-extrabold text-gray-900">₹{order.totalAmount?.toFixed(2)}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm">
                    {order.prescription ? (
                      <button
                        onClick={() => setSelectedPrescription(order.prescription.filePath)}
                        className="flex items-center gap-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors font-semibold"
                      >
                        <FileText size={16} /> View Rx
                      </button>
                    ) : (
                      <span className="text-gray-400 italic">None</span>
                    )}
                  </td>
                  <td className="p-4 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {/* Admin approves PAID orders → INITIATED */}
                      {order.status === 'PAID' && (
                        <button onClick={() => updateOrderStatus(order.id, 'INITIATED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Approve & Initiate">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {/* Legacy PENDING support */}
                      {order.status === 'PENDING' && (
                        <button onClick={() => updateOrderStatus(order.id, 'INITIATED')} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="Approve">
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {/* Assign delivery agent for PAID/INITIATED orders */}
                      {(order.status === 'PAID' || order.status === 'INITIATED') && (
                        <button onClick={() => { setAssignModal(order); setSelectedAgentId(''); }} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Assign Delivery Agent">
                          <Users size={18} />
                        </button>
                      )}
                      {/* Cancel */}
                      {!['DELIVERED', 'CANCELLED', 'DISPATCHED'].includes(order.status) && (
                        <button onClick={() => updateOrderStatus(order.id, 'CANCELLED')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Cancel">
                          <XCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 font-medium">No orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Coupons Tab */}
      {activeTab === 'coupons' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Manage Coupons</h2>
            <button onClick={openCreateCoupon} className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md">
              <Plus size={18} /> New Coupon
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4">Code</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Min Order</th>
                  <th className="p-4">Expiry</th>
                  <th className="p-4">Usage</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map(c => {
                  const expired = c.expiryDate && new Date(c.expiryDate) < new Date();
                  return (
                    <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${expired ? 'opacity-50' : ''}`}>
                      <td className="p-4 font-black text-emerald-700 tracking-widest">{c.code}</td>
                      <td className="p-4 text-sm text-gray-600">{c.discountType}</td>
                      <td className="p-4 font-bold text-gray-900">
                        {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                      </td>
                      <td className="p-4 text-sm text-gray-600">₹{c.minOrderAmount || 0}</td>
                      <td className="p-4 text-sm">
                        <span className={expired ? 'text-red-500 font-bold' : 'text-gray-600'}>
                          {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString() : '—'}
                          {expired && ' (Expired)'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{c.usedCount || 0} / {c.usageLimit || '∞'}</td>
                      <td className="p-4 flex gap-2">
                        <button onClick={() => openEditCoupon(c)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => deleteCoupon(c.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100" title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {coupons.length === 0 && (
                  <tr><td colSpan="7" className="p-8 text-center text-gray-400">No coupons found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medicines Tab */}
      {activeTab === 'medicines' && (
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
            <h2 className="text-xl font-bold text-gray-800">Manage Medicines</h2>
            <button onClick={openCreateMed} className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md">
              <Plus size={18} /> Add Medicine
            </button>
          </div>

          {/* Search + filter */}
          <div className="flex gap-3 mb-5">
            <input
              value={medSearch} onChange={e => setMedSearch(e.target.value)}
              placeholder="Search by name..."
              className="flex-grow border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <select value={medFilterCat} onChange={e => setMedFilterCat(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Medicine grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {medicines
              .filter(m => (!medSearch || m.name.toLowerCase().includes(medSearch.toLowerCase())))
              .filter(m => (!medFilterCat || m.category?.id === parseInt(medFilterCat)))
              .map(med => (
              <div key={med.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Image */}
                <div className="relative overflow-hidden bg-gray-50" style={{height: '128px'}}>
                  {med.imageUrl ? (
                    <img src={`http://localhost:8081${med.imageUrl}`} alt={med.name}
                      className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-300">
                      <ImagePlus size={28} /><span className="text-xs mt-1">No image</span>
                    </div>
                  )}
                  {med.requiresPrescription && (
                    <span className="absolute top-1.5 right-1.5 text-[9px] font-extrabold text-white bg-red-500 px-1.5 py-0.5 rounded">Rx</span>
                  )}
                </div>
                {/* Info */}
                <div className="p-3">
                  <p className="font-bold text-gray-900 text-sm truncate">{med.name}</p>
                  <p className="text-xs text-gray-400">{med.category?.name} · {med.dosage}</p>
                  <p className="text-sm font-extrabold text-brand-600 mt-1">₹{med.price?.toFixed(2)}</p>
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => openEditMed(med)} className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-bold">
                      <Pencil size={12} /> Edit
                    </button>
                    <button onClick={() => deleteMed(med.id)} disabled={medDeleting === med.id}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-xs font-bold disabled:opacity-50">
                      <Trash2 size={12} /> {medDeleting === med.id ? '...' : 'Delete'}
                    </button>
                  </div>
                  {/* Image upload */}
                  <label className={`mt-2 flex items-center justify-center gap-1 w-full py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all
                    ${imgUploading === med.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white'}`}>
                    {imgUploading === med.id
                      ? <><div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> Uploading...</>
                      : <><ImagePlus size={12} /> {med.imageUrl ? 'Change Photo' : 'Add Photo'}</>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                      disabled={imgUploading === med.id}
                      onChange={(e) => handleImageUpload(med.id, e.target.files[0])} />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">Manage Categories</h2>
            <button onClick={() => setCatModal(true)} className="flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-brand-700 transition-all shadow-md">
              <Plus size={18} /> New Category
            </button>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Description</th>
                  <th className="p-4">Medicines</th><th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-400">#{cat.id}</td>
                    <td className="p-4 font-bold text-gray-900">{cat.name}</td>
                    <td className="p-4 text-sm text-gray-500">{cat.description || '—'}</td>
                    <td className="p-4 text-sm text-gray-600">{medicines.filter(m => m.category?.id === cat.id).length}</td>
                    <td className="p-4">
                      <button onClick={() => deleteCategory(cat.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {categories.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No categories.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Medicine Create/Edit Modal */}
      {medModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl font-bold text-gray-900">{medModal === 'create' ? 'Add Medicine' : 'Edit Medicine'}</h3>
              <button onClick={() => setMedModal(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Name *</label>
                <input value={medForm.name} onChange={e => setMedForm({...medForm, name: e.target.value})}
                  placeholder="e.g. Dolo 650mg" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Description</label>
                <textarea value={medForm.description} onChange={e => setMedForm({...medForm, description: e.target.value})}
                  rows={2} placeholder="Brief description..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Price (₹) *</label>
                <input type="number" value={medForm.price} onChange={e => setMedForm({...medForm, price: e.target.value})}
                  placeholder="0.00" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Stock *</label>
                <input type="number" value={medForm.stock} onChange={e => setMedForm({...medForm, stock: e.target.value})}
                  placeholder="100" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Dosage</label>
                <input value={medForm.dosage} onChange={e => setMedForm({...medForm, dosage: e.target.value})}
                  placeholder="e.g. 650 mg" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Packaging</label>
                <input value={medForm.packaging} onChange={e => setMedForm({...medForm, packaging: e.target.value})}
                  placeholder="e.g. Strip of 15" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Category *</label>
                <div className="flex gap-2">
                  <select value={medForm.categoryId} onChange={e => setMedForm({...medForm, categoryId: e.target.value})}
                    className="flex-grow border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400">
                    <option value="">Select category...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <button type="button" onClick={() => setCatModal(true)}
                    className="px-3 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 whitespace-nowrap">
                    <Plus size={14} /> New
                  </button>
                </div>
              </div>
              <div className="col-span-2 flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                <input type="checkbox" id="rxCheck" checked={medForm.requiresPrescription}
                  onChange={e => setMedForm({...medForm, requiresPrescription: e.target.checked})}
                  className="w-4 h-4 accent-red-500" />
                <label htmlFor="rxCheck" className="text-sm font-bold text-orange-800 cursor-pointer">Requires Prescription (Rx)</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setMedModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={saveMed} disabled={medSaving}
                className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-70">
                {medSaving ? 'Saving...' : medModal === 'create' ? 'Create Medicine' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Category Modal */}
      {catModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Category</h3>
              <button onClick={() => setCatModal(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Category Name *</label>
                <input value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})}
                  placeholder="e.g. Eye Care" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Description</label>
                <input value={catForm.description} onChange={e => setCatForm({...catForm, description: e.target.value})}
                  placeholder="Optional description" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setCatModal(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
              <button onClick={saveCategory} disabled={catSaving}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-70">
                {catSaving ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Create/Edit Modal */}
      {couponModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{couponModal === 'create' ? 'Create Coupon' : 'Edit Coupon'}</h3>
              <button onClick={() => setCouponModal(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              {couponModal === 'create' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Coupon Code</label>
                  <input value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                    placeholder="e.g. SAVE20" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Discount Type</label>
                <select value={couponForm.discountType} onChange={e => setCouponForm({...couponForm, discountType: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FLAT">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Discount Value {couponForm.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}
                </label>
                <input type="number" value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: e.target.value})}
                  placeholder={couponForm.discountType === 'PERCENTAGE' ? '10' : '100'}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={couponForm.expiryDate} onChange={e => setCouponForm({...couponForm, expiryDate: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Order Amount (₹)</label>
                <input type="number" value={couponForm.minOrderAmount} onChange={e => setCouponForm({...couponForm, minOrderAmount: e.target.value})}
                  placeholder="0 = no minimum"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Usage Limit (leave blank = unlimited)</label>
                <input type="number" value={couponForm.usageLimit} onChange={e => setCouponForm({...couponForm, usageLimit: e.target.value})}
                  placeholder="e.g. 100"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setCouponModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
              <button onClick={saveCoupon} disabled={couponSaving}
                className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all disabled:opacity-70">
                {couponSaving ? 'Saving...' : 'Save Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Image Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2"><FileText /> Prescription Image</h3>
              <button onClick={() => setSelectedPrescription(null)} className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-grow bg-gray-100 flex items-center justify-center min-h-[400px]">
              <img
                src={
                  selectedPrescription.startsWith('http')
                    ? selectedPrescription
                    : selectedPrescription.startsWith('/uploads')
                      ? `http://localhost:8081${selectedPrescription}`
                      : `http://localhost:8081/uploads/prescriptions/${selectedPrescription.replace(/\\/g, '/').split('/').pop()}`
                }
                alt="Prescription"
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400?text=Image+Not+Found"; }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Tab */}
      {activeTab === 'delivery' && (
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Delivery Agents</h2>
            <p className="text-sm text-gray-500">Registered delivery agents. Assign them to PAID/INITIATED orders from the Orders tab.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-bold">
                  <th className="p-4">ID</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {agents.map(agent => (
                  <tr key={agent.id} className="hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-400">#{agent.id}</td>
                    <td className="p-4 font-bold text-gray-900 flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                        {agent.username?.charAt(0).toUpperCase()}
                      </div>
                      {agent.username}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{agent.email}</td>
                  </tr>
                ))}
                {agents.length === 0 && (
                  <tr><td colSpan="3" className="p-8 text-center text-gray-400">
                    No delivery agents registered yet. Register an agent using the signup API with role "delivery_agent".
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Delivery Agent Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Truck size={20} className="text-blue-600" /> Assign Delivery Agent
              </h3>
              <button onClick={() => setAssignModal(null)} className="p-1 hover:bg-gray-100 rounded-full"><X size={18} /></button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Order</span>
                <span className="font-bold">#PHR-{String(assignModal.id).padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Customer</span>
                <span className="font-semibold">{assignModal.userName || assignModal.user?.username || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Address</span>
                <span className="font-semibold text-right max-w-[200px]">{assignModal.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="font-bold text-green-600">₹{assignModal.totalAmount?.toFixed(2)}</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Select Delivery Agent</label>
              {agents.length === 0 ? (
                <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">No delivery agents available. Please register agents first.</p>
              ) : (
                <select
                  value={selectedAgentId}
                  onChange={e => setSelectedAgentId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">-- Select an agent --</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.username} ({a.email})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setAssignModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">Cancel</button>
              <button
                onClick={handleAssignAgent}
                disabled={assigning || !selectedAgentId}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {assigning ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Assigning...</> : <><Truck size={16} /> Assign Agent</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
