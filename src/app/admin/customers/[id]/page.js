'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, DollarSign, ShoppingCart, CreditCard, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function CustomerViewPage() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchCustomerData();
    }
  }, [params.id]);

  const fetchCustomerData = async () => {
    try {
      // Fetch customer details
      const customerDoc = await getDoc(doc(db, 'customers', params.id));
      if (customerDoc.exists()) {
        setCustomer({ id: customerDoc.id, ...customerDoc.data() });
      }

      // Fetch customer orders
      const ordersQuery = query(
        collection(db, 'orders'),
        where('customerId', '==', params.id),
        orderBy('createdAt', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);

      // Fetch customer payments
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('customerId', '==', params.id),
        orderBy('createdAt', 'desc')
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);

    } catch (error) {
      console.error('Error fetching customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalanceSheet = () => {
    const totalOrders = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const outstandingBalance = totalOrders - totalPayments;

    return {
      totalOrders,
      totalPayments,
      outstandingBalance
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Customer Not Found</h1>
          <Link
            href="/admin/customers"
            className="text-blue-600 hover:text-blue-900"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  const balanceSheet = calculateBalanceSheet();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            <p className="text-gray-600">{customer.customerCode}</p>
          </div>
        </div>
        <Link
          href={`/admin/customers/${params.id}/edit`}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Edit size={20} />
          Edit Customer
        </Link>
      </div>

      {/* Customer Status */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              customer.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className="text-sm text-gray-600">
              Payment Terms: {customer.paymentTerms || 'Immediate'}
            </span>
          </div>
          {customer.creditLimit > 0 && (
            <span className="text-sm text-gray-600">
              Credit Limit: ₹{customer.creditLimit.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Balance Sheet Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{balanceSheet.totalOrders.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payments</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{balanceSheet.totalPayments.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              balanceSheet.outstandingBalance > 0
                ? 'bg-red-100'
                : 'bg-green-100'
            }`}>
              <DollarSign className={`h-6 w-6 ${
                balanceSheet.outstandingBalance > 0
                  ? 'text-red-600'
                  : 'text-green-600'
              }`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding Balance</p>
              <p className={`text-2xl font-bold ${
                balanceSheet.outstandingBalance > 0
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                ₹{Math.abs(balanceSheet.outstandingBalance).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Name</label>
              <p className="text-gray-900">{customer.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Phone</label>
              <p className="text-gray-900">{customer.phone}</p>
            </div>
            {customer.shopName && (
              <div>
                <label className="text-sm font-medium text-gray-600">Shop Name</label>
                <p className="text-gray-900">{customer.shopName}</p>
              </div>
            )}
            {customer.email && (
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <p className="text-gray-900">{customer.email}</p>
              </div>
            )}
            {customer.gstNumber && (
              <div>
                <label className="text-sm font-medium text-gray-600">GST Number</label>
                <p className="text-gray-900">{customer.gstNumber}</p>
              </div>
            )}
            {customer.address && (
              <div>
                <label className="text-sm font-medium text-gray-600">Address</label>
                <p className="text-gray-900 whitespace-pre-line">{customer.address}</p>
              </div>
            )}
            {customer.notes && (
              <div>
                <label className="text-sm font-medium text-gray-600">Notes</label>
                <p className="text-gray-900 whitespace-pre-line">{customer.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Summary</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Orders:</span>
              <span className="font-medium">{orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Payments:</span>
              <span className="font-medium">{payments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credit Limit:</span>
              <span className="font-medium">
                ₹{(customer.creditLimit || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 font-medium">Outstanding:</span>
              <span className={`font-bold ${
                balanceSheet.outstandingBalance > 0
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                ₹{Math.abs(balanceSheet.outstandingBalance).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>
        {orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderNumber || order.id.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{(order.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'Unknown'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No orders found for this customer.</p>
        )}
      </div>
    </div>
  );
}