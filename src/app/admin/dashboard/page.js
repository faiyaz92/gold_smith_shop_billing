'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import {
  Users,
  Package,
  ShoppingBag,
  MessageSquare,
  Truck,
  CheckCircle,
  Clock,
  PackageCheck,
  ShoppingCart,
  Package2,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Phone,
  Factory,
  DollarSign,
  BarChart3,
  RefreshCw,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, where, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { DevModeToggle } from '@/components/DevModeToggle.js';
import GoldPricePopup from '@/components/GoldPricePopup.js';
import GoldPriceManager from '@/components/GoldPriceManager.js';
import PurchaseForm from '@/components/PurchaseForm.js';
import SaleForm from '@/components/SaleForm.js';
import LoanForm from '@/components/LoanForm.js';
import QuickChallanForm from '@/components/QuickChallanForm.js';
import ReceivePaymentForm from '@/components/ReceivePaymentForm.js';
import { fetchGoldPrice, getLatestGoldPrice } from '@/utils/goldPriceAPI';
import AdminLayout from '@/app/admin/AdminLayout';

// Gold Smith Dashboard - Key Metrics for Jewelry Wholesaler
export default function GoldSmithDashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshingPrice, setRefreshingPrice] = useState(false);

  // Core Data States
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [payments, setPayments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Quick Operations States
  const [showGoldPricePopup, setShowGoldPricePopup] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [showChallanForm, setShowChallanForm] = useState(false);
  const [showReceivePaymentForm, setShowReceivePaymentForm] = useState(false);
  const [showGoldPriceManager, setShowGoldPriceManager] = useState(false);
  const [currentGoldPrice, setCurrentGoldPrice] = useState(null);
  const [goldPriceData, setGoldPriceData] = useState(null);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const userRole = typeof window !== 'undefined' ? (localStorage.getItem('userRole') || 'company_admin') : 'company_admin';
  const ordersPath = `companies/${companyId}/orders`;
  const customersPath = `companies/${companyId}/customers`;
  const manufacturersPath = `companies/${companyId}/manufacturers`;
  const inventoryPath = `companies/${companyId}/inventory`;
  const categoriesPath = `companies/${companyId}/categories`;
  const paymentsPath = `companies/${companyId}/payments`;

  useEffect(() => {
    setIsClient(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch orders
      const ordersQuery = query(collection(db, ordersPath), orderBy('createdAt', 'desc'));
      const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        setOrders(ordersData);
      });

      // Fetch customers
      const customersQuery = query(collection(db, customersPath));
      const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersData);
      });

      // Fetch manufacturers
      const manufacturersQuery = query(collection(db, manufacturersPath));
      const manufacturersUnsubscribe = onSnapshot(manufacturersQuery, (snapshot) => {
        const manufacturersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setManufacturers(manufacturersData);
      });

      // Fetch inventory
      const inventoryQuery = query(collection(db, inventoryPath));
      const inventoryUnsubscribe = onSnapshot(inventoryQuery, (snapshot) => {
        const inventoryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setInventory(inventoryData);
      });

      // Fetch categories
      const categoriesQuery = query(collection(db, categoriesPath));
      const categoriesUnsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      });

      // Fetch payments
      const paymentsQuery = query(collection(db, paymentsPath), orderBy('createdAt', 'desc'));
      const paymentsUnsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setPayments(paymentsData);
      });

      // Fetch current gold price
      const loadGoldPrice = async () => {
        try {
          const priceData = await getLatestGoldPrice();
          if (priceData) {
            setCurrentGoldPrice(priceData);
          }
        } catch (error) {
          console.error('Error loading gold price:', error);
        }
      };
      loadGoldPrice();

      return () => {
        ordersUnsubscribe();
        customersUnsubscribe();
        manufacturersUnsubscribe();
        inventoryUnsubscribe();
        categoriesUnsubscribe();
        paymentsUnsubscribe();
      };

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders
    const todayOrders = orders.filter(order =>
      order.createdAt >= todayStart && order.createdAt < tomorrow
    );

    // Due orders (delivery today/tomorrow)
    const dueOrders = orders.filter(order => {
      if (!order.expectedDeliveryDate) return false;
      const deliveryDate = new Date(order.expectedDeliveryDate);
      const deliveryStart = new Date(deliveryDate.getFullYear(), deliveryDate.getMonth(), deliveryDate.getDate());
      const deliveryEnd = new Date(deliveryStart);
      deliveryEnd.setDate(deliveryEnd.getDate() + 1);
      return deliveryStart <= tomorrow && deliveryEnd > todayStart;
    });

    // Today's deliveries
    const todayDeliveries = orders.filter(order =>
      order.status === 'Delivered' &&
      order.updatedAt >= todayStart && order.updatedAt < tomorrow
    );

    // Outstanding receivables (customer dues)
    const outstandingReceivables = customers.reduce((total, customer) => {
      return total + (customer.balance || 0);
    }, 0);

    // Outstanding payables (manufacturer dues)
    const outstandingPayables = manufacturers.reduce((total, manufacturer) => {
      return total + (manufacturer.balance || 0);
    }, 0);

    // Gold inventory value
    const goldInventoryValue = inventory.reduce((total, item) => {
      const category = categories.find(c => c.id === item.categoryId);
      const rate = category?.metalRatePerGram || 0;
      return total + (item.weight || 0) * rate;
    }, 0);

    // Today's commission (simplified - difference between customer price and manufacturer cost)
    const todayCommission = todayOrders.reduce((total, order) => {
      // Simplified commission calculation
      const subtotal = order.subtotal || 0;
      return total + (subtotal * 0.05); // 5% commission estimate
    }, 0);

    // Order status breakdown
    const orderStatusBreakdown = [
      { name: 'New', value: orders.filter(o => o.status === 'New').length, color: '#6B7280' },
      { name: 'Confirmed', value: orders.filter(o => o.status === 'Confirmed').length, color: '#3B82F6' },
      { name: 'In Production', value: orders.filter(o => o.status === 'In Production').length, color: '#F59E0B' },
      { name: 'Ready for Pickup', value: orders.filter(o => o.status === 'Ready for Pickup').length, color: '#F97316' },
      { name: 'Completed', value: orders.filter(o => o.status === 'Completed').length, color: '#10B981' }
    ];

    // Recent activities (last 10)
    const activities = [
      ...orders.slice(0, 5).map(order => ({
        id: order.id,
        type: 'order',
        message: `New order from ${order.customerName} - ${order.weight}g ${order.karat}`,
        time: order.createdAt,
        icon: Phone
      })),
      ...payments.slice(0, 3).map(payment => ({
        id: payment.id,
        type: 'payment',
        message: `Payment received: ₹${payment.amount}`,
        time: payment.createdAt,
        icon: DollarSign
      }))
    ].sort((a, b) => b.time - a.time).slice(0, 10);

    return {
      todayOrders: {
        count: todayOrders.length,
        value: todayOrders.reduce((sum, order) => sum + (order.total || 0), 0)
      },
      totalOrders: orders.length,
      dueOrders: dueOrders.length,
      todayDeliveries: todayDeliveries.length,
      outstandingReceivables,
      outstandingPayables,
      goldInventoryValue,
      todayCommission,
      orderStatusBreakdown,
      recentActivities: activities
    };
  }, [orders, customers, manufacturers, inventory, categories, payments]);

  // Quick Actions Handlers
  const handleRefreshGoldPrice = async () => {
    setRefreshingPrice(true);
    try {
      // Navigate to gold price page where the widget will auto-refresh
      router.push('/admin/dashboard#gold-price');
      // Simulate refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error refreshing gold price:', error);
    } finally {
      setRefreshingPrice(false);
    }
  };

  const handleNewOrder = () => {
    router.push('/admin/orders');
  };

  const handleRecordPayment = () => {
    router.push('/admin/orders?action=payment');
  };

  const handleViewReports = () => {
    router.push('/admin/invoices');
  };

  // New Quick Operations Handlers
  const handlePurchaseFromSupplier = () => {
    setShowPurchaseForm(true);
  };

  const handleSaleInvoice = () => {
    setShowSaleForm(true);
  };

  const handleLoanToCustomer = () => {
    setShowLoanForm(true);
  };

  const handleQuickChallan = () => {
    setShowChallanForm(true);
  };

  const handleReceivePayment = () => {
    setShowReceivePaymentForm(true);
  };

  const handleGoldPriceConfirm = (priceData) => {
    setGoldPriceData(priceData);
    setShowGoldPricePopup(false);
  };

  if (!isClient) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Gold Smith Dashboard</h1>
              <p className="text-gray-600 mt-2">Jewelry wholesaler management overview</p>
            </div>
            <DevModeToggle />
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* New Orders Today */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Orders Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.todayOrders.count}</p>
                <p className="text-sm text-gray-500">₹{dashboardMetrics.todayOrders.value.toLocaleString()}</p>
              </div>
              <Phone className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          {/* Due Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Due Orders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardMetrics.dueOrders}</p>
                <p className="text-sm text-gray-500">Delivery today/tomorrow</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>

          {/* Outstanding Receivables */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receivables</p>
                <p className="text-2xl font-bold text-gray-900">₹{dashboardMetrics.outstandingReceivables.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Customer dues</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          {/* Today's Commission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-purple-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Commission</p>
                <p className="text-2xl font-bold text-gray-900">₹{dashboardMetrics.todayCommission.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Estimated earnings</p>
              </div>
              <IndianRupee className="w-8 h-8 text-purple-500" />
            </div>
          </motion.div>

          {/* Current Gold Price */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-yellow-500 cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => setShowGoldPriceManager(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gold Price (24k)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {currentGoldPrice ? `$${currentGoldPrice.pricePerOunce?.toLocaleString()}` : 'Loading...'}
                </p>
                <p className="text-sm text-gray-500">
                  {currentGoldPrice ? `$${currentGoldPrice.pricePerGram?.toFixed(2)}/g` : ''}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <RefreshCw className="w-6 h-6 text-yellow-500 mb-1" />
                <span className="text-xs text-gray-400">Click to edit</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Orders */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{dashboardMetrics.totalOrders}</p>
              </div>
              <Package className="w-6 h-6 text-gray-500" />
            </div>
          </div>

          {/* Gold Inventory Value */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gold Inventory Value</p>
                <p className="text-xl font-bold text-gray-900">₹{dashboardMetrics.goldInventoryValue.toLocaleString()}</p>
              </div>
              <BarChart3 className="w-6 h-6 text-gray-500" />
            </div>
          </div>

          {/* Outstanding Payables */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Payables</p>
                <p className="text-xl font-bold text-gray-900">₹{dashboardMetrics.outstandingPayables.toLocaleString()}</p>
              </div>
              <AlertTriangle className="w-6 h-6 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Charts and Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Order Status Breakdown */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardMetrics.orderStatusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardMetrics.orderStatusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Activities */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {dashboardMetrics.recentActivities.map((activity, index) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <activity.icon className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">
                      {activity.time.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {dashboardMetrics.recentActivities.length === 0 && (
                <p className="text-gray-500 text-center py-8">No recent activities</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-700" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Refresh Gold Price */}
            <button
              onClick={handleRefreshGoldPrice}
              disabled={refreshingPrice}
              className="flex flex-col items-center p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-8 h-8 text-yellow-600 mb-2 ${refreshingPrice ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
              <span className="text-sm font-medium text-yellow-700">Refresh Gold Price</span>
              <span className="text-xs text-yellow-600 mt-1">Update market rate</span>
            </button>

            {/* New Order */}
            <button
              onClick={handleNewOrder}
              className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <Phone className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-blue-700">New Order</span>
              <span className="text-xs text-blue-600 mt-1">Create customer order</span>
            </button>

            {/* Record Payment */}
            <button
              onClick={handleRecordPayment}
              className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <DollarSign className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-green-700">Record Payment</span>
              <span className="text-xs text-green-600 mt-1">Gold or USD payment</span>
            </button>

            {/* View Reports */}
            <button
              onClick={handleViewReports}
              className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <FileText className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-purple-700">View Reports</span>
              <span className="text-xs text-purple-600 mt-1">Invoices & statements</span>
            </button>

            {/* Purchase from Supplier */}
            <button
              onClick={handlePurchaseFromSupplier}
              className="flex flex-col items-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors group"
            >
              <ShoppingBag className="w-8 h-8 text-indigo-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-indigo-700">Purchase</span>
              <span className="text-xs text-indigo-600 mt-1">Gold or jewelry</span>
            </button>

            {/* Sale Invoice */}
            <button
              onClick={handleSaleInvoice}
              className="flex flex-col items-center p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors group"
            >
              <PackageCheck className="w-8 h-8 text-teal-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-teal-700">Sale Invoice</span>
              <span className="text-xs text-teal-600 mt-1">Sell jewelry</span>
            </button>

            {/* Loan to Customer */}
            <button
              onClick={handleLoanToCustomer}
              className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group"
            >
              <IndianRupee className="w-8 h-8 text-orange-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-orange-700">Loan</span>
              <span className="text-xs text-orange-600 mt-1">Cash to customer</span>
            </button>

            {/* Quick Challan */}
            <button
              onClick={handleQuickChallan}
              className="flex flex-col items-center p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition-colors group"
            >
              <Truck className="w-8 h-8 text-cyan-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-cyan-700">Quick Challan</span>
              <span className="text-xs text-cyan-600 mt-1">Gold withdrawal</span>
            </button>

            {/* Receive Payment */}
            <button
              onClick={handleReceivePayment}
              className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <DollarSign className="w-8 h-8 text-green-600 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-medium text-green-700">Receive Payment</span>
              <span className="text-xs text-green-600 mt-1">Customer payments</span>
            </button>
          </div>
          
          {/* Additional Quick Links */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Management</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <button
                onClick={() => router.push('/admin/customers')}
                className="flex items-center gap-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Customers</span>
              </button>
              <button
                onClick={() => router.push('/admin/manufacturers')}
                className="flex items-center gap-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Factory className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Manufacturers</span>
              </button>
              <button
                onClick={() => router.push('/admin/inventory')}
                className="flex items-center gap-2 p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Package className="w-5 h-5 text-gray-600" />
                <span className="text-sm text-gray-700">Inventory</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gold Price Popup */}
      <GoldPricePopup
        isOpen={showGoldPricePopup}
        onClose={() => setShowGoldPricePopup(false)}
        onPriceConfirm={handleGoldPriceConfirm}
      />

      {/* Purchase Form */}
      <PurchaseForm
        isOpen={showPurchaseForm}
        onClose={() => setShowPurchaseForm(false)}
        companyId={companyId}
        userRole={userRole}
      />

      {/* Sale Form */}
      <SaleForm
        isOpen={showSaleForm}
        onClose={() => setShowSaleForm(false)}
        companyId={companyId}
        userRole={userRole}
      />

      {/* Loan Form */}
      <LoanForm
        isOpen={showLoanForm}
        onClose={() => setShowLoanForm(false)}
        companyId={companyId}
        userRole={userRole}
      />

      {/* Quick Challan Form */}
      <QuickChallanForm
        isOpen={showChallanForm}
        onClose={() => setShowChallanForm(false)}
        companyId={companyId}
        userRole={userRole}
      />

      {/* Receive Payment Form */}
      <ReceivePaymentForm
        isOpen={showReceivePaymentForm}
        onClose={() => setShowReceivePaymentForm(false)}
        companyId={companyId}
        userRole={userRole}
      />

      {/* Gold Price Manager */}
      <GoldPriceManager
        isOpen={showGoldPriceManager}
        onClose={() => setShowGoldPriceManager(false)}
      />
    </AdminLayout>
  );
}
