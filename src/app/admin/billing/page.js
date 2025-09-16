'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import Products from '@/app/Componenets/Products';
import { db } from '@/app/firebase';
import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import jsPDF from 'jspdf';

const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'laundry_q8';

// Custom debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function BillingPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingPage />
    </Suspense>
  );
}

function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [cart, setCart] = useState([]);
  const [billNumber, setBillNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isPaid, setIsPaid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [newOrderId, setNewOrderId] = useState(null);

  const debouncedSearchTerm = useDebounce(customerSearch, 500);

  // Fetch order if redirected from order list
  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        setLoading(true);
        try {
          const orderRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders/${orderId}`);
          const orderSnap = await getDoc(orderRef);
          if (orderSnap.exists()) {
            const data = orderSnap.data();
            setCart(data.items || []);
            setBillNumber(data.billNumber || '');
            setIsPaid(data.paymentStatus === 'paid');
            setSelectedCustomer({
              userId: data.userId || '',
              name: data.name || '',
              phone: data.phone || '',
              email: data.email || '',
              address: data.address || '',
              city: data.city || '',
              zip: data.zip || ''
            });
          } else {
            setError('Order not found');
          }
        } catch (err) {
          console.error('Error fetching order:', err);
          setError(`Error fetching order: ${err.message} (Code: ${err.code})`);
        }
        setLoading(false);
      };
      fetchOrder();
    }
  }, [orderId]);

  // Handle customer search and suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedSearchTerm.length >= 3) {
        setLoading(true);
        setError(null);
        try {
          const usersRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`);
          const q = query(
            usersRef,
            where('phone', '>=', debouncedSearchTerm),
            where('phone', '<=', debouncedSearchTerm + '\uf8ff')
          );
          const querySnapshot = await getDocs(q);
          const suggestionsList = querySnapshot.docs.map((doc) => ({
            userId: doc.id,
            phone: doc.data().phone,
            name: doc.data().name || '',
            email: doc.data().email || '',
            address: doc.data().address || '',
            city: doc.data().city || '',
            zip: doc.data().zip || ''
          }));
          setSuggestions(suggestionsList);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
          setError(`Error fetching suggestions: ${err.message} (Code: ${err.code})`);
        }
        setLoading(false);
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [debouncedSearchTerm]);

  // Handle customer selection from suggestions
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch(customer.phone);
    setSuggestions([]);
  };

  // Handle customer search (exact match when clicking Search button)
  const handleCustomerSearch = async () => {
    if (!customerSearch) {
      setError('Please enter a phone number');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const usersRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`);
      const q = query(usersRef, where('phone', '==', customerSearch));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const customerData = querySnapshot.docs[0].data();
        setSelectedCustomer({
          userId: querySnapshot.docs[0].id,
          name: customerData.name || '',
          phone: customerData.phone || '',
          email: customerData.email || '',
          address: customerData.address || '',
          city: customerData.city || '',
          zip: customerData.zip || ''
        });
      } else {
        setSelectedCustomer({
          userId: '',
          phone: customerSearch,
          name: '',
          email: '',
          address: '',
          city: '',
          zip: ''
        });
      }
      setSuggestions([]);
    } catch (err) {
      console.error('Error searching customer:', err);
      setError(`Error searching customer: ${err.message} (Code: ${err.code})`);
    }
    setLoading(false);
  };

  // Handle customer details change
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setSelectedCustomer((prev) => ({ ...prev, [name]: value }));
  };

  // Add to cart
  const addToCart = (name, price) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.name === name);
      let newCart;
      if (existingItem) {
        newCart = prevCart.map((item) =>
          item.name === name ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newCart = [...prevCart, { name, price, quantity: 1 }];
      }
      console.log('New cart state:', newCart);
      return newCart;
    });
  };

  // Remove from cart
  const removeFromCart = (name) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.name === name);
      if (existingItem && existingItem.quantity > 1) {
        return prevCart.map((item) =>
          item.name === name ? { ...item, quantity: item.quantity - 1 } : item
        );
      }
      return prevCart.filter((item) => item.name !== name);
    });
  };

  // Generate PDF using jsPDF
  const generatePDF = () => {
    const customer = selectedCustomer || {};
    const total = cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2);
    const date = new Date().toLocaleDateString();
    const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();
    const finalBillNumber = billNumber || 'BILL-' + Date.now();

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('EASY2 Solutions', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.text('INVOICE', 105, 35, { align: 'center' });

    // Bill info
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Bill Number: ${finalBillNumber}`, 20, 50);
    doc.text(`Issued on: ${date}`, 20, 60);
    doc.text(`Estimated Delivery: ${deliveryDate}`, 20, 70);

    // Customer Details
    doc.setFont(undefined, 'bold');
    doc.text('Customer Details:', 20, 90);
    doc.setFont(undefined, 'normal');
    doc.text(`Name: ${customer.name || 'N/A'}`, 20, 100);
    doc.text(`Phone: ${customer.phone || 'N/A'}`, 20, 110);
    doc.text(`Email: ${customer.email || 'N/A'}`, 20, 120);
    doc.text(`Address: ${customer.address || 'N/A'}, ${customer.city || 'N/A'}, ${customer.zip || 'N/A'}`, 20, 130);

    // Items Table
    doc.setFont(undefined, 'bold');
    doc.text('Order Items:', 20, 150);

    let yPosition = 160;
    doc.setFont(undefined, 'normal');

    // Table headers
    doc.setFillColor(230, 230, 230);
    doc.rect(20, yPosition, 170, 8, 'F');
    doc.setFont(undefined, 'bold');
    doc.text('Item', 25, yPosition + 5);
    doc.text('Qty', 100, yPosition + 5);
    doc.text('Price (₹)', 140, yPosition + 5);
    yPosition += 10;

    // Items
    doc.setFont(undefined, 'normal');
    cart.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const itemText = item.name;
      const qtyText = item.quantity.toString();
      const priceText = `₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}`;

      const splitName = doc.splitTextToSize(itemText, 70);
      doc.text(splitName, 25, yPosition);
      doc.text(qtyText, 100, yPosition);
      doc.text(priceText, 140, yPosition);

      yPosition += 8;
    });

    // Total
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 5;

    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text(`Total: ₹${total}`, 140, yPosition);

    // Payment Status
    yPosition += 15;
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Payment Status: ${isPaid ? 'Paid' : 'Unpaid'}`, 20, yPosition);

    // Footer
    doc.setFontSize(10);
    doc.text('Thank you for your business!', 105, 290, { align: 'center' });

    return doc;
  };

  // Download PDF and clear cart
  const handleDownloadPDF = () => {
    const pdf = generatePDF();
    const finalBillNumber = billNumber || 'BILL-' + Date.now();
    pdf.save(`invoice_${finalBillNumber}.pdf`);
    setCart([]);
    setShowSuccessDialog(false);
    if (newOrderId) {
      router.push(`/admin/orders?orderId=${newOrderId}`);
    } else {
      router.push('/admin/orders');
    }
  };

  // Generate or update bill
  const handleGenerateBill = async () => {
    if (!selectedCustomer || cart.length === 0) {
      setError('Please select a customer and add items to cart');
      return;
    }
    if (!selectedCustomer.name || !selectedCustomer.phone) {
      setError('Customer name and phone are required');
      return;
    }

    setLoading(true);
    setError(null);
    let newBillNumber = billNumber;
    if (!billNumber) {
      newBillNumber = 'BILL-' + Date.now();
      setBillNumber(newBillNumber);
    }

    const orderData = {
      userId: selectedCustomer.userId || selectedCustomer.phone,
      name: selectedCustomer.name,
      email: selectedCustomer.email || '',
      phone: selectedCustomer.phone,
      address: selectedCustomer.address || '',
      city: selectedCustomer.city || '',
      zip: selectedCustomer.zip || '',
      items: cart,
      total: cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0),
      billNumber: newBillNumber,
      paymentStatus: isPaid ? 'paid' : 'unpaid',
      status: 'Pending',
      timestamp: serverTimestamp(),
      deliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
    };

    try {
      console.log('Order data:', orderData);
      const userId = selectedCustomer.userId || selectedCustomer.phone;
      const userRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`, userId);
      await setDoc(userRef, {
        name: selectedCustomer.name,
        email: selectedCustomer.email || '',
        phone: selectedCustomer.phone,
        address: selectedCustomer.address || '',
        city: selectedCustomer.city || '',
        zip: selectedCustomer.zip || ''
      }, { merge: true });
      console.log('User document saved/updated for ID:', userId);

      let finalOrderId = orderId;
      if (orderId) {
        const orderRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders/${orderId}`);
        await updateDoc(orderRef, orderData);
        console.log('Order updated:', orderId);
      } else {
        const orderRef = await addDoc(
          collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`),
          orderData
        );
        finalOrderId = orderRef.id;
        setNewOrderId(finalOrderId);
        console.log('Order created:', finalOrderId);
      }

      setShowSuccessDialog(true);
    } catch (err) {
      console.error('Error generating bill:', err);
      setError(`Error generating bill: ${err.message} (Code: ${err.code})`);
    } finally {
      setLoading(false);
    }
  };

  // Handle dialog close without downloading
  const handleDialogClose = () => {
    setShowSuccessDialog(false);
    setCart([]);
    if (newOrderId) {
      router.push(`/admin/orders?orderId=${newOrderId}`);
    } else {
      router.push('/admin/orders');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-6 text-blue-700">Admin POS / Billing</h1>
        {error && <div className="mb-4 text-red-500 text-sm sm:text-base">{error}</div>}
        {loading && <div className="mb-4 text-blue-500 text-sm sm:text-base">Loading...</div>}

        {/* Customer Selection */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">Customer Details</h2>
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1 relative">
              <label className="block text-sm font-medium mb-1">Search by Phone</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Enter phone number"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm sm:text-base"
                />
                <button
                  onClick={handleCustomerSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 text-sm sm:text-base"
                  disabled={loading}
                >
                  Search
                </button>
              </div>
              {suggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded-lg mt-1 w-full max-h-60 overflow-y-auto shadow-lg">
                  {suggestions.map((suggestion, index) => (
                    <li
                      key={index}
                      className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm sm:text-base"
                      onClick={() => handleSelectCustomer(suggestion)}
                    >
                      <span>{suggestion.phone}</span>
                      <span className="text-gray-500">{suggestion.name || 'Unknown'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {selectedCustomer && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  name="name"
                  value={selectedCustomer.name}
                  onChange={handleCustomerChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  value={selectedCustomer.email}
                  onChange={handleCustomerChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  name="phone"
                  value={selectedCustomer.phone}
                  onChange={handleCustomerChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm sm:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  name="city"
                  value={selectedCustomer.city}
                  onChange={handleCustomerChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ZIP</label>
                <input
                  name="zip"
                  value={selectedCustomer.zip}
                  onChange={handleCustomerChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm sm:text-base"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  name="address"
                  value={selectedCustomer.address}
                  onChange={handleCustomerChange}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm sm:text-base"
                  rows="3"
                />
              </div>
            </div>
          )}
        </div>

        {/* POS Cart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">Select Services / Products</h2>
            <Products
              cart={cart}
              addToCart={addToCart}
              removeFromCart={removeFromCart}
              onActiveCategoryChange={() => {}}
              searchQuery=""
            />
          </div>
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 text-blue-600">Cart Summary</h2>
            {cart.length === 0 ? (
              <div className="text-gray-500 text-sm sm:text-base">No items in cart</div>
            ) : (
              <ul className="mb-4 space-y-2">
                {cart.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center py-2 border-b text-sm sm:text-base">
                    <span>{item.name} x {item.quantity}</span>
                    <span>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="font-bold text-lg text-right mb-4">
              Total: ₹{cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)}
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm sm:text-base">
                <input
                  type="checkbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="form-checkbox"
                />
                <span>Mark as Paid Now</span>
              </label>
            </div>
            <button
              className="w-full bg-green-600 text-white py-2 rounded shadow hover:bg-green-700 disabled:opacity-50 text-sm sm:text-base"
              onClick={handleGenerateBill}
              disabled={!selectedCustomer || cart.length === 0 || loading}
            >
              {orderId ? 'Update Bill' : 'Generate Bill'}
            </button>
          </div>
        </div>

        {/* Success Dialog */}
        {showSuccessDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {orderId ? 'Bill Updated Successfully!' : 'Order Placed Successfully!'}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Order ID: {newOrderId || orderId}
                </p>
                <p className="text-sm text-gray-700 mb-6">
                  Would you like to download the bill?
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDownloadPDF}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Yes
                  </button>
                  <button
                    onClick={handleDialogClose}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-sm font-medium"
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}