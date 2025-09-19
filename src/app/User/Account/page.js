'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { auth, db } from '@/app/firebase';
import { doc, collection, query, where, updateDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Navbar from '@/app/Componenets/Navbar';
import MobileNav from '@/app/Componenets/MobileNav';
const statusColors = {
  Pending: 'bg-orange-100 text-orange-800',
  Confirmed: 'bg-yellow-100 text-yellow-800',
  'Scheduled for Pickup': 'bg-blue-100 text-blue-800',
  'Out for Pickup': 'bg-blue-200 text-blue-900',
  'Picked Up': 'bg-blue-300 text-blue-900',
  'Received at Facility': 'bg-purple-100 text-purple-800',
  'In Sorting/Inspection': 'bg-purple-200 text-purple-800',
  'In Washing': 'bg-teal-100 text-teal-800',
  'In Drying': 'bg-teal-200 text-teal-800',
  'In Ironing/Pressing': 'bg-teal-300 text-teal-800',
  'In Folding/Packaging': 'bg-teal-400 text-teal-800',
  'Quality Check': 'bg-indigo-100 text-indigo-800',
  'Ready for Delivery': 'bg-indigo-200 text-indigo-800',
  'Out for Delivery': 'bg-indigo-300 text-indigo-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
  'Refunded/Returned': 'bg-red-200 text-red-800',
  'On Hold': 'bg-gray-100 text-gray-800',
};
const Page = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState('');
  const [activeTab, setActiveTab] = useState('account');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    zip: '',
    address: ''
  });
  const [error, setError] = useState(null);
  const [expandedTrails, setExpandedTrails] = useState({});

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'abc_pvt_ltd';
  const tenantUsersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`;
  const tenantOrdersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`;

  // Define status progression for progress trail
  const statusProgression = [
    'Pending',
    'Confirmed',
    'Scheduled for Pickup',
    'Out for Pickup',
    'Picked Up',
    'Received at Facility',
    'In Sorting/Inspection',
    'In Washing',
    'In Drying',
    'In Ironing/Pressing',
    'In Folding/Packaging',
    'Quality Check',
    'Ready for Delivery',
    'Out for Delivery',
    'Delivered'
  ];

  useEffect(() => {
    if (!auth || !db) {
      console.error('Firebase not initialized: auth or db is null');
      setError('Firebase not initialized. Check your configuration.');
      setLoading(false);
      return;
    }

    console.log('Setting up auth listener...');
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        console.log('No user logged in, redirecting to /User/Auth');
        router.push('/User/Auth');
        return;
      }

      try {
        console.log(`Fetching user data for UID: ${currentUser.uid}`);
        const userRef = doc(db, `${tenantUsersPath}/${currentUser.uid}`);
        const unsubscribeUser = onSnapshot(userRef, (userDoc) => {
          if (userDoc.exists()) {
            console.log('User data snapshot received:', userDoc.data());
            const userData = userDoc.data();
            const formattedUser = {
              uid: userDoc.id,
              name: userData.name || currentUser.displayName || 'User',
              email: userData.email || currentUser.email || '',
              phone: userData.phone || currentUser.phoneNumber || '',
              city: userData.city || '',
              zip: userData.zip || '',
              address: userData.address || '',
              photoURL: userData.photoURL || currentUser.photoURL || null
            };
            setUser(formattedUser);
            setFormData({
              name: formattedUser.name,
              email: formattedUser.email,
              phone: formattedUser.phone,
              city: formattedUser.city,
              zip: formattedUser.zip,
              address: formattedUser.address
            });
            console.log('User state updated:', formattedUser);
          } else {
            console.warn('User document does not exist for UID:', currentUser.uid);
            setError('User data not found in Firestore');
          }
        }, (err) => {
          console.error('User snapshot error:', err);
          setError(`Error fetching user data: ${err.message}`);
        });

        console.log(`Fetching orders for user UID: ${currentUser.uid}`);
        const ordersRef = collection(db, tenantOrdersPath);
        const q = query(ordersRef, where('userId', '==', currentUser.uid));
        const unsubscribeOrders = onSnapshot(q, (querySnapshot) => {
          console.log('Orders snapshot received, doc count:', querySnapshot.size);
          const userOrders = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            const items = (data.items || []).map(item => ({
              ...item,
              price: Number(item.price || 0),
              quantity: Number(item.quantity || 1)
            }));

            return {
              id: doc.id,
              ...data,
              items,
              total: Number(data.total || 0),
              date: data.timestamp?.toDate() || new Date(),
              estimatedDelivery: data.deliveryDate?.toDate() || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              status: data.status || 'Pending',
              paymentMethod: data.paymentMethod || 'COD',
              city: data.city || '',
              zip: data.zip || '',
              email: data.email || '',
              paymentStatus: data.paymentStatus || 'Paid',
              paymentId: data.paymentId || '',
              laundryStatus: data.laundryStatus || {
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
              },
            };
          });

          userOrders.sort((a, b) => b.date - a.date);
          const sortedOrders = userOrders.map((order, index, array) => ({
            ...order,
            srNo: array.length - index
          }));
          setOrders(sortedOrders);
          console.log('Orders state updated:', sortedOrders);
          setLoading(false);
        }, (err) => {
          console.error('Orders snapshot error:', err);
          setError(`Error fetching orders: ${err.message}`);
          setLoading(false);
        });

        return () => {
          console.log('Cleaning up listeners for user and orders');
          unsubscribeUser();
          unsubscribeOrders();
        };
      } catch (err) {
        console.error('Auth setup error:', err);
        setError(`Authentication error: ${err.message}`);
        setLoading(false);
      }
    }, (err) => {
      console.error('Auth state error:', err);
      setError(`Auth state error: ${err.message}`);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up auth listener');
      unsubscribeAuth();
    };
  }, [router]); // Only depend on router to prevent re-running unnecessarily

  const handleLogout = async () => {
    try {
      console.log('Attempting to sign out...');
      await signOut(auth);
      console.log('Sign out successful, redirecting to /');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      setError(`Error signing out: ${error.message}`);
    }
  };

  const handleEditClick = useCallback((mode) => {
    console.log('Opening edit modal for mode:', mode);
    setEditMode(mode);
    setShowEditModal(true);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      console.warn('No user data available for submit');
      setError('No user data available');
      return;
    }

    try {
      console.log('Submitting updates for user:', user.uid);
      const userRef = doc(db, `${tenantUsersPath}/${user.uid}`);
      const updates = {};

      if (editMode === 'info') {
        updates.name = formData.name;
        updates.email = formData.email;
        updates.phone = formData.phone;
      } else {
        updates.city = formData.city;
        updates.zip = formData.zip;
        updates.address = formData.address;
        updates.phone = formData.phone;
      }

      console.log('Firestore updates:', updates);
      await updateDoc(userRef, updates);

      setUser(prev => ({
        ...prev,
        ...updates
      }));
      console.log('User state updated after submit:', { ...user, ...updates });

      setShowEditModal(false);
      setError(null);
    } catch (error) {
      console.error('Update error:', error);
      setError(`Error updating user data: ${error.message}`);
    }
  };

  const formatDate = useCallback((date) => {
    return date instanceof Date
      ? date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      : 'Invalid Date';
  }, []);

  const formatDateTime = useCallback((date) => {
    return date instanceof Date
      ? date.toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Invalid Date';
  }, []);

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    // Normalize: trim and lowercase
    const normalized = status.trim().toLowerCase();
    // Find the first key in statusColors that matches normalized
    const foundKey = Object.keys(statusColors).find(
      key => key.trim().toLowerCase() === normalized
    );
    return foundKey ? statusColors[foundKey] : 'bg-gray-100 text-gray-800';
  };

  const groupItemsByCategory = useCallback((items) => {
    const groups = {};
    (items || []).forEach(item => {
      const catName = item.categoryName || 'Other';
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(item);
    });
    return groups;
  }, []);

  const renderProgressTrail = useCallback((status, collapsed = true) => {
    const currentIndex = statusProgression.indexOf(status);

    if (status === 'Cancelled') {
      return (
        <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-red-100 text-red-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <span className="text-xs mt-1 text-center w-20 sm:w-24">Cancelled</span>
          </div>
        </div>
      );
    }

    // If collapsed, only show the current step
    if (collapsed) {
      const step = statusProgression[currentIndex] || status;
      return (
        <div className="flex flex-wrap gap-1 sm:gap-2 mt-4 justify-center sm:justify-start">
          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(step)}`}>
                {currentIndex + 1}
              </div>
              <span className="text-xs mt-1 text-center w-20 sm:w-24">{step}</span>
            </div>
          </div>
        </div>
      );
    }

    // Expanded: show full trail
    return (
      <div className="flex flex-wrap gap-1 sm:gap-2 mt-4 justify-center sm:justify-start">
        {statusProgression.map((step, index) => {
          const isCompleted = index < currentIndex || (index === currentIndex && status === 'Delivered');
          const isCurrent = index === currentIndex;
          const isTerminated = status === 'Refunded/Returned' || status === 'On Hold';
          if (isTerminated && index > currentIndex) return null;

          return (
            <div key={step} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium ${
                    isCompleted ? 'bg-green-100 text-green-800' :
                    isCurrent ? getStatusColor(step) : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : index + 1}
                </div>
                <span className="text-[10px] sm:text-xs mt-1 text-center w-16 sm:w-24">{step}</span>
              </div>
              {index < statusProgression.length - 1 && !isTerminated && (
                <div className={`h-1 w-4 sm:w-8 mt-2 sm:mt-3 ${isCompleted ? 'bg-green-100' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  }, [getStatusColor, statusProgression]);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 bg-white">
        <div className="text-red-600 text-center">
          <p>Error: {error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 bg-white">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="bg-white border border-blue-200 rounded-lg p-4 sm:p-6 transition-all duration-300 hover:border-blue-300">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-blue-200">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-blue-600">{user.name || 'User'}</h2>
                <p className="text-gray-600">{user.email || 'No email'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-blue-600 mb-2">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="text-gray-800">{user.name || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-gray-800">{user.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-gray-800">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditClick('info')}
                  className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  Edit Information
                </button>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="font-medium text-blue-600 mb-2">Default Shipping Address</h3>
                {user.address ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Address</p>
                      <p className="text-gray-800">{user.address}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">City</p>
                      <p className="text-gray-800">{user.city}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">ZIP Code</p>
                      <p className="text-gray-800">{user.zip}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="text-gray-800">{user.phone || 'Not provided'}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">No shipping address saved</p>
                )}
                <button
                  onClick={() => handleEditClick('address')}
                  className="mt-3 text-blue-600 hover:text-blue-500 text-sm font-medium flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  {user.address ? 'Edit Address' : 'Add Address'}
                </button>
              </div>
            </div>
          </div>
        );

      case 'orders':
        return (
          <div className="p-4 sm:p-6 bg-white">
            <h2 className="text-xl font-bold mb-6 text-blue-600">All Orders</h2>
            {orders.length === 0 ? (
              <div className="bg-white border border-blue-200 rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No orders yet</h3>
                <p className="mt-1 text-gray-500">You haven&apos;t placed any orders yet.</p>
                <Link href="/Shop" className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Start Shopping
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-4 sm:p-6 mb-6 rounded-xl border border-blue-200 transition-all duration-300 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                    <div>
                      <h4 className="font-medium text-blue-600">Order #{order.srNo}</h4>
                      <p className="text-sm text-gray-600">Placed on {formatDateTime(order.date)}</p>
                    </div>
                    <div className="mt-2 sm:mt-0 flex flex-col items-end">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      <button
                        className="text-xs text-blue-600 underline mt-1"
                        onClick={() => toggleTrail(order.id)}
                        type="button"
                      >
                        {expandedTrails[order.id] ? 'Collapse Progress' : 'Show Full Progress'}
                      </button>
                    </div>
                  </div>

                  {renderProgressTrail(order.status, !expandedTrails[order.id])}

                  <div className="mb-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Estimated Delivery:</span> {formatDate(order.estimatedDelivery)}
                    </p>
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600">Order Total:</span> ₹{order.total.toFixed(2)}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(groupItemsByCategory(order.items)).map(([catName, items]) => {
                      const catImage = items[0]?.categoryImage || null;
                      return (
                        <div key={catName} className="mb-4 border rounded-lg border-blue-200 bg-blue-50">
                          <div className="flex items-center gap-3 px-4 py-2 border-b border-blue-200">
                            {catImage ? (
                              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-white border border-blue-200">
                                <img src={catImage} alt={catName} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                </svg>
                              </div>
                            )}
                            <span className="font-semibold text-blue-700">{catName}</span>
                          </div>
                          <div className="p-4 space-y-2">
                            {items.map((item, index) => (
                              <div key={`${item.name}-${index}`} className="flex items-start gap-4">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                  {item.image ? (
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-8 w-8 text-gray-400"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={1.5}
                                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <h5 className="font-medium text-blue-600">{item.name}</h5>
                                  <p className="text-sm text-gray-600">
                                    Quantity: {item.quantity}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Price: ₹{item.price.toFixed(2)}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium text-blue-600">
                                    ₹{(item.price * item.quantity).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-blue-600 mb-2">Shipping Information</h5>
                        <p className="text-gray-600">{order.city || 'Not provided'}, {order.zip || 'Not provided'}</p>
                        <p className="text-gray-600">{order.email || 'Not provided'}</p>
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-600 mb-2">Payment Details</h5>
                        <p className="text-gray-600">Method: {order.paymentMethod || 'COD'}</p>
                        <p className="text-gray-600">Status: {order.paymentStatus || 'Paid'}</p>
                        {order.paymentId && (
                          <p className="text-gray-600">ID: {order.paymentId}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        );

      case 'address':
        return (
          <div className="bg-white border border-blue-200 rounded-lg p-4 sm:p-6 transition-all duration-300 hover:border-blue-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-blue-600">My Addresses</h2>
              <button
                onClick={() => handleEditClick('address')}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-all duration-200 hover:scale-[1.02]"
              >
                Add New Address
              </button>
            </div>

            {user.address ? (
              <div className="border border-blue-200 rounded-lg p-4 sm:p-6 relative group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-blue-600 mb-2">Default Shipping Address</h3>
                    <p className="text-gray-800 mb-1">{user.name || 'Not provided'}</p>
                    <p className="text-gray-800 mb-1">{user.address}</p>
                    <p className="text-gray-800 mb-1">{user.city}, {user.zip}</p>
                    <p className="text-gray-800">Phone: {user.phone || 'Not provided'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick('address')}
                      className="text-blue-600 hover:text-blue-500"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 006 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No saved addresses</h3>
                <p className="mt-1 text-sm text-gray-500">Add your first shipping address.</p>
                <div className="mt-6">
                  <button
                    onClick={() => handleEditClick('address')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Add Address
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'wishlist':
        return (
          <div className="bg-white border border-blue-200 rounded-lg p-4 sm:p-6 transition-all duration-300 hover:border-blue-300">
            <h2 className="text-xl font-semibold text-blue-600 mb-6">My Wishlist</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Your wishlist is empty</h3>
              <p className="mt-1 text-sm text-gray-500">Save your favorite items here</p>
              <div className="mt-6">
                <Link href="/Shop" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const toggleTrail = (orderId) => {
    setExpandedTrails(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  return (
    <>
      <Navbar />
      <MobileNav />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 mt-14 sm:mt-8 md:mt-12 lg:mt-16 bg-white">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-6 sm:mb-8 text-blue-600">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 sm:gap-8">
          <div className="md:col-span-1 bg-white border border-blue-200 rounded-lg p-4 sm:p-6 h-fit transition-all duration-300 hover:border-blue-300">
            <div className="space-y-4">
              {['account', 'orders', 'address', 'wishlist'].map((tab) => (
                <div
                  key={tab}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    activeTab === tab ? 'bg-blue-600/20 border border-blue-600/50' : 'hover:bg-blue-50 hover:border-blue-300'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  <h3 className="font-medium flex items-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      {tab === 'account' && (
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      )}
                      {tab === 'orders' && (
                        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                      )}
                      {tab === 'address' && (
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      )}
                      {tab === 'wishlist' && (
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      )}
                    </svg>
                    {tab.toUpperCase()}
                  </h3>
                </div>
              ))}
              <div
                className="p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-red-50 hover:border-red-300 border border-transparent"
                onClick={handleLogout}
              >
                <h3 className="font-medium flex items-center text-red-600 hover:text-red-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  Log Out
                </h3>
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            {renderContent()}
          </div>
        </div>
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-blue-200 rounded-lg p-6 w-full max-w-md animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-600">
                {editMode === 'info' ? 'Edit Personal Information' : 'Edit Shipping Address'}
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {editMode === 'info' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                      rows="3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ZIP Code</label>
                      <input
                        type="text"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-[1.02]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Page;
