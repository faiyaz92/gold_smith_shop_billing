'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Truck, CreditCard, Check, Search, ShoppingBag } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { db } from '@/app/firebase';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useFirestorePaths } from '@/app/utils/firestorePaths';

const PICKUP_TIMES = [
  { value: 'morning', label: 'Morning (9-12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12-5 PM)' },
  { value: 'evening', label: 'Evening (5-8 PM)' },
];

const DELIVERY_PREFS = [
  { value: 'standard', label: 'Standard Delivery' },
  { value: 'express', label: 'Express Delivery (+KWD 5)' },
];

const SERVICE_TYPES = [
  { value: 'delivery', label: 'Home Delivery', icon: '🚚' },
  { value: 'pickup', label: 'Store Pickup', icon: '🏪' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart, cartCount } = useCart();
  const { getOrdersPath, getCouponsPath, getStatesPath, getAreasPath, getBranchesPath } = useFirestorePaths();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});

  // Form data
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zip: ''
  });

  // Location selection
  const [states, setStates] = useState([]);
  const [areas, setAreas] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  // Service options
  const [serviceType, setServiceType] = useState('delivery');
  const [pickupTime, setPickupTime] = useState('morning');
  const [deliveryPref, setDeliveryPref] = useState('standard');

  // Coupon
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const expressFee = deliveryPref === 'express' ? 5 : 0;
  const discount = appliedCoupon ? calculateDiscount(appliedCoupon, subtotal + expressFee) : 0;
  const total = subtotal + expressFee - discount;

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setForm(prev => ({
          ...prev,
          name: user.displayName || '',
          email: user.email || ''
        }));
      }
    });

    fetchLocationData();

    return () => unsubscribe();
  }, []);

  const fetchLocationData = async () => {
    try {
      const [statesSnap, areasSnap, branchesSnap] = await Promise.all([
        getDocs(collection(db, getStatesPath())),
        getDocs(collection(db, getAreasPath())),
        getDocs(collection(db, getBranchesPath()))
      ]);

      setStates(statesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(s => s.isActive));
      setAreas(areasSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(a => a.isActive));
      setBranches(branchesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(b => b.isActive));
    } catch (error) {
      console.error('Error fetching location data:', error);
    }
  };

  const calculateDiscount = (coupon, amount) => {
    let discount = 0;
    switch (coupon.type) {
      case 'percentage':
        discount = (amount * coupon.value) / 100;
        if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
          discount = coupon.maximumDiscount;
        }
        break;
      case 'fixed':
        discount = Math.min(coupon.value, amount);
        break;
      case 'free_delivery':
        discount = expressFee;
        break;
    }
    return Math.min(discount, amount);
  };

  // Validation functions
  const validateStep1 = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name is required';
    if (!form.email.trim()) errors.email = 'Email address is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = 'Please enter a valid email address';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(form.phone.replace(/\s/g, ''))) errors.phone = 'Please enter a valid phone number';

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    if (!selectedState) errors.state = 'Please select a state';
    if (!selectedArea) errors.area = 'Please select an area';
    if (!selectedBranch) errors.branch = 'Please select a branch';

    if (serviceType === 'delivery') {
      if (!form.address.trim()) errors.address = 'Delivery address is required';
      if (!form.city.trim()) errors.city = 'City is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    // Step 3 validation - ensure all previous steps are valid
    return validateStep1() && validateStep2();
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setValidationErrors({ coupon: 'Please enter a coupon code' });
      return;
    }

    try {
      setValidationErrors({}); // Clear previous errors
      const couponQuery = query(
        collection(db, getCouponsPath()),
        where('code', '==', couponCode.toUpperCase())
      );
      const couponSnap = await getDocs(couponQuery);

      if (!couponSnap.empty) {
        const coupon = { id: couponSnap.docs[0].id, ...couponSnap.docs[0].data() };
        setAppliedCoupon(coupon);
        setValidationErrors({ coupon: 'Coupon applied successfully!' });
      } else {
        setValidationErrors({ coupon: 'Invalid coupon code' });
        setAppliedCoupon(null);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setValidationErrors({ coupon: 'Error applying coupon. Please try again.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      setValidationErrors({ general: 'Your cart is empty' });
      return;
    }

    if (!validateStep3()) {
      setValidationErrors({ general: 'Please complete all required fields before placing your order' });
      return;
    }

    setLoading(true);
    setValidationErrors({}); // Clear any previous errors

    try {
      const orderData = {
        customerId: user?.uid || null,
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: selectedState,
        zip: form.zip,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          categoryName: item.categoryName || ''
        })),
        subtotal,
        expressDeliveryFee: expressFee,
        discountAmount: discount,
        finalTotal: total,
        appliedCoupon,
        status: 'Pending',
        branchId: selectedBranch,
        serviceType,
        pickupTime,
        deliveryPref,
        timestamp: serverTimestamp(),
        orderTakenBy: null // Will be set by admin
      };

      await addDoc(collection(db, getOrdersPath()), orderData);
      clearCart();

      // Redirect to success page or show success message
      router.push('/order-success');

    } catch (error) {
      console.error('Error placing order:', error);
      setValidationErrors({ general: 'Error placing order. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    setValidationErrors({}); // Clear previous errors

    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <Link
            href="/products"
            className="bg-rose-600 text-white px-6 py-3 rounded-lg hover:bg-rose-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-rose-600">
                Luxe Perfumes
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-rose-600 transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-gray-700 hover:text-rose-600 transition-colors">
                Shop
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-rose-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-rose-600 transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-500 cursor-pointer hover:text-rose-600 transition-colors" />
              </div>
              <Link href="/cart" className="relative">
                <ShoppingBag className="w-6 h-6 text-gray-700 hover:text-rose-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/auth" className="text-gray-700 hover:text-rose-600 transition-colors">
                Account
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center text-rose-600 hover:text-rose-700 mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Cart
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= step
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-rose-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* General Error Display */}
        {validationErrors.general && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{validationErrors.general}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Checkout Form */}
          <div className="space-y-6">
            {/* Step 1: Customer Information */}
            {currentStep === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Customer Information</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.name && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={nextStep}
                  className="w-full bg-rose-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-rose-700 transition-colors mt-6"
                >
                  Continue to Delivery
                </button>
              </motion.div>
            )}

            {/* Step 2: Delivery Information */}
            {currentStep === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Delivery Information</h2>

                <div className="space-y-4">
                  {/* Service Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Type *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {SERVICE_TYPES.map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setServiceType(type.value)}
                          className={`p-3 border rounded-lg text-center transition-colors ${
                            serviceType === type.value
                              ? 'border-rose-500 bg-rose-50 text-rose-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <span className="text-2xl mb-1 block">{type.icon}</span>
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setSelectedArea('');
                        setSelectedBranch('');
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.state ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select State</option>
                      {states.map(state => (
                        <option key={state.id} value={state.name}>{state.name}</option>
                      ))}
                    </select>
                    {validationErrors.state && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.state}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area *
                    </label>
                    <select
                      value={selectedArea}
                      onChange={(e) => {
                        setSelectedArea(e.target.value);
                        setSelectedBranch('');
                      }}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.area ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select Area</option>
                      {areas
                        .filter(area => area.stateId === states.find(s => s.name === selectedState)?.id)
                        .map(area => (
                          <option key={area.id} value={area.name}>{area.name}</option>
                        ))}
                    </select>
                    {validationErrors.area && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.area}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch/Store *
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.branch ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                    {validationErrors.branch && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.branch}</p>
                    )}
                  </div>

                  {/* Delivery Options */}
                  {serviceType === 'delivery' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delivery Preference
                        </label>
                        <select
                          value={deliveryPref}
                          onChange={(e) => setDeliveryPref(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                        >
                          {DELIVERY_PREFS.map(pref => (
                            <option key={pref.value} value={pref.value}>{pref.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address *
                        </label>
                        <textarea
                          value={form.address}
                          onChange={(e) => setForm({...form, address: e.target.value})}
                          rows={3}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none ${
                            validationErrors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your full address"
                          required
                        />
                        {validationErrors.address && (
                          <p className="text-red-500 text-sm mt-1">{validationErrors.address}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City *
                          </label>
                          <input
                            type="text"
                            value={form.city}
                            onChange={(e) => setForm({...form, city: e.target.value})}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                              validationErrors.city ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Enter your city"
                            required
                          />
                          {validationErrors.city && (
                            <p className="text-red-500 text-sm mt-1">{validationErrors.city}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            ZIP Code
                          </label>
                          <input
                            type="text"
                            value={form.zip}
                            onChange={(e) => setForm({...form, zip: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Pickup Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preferred Time
                    </label>
                    <select
                      value={pickupTime}
                      onChange={(e) => setPickupTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                    >
                      {PICKUP_TIMES.map(time => (
                        <option key={time.value} value={time.value}>{time.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={nextStep}
                    className="flex-1 bg-rose-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-rose-700 transition-colors"
                  >
                    Continue to Payment
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Payment & Review */}
            {currentStep === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow-sm p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment & Review</h2>

                {/* Coupon */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coupon Code (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent ${
                        validationErrors.coupon && validationErrors.coupon !== 'Coupon applied successfully!' ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {validationErrors.coupon && (
                    <p className={`text-sm mt-1 ${
                      validationErrors.coupon === 'Coupon applied successfully!' ? 'text-green-600' : 'text-red-500'
                    }`}>
                      {validationErrors.coupon}
                    </p>
                  )}
                </div>

                {/* Payment Method */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Method</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-4 border border-gray-300 rounded-lg bg-gray-50">
                      <CreditCard className="w-6 h-6 text-gray-600 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">Cash on Delivery</p>
                        <p className="text-sm text-gray-600">Pay when you receive your order</p>
                      </div>
                      <div className="ml-auto">
                        <div className="w-4 h-4 bg-rose-600 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={prevStep}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-rose-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>

              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      KWD {(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="text-gray-900">KWD {subtotal.toFixed(2)}</span>
                </div>

                {expressFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Express Delivery</span>
                    <span className="text-gray-900">KWD {expressFee.toFixed(2)}</span>
                  </div>
                )}

                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-KWD {discount.toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span>KWD {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}