'use client';

// ✅ TASK 3.4: Enhanced Customer Details Page - Comprehensive Customer View
// Shows customer info, balance, transactions, orders, payments, sales, and purchase history

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../../../firebase';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Receipt,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const customerId = params.id;

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [accountBalance, setAccountBalance] = useState(0);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

  useEffect(() => {
    if (customerId) {
      fetchCustomerDetails();
    }
  }, [customerId]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);

      // Fetch customer basic info
      const customerRef = doc(db, `${basePath}/customers`, customerId);
      const customerSnap = await getDoc(customerRef);

      if (!customerSnap.exists()) {
        alert('Customer not found');
        router.push('/admin/customers');
        return;
      }

      const customerData = {
        id: customerSnap.id,
        ...customerSnap.data()
      };

      setCustomer(customerData);

      // Fetch account balance
      const accountManager = new HierarchicalAccountManager(companyId);
      if (customerData.accountCode) {
        const account = await accountManager.getAccountByCode(customerData.accountCode);
        setAccountBalance(account ? (account.currentBalanceGold || account.currentBalance || 0) : 0);
      }

      // Fetch recent transactions (last 20)
      const transactionsRef = collection(db, `${basePath}/transactions`);
      const transactionsQuery = query(
        transactionsRef,
        where('customerId', '==', customerId),
        orderBy('date', 'desc'),
        limit(20)
      );
      const transactionsSnap = await getDocs(transactionsQuery);
      const transactionsData = transactionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTransactions(transactionsData);

      // Fetch recent orders (last 10)
      const ordersRef = collection(db, `${basePath}/orders`);
      const ordersQuery = query(
        ordersRef,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const ordersSnap = await getDocs(ordersQuery);
      const ordersData = ordersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);

      // Fetch recent payments (last 10)
      const paymentsRef = collection(db, `${basePath}/payments`);
      const paymentsQuery = query(
        paymentsRef,
        where('customerId', '==', customerId),
        orderBy('paymentDate', 'desc'),
        limit(10)
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);

      // Fetch recent purchases (last 10)
      const purchasesRef = collection(db, `${basePath}/purchases`);
      const purchasesQuery = query(
        purchasesRef,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const purchasesSnap = await getDocs(purchasesQuery);
      const purchasesData = purchasesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPurchases(purchasesData);

      // Fetch recent sales (last 10)
      const salesRef = collection(db, `${basePath}/sales`);
      const salesQuery = query(
        salesRef,
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );
      const salesSnap = await getDocs(salesQuery);
      const salesData = salesSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSales(salesData);

    } catch (error) {
      console.error('Error fetching customer details:', error);
      alert('Error loading customer details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Customer Not Found</h2>
          <Link
            href="/admin/customers"
            className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/customers"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {customer.customerName || customer.name}
            </h1>
            <p className="text-gray-600">Customer Code: {customer.customerCode}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center gap-2"
          >
            <Edit size={16} />
            Edit Customer
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Print Details
          </button>
        </div>
      </div>

      {/* Customer Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Basic Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-blue-500" size={24} />
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Phone size={16} className="text-gray-400" />
              <span className="text-sm">{customer.phone || 'N/A'}</span>
            </div>
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span className="text-sm">{customer.email}</span>
              </div>
            )}
            {customer.shopName && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gray-400" />
                <span className="text-sm">{customer.shopName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <span className="text-sm">Joined: {formatDate(customer.createdAt)}</span>
            </div>
            <div className="mt-3">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                customer.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <Scale className="text-green-500" size={24} />
            <h3 className="text-lg font-semibold">Current Balance</h3>
          </div>
          <div className="space-y-2">
            <div className={`text-2xl font-bold ${
              accountBalance > 0 ? 'text-red-600' : accountBalance < 0 ? 'text-green-600' : 'text-gray-900'
            }`}>
              {accountBalance.toFixed(3)}g
            </div>
            <div className="text-sm text-gray-600">
              ${(accountBalance * 145.43).toFixed(2)} USD
            </div>
            <div className="text-xs text-gray-500">
              {accountBalance > 0 ? 'Outstanding' : accountBalance < 0 ? 'Credit' : 'Settled'}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-purple-500" size={24} />
            <h3 className="text-lg font-semibold">Summary</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Orders:</span>
              <span className="text-sm font-semibold">{orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Sales:</span>
              <span className="text-sm font-semibold">{sales.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Payments Made:</span>
              <span className="text-sm font-semibold">{payments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Transactions:</span>
              <span className="text-sm font-semibold">{transactions.length}</span>
            </div>
          </div>
        </div>

        {/* Credit Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="text-orange-500" size={24} />
            <h3 className="text-lg font-semibold">Credit Information</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Credit Limit:</span>
              <span className="text-sm font-semibold">
                {customer.creditLimitGold ? `${customer.creditLimitGold.toFixed(3)}g` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Available Credit:</span>
              <span className="text-sm font-semibold">
                {customer.availableCreditGold ? `${customer.availableCreditGold.toFixed(3)}g` : 'N/A'}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              Payment Terms: {customer.paymentTerms || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Receipt size={20} className="text-blue-500" />
            Recent Transactions
          </h3>
          <Link
            href={`/admin/transactions?customerId=${customer.id}`}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View All →
          </Link>
        </div>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.slice(0, 5).map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.transactionType || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {transaction.description || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {transaction.amount ? `${transaction.amount.toFixed(3)}g` : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                        {transaction.status || 'Completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No transactions found</p>
        )}
      </div>

      {/* Recent Orders and Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package size={20} className="text-green-500" />
              Recent Orders
            </h3>
            <Link
              href={`/admin/orders?customerId=${customer.id}`}
              className="text-green-600 hover:text-green-800 text-sm"
            >
              View All →
            </Link>
          </div>
          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Order #{order.orderNumber || order.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{order.totalGoldWeight ? `${order.totalGoldWeight.toFixed(3)}g` : 'N/A'}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No orders found</p>
          )}
        </div>

        {/* Recent Sales */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag size={20} className="text-purple-500" />
              Recent Sales
            </h3>
            <Link
              href={`/admin/sales?customerId=${customer.id}`}
              className="text-purple-600 hover:text-purple-800 text-sm"
            >
              View All →
            </Link>
          </div>
          {sales.length > 0 ? (
            <div className="space-y-3">
              {sales.slice(0, 3).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Sale #{sale.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{formatDate(sale.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{sale.pureGoldAmount ? `${sale.pureGoldAmount.toFixed(3)}g` : 'N/A'}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(sale.status)}`}>
                      {sale.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No sales found</p>
          )}
        </div>
      </div>

      {/* Payments and Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CreditCard size={20} className="text-blue-500" />
              Recent Payments
            </h3>
            <Link
              href={`/admin/payments?customerId=${customer.id}`}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All →
            </Link>
          </div>
          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Payment #{payment.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{formatDate(payment.paymentDate)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {payment.amount ? formatCurrency(payment.amount) : 'N/A'}
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No payments found</p>
          )}
        </div>

        {/* Recent Purchases */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={20} className="text-orange-500" />
              Recent Purchases
            </h3>
            <Link
              href={`/admin/purchases?customerId=${customer.id}`}
              className="text-orange-600 hover:text-orange-800 text-sm"
            >
              View All →
            </Link>
          </div>
          {purchases.length > 0 ? (
            <div className="space-y-3">
              {purchases.slice(0, 3).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-semibold">Purchase #{purchase.id.slice(-8)}</p>
                    <p className="text-sm text-gray-600">{formatDate(purchase.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{purchase.totalWeight ? `${purchase.totalWeight.toFixed(3)}g` : 'N/A'}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(purchase.status)}`}>
                      {purchase.status || 'Completed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No purchases found</p>
          )}
        </div>
      </div>
    </div>
  );
}