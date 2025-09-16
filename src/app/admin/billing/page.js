'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import Products from '@/app/Componenets/Products';

const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';

export default function BillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [cart, setCart] = useState([]);
  const [billNumber, setBillNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Fetch order if redirected from order list
  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        const orderRef = doc(
          db,
          `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`,
          orderId
        );
        const orderSnap = await getDoc(orderRef);
        if (orderSnap.exists()) {
          const data = orderSnap.data();
          setCart(data.items || []);
          setBillNumber(data.billNumber || '');
          setSelectedCustomer({
            name: data.name || '',
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            city: data.city || '',
            zip: data.zip || ''
          });
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  // Handle customer selection or creation
  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
  };

  // Generate or update bill
  const handleGenerateBill = async () => {
    let newBillNumber = billNumber;
    if (!billNumber) {
      newBillNumber = 'BILL-' + Date.now();
      setBillNumber(newBillNumber);
    }
    const orderData = {
      ...selectedCustomer,
      items: cart,
      billNumber: newBillNumber,
      billPaid: false,
      createdAt: new Date(),
    };
    if (orderId) {
      await updateDoc(
        doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`, orderId),
        orderData
      );
    } else {
      await addDoc(
        collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`),
        orderData
      );
      // Optionally create user in Firestore if new
      if (!selectedCustomer) {
        await setDoc(
          doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`, selectedCustomer.phone),
          selectedCustomer
        );
      }
    }
    // TODO: Generate PDF here
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto p-4 sm:p-8">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Admin POS / Billing</h1>
        {/* Customer Selection */}
        <div className="mb-6 bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4 items-center">
          {/* Replace with a real UserSelector component */}
          <div className="flex-1">
            <label className="block font-medium mb-1">Select or Add Customer</label>
            <input
              type="text"
              placeholder="Search or add customer by name/phone"
              className="w-full border border-gray-200 rounded px-3 py-2"
              // onChange={...}
            />
            {/* Show selected customer details if any */}
            {selectedCustomer && (
              <div className="mt-2 text-sm text-gray-700">
                <div><b>Name:</b> {selectedCustomer.name}</div>
                <div><b>Phone:</b> {selectedCustomer.phone}</div>
                <div><b>Email:</b> {selectedCustomer.email}</div>
              </div>
            )}
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded shadow"
            // onClick={...}
          >
            Add New Customer
          </button>
        </div>

        {/* POS Cart Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Products List */}
          <div className="md:col-span-2 bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">Select Services / Products</h2>
            <Products cart={cart} setCart={setCart} />
          </div>
          {/* Cart Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold mb-4 text-blue-600">Cart</h2>
            {cart.length === 0 ? (
              <div className="text-gray-500">No items in cart</div>
            ) : (
              <ul className="mb-4">
                {cart.map((item, idx) => (
                  <li key={idx} className="flex justify-between items-center py-2 border-b">
                    <span>{item.name} x{item.quantity}</span>
                    <span>₹{(Number(item.price) * Number(item.quantity)).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="font-bold text-lg text-right mb-4">
              Total: ₹{cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0).toFixed(2)}
            </div>
            <button
              className="w-full bg-green-600 text-white py-2 rounded font-semibold"
              onClick={handleGenerateBill}
              disabled={!selectedCustomer || cart.length === 0}
            >
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}