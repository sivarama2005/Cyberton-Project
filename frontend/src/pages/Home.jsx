import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useReward } from '../context/RewardContext';
import { Search, ShoppingCart, Pill, Plus, ArrowLeft, ArrowRight, Thermometer, Droplets, Heart, Shell, Wind, Activity, X, CheckCircle, ShieldCheck, Truck, Clock, Phone, Mail, MapPin, Leaf, Baby, Stethoscope, Cross, Syringe, Tag, Coins } from 'lucide-react';

const mockCategories = [
  { id: 1, name: 'Fever & Pain', icon: Thermometer, color: 'bg-red-100 text-red-600 border-red-200' },
  { id: 2, name: 'Cold & Cough', icon: Wind, color: 'bg-blue-100 text-blue-600 border-blue-200' },
  { id: 3, name: 'Stomach Care', icon: Droplets, color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
  { id: 4, name: 'Heart Health', icon: Heart, color: 'bg-rose-100 text-rose-600 border-rose-200' },
  { id: 5, name: 'Vitamins & Supplements', icon: Activity, color: 'bg-emerald-100 text-emerald-600 border-emerald-200' },
  { id: 6, name: 'Skin Care', icon: Shell, color: 'bg-purple-100 text-purple-600 border-purple-200' },
  { id: 7, name: 'Antibiotics', icon: Pill, color: 'bg-indigo-100 text-indigo-600 border-indigo-200' },
  { id: 8, name: 'Diabetes Care', icon: Syringe, color: 'bg-orange-100 text-orange-600 border-orange-200' },
  { id: 9, name: 'Ayurvedic', icon: Leaf, color: 'bg-green-100 text-green-700 border-green-300' },
  { id: 10, name: 'First Aid', icon: Cross, color: 'bg-red-50 text-red-700 border-red-300' },
  { id: 11, name: 'Baby Care', icon: Baby, color: 'bg-pink-100 text-pink-600 border-pink-200' },
  { id: 12, name: 'Healthcare Devices', icon: Stethoscope, color: 'bg-cyan-100 text-cyan-600 border-cyan-200' },
];

const mockMedicinesData = [
  // Fever & Pain
  { id: 101, name: 'Dolo 650mg', description: 'Paracetamol for fever and pain relief.', price: 30.00, stock: 73, requiresPrescription: false, dosage: '650 mg', packaging: 'Strip of 15', category: { id: 1, name: 'Fever & Pain' } },
  { id: 102, name: 'Crocin 500mg', description: 'Paracetamol tablet for mild fever.', price: 20.00, stock: 186, requiresPrescription: false, dosage: '500 mg', packaging: 'Strip of 15', category: { id: 1, name: 'Fever & Pain' } },
  { id: 103, name: 'Combiflam', description: 'Ibuprofen + Paracetamol combination for pain.', price: 40.00, stock: 256, requiresPrescription: false, dosage: '400 mg', packaging: 'Strip of 20', category: { id: 1, name: 'Fever & Pain' } },
  { id: 104, name: 'Zerodol-SP', description: 'Aceclofenac + Serratiopeptidase for inflammation.', price: 110.00, stock: 224, requiresPrescription: true, dosage: '100 mg', packaging: 'Strip of 10', category: { id: 1, name: 'Fever & Pain' } },
  { id: 105, name: 'Voveran 50mg', description: 'Diclofenac for pain and inflammation.', price: 90.00, stock: 378, requiresPrescription: true, dosage: '50 mg', packaging: 'Strip of 15', category: { id: 1, name: 'Fever & Pain' } },
  // Antibiotics
  { id: 201, name: 'Augmentin 625mg', description: 'Amoxicillin + Clavulanic Acid broad-spectrum antibiotic.', price: 200.00, stock: 399, requiresPrescription: true, dosage: '625 mg', packaging: 'Strip of 10', category: { id: 7, name: 'Antibiotics' } },
  { id: 202, name: 'Azithral 500mg', description: 'Azithromycin antibiotic for bacterial infections.', price: 120.00, stock: 189, requiresPrescription: true, dosage: '500 mg', packaging: 'Strip of 5', category: { id: 7, name: 'Antibiotics' } },
  { id: 203, name: 'Taxim-O 200mg', description: 'Cefixime for urinary and respiratory infections.', price: 150.00, stock: 126, requiresPrescription: true, dosage: '200 mg', packaging: 'Strip of 10', category: { id: 7, name: 'Antibiotics' } },
  { id: 204, name: 'Ciprobid 500mg', description: 'Ciprofloxacin for bacterial infections.', price: 45.00, stock: 376, requiresPrescription: true, dosage: '500 mg', packaging: 'Strip of 10', category: { id: 7, name: 'Antibiotics' } },
  // Stomach Care
  { id: 301, name: 'Pantocid 40mg', description: 'Pantoprazole for acid reflux and ulcers.', price: 130.00, stock: 268, requiresPrescription: false, dosage: '40 mg', packaging: 'Strip of 15', category: { id: 3, name: 'Stomach Care' } },
  { id: 302, name: 'Omez 20mg', description: 'Omeprazole proton pump inhibitor.', price: 60.00, stock: 23, requiresPrescription: false, dosage: '20 mg', packaging: 'Strip of 20', category: { id: 3, name: 'Stomach Care' } },
  { id: 303, name: 'Gelusil MPS', description: 'Antacid liquid for quick acidity relief.', price: 120.00, stock: 265, requiresPrescription: false, dosage: 'Liquid', packaging: 'Bottle of 200ml', category: { id: 3, name: 'Stomach Care' } },
  { id: 304, name: 'Digene Tablet', description: 'Antacid tablet for gas and acidity.', price: 25.00, stock: 314, requiresPrescription: false, dosage: 'Tablet', packaging: 'Strip of 15', category: { id: 3, name: 'Stomach Care' } },
  { id: 305, name: 'Meftal-Spas', description: 'Mefenamic Acid for stomach cramps.', price: 45.00, stock: 439, requiresPrescription: true, dosage: '250 mg', packaging: 'Strip of 10', category: { id: 3, name: 'Stomach Care' } },
  // Cold & Cough
  { id: 401, name: 'Allegra 120mg', description: 'Fexofenadine antihistamine for allergies.', price: 180.00, stock: 442, requiresPrescription: false, dosage: '120 mg', packaging: 'Strip of 10', category: { id: 2, name: 'Cold & Cough' } },
  { id: 402, name: 'Okacet 10mg', description: 'Cetirizine for cold and allergy relief.', price: 20.00, stock: 165, requiresPrescription: false, dosage: '10 mg', packaging: 'Strip of 10', category: { id: 2, name: 'Cold & Cough' } },
  { id: 403, name: 'Benadryl Syrup', description: 'Diphenhydramine cough syrup.', price: 120.00, stock: 42, requiresPrescription: false, dosage: 'Syrup', packaging: 'Bottle of 150ml', category: { id: 2, name: 'Cold & Cough' } },
  { id: 404, name: 'Corex DX Syrup', description: 'Dextromethorphan for dry cough.', price: 130.00, stock: 317, requiresPrescription: false, dosage: 'Syrup', packaging: 'Bottle of 100ml', category: { id: 2, name: 'Cold & Cough' } },
  // Heart Health
  { id: 501, name: 'Telma 40mg', description: 'Telmisartan for high blood pressure.', price: 210.00, stock: 312, requiresPrescription: true, dosage: '40 mg', packaging: 'Strip of 15', category: { id: 4, name: 'Heart Health' } },
  { id: 502, name: 'Ecosprin 75mg', description: 'Aspirin blood thinner for heart protection.', price: 10.00, stock: 114, requiresPrescription: true, dosage: '75 mg', packaging: 'Strip of 14', category: { id: 4, name: 'Heart Health' } },
  { id: 503, name: 'Atorva 10mg', description: 'Atorvastatin for cholesterol management.', price: 60.00, stock: 229, requiresPrescription: true, dosage: '10 mg', packaging: 'Strip of 10', category: { id: 4, name: 'Heart Health' } },
  // Diabetes Care
  { id: 601, name: 'Glycomet 500mg', description: 'Metformin for type 2 diabetes management.', price: 25.00, stock: 316, requiresPrescription: true, dosage: '500 mg', packaging: 'Strip of 10', category: { id: 8, name: 'Diabetes Care' } },
  { id: 602, name: 'Galvus 50mg', description: 'Vildagliptin for blood sugar control.', price: 350.00, stock: 349, requiresPrescription: true, dosage: '50 mg', packaging: 'Strip of 15', category: { id: 8, name: 'Diabetes Care' } },
  { id: 603, name: 'Amaryl 1mg', description: 'Glimepiride for diabetes treatment.', price: 120.00, stock: 430, requiresPrescription: true, dosage: '1 mg', packaging: 'Strip of 15', category: { id: 8, name: 'Diabetes Care' } },
  // Vitamins & Supplements
  { id: 701, name: 'Supradyn', description: 'Multivitamin tablet for daily nutrition.', price: 55.00, stock: 403, requiresPrescription: false, dosage: 'Tablet', packaging: 'Strip of 15', category: { id: 5, name: 'Vitamins & Supplements' } },
  { id: 702, name: 'Zincovit', description: 'Multivitamin + Zinc for immunity.', price: 100.00, stock: 40, requiresPrescription: false, dosage: 'Tablet', packaging: 'Strip of 15', category: { id: 5, name: 'Vitamins & Supplements' } },
  { id: 703, name: 'Evion 400mg', description: 'Vitamin E capsule for skin and immunity.', price: 35.00, stock: 116, requiresPrescription: false, dosage: '400 mg', packaging: 'Strip of 10', category: { id: 5, name: 'Vitamins & Supplements' } },
  { id: 704, name: 'Neurobion Forte', description: 'Vitamin B Complex for nerve health.', price: 35.00, stock: 349, requiresPrescription: false, dosage: 'Tablet', packaging: 'Strip of 30', category: { id: 5, name: 'Vitamins & Supplements' } },
  // Skin Care
  { id: 801, name: 'Betnovate-C Cream', description: 'Betamethasone cream for skin inflammation.', price: 60.00, stock: 350, requiresPrescription: true, dosage: 'Cream', packaging: 'Tube of 30g', category: { id: 6, name: 'Skin Care' } },
  { id: 802, name: 'Candid Powder', description: 'Clotrimazole antifungal dusting powder.', price: 120.00, stock: 417, requiresPrescription: false, dosage: 'Dusting Powder', packaging: 'Bottle of 100g', category: { id: 6, name: 'Skin Care' } },
  { id: 803, name: 'Moisturex Cream', description: 'Urea Lactic Acid moisturizing cream.', price: 250.00, stock: 235, requiresPrescription: false, dosage: 'Cream', packaging: 'Jar of 100g', category: { id: 6, name: 'Skin Care' } },
  // Ayurvedic
  { id: 901, name: 'Liv.52 Tablet', description: 'Himalaya ayurvedic liver tonic.', price: 140.00, stock: 268, requiresPrescription: false, dosage: 'Tablet', packaging: 'Bottle of 100', category: { id: 9, name: 'Ayurvedic' } },
  { id: 902, name: 'Septilin', description: 'Himalaya immunity builder tablet.', price: 180.00, stock: 358, requiresPrescription: false, dosage: 'Tablet', packaging: 'Bottle of 60', category: { id: 9, name: 'Ayurvedic' } },
  { id: 903, name: 'Dabur Chyawanprash', description: 'Ayurvedic health supplement paste.', price: 350.00, stock: 397, requiresPrescription: false, dosage: 'Paste', packaging: 'Jar of 1kg', category: { id: 9, name: 'Ayurvedic' } },
  { id: 904, name: 'Zandu Balm', description: 'Ayurvedic pain relief balm.', price: 45.00, stock: 148, requiresPrescription: false, dosage: 'Balm', packaging: 'Jar of 25g', category: { id: 9, name: 'Ayurvedic' } },
  // First Aid
  { id: 1001, name: 'Dettol Liquid 100ml', description: 'Antiseptic disinfectant liquid.', price: 60.00, stock: 238, requiresPrescription: false, dosage: 'Liquid', packaging: 'Bottle of 100ml', category: { id: 10, name: 'First Aid' } },
  { id: 1002, name: 'Savlon Antiseptic', description: 'Antiseptic liquid for wound care.', price: 50.00, stock: 334, requiresPrescription: false, dosage: 'Liquid', packaging: 'Bottle of 100ml', category: { id: 10, name: 'First Aid' } },
  { id: 1003, name: 'Band-Aid Strips', description: 'Waterproof washproof adhesive strips.', price: 40.00, stock: 52, requiresPrescription: false, dosage: 'Strips', packaging: 'Pack of 20', category: { id: 10, name: 'First Aid' } },
  { id: 1004, name: 'Soframycin Cream', description: 'Framycetin antiseptic cream for wounds.', price: 55.00, stock: 254, requiresPrescription: false, dosage: 'Cream', packaging: 'Tube of 30g', category: { id: 10, name: 'First Aid' } },
  // Baby Care
  { id: 1101, name: 'Pampers Large', description: 'Active baby diapers for comfort.', price: 450.00, stock: 51, requiresPrescription: false, dosage: 'Large', packaging: 'Pack of 30', category: { id: 11, name: 'Baby Care' } },
  { id: 1102, name: 'Sebamed Baby Lotion', description: 'Gentle baby lotion for sensitive skin.', price: 450.00, stock: 247, requiresPrescription: false, dosage: 'Lotion', packaging: 'Bottle of 100ml', category: { id: 11, name: 'Baby Care' } },
  { id: 1103, name: 'Himalaya Baby Powder', description: 'Herbal baby powder for rash prevention.', price: 80.00, stock: 208, requiresPrescription: false, dosage: 'Powder', packaging: 'Bottle of 100g', category: { id: 11, name: 'Baby Care' } },
  { id: 1104, name: 'Cerelac Wheat Apple', description: 'Wheat apple baby food powder.', price: 280.00, stock: 216, requiresPrescription: false, dosage: 'Powder', packaging: 'Box of 300g', category: { id: 11, name: 'Baby Care' } },
  // Healthcare Devices
  { id: 1201, name: 'Accu-Chek Glucometer', description: 'Active glucometer with 10 test strips.', price: 999.00, stock: 213, requiresPrescription: false, dosage: 'Device', packaging: '1 Unit + 10 Strips', category: { id: 12, name: 'Healthcare Devices' } },
  { id: 1202, name: 'Dr Trust BP Monitor', description: 'Digital blood pressure monitor.', price: 1200.00, stock: 350, requiresPrescription: false, dosage: 'Device', packaging: '1 Unit', category: { id: 12, name: 'Healthcare Devices' } },
  { id: 1203, name: 'Omron Pulse Oximeter', description: 'Oxygen saturation measurement device.', price: 1500.00, stock: 303, requiresPrescription: false, dosage: 'Device', packaging: '1 Unit', category: { id: 12, name: 'Healthcare Devices' } },
  { id: 1204, name: 'Digital Thermometer', description: 'Standard digital body thermometer.', price: 250.00, stock: 208, requiresPrescription: false, dosage: 'Device', packaging: '1 Unit', category: { id: 12, name: 'Healthcare Devices' } },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState(mockCategories);
  const [allMedicines, setAllMedicines] = useState(mockMedicinesData);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const { cart, isCartOpen, setIsCartOpen, addToCart, updateQuantity, removeFromCart, clearCart, cartTotalAmount: cartTotal, cartTotalItems } = useCart();
  const [orderStatus, setOrderStatus] = useState(null);
  const [isOrdering, setIsOrdering] = useState(false);
  const [address, setAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  const {
    availablePoints,
    couponCode,
    setCouponCode,
    appliedCoupon,
    setAppliedCoupon,
    couponDiscount,
    setCouponDiscount,
    couponError,
    handleValidateCoupon: contextValidateCoupon,
    removeCoupon,
    usePoints,
    setUsePoints
  } = useReward();

  const handleValidateCoupon = async () => {
    try {
      await contextValidateCoupon(couponCode, cartTotal);
    } catch (e) {
      // Error is handled in context
    }
  };

  // Recalculate coupon discount whenever cart total changes (quantity updates)
  useEffect(() => {
    if (appliedCoupon && cartTotal > 0) {
      contextValidateCoupon(appliedCoupon, cartTotal).catch(() => {});
    }
  }, [cartTotal]);

  // Calculate final amount
  let pointsDiscount = 0;
  if (usePoints) {
    pointsDiscount = Math.min(availablePoints / 10, cartTotal - couponDiscount);
    if (pointsDiscount < 0) pointsDiscount = 0;
  }
  const finalTotal = Math.max(0, cartTotal - couponDiscount - pointsDiscount);

  // Fetch from DB if available
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/medicines');
        if (response.data && response.data.length > 0) {
          setAllMedicines(response.data);

          // Extract unique categories from dynamic data
          const uniqueCategories = [];
          const map = new Map();
          for (const med of response.data) {
            if (med.category && !map.has(med.category.id)) {
              map.set(med.category.id, true);
              // Preserve our mock category icons and colors by merging
              const mockCat = mockCategories.find(c => c.name === med.category.name);
              uniqueCategories.push({
                ...med.category,
                icon: mockCat ? mockCat.icon : Activity,
                color: mockCat ? mockCat.color : 'bg-gray-100 text-gray-600'
              });
            }
          }
          if (uniqueCategories.length > 0) {
            setCategories(uniqueCategories);
          }
        }
      } catch (error) {
        console.error("Failed to fetch medicines from DB, using mock data", error);
      }
    };
    fetchData();
  }, []);

  const displayedMedicines = selectedCategory
    ? allMedicines.filter(m => m.category?.id === selectedCategory?.id)
    : allMedicines.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase()));

  const hasPrescriptionItems = cart.some(item => item.requiresPrescription);

  const handlePlaceOrder = async () => {
    if (!user) {
      alert("Please login to place an order");
      return;
    }

    if (!address || !contactNumber) {
      alert("Please provide both shipping address and contact number");
      return;
    }

    if (hasPrescriptionItems && !prescriptionFile) {
      alert("Please upload a prescription for the required medicines");
      return;
    }

    setIsOrdering(true);
    try {
      const orderPayload = {
        totalAmount: cartTotal,
        address: address,
        contactNumber: contactNumber,
        items: cart.map(item => ({ medicineId: item.id, quantity: item.quantity, price: item.price }))
      };
      
      if (appliedCoupon) {
        orderPayload.couponCode = appliedCoupon;
        orderPayload.discountAmount = couponDiscount;
      }
      if (usePoints) {
        orderPayload.pointsUsed = Math.round(pointsDiscount * 10);
      }

      // Send real API request to backend
      const response = await api.post('/orders', orderPayload);
      const savedOrder = response.data;

      // If prescription file exists, upload it — failure here should NOT block success
      if (prescriptionFile && savedOrder.id) {
        try {
          const formData = new FormData();
          formData.append('file', prescriptionFile);
          await api.post(`/prescriptions/upload/${savedOrder.id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (prescriptionErr) {
          console.warn("Prescription upload failed but order was placed:", prescriptionErr.message);
        }
      }

      // Clear cart and redirect to payment page
      clearCart();
      setAddress('');
      setContactNumber('');
      setPrescriptionFile(null);
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponDiscount(0);
      setUsePoints(false);
      setIsCartOpen(false);
      setIsOrdering(false);

      // Redirect to payment page with order details
      navigate('/payment', {
        state: {
          orderId: savedOrder.id,
          totalAmount: finalTotal,
          address: orderPayload.address,
          contactNumber: orderPayload.contactNumber,
        }
      });
    } catch (err) {
      console.error("Order placement error:", err);
      alert("Failed to place order: " + (err.response?.data?.message || err.message));
      setIsOrdering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">

      {!user ? (
        <div className="flex flex-col flex-grow animate-fade-in">
          {/* Premium Hero Section */}
          <section className="relative text-gray-900 pt-32 pb-24 px-6 flex items-center justify-center overflow-hidden min-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-purple-50 to-teal-50 overflow-hidden z-0">
               <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob"></div>
               <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob" style={{animationDelay: '2s'}}></div>
               <div className="absolute bottom-[-20%] left-[20%] w-[700px] h-[700px] bg-brand-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-50 animate-blob" style={{animationDelay: '4s'}}></div>
            </div>

            <div className="container mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
              <div className="lg:w-1/2 flex flex-col items-start text-left">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-white/50 text-brand-700 mb-8 font-bold text-sm tracking-wide uppercase shadow-lg shadow-brand-500/10 hover:scale-105 transition-transform duration-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                  Trust. Speed. Care.
                </div>
                <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-6 tracking-tight leading-[1.15] text-gray-900 drop-shadow-sm">
                  Modern Healthcare, <br /> <span className="text-gradient animate-pulse-glow inline-block py-2">Delivered Fast.</span>
                </h1>
                <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed font-medium max-w-xl">
                  We bring the pharmacy to your doorstep. Experience seamless, secure, and fully verified medicine delivery with our licensed pharmacists.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link to="/register" className="relative group overflow-hidden bg-brand-600 text-white font-bold py-4 px-10 rounded-full hover:bg-brand-700 transition-all shadow-xl shadow-brand-600/30 text-lg flex items-center justify-center gap-2 hover:-translate-y-1">
                    <span className="relative z-10">Get Started Today</span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  </Link>
                  <Link to="/login" className="glass border border-gray-200 text-gray-800 font-bold py-4 px-10 rounded-full hover:border-brand-500 hover:text-brand-600 hover:shadow-lg transition-all text-lg flex items-center justify-center hover:-translate-y-1">
                    Log In to Account
                  </Link>
                </div>
                <div className="mt-12 flex items-center gap-4 text-sm text-gray-500 font-medium">
                  <div className="flex -space-x-4">
                    <img className="w-12 h-12 rounded-full border-4 border-white shadow-sm hover:z-10 transition-transform hover:scale-110 duration-300" src="https://i.pravatar.cc/100?img=32" alt="user" />
                    <img className="w-12 h-12 rounded-full border-4 border-white shadow-sm hover:z-10 transition-transform hover:scale-110 duration-300" src="https://i.pravatar.cc/100?img=47" alt="user" />
                    <img className="w-12 h-12 rounded-full border-4 border-white shadow-sm hover:z-10 transition-transform hover:scale-110 duration-300" src="https://i.pravatar.cc/100?img=12" alt="user" />
                    <img className="w-12 h-12 rounded-full border-4 border-white shadow-sm hover:z-10 transition-transform hover:scale-110 duration-300" src="https://i.pravatar.cc/100?img=68" alt="user" />
                  </div>
                  <div>
                    <div className="flex text-yellow-400 text-lg">★★★★★</div>
                    <p>Trusted by <span className="text-gray-900 font-bold">10,000+</span> Customers</p>
                  </div>
                </div>
              </div>
              <div className="lg:w-1/2 relative w-full flex justify-center lg:justify-end">
                <div className="absolute inset-0 bg-brand-200 rounded-[3rem] transform rotate-3 scale-105 opacity-60 z-0 animate-pulse"></div>
                <div className="absolute inset-0 bg-teal-200 rounded-[3rem] transform -rotate-3 scale-105 opacity-40 z-0 animate-pulse" style={{animationDelay: '1s'}}></div>
                <img src="/hero-image.jpg" alt="Professional Pharmacy Delivery" className="relative z-10 w-full max-w-xl object-cover rounded-[2.5rem] shadow-2xl border-8 border-white animate-float" />
              </div>
            </div>
          </section>

          {/* Features / Benefits Section */}
          <section className="bg-gray-50 py-32 relative z-20 border-t border-gray-100">
            <div className="container mx-auto px-6">
              <div className="flex flex-col lg:flex-row items-center gap-20">
                <div className="lg:w-1/2 relative flex justify-center lg:justify-start w-full order-2 lg:order-1">
                  <div className="absolute inset-0 bg-gradient-to-tr from-accent-200 to-purple-200 rounded-[3rem] transform -rotate-3 scale-105 opacity-60 z-0"></div>
                  <img src="/features-stunning.png" alt="Fast Medicine Delivery" className="relative z-10 w-full max-w-lg object-cover rounded-[2.5rem] shadow-2xl border-8 border-white transform transition duration-700 hover:-translate-y-2" />
                </div>
                <div className="lg:w-1/2 flex flex-col items-start gap-10 order-1 lg:order-2">
                  <div>
                    <h2 className="text-sm font-bold tracking-widest text-brand-600 uppercase mb-3">Service Excellence</h2>
                    <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">Why Choose PharmaCare?</h3>
                  </div>

                  <div className="flex flex-col gap-8 w-full mt-4">
                    <div className="flex gap-6 items-start glass-card p-6 rounded-2xl">
                      <div className="w-16 h-16 rounded-2xl bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:animate-bounce">
                        <ShieldCheck size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">100% Genuine Medicines</h4>
                        <p className="text-gray-600 leading-relaxed font-medium text-lg">All our medicines are directly sourced from verified manufacturers and strictly quality checked before dispatch.</p>
                      </div>
                    </div>

                    <div className="flex gap-6 items-start glass-card p-6 rounded-2xl">
                      <div className="w-16 h-16 rounded-2xl bg-accent-100 text-accent-600 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:animate-pulse">
                        <Truck size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">Lightning Fast Delivery</h4>
                        <p className="text-gray-600 leading-relaxed font-medium text-lg">Get your essential medications delivered securely in highly resilient and insulated packaging, right when you need them.</p>
                      </div>
                    </div>

                    <div className="flex gap-6 items-start glass-card p-6 rounded-2xl">
                      <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:animate-spin">
                        <Clock size={32} />
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">24/7 Expert Support</h4>
                        <p className="text-gray-600 leading-relaxed font-medium text-lg">Our dedicated team of licensed pharmacists is always available to answer your queries and review your prescriptions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Information Section */}
          <section className="bg-white py-24 relative z-20">
            <div className="container mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-sm font-bold tracking-widest text-brand-600 uppercase mb-3">Get in Touch</h2>
                <h3 className="text-4xl md:text-5xl font-extrabold text-gray-900">We're Here to Help</h3>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto font-medium">Have questions about your prescription or need help finding a product? Our team is ready to assist you.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Contact Box 1 - Phone */}
                <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Phone size={30} className="group-hover:animate-bounce" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Call Us Anytime</h4>
                  <p className="text-gray-600 font-medium mb-4">Available 24/7 for urgent inquiries.</p>
                  <a href="tel:+91 9347189604" className="text-lg font-extrabold text-blue-600 hover:text-blue-700 hover:underline">+919347189604</a>
                </div>

                {/* Contact Box 2 - Email */}
                <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group cursor-pointer delay-100">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <Mail size={30} className="group-hover:animate-pulse" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Email Support</h4>
                  <p className="text-gray-600 font-medium mb-4">We'll respond within 2 hours.</p>
                  <a href="mailto:pharmacare@gmail.com" className="text-lg font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline">pharmacare@gmail.com</a>
                </div>

                {/* Contact Box 3 - Location */}
                <div className="glass-card p-8 rounded-3xl flex flex-col items-center text-center group cursor-pointer delay-200">
                  <div className="w-16 h-16 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300">
                    <MapPin size={30} className="group-hover:animate-bounce" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Main Pharmacy</h4>
                  <p className="text-gray-600 font-medium mb-4">Visit us for in-person consultations.</p>
                  <span className="text-lg font-extrabold text-purple-600">Near Santhiram Medical College</span>
                </div>
              </div>
            </div>
          </section>

          {/* Simple Footer */}
          <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
            <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-2">
                <Pill className="text-brand-400" size={28} />
                <span className="text-2xl font-black text-white tracking-tight">PharmaCare</span>
              </div>
              <p className="text-gray-400 font-medium text-sm text-center md:text-left">
                &copy; {new Date().getFullYear()} PharmaCare Digital. All rights reserved.
              </p>
              <div className="flex gap-6 text-sm font-medium">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <>
          {/* Search Header */}
          <section className="bg-white pt-32 pb-20 px-6 relative overflow-hidden border-b border-gray-100">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-white to-teal-50/50 z-0"></div>
            <div className="container mx-auto relative z-10">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-10 tracking-tight text-center text-gray-900 animate-slide-up">
                Find the Right Care for Your <span className="text-gradient">Condition.</span>
              </h1>
              <div className="max-w-3xl mx-auto relative animate-fade-in group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand-400/20 to-teal-400/20 rounded-full blur-xl opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative flex items-center bg-white/80 backdrop-blur-xl rounded-full p-2 border border-gray-100 shadow-2xl focus-within:ring-4 focus-within:ring-brand-200/50 transition-all duration-500">
                  <div className="pl-6 pr-4 text-brand-500 rounded-full"><Search size={28} /></div>
                  <input
                    type="text"
                    placeholder="Search by disease, medicine name, or composition..."
                    className="flex-grow bg-transparent text-gray-800 placeholder-gray-400 focus:outline-none py-4 md:text-xl w-full transition-all duration-300 font-medium"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSelectedCategory(null);
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Main Content Area */}
          <section className="relative py-24 min-h-screen overflow-hidden bg-white">
            {/* Stunning Pleasant Background Orbs */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40">
                <div className="absolute top-[10%] right-[10%] w-[600px] h-[600px] bg-brand-100 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
                <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-teal-100 rounded-full mix-blend-multiply filter blur-[100px] animate-blob" style={{animationDelay: '2s'}}></div>
                <div className="absolute top-[40%] left-[30%] w-[700px] h-[700px] bg-purple-50 rounded-full mix-blend-multiply filter blur-[120px] animate-blob" style={{animationDelay: '4s'}}></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 flex-grow">
              {!selectedCategory && !searchQuery ? (
                <div className="animate-fade-in">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 border-b border-gray-100 pb-8">
                    <div>
                      <h2 className="text-sm font-bold tracking-widest text-brand-600 uppercase mb-3">Medical Catalog</h2>
                      <h3 className="text-4xl font-extrabold text-gray-900">Browse by Health Condition</h3>
                    </div>
                    <p className="text-gray-500 font-medium mt-4 md:mt-0">Select a category to view specialized treatments</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat)}
                          className={`group relative flex flex-col items-center justify-center p-10 rounded-[2.5rem] border border-gray-100 bg-white shadow-card hover:shadow-card-hover hover:-translate-y-2 transition-all duration-500 cursor-pointer overflow-hidden`}
                        >
                          <div className={`absolute top-0 left-0 w-full h-1.5 ${cat.color.split(' ')[0].replace('text-', 'bg-')} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                          <div className={`w-20 h-20 rounded-3xl ${cat.color.split(' ')[0].replace('text-', 'bg-').replace('-600', '-50')} ${cat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
                            <Icon size={40} className="group-hover:animate-pulse" />
                          </div>
                          <h3 className="font-bold text-xl text-gray-900 text-center group-hover:text-brand-600 transition-colors">{cat.name}</h3>
                          <div className="flex items-center gap-2 text-sm font-bold text-brand-600 mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                            Explore <ArrowRight size={16} />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
              <div className="animate-fade-in">
                <div className="flex justify-between items-center mb-8 border-b pb-4">
                  <div className="flex items-center gap-4">
                    {selectedCategory && (
                      <button onClick={() => setSelectedCategory(null)} className="p-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <h2 className="text-3xl font-bold text-gray-900">
                      {selectedCategory ? `${selectedCategory.name} Relief` : `Search Results for "${searchQuery}"`}
                    </h2>
                  </div>
                </div>

                {displayedMedicines.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-xl text-gray-500 font-medium">No medicines found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" style={{gridAutoRows: '1fr'}}>
                    {displayedMedicines.map((medicine) => {
                      // Category-specific gradient + icon — always unique, never broken
                      const categoryStyle = {
                        'Fever & Pain':           { bg: 'from-red-400 to-orange-500',    emoji: '🌡️', label: 'Fever & Pain' },
                        'Cold & Cough':           { bg: 'from-blue-400 to-cyan-500',     emoji: '🤧', label: 'Cold & Cough' },
                        'Stomach Care':           { bg: 'from-yellow-400 to-amber-500',  emoji: '💊', label: 'Stomach Care' },
                        'Heart Health':           { bg: 'from-rose-500 to-pink-600',     emoji: '❤️', label: 'Heart Health' },
                        'Vitamins & Supplements': { bg: 'from-emerald-400 to-teal-500',  emoji: '💪', label: 'Vitamins' },
                        'Skin Care':              { bg: 'from-purple-400 to-pink-500',   emoji: '✨', label: 'Skin Care' },
                        'Antibiotics':            { bg: 'from-indigo-500 to-blue-600',   emoji: '🔬', label: 'Antibiotics' },
                        'Diabetes Care':          { bg: 'from-orange-400 to-red-500',    emoji: '🩸', label: 'Diabetes Care' },
                        'Ayurvedic':              { bg: 'from-green-500 to-emerald-600', emoji: '🌿', label: 'Ayurvedic' },
                        'First Aid':              { bg: 'from-red-500 to-rose-600',      emoji: '🩹', label: 'First Aid' },
                        'Baby Care':              { bg: 'from-pink-300 to-rose-400',     emoji: '👶', label: 'Baby Care' },
                        'Healthcare Devices':     { bg: 'from-slate-500 to-gray-600',    emoji: '🩺', label: 'Devices' },
                        'Health Packages':        { bg: 'from-teal-500 to-cyan-600',     emoji: '🏥', label: 'Health Packages' },
                      };
                      const style = categoryStyle[medicine.category?.name] || { bg: 'from-brand-500 to-teal-500', emoji: '💊', label: 'Medicine' };
                      const cartItem = cart.find(i => i.id === medicine.id);

                      return (
                        <div key={medicine.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col group overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300">

                          {/* Image — strictly 300px, flex-shrink-0 prevents any resize */}
                          <div className="relative overflow-hidden flex-shrink-0" style={{height: '400px', minHeight: '400px', maxHeight: '400px'}}>
                            {medicine.imageUrl ? (
                              <img
                                src={`http://localhost:8081${medicine.imageUrl}`}
                                alt={medicine.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.classList.add(`bg-gradient-to-br`, ...style.bg.split(' '));
                                  e.target.parentElement.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center"><span class="text-5xl">${style.emoji}</span></div>`;
                                }}
                              />
                            ) : (
                              <div className={`absolute inset-0 bg-gradient-to-br ${style.bg} flex flex-col items-center justify-center`}>
                                <span className="text-5xl mb-1">{style.emoji}</span>
                                <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{style.label}</span>
                              </div>
                            )}
                            {medicine.requiresPrescription && (
                              <span className="absolute top-2 right-2 text-[10px] font-extrabold text-white bg-red-500 px-2 py-0.5 rounded-md flex items-center gap-1 shadow z-10">
                                <Pill size={10} /> Rx
                              </span>
                            )}
                          </div>

                          {/* Body — fixed height, flex layout keeps price+button always at bottom */}
                          <div className="p-4 flex flex-col flex-1" style={{minHeight: '150px'}}>
                            <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-brand-600 transition-colors">
                              {medicine.name}
                              {medicine.dosage && <span className="text-sm text-gray-400 font-normal ml-1">({medicine.dosage})</span>}
                            </h3>
                            {medicine.packaging && (
                              <p className="text-xs text-gray-400 mt-0.5">📦 {medicine.packaging}</p>
                            )}
                            <p className="text-gray-500 text-sm mt-2 leading-relaxed line-clamp-2 flex-grow">
                              {medicine.description}
                            </p>
                            <div className="flex justify-between items-center pt-3 border-t border-gray-100 mt-3">
                              <span className="text-2xl font-extrabold text-gray-900">₹{medicine.price.toFixed(2)}</span>
                              {cartItem ? (
                                <div className="flex items-center gap-1 bg-brand-50 rounded-xl p-1">
                                  <button type="button" onClick={(e) => { e.stopPropagation(); updateQuantity(medicine.id, -1); }} className="w-7 h-7 rounded-lg bg-white shadow-sm hover:bg-red-50 hover:text-red-600 flex items-center justify-center font-bold text-gray-700 transition-colors">−</button>
                                  <span className="w-7 text-center font-extrabold text-brand-700 text-sm">{cartItem.quantity}</span>
                                  <button type="button" onClick={(e) => { e.stopPropagation(); updateQuantity(medicine.id, 1); }} className="w-7 h-7 rounded-lg bg-brand-600 text-white shadow-sm hover:bg-brand-700 flex items-center justify-center font-bold transition-colors">+</button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); addToCart(medicine); }}
                                  className="bg-brand-50 hover:bg-brand-600 text-brand-700 hover:text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-sm"
                                >
                                  <Plus size={15} /> Add
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
          </section>
        </>
      )}

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 right-8 bg-brand-600 text-white p-4 rounded-full shadow-2xl hover:bg-brand-700 transition-transform scale-100 hover:scale-110 z-40 flex items-center justify-center animate-bounce"
        >
          <ShoppingCart size={28} />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
            {cart.reduce((total, item) => total + item.quantity, 0)}
          </span>
        </button>
      )}

      {/* Shopping Cart Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end backdrop-blur-sm" onClick={(e) => { if(e.target === e.currentTarget) { setIsCartOpen(false); setOrderStatus(null); }}}>
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col">

            {/* Header */}
            <div className="px-5 py-4 border-b flex justify-between items-center bg-white flex-shrink-0">
              <h2 className="text-xl font-extrabold flex items-center gap-2 text-gray-900">
                <ShoppingCart className="text-brand-600" size={22} />
                Your Cart
                {cart.length > 0 && <span className="ml-1 text-sm font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">{cartTotalItems} items</span>}
              </h2>
              <button onClick={() => { setIsCartOpen(false); setOrderStatus(null); }} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {orderStatus === 'success' ? (
              <div className="flex-grow flex flex-col items-center justify-center p-8 text-center animate-fade-in">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-5">
                  <CheckCircle size={44} className="text-green-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Order Placed!</h3>
                <p className="text-gray-500">Your medicines will be delivered soon.</p>
                <button onClick={() => { setIsCartOpen(false); setOrderStatus(null); }} className="mt-8 bg-brand-600 text-white font-bold py-3 px-8 rounded-full hover:bg-brand-700 transition-all">Continue Shopping</button>
              </div>
            ) : (
              <>
                {/* ── ITEMS SECTION (scrollable, fixed height ~40% of drawer) ── */}
                <div className="flex-shrink-0 bg-gray-50 border-b" style={{maxHeight: '40%'}}>
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <ShoppingCart size={40} className="text-gray-200 mb-3" />
                      <p className="text-gray-400 font-medium text-sm">Your cart is empty</p>
                    </div>
                  ) : (
                    <div className="overflow-y-auto h-full p-3 space-y-2">
                      {cart.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
                          {/* Icon */}
                          <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                            <Pill size={16} className="text-brand-500" />
                          </div>
                          {/* Name + Rx badge */}
                          <div className="flex-grow min-w-0">
                            <p className="font-bold text-gray-900 text-sm leading-tight">{item.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">₹{item.price.toFixed(2)} each</p>
                            {item.requiresPrescription && (
                              <span className="text-[9px] font-bold text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded mt-0.5 inline-block">Rx</span>
                            )}
                          </div>
                          {/* Qty controls */}
                          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-1 py-0.5 flex-shrink-0">
                            <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 rounded-md bg-white shadow-sm hover:bg-red-50 hover:text-red-600 flex items-center justify-center font-bold text-gray-600 transition-colors text-sm">−</button>
                            <span className="w-6 text-center font-extrabold text-gray-900 text-sm">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 rounded-md bg-brand-600 text-white hover:bg-brand-700 flex items-center justify-center font-bold transition-colors text-sm">+</button>
                          </div>
                          {/* Total */}
                          <span className="font-extrabold text-brand-600 text-sm w-16 text-right flex-shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                          {/* Remove */}
                          <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ── CHECKOUT SECTION (scrollable) ── */}
                {cart.length > 0 && (
                  <div className="flex-grow overflow-y-auto">
                    <div className="p-4 space-y-3">

                      {/* Coupon */}
                      <div className="bg-white border border-gray-100 rounded-xl p-3">
                        <label className="text-xs font-bold text-gray-600 flex items-center gap-1 mb-2 uppercase tracking-wide"><Tag size={13}/> Coupon Code</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={e => setCouponCode(e.target.value.toUpperCase())}
                            disabled={appliedCoupon !== null}
                            placeholder="ENTER CODE"
                            className="flex-grow border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-400"
                          />
                          {appliedCoupon ? (
                            <button onClick={removeCoupon} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg font-bold text-xs border border-red-200 hover:bg-red-100 whitespace-nowrap">Remove</button>
                          ) : (
                            <button onClick={handleValidateCoupon} className="bg-gray-900 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-700 whitespace-nowrap">Apply</button>
                          )}
                        </div>
                        {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
                        {appliedCoupon && <p className="text-green-600 text-xs font-bold mt-1">✓ {appliedCoupon} applied — -₹{couponDiscount.toFixed(2)}</p>}
                      </div>

                      {/* Loyalty Points */}
                      {availablePoints > 0 && (
                        <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Coins size={16} className="text-amber-600" />
                            <div>
                              <p className="font-bold text-sm text-amber-900">Loyalty Points</p>
                              <p className="text-xs text-amber-700">Balance: {availablePoints} pts (10 pts = ₹1)</p>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} className="w-4 h-4 accent-amber-500 rounded" />
                            <span className="text-sm font-bold text-amber-800">Use</span>
                          </label>                        </div>
                      )}

                      {/* Shipping Address */}
                      <div className="bg-white border border-gray-100 rounded-xl p-3">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Shipping Address</label>
                        <textarea
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 resize-none"
                          placeholder="Enter your full home address"
                          rows="2"
                        />
                      </div>

                      {/* Contact Number */}
                      <div className="bg-white border border-gray-100 rounded-xl p-3">
                        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2 block">Contact Number</label>
                        <input
                          type="text"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
                          placeholder="+91 9876543210"
                        />
                      </div>

                      {/* Prescription Upload */}
                      {hasPrescriptionItems && (
                        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                          <div className="flex gap-2 text-orange-800 text-xs mb-2">
                            <span>⚠️</span>
                            <p><strong>Prescription Required</strong> — upload a valid prescription image.</p>
                          </div>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setPrescriptionFile(e.target.files[0])}
                            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-orange-100 file:text-orange-700 hover:file:bg-orange-200"
                          />
                          {prescriptionFile && <p className="text-green-600 text-xs mt-1 font-medium">✓ {prescriptionFile.name}</p>}
                        </div>
                      )}

                      {/* Price Summary */}
                      <div className="bg-white border border-gray-100 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal ({cartTotalItems} items)</span>
                          <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                        {appliedCoupon && (
                          <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>Coupon ({appliedCoupon})</span>
                            <span>-₹{couponDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        {usePoints && pointsDiscount > 0 && (
                          <div className="flex justify-between text-sm text-amber-600 font-medium">
                            <span>Points ({Math.round(pointsDiscount * 10)} pts)</span>
                            <span>-₹{pointsDiscount.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                          <span className="font-extrabold text-gray-900">Total</span>
                          <span className="text-2xl font-extrabold text-brand-600">₹{finalTotal.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── CHECKOUT BUTTON (always visible at bottom) ── */}
                {cart.length > 0 && (
                  <div className="p-4 border-t bg-white flex-shrink-0">
                    <button
                      onClick={handlePlaceOrder}
                      disabled={isOrdering}
                      className="w-full bg-brand-600 text-white font-extrabold py-4 rounded-2xl hover:bg-brand-700 transition-all shadow-lg shadow-brand-500/20 flex justify-center items-center gap-2 text-base"
                    >
                      {isOrdering
                        ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                        : <>Proceed to Payment · ₹{finalTotal.toFixed(2)}</>
                      }
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
