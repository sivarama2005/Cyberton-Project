import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, CreditCard, AlertCircle, Loader2, CheckCircle2, XCircle } from 'lucide-react';

/**
 * PaymentPage
 * Receives order details via router state: { orderId, totalAmount, address, contactNumber }
 * Loads Razorpay checkout SDK and handles payment flow.
 */
const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { orderId, totalAmount, address, contactNumber } = location.state || {};

  const [status, setStatus] = useState('idle'); // idle | loading | success | failed
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!orderId) {
      navigate('/', { replace: true });
    }
  }, [orderId, navigate]);

  // Dynamically load Razorpay checkout script
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    setStatus('loading');
    setMessage('');

    try {
      // Step 1: Create Razorpay order on backend
      const { data } = await api.post('/payment/create-order', { orderId });
      const { razorpayOrderId, amount, currency, keyId } = data;

      // Step 2: Load Razorpay SDK
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setStatus('failed');
        setMessage('Failed to load payment gateway. Please check your internet connection.');
        return;
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // paise
        currency: currency || 'INR',
        name: 'PharmaCare',
        description: `Order #PHR-${String(orderId).padStart(4, '0')}`,
        order_id: razorpayOrderId,
        prefill: {
          contact: contactNumber || '',
        },
        notes: {
          address: address || '',
        },
        theme: { color: '#16a34a' },
        handler: async (response) => {
          // Step 4: Verify payment on backend
          try {
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId,
            });
            setStatus('success');
            setMessage('Payment successful! Your order has been confirmed.');
          } catch (err) {
            setStatus('failed');
            setMessage(err.response?.data?.message || 'Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: async () => {
            // User closed the modal without paying
            try {
              await api.post('/payment/failure', { orderId, razorpayOrderId });
            } catch (_) {}
            setStatus('failed');
            setMessage('Payment was cancelled. You can retry from your dashboard.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', async (response) => {
        try {
          await api.post('/payment/failure', { orderId, razorpayOrderId });
        } catch (_) {}
        setStatus('failed');
        setMessage(response.error?.description || 'Payment failed. Please try again.');
      });

      rzp.open();
      setStatus('idle'); // Reset while modal is open
    } catch (err) {
      setStatus('failed');
      setMessage(err.response?.data?.message || 'Could not initiate payment. Please try again.');
    }
  };

  if (!orderId) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-20 px-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 max-w-md w-full p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <CreditCard className="text-green-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Complete Payment</h1>
            <p className="text-gray-500 text-sm">Secure checkout powered by Razorpay</p>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-5 mb-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Order ID</span>
            <span className="font-bold text-gray-900">#PHR-{String(orderId).padStart(4, '0')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Delivery Address</span>
            <span className="font-semibold text-gray-700 text-right max-w-[200px]">{address}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 font-medium">Contact</span>
            <span className="font-semibold text-gray-700">{contactNumber}</span>
          </div>
          <div className="border-t border-gray-200 pt-3 flex justify-between">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="text-xl font-black text-green-600">₹{Number(totalAmount).toFixed(2)}</span>
          </div>
        </div>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
            <CheckCircle2 className="text-green-600 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold text-green-800">Payment Successful!</p>
              <p className="text-green-700 text-sm mt-1">{message}</p>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
            <XCircle className="text-red-500 mt-0.5 shrink-0" size={20} />
            <div>
              <p className="font-bold text-red-800">Payment Failed</p>
              <p className="text-red-700 text-sm mt-1">{message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {status === 'success' ? (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={20} /> View My Orders
          </button>
        ) : (
          <button
            onClick={handlePayment}
            disabled={status === 'loading'}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {status === 'loading' ? (
              <><Loader2 size={20} className="animate-spin" /> Processing...</>
            ) : (
              <><CreditCard size={20} /> Pay ₹{Number(totalAmount).toFixed(2)}</>
            )}
          </button>
        )}

        {status === 'failed' && (
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
          >
            Go to Dashboard
          </button>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 mt-5 text-gray-400 text-xs">
          <ShieldCheck size={14} />
          <span>256-bit SSL encrypted · Powered by Razorpay</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
