'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/app/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, setDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { motion } from 'framer-motion';
import Navbar from '@/app/Componenets/Navbar';
import { User, Shield, MapPin, Globe, Building, Tag, X, Check } from 'lucide-react';
import { useTranslation } from '@/app/utils/useTranslation';

export const PICKUP_TIMES = [
  { value: 'morning', label: 'Morning (9-12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12-5 PM)' },
  { value: 'evening', label: 'Evening (5-8 PM)' },
];

export const DELIVERY_PREFS = [
  { value: 'standard', label: 'Standard' },
  { value: 'express', label: 'Express (+KWD5)' },
];

export const SERVICE_TYPES = [
  { value: 'delivery', label: 'Delivery', icon: '🚚' },
  { value: 'pickup', label: 'Pickup', icon: '🏪' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const method = searchParams.get('method') || 'cod';

  // Define Firestore paths
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'abc_pvt_ltd';
  const basePath = 'Easy2Solutions/companyDirectory/tenantCompanies';
  const tenantUsersPath = `${basePath}/${companyId}/users`;
  const tenantOrdersPath = `${basePath}/${companyId}/orders`;
  const statesPath = `${basePath}/${companyId}/states`;
  const areasPath = `${basePath}/${companyId}/areas`;
  const clustersPath = `${basePath}/${companyId}/clusters`;
  const branchesPath = `${basePath}/${companyId}/branches`;
  const couponsPath = `${basePath}/${companyId}/coupons`;

  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    zip: '',
    address: ''
  });
  const [schedule, setSchedule] = useState({
    pickupTime: 'morning',
    deliveryPref: 'standard',
    serviceType: 'delivery',
  });

  // Location selection state
  const [selectedState, setSelectedState] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedBranchName, setSelectedBranchName] = useState('');

  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Data arrays
  const [states, setStates] = useState([]);
  const [areas, setAreas] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const expressDeliveryFee = schedule.deliveryPref === 'express' ? 5 : 0;
  const orderTotal = subtotal + expressDeliveryFee;

  // Calculate discount
  const calculateDiscount = (coupon, orderAmount) => {
    if (!coupon) return 0;

    let discount = 0;
    
    switch (coupon.type) {
      case 'percentage':
        discount = (orderAmount * coupon.value) / 100;
        if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
          discount = coupon.maximumDiscount;
        }
        break;
      case 'fixed':
        discount = Math.min(coupon.value, orderAmount);
        break;
      case 'free_delivery':
        discount = expressDeliveryFee; // Only discount the express delivery fee
        break;
      case 'bogo':
        // For BOGO, calculate based on lowest price items
        discount = calculateBogoDiscount();
        break;
      default:
        discount = 0;
    }

    return Math.min(discount, orderAmount); // Never exceed order amount
  };

  const calculateBogoDiscount = () => {
    // Simple BOGO: Get 50% off on the lowest priced items
    const sortedItems = [...cart].sort((a, b) => a.price - b.price);
    let discount = 0;
    
    for (let i = 0; i < sortedItems.length; i += 2) {
      if (sortedItems[i + 1]) {
        // If there's a pair, give 50% off the cheaper item
        discount += (sortedItems[i].price * sortedItems[i].quantity) * 0.5;
      }
    }
    
    return discount;
  };

  const discountAmount = calculateDiscount(appliedCoupon, orderTotal);
  const finalTotal = orderTotal - discountAmount;

  // Fetch location data
  useEffect(() => {
    const fetchLocationData = () => {
      // Fetch states
      const unsubStates = onSnapshot(collection(db, statesPath), (snapshot) => {
        const statesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          isActive: doc.data().isActive
        })).filter(state => state.isActive);
        setStates(statesData);
      });

      // Fetch areas
      const unsubAreas = onSnapshot(collection(db, areasPath), (snapshot) => {
        const areasData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          stateId: doc.data().stateId,
          isActive: doc.data().isActive
        })).filter(area => area.isActive);
        setAreas(areasData);
      });

      // Fetch clusters
      const unsubClusters = onSnapshot(collection(db, clustersPath), (snapshot) => {
        const clustersData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          areaIds: doc.data().areaIds || [],
          branchId: doc.data().branchId,
          isActive: doc.data().isActive
        })).filter(cluster => cluster.isActive);
        setClusters(clustersData);
      });

      // Fetch branches
      const unsubBranches = onSnapshot(collection(db, branchesPath), (snapshot) => {
        const branchesData = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
          isActive: doc.data().isActive
        })).filter(branch => branch.isActive);
        setBranches(branchesData);
      });

      return () => {
        unsubStates();
        unsubAreas();
        unsubClusters();
        unsubBranches();
      };
    };

    return fetchLocationData();
  }, []);

  // Coupon validation and application
  const validateCoupon = async (code) => {
    try {
      const couponsQuery = query(
        collection(db, couponsPath),
        where('code', '==', code.toUpperCase())
      );
      
      const couponSnapshot = await getDocs(couponsQuery);
      
      if (couponSnapshot.empty) {
        throw new Error('Invalid coupon code');
      }

      const couponDoc = couponSnapshot.docs[0];
      const coupon = {
        id: couponDoc.id,
        ...couponDoc.data(),
        validFrom: couponDoc.data().validFrom?.toDate(),
        validUntil: couponDoc.data().validUntil?.toDate(),
      };

      // Validation checks
      const now = new Date();
      
      // Check if coupon is active
      if (!coupon.isActive) {
        throw new Error('This coupon is no longer active');
      }

      // Check date validity
      if (coupon.validFrom && coupon.validFrom > now) {
        throw new Error('This coupon is not yet valid');
      }
      
      if (coupon.validUntil && coupon.validUntil < now) {
        throw new Error('This coupon has expired');
      }

      // Check minimum order value
      if (coupon.minimumOrderValue && orderTotal < coupon.minimumOrderValue) {
        throw new Error(`Minimum order value of KWD ${coupon.minimumOrderValue} required`);
      }

      // Check usage limits
      if (coupon.totalUsageLimit && coupon.usedCount >= coupon.totalUsageLimit) {
        throw new Error('Coupon usage limit reached');
      }

      // For registered users, check per-user limit
      if (coupon.usageLimit === 'once_per_user' && isAuthenticated && user) {
        // Check if user has already used this coupon
        const userOrdersQuery = query(
          collection(db, tenantOrdersPath),
          where('userId', '==', user.uid),
          where('appliedCoupon.id', '==', coupon.id)
        );
        
        const userOrdersSnapshot = await getDocs(userOrdersQuery);
        if (!userOrdersSnapshot.empty) {
          throw new Error('You have already used this coupon');
        }
      }

      return coupon;
    } catch (error) {
      throw error;
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const validCoupon = await validateCoupon(couponCode);
      setAppliedCoupon(validCoupon);
      setCouponCode('');
      setCouponError('');
    } catch (error) {
      setCouponError(error.message);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Get areas for selected state
  const getAreasForState = (stateId) => {
    return areas.filter(area => area.stateId === stateId);
  };

  // Get branch for selected area
  const getBranchForArea = (areaId) => {
    const cluster = clusters.find(cluster => 
      cluster.areaIds && cluster.areaIds.includes(areaId)
    );
    
    if (cluster) {
      const branch = branches.find(branch => branch.id === cluster.branchId);
      return branch;
    }
    
    return null;
  };

  // Handle state selection
  const handleStateChange = (stateId) => {
    setSelectedState(stateId);
    setSelectedArea('');
    setSelectedBranchId('');
    setSelectedBranchName('');
  };

  // Handle area selection
  const handleAreaChange = (areaId) => {
    setSelectedArea(areaId);
    
    const branch = getBranchForArea(areaId);
    if (branch) {
      setSelectedBranchId(branch.id);
      setSelectedBranchName(branch.name);
    } else {
      setSelectedBranchId('');
      setSelectedBranchName('');
    }
  };

  // Check authentication status and load data
  useEffect(() => {
    const auth = getAuth();
    
    const isAuthenticatedUser = localStorage.getItem('isAuthenticatedUser') === 'true';
    const userInfo = localStorage.getItem('checkoutUserInfo');
    
    setIsAuthenticated(isAuthenticatedUser);
    setIsGuest(!isAuthenticatedUser);

    if (isAuthenticatedUser && userInfo) {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          
          try {
            const userRef = doc(db, `${tenantUsersPath}/${currentUser.uid}`);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              setForm({
                name: userData.name || currentUser.displayName || '',
                email: userData.email || currentUser.email || '',
                phone: userData.phone || '',
                city: userData.city || '',
                zip: userData.zip || '',
                address: userData.address || ''
              });
            } else {
              setForm({
                name: currentUser.displayName || '',
                email: currentUser.email || '',
                phone: currentUser.phoneNumber || '',
                city: '',
                zip: '',
                address: ''
              });
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }
      });

      return () => unsubscribe();
    }
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('checkoutCart')) || [];
    setCart(savedCart);
    
    if (savedCart.length === 0) {
      router.push('/');
    }
  }, [router]);

  // Handle input change for address form
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle schedule change
  const handleScheduleChange = (e) => {
    setSchedule({ ...schedule, [e.target.name]: e.target.value });
  };

  // Save address to Firestore
  const saveAddress = async () => {
    if (!form.name || !form.phone || !form.city || !form.zip || !form.email || !form.address) {
      alert('Please fill all delivery details');
      return false;
    }

    if (!selectedState || !selectedArea) {
      alert('Please select your state and area');
      return false;
    }

    if (!selectedBranchId) {
      alert('No service branch available for selected area. Please contact support.');
      return false;
    }

    if (isAuthenticated && user) {
      try {
        const userRef = doc(db, `${tenantUsersPath}/${user.uid}`);
        const updates = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          zip: form.zip,
          address: form.address,
          stateId: selectedState,
          areaId: selectedArea,
          userType: 'Customer',
          updatedAt: serverTimestamp()
        };

        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          await updateDoc(userRef, updates);
        } else {
          await setDoc(userRef, {
            ...updates,
            createdAt: serverTimestamp()
          });
        }
        return true;
      } catch (error) {
        console.error('Error saving address:', error);
        alert('Error saving address');
        return false;
      }
    }
    
    return true;
  };

  // Place order with coupon information
  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.city || !form.zip || !form.email || !form.address) {
      alert('Please fill all delivery details');
      return;
    }

    if (!selectedState || !selectedArea) {
      alert('Please select your state and area');
      return;
    }

    if (!selectedBranchId) {
      alert('No service branch available for selected area. Please contact support.');
      return;
    }

    setLoading(true);
    try {
      const saved = await saveAddress();
      if (!saved) {
        setLoading(false);
        return;
      }

      const guestUserId = isGuest ? `GUEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` : user.uid;

      const orderData = {
        userId: guestUserId,
        items: cart,
        
        // Pricing details
        subtotal: subtotal,
        expressDeliveryFee: expressDeliveryFee,
        orderTotal: orderTotal,
        discountAmount: discountAmount,
        finalTotal: finalTotal,
        
        // Coupon information
        appliedCoupon: appliedCoupon ? {
          id: appliedCoupon.id,
          code: appliedCoupon.code,
          name: appliedCoupon.name,
          type: appliedCoupon.type,
          value: appliedCoupon.value,
          discountApplied: discountAmount
        } : null,
        
        // Customer details
        name: form.name,
        email: form.email,
        phone: form.phone,
        city: form.city,
        zip: form.zip,
        address: form.address,
        
        // Location data
        stateId: selectedState,
        areaId: selectedArea,
        branchId: selectedBranchId,
        branchName: selectedBranchName,
        
        // Payment and service details
        paymentMethod: method === 'cod' ? 'COD' : 'razorpay',
        paymentStatus: method === 'cod' ? 'pending' : 'completed',
        status: 'Pending',
        timestamp: serverTimestamp(),
        pickupTime: schedule.pickupTime,
        deliveryPref: schedule.deliveryPref,
        serviceType: schedule.serviceType,
        deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        
        // Order tracking fields
        isGuestOrder: isGuest,
        orderSource: 'Website',
        customerType: isGuest ? 'Guest' : 'Registered',
        adminCallRequired: true,
        adminCallStatus: 'pending',
        orderConfirmed: false,
        
        // Laundry status tracking
        laundryStatus: {
          pickupManVerified: false,
          customerPickupVerified: false,
          receivedAtFacility: false,
          sortingDone: false,
          washingDone: false,
          dryingDone: false,
          ironingDone: false,
          foldingDone: false,
          qualityCheckDone: false,
          deliveryManDone: false,
          customerDeliveryConfirmed: false,
        }
      };

      // Create guest user record if needed
      if (isGuest) {
        const guestUserData = {
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          zip: form.zip,
          address: form.address,
          stateId: selectedState,
          areaId: selectedArea,
          userType: 'Guest',
          isGuestUser: true,
          createdAt: serverTimestamp(),
          createdFrom: 'Website Checkout'
        };

        await setDoc(doc(db, tenantUsersPath, guestUserId), guestUserData);
      }

      // Create the order
      await addDoc(collection(db, tenantOrdersPath), orderData);

      // Update coupon usage count if coupon was applied
      if (appliedCoupon) {
        const couponRef = doc(db, couponsPath, appliedCoupon.id);
        await updateDoc(couponRef, {
          usedCount: (appliedCoupon.usedCount || 0) + 1,
          lastUsed: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Clear localStorage
      localStorage.removeItem('checkoutCart');
      localStorage.removeItem('isAuthenticatedUser');
      localStorage.removeItem('checkoutUserInfo');

      // Show success message and redirect
      alert(isGuest 
        ? 'Order placed successfully! Our admin will call you to confirm the order details.' 
        : 'Order placed successfully!'
      );
      
      if (isGuest) {
        router.push('/');
      } else {
        router.push('/User/Account/');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order. Please try again.');
    }
    setLoading(false);
  };

  // Group items by category
  const groupItemsByCategory = (items) => {
    return items.reduce((acc, item) => {
      const category = item.categoryName || item.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {});
  };

  const grouped = groupItemsByCategory(cart);
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-blue-700">{t('checkout')}</h1>
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-100">
            {isGuest ? (
              <>
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">{t('guestCheckout')}</span>
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">{t('registeredUser')}</span>
              </>
            )}
          </div>
        </div>

        {/* Guest user notice */}
        {isGuest && (
          <motion.div
            className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <User className="w-5 h-5 text-blue-600" />
              <h3 className="font-medium text-blue-800">{t('guestCheckout')}</h3>
            </div>
            <p className="text-blue-700 text-sm">
              {t('guestNotice')}
              <button 
                onClick={() => router.push('/User/Auth/')}
                className="text-blue-600 hover:text-blue-800 underline ml-1"
              >
                {t('createAccountPrompt')}
              </button>
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left column: Location, Delivery Details, then Schedule */}
          <div className="flex flex-col gap-8">
            {/* Location Selection */}
            <motion.div
              className="bg-white p-6 rounded-lg shadow-md border border-blue-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-lg font-semibold mb-4 text-blue-800 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {t('serviceLocation')}
              </h2>
              <div className="space-y-4">
                {/* State Selection */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    {t('selectState')}
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">{t('chooseState')}</option>
                    {states.map(state => (
                      <option key={state.id} value={state.id}>
                        {state.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Area Selection */}
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    {t('selectArea')}
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!selectedState}
                    required
                  >
                    <option value="">
                      {selectedState ? t('chooseArea') : t('selectStateFirst')}
                    </option>
                    {selectedState && getAreasForState(selectedState).map(area => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Branch Display */}
                {selectedBranchId && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <Building className="w-4 h-4" />
                      <span className="text-sm font-medium">{t('serviceBranch')}</span>
                      <span className="text-sm">{selectedBranchName}</span>
                    </div>
                  </div>
                )}

                {selectedArea && !selectedBranchId && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-700">
                      <Building className="w-4 h-4" />
                      <span className="text-sm">{t('noBranch')}</span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-6 rounded-lg shadow-md border border-blue-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-lg font-semibold mb-4 text-blue-800">{t('deliveryDetails')}</h2>
              <div className="space-y-4">
                <input
                  name="name"
                  placeholder={t('fullName')}
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder={t('emailAddress')}
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="phone"
                  placeholder={t('phoneNumber')}
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="city"
                  placeholder={t('city')}
                  value={form.city}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <input
                  name="zip"
                  placeholder={t('zipCode')}
                  value={form.zip}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <textarea
                  name="address"
                  placeholder={t('completeAddress')}
                  value={form.address}
                  onChange={handleChange}
                  className="w-full border border-blue-200 p-3 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              className="bg-white p-6 rounded-lg shadow-md border border-blue-100"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h2 className="text-lg font-semibold mb-4 text-blue-800">{t('serviceOptions')}</h2>
              
              <div className="mb-6">
                <div className="font-medium mb-3 text-blue-700">{t('serviceType')}</div>
                <div className="grid grid-cols-2 gap-3">
                  {SERVICE_TYPES.map(opt => (
                    <label 
                      key={opt.value} 
                      className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        schedule.serviceType === opt.value 
                          ? 'border-blue-500 bg-blue-50 text-blue-700' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="serviceType"
                        value={opt.value}
                        checked={schedule.serviceType === opt.value}
                        onChange={handleScheduleChange}
                        className="sr-only"
                      />
                      <span className="text-lg">{opt.icon}</span>
                      <span className="font-medium">{t(opt.label)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="font-medium mb-2 text-blue-700">{t('pickupTime')}</div>
                <div className="space-y-2">
                  {PICKUP_TIMES.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="pickupTime"
                        value={opt.value}
                        checked={schedule.pickupTime === opt.value}
                        onChange={handleScheduleChange}
                        className="accent-blue-600"
                      />
                      <span className="text-sm">{t(opt.label)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-medium mb-2 text-blue-700">{t('deliveryPref')}</div>
                <div className="space-y-2">
                  {DELIVERY_PREFS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="deliveryPref"
                        value={opt.value}
                        checked={schedule.deliveryPref === opt.value}
                        onChange={handleScheduleChange}
                        className="accent-blue-600"
                      />
                      <span className="text-sm">{t(opt.label)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right column: Order Summary */}
          <motion.div
            className="bg-white p-6 rounded-lg shadow-md border border-blue-100 flex flex-col"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-lg font-semibold mb-4 text-blue-800">{t('orderSummary')}</h2>
            
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4">
              {cart.length === 0 ? (
                <p className="text-gray-500">{t('yourCartIsEmpty')}</p>
              ) : (
                Object.entries(grouped).map(([catName, items]) => (
                  <div key={catName} className="mb-4 border rounded-lg border-blue-200 bg-blue-50">
                    <div className="px-4 py-2 font-semibold text-blue-700 border-b border-blue-200">{catName}</div>
                    <div className="p-4 space-y-2">
                      {items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>{item.name} x{item.quantity}</span>
                          <span>{t('currency')} {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Coupon Section */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                {t('promoCode')}
              </h3>
              
              {!appliedCoupon ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder={t('enterCoupon')}
                      className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-200"
                      disabled={couponLoading}
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode.trim()}
                      className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {couponLoading ? t('checking') : t('apply')}
                    </button>
                  </div>
                  {couponError && (
                    <p className="text-xs text-red-600">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">{appliedCoupon.code}</span>
                    <span className="text-xs text-green-600">({appliedCoupon.name})</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-green-600 hover:text-green-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-blue-100 pt-4">
              <div className="flex justify-between mb-2 text-blue-900">
                <span>{t('subtotal')}</span>
                <span>{t('currency')} {subtotal.toFixed(2)}</span>
              </div>
              {expressDeliveryFee > 0 && (
                <div className="flex justify-between mb-2 text-blue-700">
                  <span>{t('expressDelivery')}</span>
                  <span>{t('currency')} {expressDeliveryFee.toFixed(2)}</span>
                </div>
              )}
              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>{t('discount')} ({appliedCoupon.code})</span>
                  <span>-{t('currency')} {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between mb-2 text-blue-500 text-sm">
                <span>{t('shipping')}</span>
                <span>{t('free')}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg text-blue-700 border-t pt-2">
                <span>{t('total')}</span>
                <span>{t('currency')} {finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              whileHover={{ scale: 1.02 }}
              disabled={cart.length === 0 || loading || !selectedBranchId}
              onClick={placeOrder}
              className="w-full py-3 mt-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
            >
              {loading ? t('placingOrder') : 
                isGuest ? 
                  t('placeOrderGuest') : 
                  t('placeOrder')
              }
            </motion.button>
            
            {isGuest && (
              <p className="text-xs text-center text-gray-500 mt-2">
                {t('adminWillCall')}
              </p>
            )}
            
            {!selectedBranchId && selectedArea && (
              <p className="text-xs text-center text-red-500 mt-2">
                {t('selectValidArea')}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}