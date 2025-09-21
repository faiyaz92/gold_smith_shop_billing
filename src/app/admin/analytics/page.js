'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Building2,
  Users,
  TrendingDown,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  UserCheck,
  Clock,
  AlertTriangle,
  Trophy,
  TrendingUp,
  Eye,
  Filter,
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/app/firebase';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AdminLayout from '../AdminLayout';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

export default function AdminAnalytics() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState(() => new Date());

  // Data states
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);

  // Analytics data
  const [salesAnalytics, setSalesAnalytics] = useState({});
  const [branchAnalytics, setBranchAnalytics] = useState({});
  const [customerAnalytics, setCustomerAnalytics] = useState({});
  const [lostAnalytics, setLostAnalytics] = useState({});

  // Current user for role checking
  const [currentUser, setCurrentUser] = useState({
    userId: '',
    userName: '',
    userRole: '',
    branchId: ''
  });

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const usersPath = `${tenantCompaniesPath}/${companyId}/users`;
  const productsPath = `${tenantCompaniesPath}/${companyId}/products`;
  const ordersPath = `${tenantCompaniesPath}/${companyId}/orders`;
  const branchesPath = `${tenantCompaniesPath}/${companyId}/branches`;

  // Check if user has access to analytics
  const hasAccess = currentUser.userRole === 'company_admin' || currentUser.userRole === 'general_manager';

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }

    // Get current user info
    const userId = localStorage.getItem('userId') || '';
    const userName = localStorage.getItem('userName') || '';
    const userRole = localStorage.getItem('userRole') || '';
    const branchId = localStorage.getItem('userBranchId') || '';
    setCurrentUser({ userId, userName, userRole, branchId });

    // Check access
    if (userRole !== 'company_admin' && userRole !== 'general_manager') {
      router.push('/admin/dashboard');
      return;
    }

    // Fetch all required data
    const unsubscriptions = [];

    // Orders subscription
    const ordersQuery = query(collection(db, ordersPath), orderBy('timestamp', 'desc'));
    const unsubOrders = onSnapshot(ordersQuery, (snapshot) => {
      const allOrders = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
          total: Number(data.total || 0),
          items: data.items || [],
        };
      });
      setOrders(allOrders);
    });

    // Users subscription
    const unsubUsers = onSnapshot(collection(db, usersPath), (snapshot) => {
      const allUsers = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      }));
      setUsers(allUsers);
    });

    // Branches subscription
    const unsubBranches = onSnapshot(collection(db, branchesPath), (snapshot) => {
      const allBranches = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setBranches(allBranches);
    });

    // Products subscription
    const unsubProducts = onSnapshot(collection(db, productsPath), (snapshot) => {
      const allProducts = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setProducts(allProducts);
    });

    unsubscriptions.push(unsubOrders, unsubUsers, unsubBranches, unsubProducts);
    setIsLoading(false);

    return () => {
      unsubscriptions.forEach(unsub => unsub());
    };
  }, [router]);

  // Calculate analytics when data changes
  useEffect(() => {
    if (orders.length > 0 && users.length > 0 && branches.length > 0) {
      calculateAnalytics();
    }
  }, [orders, users, branches, products, startDate, endDate]);

  const calculateAnalytics = () => {
    const filteredOrders = orders.filter(order =>
      order.timestamp >= startDate &&
      order.timestamp <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
    );

    // Sales Analytics
    calculateSalesAnalytics(filteredOrders);
    
    // Branch Analytics
    calculateBranchAnalytics(filteredOrders);
    
    // Customer Analytics
    calculateCustomerAnalytics(filteredOrders);
    
    // Lost Analytics
    calculateLostAnalytics(filteredOrders);
  };

  const calculateSalesAnalytics = (filteredOrders) => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Daily sales
    const dailySales = {};
    filteredOrders.forEach(order => {
      const day = order.timestamp.toISOString().split('T')[0];
      dailySales[day] = (dailySales[day] || 0) + order.total;
    });

    const dailySalesChart = Object.entries(dailySales)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sales]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: sales,
      }));

    // Monthly comparison
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthOrders = orders.filter(order => 
      order.timestamp.getMonth() === currentMonth && order.timestamp.getFullYear() === currentYear
    );
    const lastMonthOrders = orders.filter(order => 
      order.timestamp.getMonth() === lastMonth && order.timestamp.getFullYear() === lastMonthYear
    );

    const currentMonthRevenue = currentMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0);
    const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Payment method distribution
    const paymentMethods = {};
    filteredOrders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    const paymentMethodChart = Object.entries(paymentMethods).map(([method, count]) => ({
      name: method,
      value: count,
    }));

    // Top selling services
    const serviceQuantities = {};
    filteredOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const service = item.name || 'Unknown Service';
          serviceQuantities[service] = (serviceQuantities[service] || 0) + (item.quantity || 1);
        });
      }
    });

    const topServices = Object.entries(serviceQuantities)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([service, quantity]) => ({ service, quantity }));

    setSalesAnalytics({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth,
      dailySalesChart,
      paymentMethodChart,
      topServices,
    });
  };

  const calculateBranchAnalytics = (filteredOrders) => {
    // Branch performance
    const branchPerformance = {};
    branches.forEach(branch => {
      branchPerformance[branch.id] = {
        name: branch.name,
        orders: 0,
        revenue: 0,
        customers: new Set(),
      };
    });

    filteredOrders.forEach(order => {
      const branchId = order.branchId || 'unknown';
      if (branchPerformance[branchId]) {
        branchPerformance[branchId].orders += 1;
        branchPerformance[branchId].revenue += order.total;
        branchPerformance[branchId].customers.add(order.userId || order.phone);
      }
    });

    const branchPerformanceChart = Object.values(branchPerformance).map(branch => ({
      name: branch.name,
      orders: branch.orders,
      revenue: branch.revenue,
      customers: branch.customers.size,
    }));

    // Branch comparison
    const topBranches = branchPerformanceChart
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    setBranchAnalytics({
      branchPerformanceChart,
      topBranches,
    });
  };

  const calculateCustomerAnalytics = (filteredOrders) => {
    // Customer spending analysis
    const customerSpending = {};
    filteredOrders.forEach(order => {
      const customerId = order.userId || order.phone || 'anonymous';
      if (!customerSpending[customerId]) {
        customerSpending[customerId] = {
          name: order.name || 'Unknown Customer',
          phone: order.phone || 'N/A',
          totalSpent: 0,
          orderCount: 0,
          lastOrder: order.timestamp,
        };
      }
      customerSpending[customerId].totalSpent += order.total;
      customerSpending[customerId].orderCount += 1;
      if (order.timestamp > customerSpending[customerId].lastOrder) {
        customerSpending[customerId].lastOrder = order.timestamp;
      }
    });

    const topSpenders = Object.values(customerSpending)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    // Customer segments
    const segments = {
      'High Value (>KWD 500)': 0,
      'Medium Value (KWD 100-500)': 0,
      'Low Value (<KWD 100)': 0,
    };

    Object.values(customerSpending).forEach(customer => {
      if (customer.totalSpent > 500) segments['High Value (>KWD 500)']++;
      else if (customer.totalSpent > 100) segments['Medium Value (KWD 100-500)']++;
      else segments['Low Value (<KWD 100)']++;
    });

    const customerSegmentChart = Object.entries(segments).map(([segment, count]) => ({
      name: segment,
      value: count,
    }));

    // New vs returning customers
    const newCustomers = users.filter(user => 
      user.createdAt >= startDate && user.createdAt <= endDate
    ).length;

    setCustomerAnalytics({
      topSpenders,
      customerSegmentChart,
      newCustomers,
      totalCustomers: Object.keys(customerSpending).length,
    });
  };

  const calculateLostAnalytics = (filteredOrders) => {
    // Cancelled orders
    const cancelledOrders = filteredOrders.filter(order => order.status === 'Cancelled');
    const cancelledRevenue = cancelledOrders.reduce((sum, order) => sum + order.total, 0);

    // Orders on hold
    const onHoldOrders = filteredOrders.filter(order => order.status === 'On Hold');

    // Refunded orders
    const refundedOrders = filteredOrders.filter(order => order.status === 'Refunded/Returned');
    const refundedRevenue = refundedOrders.reduce((sum, order) => sum + order.total, 0);

    // Lost revenue by reason
    const lostRevenueChart = [
      { reason: 'Cancelled Orders', amount: cancelledRevenue, count: cancelledOrders.length },
      { reason: 'Refunded Orders', amount: refundedRevenue, count: refundedOrders.length },
    ];

    // Abandoned carts (customers who haven't ordered in 30+ days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const inactiveCustomers = users.filter(user => {
      const lastOrder = orders
        .filter(order => order.userId === user.id || order.phone === user.phone)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      return lastOrder && lastOrder.timestamp < thirtyDaysAgo;
    });

    setLostAnalytics({
      cancelledOrders: cancelledOrders.length,
      cancelledRevenue,
      onHoldOrders: onHoldOrders.length,
      refundedOrders: refundedOrders.length,
      refundedRevenue,
      lostRevenueChart,
      inactiveCustomers: inactiveCustomers.length,
    });
  };

  const tabs = [
    { id: 'sales', name: 'Sales Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'branches', name: 'Branch Performance', icon: <Building2 className="w-5 h-5" /> },
    { id: 'customers', name: 'Customer Insights', icon: <Users className="w-5 h-5" /> },
    { id: 'losses', name: 'Loss Analysis', icon: <TrendingDown className="w-5 h-5" /> },
  ];

  if (!isClient) return null;

  if (!hasAccess) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
            <p className="text-gray-600">Only Company Admin and General Manager can access analytics.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Business Analytics
          </h1>
          <p className="text-gray-600">Comprehensive insights into your laundry business performance</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <label className="font-medium text-gray-700">Date Range:</label>
            </div>
            <DatePicker
              selected={startDate}
              onChange={date => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              maxDate={endDate}
              className="border px-3 py-2 rounded-lg"
              dateFormat="yyyy-MM-dd"
            />
            <span className="text-gray-500">to</span>
            <DatePicker
              selected={endDate}
              onChange={date => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              minDate={startDate}
              maxDate={new Date()}
              className="border px-3 py-2 rounded-lg"
              dateFormat="yyyy-MM-dd"
            />
            <button
              onClick={() => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                setStartDate(thirtyDaysAgo);
                setEndDate(new Date());
              }}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-700'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Sales Analytics Tab */}
          {activeTab === 'sales' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Sales KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-600">
                        KWD {salesAnalytics.totalRevenue?.toLocaleString() || 0}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Orders</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {salesAnalytics.totalOrders || 0}
                      </p>
                    </div>
                    <Package className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Avg Order Value</p>
                      <p className="text-2xl font-bold text-purple-600">
                        KWD {salesAnalytics.avgOrderValue?.toFixed(2) || 0}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Revenue Growth</p>
                      <p className={`text-2xl font-bold ${salesAnalytics.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {salesAnalytics.revenueGrowth?.toFixed(1) || 0}%
                      </p>
                    </div>
                    <TrendingUp className={`w-8 h-8 ${salesAnalytics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                  </div>
                </div>
              </div>

              {/* Daily Sales Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Sales Trend</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesAnalytics.dailySalesChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KWD ${value}`, 'Sales']} />
                      <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Methods */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Methods</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={salesAnalytics.paymentMethodChart || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(salesAnalytics.paymentMethodChart || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Services */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Services</h3>
                  <div className="space-y-3">
                    {(salesAnalytics.topServices || []).slice(0, 8).map((service, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700 truncate flex-1 mr-2">{service.service}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${(service.quantity / Math.max(...(salesAnalytics.topServices || []).map(s => s.quantity))) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">{service.quantity}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Branch Analytics Tab */}
          {activeTab === 'branches' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Branch Performance Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Branch Performance Comparison</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={branchAnalytics.branchPerformanceChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue (KWD)" />
                      <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Branches */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Performing Branches</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(branchAnalytics.topBranches || []).map((branch, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Trophy className={`w-5 h-5 mr-2 ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-orange-500' : 'text-gray-300'}`} />
                              #{index + 1}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{branch.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">KWD {branch.revenue.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-semibold">{branch.orders}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-purple-600 font-semibold">{branch.customers}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Customer Analytics Tab */}
          {activeTab === 'customers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Customer KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Customers</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {customerAnalytics.totalCustomers || 0}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">New Customers</p>
                      <p className="text-2xl font-bold text-green-600">
                        {customerAnalytics.newCustomers || 0}
                      </p>
                    </div>
                    <UserCheck className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Top Spender</p>
                      <p className="text-lg font-bold text-purple-600">
                        KWD {customerAnalytics.topSpenders?.[0]?.totalSpent?.toFixed(2) || 0}
                      </p>
                    </div>
                    <Trophy className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Segments */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Segments</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerAnalytics.customerSegmentChart || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(customerAnalytics.customerSegmentChart || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Spenders */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Spenders</h3>
                  <div className="space-y-3">
                    {(customerAnalytics.topSpenders || []).slice(0, 8).map((customer, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{customer.name}</p>
                          <p className="text-xs text-gray-500">{customer.phone} • {customer.orderCount} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">KWD {customer.totalSpent.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loss Analytics Tab */}
          {activeTab === 'losses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Loss KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cancelled Orders</p>
                      <p className="text-2xl font-bold text-red-600">
                        {lostAnalytics.cancelledOrders || 0}
                      </p>
                    </div>
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Lost Revenue</p>
                      <p className="text-2xl font-bold text-red-600">
                        KWD {(lostAnalytics.cancelledRevenue + lostAnalytics.refundedRevenue)?.toFixed(2) || 0}
                      </p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">On Hold Orders</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {lostAnalytics.onHoldOrders || 0}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Inactive Customers</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {lostAnalytics.inactiveCustomers || 0}
                      </p>
                    </div>
                    <Eye className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Lost Revenue Chart */}
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue Loss Breakdown</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lostAnalytics.lostRevenueChart || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="reason" />
                      <YAxis />
                      <Tooltip formatter={(value, name) => [
                        name === 'amount' ? `KWD ${value}` : value,
                        name === 'amount' ? 'Lost Revenue' : 'Count'
                      ]} />
                      <Legend />
                      <Bar dataKey="amount" fill="#ef4444" name="Lost Revenue (KWD)" />
                      <Bar dataKey="count" fill="#f97316" name="Order Count" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}