'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AdminLayout from '@/app/admin/AdminLayout';
import { db } from '@/app/firebase'; // Changed from '@/app/firebase/config'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import {
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Package,
  Building2,
  ShoppingBag,
  Calendar,
  FileText,
  Download,
  UserCheck,    // Add this
  AlertTriangle, // Add this
  CreditCard,   // Add this
  Star         // Add this
} from 'lucide-react';

// Chart components
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// PDF and Excel imports
import jsPDF from 'jspdf'; // Add this import
import 'jspdf-autotable';  // Add this import
import * as XLSX from 'xlsx';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7300'];

export default function AdminAnalytics() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sales');

  // Date filters
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date;
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
  const [orderAnalytics, setOrderAnalytics] = useState({});
  const [showBranchInsights, setShowBranchInsights] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [branchStaff, setBranchStaff] = useState([]);
  const [dailyMetrics, setDailyMetrics] = useState({});

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;

  const tabs = [
    { id: 'sales', name: 'Sales Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'orders', name: 'Order Analysis', icon: <Package className="w-5 h-5" /> },
    { id: 'branches', name: 'Branch Performance', icon: <Building2 className="w-5 h-5" /> },
    { id: 'customers', name: 'Customer Insights', icon: <Users className="w-5 h-5" /> },
    { id: 'losses', name: 'Loss Analysis', icon: <TrendingDown className="w-5 h-5" /> },
  ];

  // Fetch data functions
  const fetchData = async () => {
    if (!companyId) return;

    try {
      setIsLoading(true);

      // Fetch orders
      const ordersQuery = query(
        collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`),
        orderBy('timestamp', 'desc')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      }));

      // Fetch users
      const usersQuery = query(
        collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`)
      );
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch branches
      const branchesQuery = query(
        collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/branches`)
      );
      const branchesSnapshot = await getDocs(branchesQuery);
      const branchesData = branchesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch products
      const productsQuery = query(
        collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/products`)
      );
      const productsSnapshot = await getDocs(productsQuery);
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      setOrders(ordersData);
      setUsers(usersData);
      setBranches(branchesData);
      setProducts(productsData);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate sales analytics
  const calculateSalesAnalytics = (filteredOrders) => {
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue growth calculation
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = filteredOrders
      .filter(order => order.timestamp.getMonth() === currentMonth && order.timestamp.getFullYear() === currentYear)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const lastMonthRevenue = filteredOrders
      .filter(order => order.timestamp.getMonth() === lastMonth && order.timestamp.getFullYear() === lastMonthYear)
      .reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Daily sales data
    const dailySalesMap = {};
    filteredOrders.forEach(order => {
      const day = order.timestamp.toISOString().split('T')[0];
      dailySalesMap[day] = (dailySalesMap[day] || 0) + (order.total || 0);
    });

    const dailySales = Object.entries(dailySalesMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, sales]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: sales,
      }));

    // Top services
    const serviceCount = {};
    filteredOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const serviceName = item.name || 'Unknown Service';
          serviceCount[serviceName] = (serviceCount[serviceName] || 0) + (item.quantity || 1);
        });
      }
    });

    const topServices = Object.entries(serviceCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([service, quantity]) => ({ service, quantity }));

    // Payment methods
    const paymentMethods = {};
    filteredOrders.forEach(order => {
      const method = order.paymentMethod || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    const paymentMethodChart = Object.entries(paymentMethods).map(([method, count]) => ({
      name: method,
      value: count,
    }));

    setSalesAnalytics({
      totalRevenue,
      totalOrders,
      avgOrderValue,
      revenueGrowth,
      dailySales,
      topServices,
      paymentMethodChart,
    });
  };

  // Calculate order analytics
  const calculateOrderAnalytics = (filteredOrders) => {
    // Daily order trends
    const dailyOrders = {};
    filteredOrders.forEach(order => {
      const day = order.timestamp.toISOString().split('T')[0];
      if (!dailyOrders[day]) {
        dailyOrders[day] = { orders: 0, pickups: 0, deliveries: 0 };
      }
      dailyOrders[day].orders += 1;
      if (order.serviceType === 'pickup') dailyOrders[day].pickups += 1;
      if (order.serviceType === 'delivery') dailyOrders[day].deliveries += 1;
    });

    const dailyOrderTrend = Object.entries(dailyOrders)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        orders: data.orders,
        pickups: data.pickups,
        deliveries: data.deliveries,
      }));

    // Order sources
    const orderSources = {
      'Website': filteredOrders.filter(o => o.orderSource === 'website' || !o.orderSource).length,
      'POS System': filteredOrders.filter(o => o.orderSource === 'pos' || o.orderSource === 'branch').length,
      'Walk-in Customer': filteredOrders.filter(o => o.orderSource === 'walkin').length,
    };

    const orderSourceChart = Object.entries(orderSources).map(([source, count]) => ({
      name: source,
      value: count,
    }));

    // Average daily orders
    const totalDays = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    const avgDailyOrders = filteredOrders.length / totalDays;

    // Order trend (last week vs current week)
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const lastWeekOrders = filteredOrders.filter(o => o.timestamp >= oneWeekAgo && o.timestamp < now).length;
    const previousWeekOrders = filteredOrders.filter(o => o.timestamp >= twoWeeksAgo && o.timestamp < oneWeekAgo).length;
    
    const orderTrendPercentage = previousWeekOrders > 0 ? 
      ((lastWeekOrders - previousWeekOrders) / previousWeekOrders) * 100 : 0;

    setOrderAnalytics({
      dailyOrderTrend,
      orderSourceChart,
      avgDailyOrders,
      orderTrendPercentage,
      totalDays,
    });
  };

  // Calculate daily metrics
  const calculateDailyMetrics = (filteredOrders, branchFilter = '', staffFilter = '') => {
    let ordersToAnalyze = filteredOrders;
    
    if (branchFilter) {
      ordersToAnalyze = ordersToAnalyze.filter(o => o.branchId === branchFilter);
    }
    
    if (staffFilter) {
      ordersToAnalyze = ordersToAnalyze.filter(o => o.orderTakenBy === staffFilter);
    }

    // Daily breakdown
    const dailyData = {};
    ordersToAnalyze.forEach(order => {
      const day = order.timestamp.toISOString().split('T')[0];
      if (!dailyData[day]) {
        dailyData[day] = {
          date: day,
          orders: 0,
          pickups: 0,
          deliveries: 0,
          sales: 0,
        };
      }
      dailyData[day].orders += 1;
      dailyData[day].sales += order.total;
      if (order.serviceType === 'pickup') dailyData[day].pickups += 1;
      if (order.serviceType === 'delivery') dailyData[day].deliveries += 1;
    });

    const dailyTable = Object.values(dailyData)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30); // Last 30 days

    setDailyMetrics({ dailyTable });
  };

  // Calculate branch analytics
  const calculateBranchAnalytics = (filteredOrders) => {
    const branchStats = {};
    branches.forEach(branch => {
      branchStats[branch.id] = {
        name: branch.name,
        orders: 0,
        revenue: 0,
      };
    });

    filteredOrders.forEach(order => {
      if (order.branchId && branchStats[order.branchId]) {
        branchStats[order.branchId].orders += 1;
        branchStats[order.branchId].revenue += order.total || 0;
      }
    });

    const branchPerformance = Object.values(branchStats)
      .sort((a, b) => b.revenue - a.revenue);

    setBranchAnalytics({ branchPerformance });
  };

  // Calculate customer analytics
  const calculateCustomerAnalytics = (filteredOrders) => {
    const customerStats = {
      totalCustomers: new Set(filteredOrders.map(o => o.customerId)).size,
      repeatCustomers: 0,
      avgOrdersPerCustomer: 0,
    };

    const customerOrderCount = {};
    filteredOrders.forEach(order => {
      if (order.customerId) {
        customerOrderCount[order.customerId] = (customerOrderCount[order.customerId] || 0) + 1;
      }
    });

    customerStats.repeatCustomers = Object.values(customerOrderCount).filter(count => count > 1).length;
    customerStats.avgOrdersPerCustomer = customerStats.totalCustomers > 0 ? 
      filteredOrders.length / customerStats.totalCustomers : 0;

    setCustomerAnalytics(customerStats);
  };

  // Calculate lost analytics
  const calculateLostAnalytics = (filteredOrders) => {
    const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled').length;
    const lostRevenue = filteredOrders
      .filter(order => order.status === 'cancelled')
      .reduce((sum, order) => sum + (order.total || 0), 0);

    setLostAnalytics({
      cancelledOrders,
      lostRevenue,
      cancellationRate: filteredOrders.length > 0 ? (cancelledOrders / filteredOrders.length) * 100 : 0,
    });
  };

  // Main calculate analytics function
  const calculateAnalytics = () => {
    if (orders.length > 0 && users.length > 0 && branches.length > 0) {
      const filteredOrders = orders.filter(order =>
        order.timestamp >= startDate &&
        order.timestamp <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
      );

      calculateSalesAnalytics(filteredOrders);
      calculateOrderAnalytics(filteredOrders);
      calculateBranchAnalytics(filteredOrders);
      calculateCustomerAnalytics(filteredOrders);
      calculateLostAnalytics(filteredOrders);
      calculateDailyMetrics(filteredOrders, selectedBranch, selectedStaff);
    }
  };

  // Export functions
  const exportToPDF = (tabName, data, sectionName = null) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('EASY2 Laundry Analytics', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`${tabName}${sectionName ? ` - ${sectionName}` : ''}`, 105, 25, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 105, 35, { align: 'center' });

    let yPos = 45;

    if (data && typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === 'number') {
          doc.text(`${key}: ${value.toLocaleString()}`, 20, yPos);
          yPos += 6;
        }
      });
    }

    doc.save(`${tabName.toLowerCase()}${sectionName ? `-${sectionName.toLowerCase()}` : ''}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = (tabName, data, sectionName = null) => {
    const wb = XLSX.utils.book_new();
    
    if (data && Array.isArray(data)) {
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, sectionName || 'Data');
    } else if (data && typeof data === 'object') {
      const summaryData = Object.entries(data).map(([key, value]) => [key, value]);
      const ws = XLSX.utils.aoa_to_sheet([['Metric', 'Value'], ...summaryData]);
      XLSX.utils.book_append_sheet(wb, ws, sectionName || 'Summary');
    }

    XLSX.writeFile(wb, `${tabName.toLowerCase()}${sectionName ? `-${sectionName.toLowerCase()}` : ''}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Effects
  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      calculateAnalytics();
    }
  }, [orders, users, branches, startDate, endDate]);

  useEffect(() => {
    if (selectedBranch) {
      const staffInBranch = users.filter(user => 
        user.branchId === selectedBranch && 
        (user.role === 'cashier' || user.role === 'branch_manager')
      );
      setBranchStaff(staffInBranch);
    } else {
      setBranchStaff([]);
    }
    setSelectedStaff('');
  }, [selectedBranch, users]);

  useEffect(() => {
    if (orders.length > 0) {
      const filteredOrders = orders.filter(order =>
        order.timestamp >= startDate &&
        order.timestamp <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
      );
      calculateDailyMetrics(filteredOrders, selectedBranch, selectedStaff);
    }
  }, [selectedBranch, selectedStaff, orders, startDate, endDate]);

  if (!isClient) return null;

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
        {/* Compact Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-sm text-gray-600 mt-1">Comprehensive business performance insights</p>
        </div>

        {/* Date Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate.toISOString().split('T')[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate.toISOString().split('T')[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            
            {/* Overall Export Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => exportToPDF(
                  tabs.find(t => t.id === activeTab)?.name || 'Analytics',
                  activeTab === 'sales' ? salesAnalytics :
                  activeTab === 'orders' ? orderAnalytics :
                  activeTab === 'branches' ? branchAnalytics :
                  activeTab === 'customers' ? customerAnalytics :
                  lostAnalytics
                )}
                className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                📄 Export All PDF
              </button>
              <button
                onClick={() => exportToExcel(
                  tabs.find(t => t.id === activeTab)?.name || 'Analytics',
                  activeTab === 'sales' ? salesAnalytics :
                  activeTab === 'orders' ? orderAnalytics :
                  activeTab === 'branches' ? branchAnalytics :
                  activeTab === 'customers' ? customerAnalytics :
                  lostAnalytics
                )}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                📊 Export All Excel
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                >
                  {tab.icon}
                  {tab.name}
                </button>
              ))}
            </nav>
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
              {/* Branch Insights Panel - Only in Sales Tab */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-blue-800">Branch & Staff Analytics</h3>
                  <button
                    onClick={() => setShowBranchInsights(!showBranchInsights)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {showBranchInsights ? 'Hide' : 'Show'} Filters
                  </button>
                </div>
                
                {showBranchInsights && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="border border-blue-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">All Branches</option>
                      {branches.map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                    
                    <select
                      value={selectedStaff}
                      onChange={(e) => setSelectedStaff(e.target.value)}
                      className="border border-blue-300 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={!selectedBranch}
                    >
                      <option value="">All Staff</option>
                      {branchStaff.map(staff => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name} ({staff.role === 'branch_manager' ? 'BM' : 'Cashier'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* KPIs with Section Export */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Key Performance Indicators</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Sales', salesAnalytics, 'KPIs')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Sales', salesAnalytics, 'KPIs')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Revenue</p>
                        <p className="text-xl font-bold text-blue-800">
                          KWD {salesAnalytics.totalRevenue?.toLocaleString() || 0}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Total Orders</p>
                        <p className="text-xl font-bold text-green-800">
                          {salesAnalytics.totalOrders?.toLocaleString() || 0}
                        </p>
                      </div>
                      <ShoppingBag className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Avg Order Value</p>
                        <p className="text-xl font-bold text-purple-800">
                          KWD {salesAnalytics.avgOrderValue?.toFixed(2) || 0}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-600 font-medium">Growth Rate</p>
                        <p className={`text-xl font-bold ${salesAnalytics.revenueGrowth >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          {salesAnalytics.revenueGrowth >= 0 ? '+' : ''}{salesAnalytics.revenueGrowth?.toFixed(1) || 0}%
                        </p>
                      </div>
                      <BarChart3 className={`w-8 h-8 ${salesAnalytics.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods & Top Services */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToPDF('Sales', salesAnalytics.paymentMethodChart, 'Payment-Methods')}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => exportToExcel('Sales', salesAnalytics.paymentMethodChart, 'Payment-Methods')}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                  <div className="h-64">
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

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Top Services</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToPDF('Sales', salesAnalytics.topServices, 'Top-Services')}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => exportToExcel('Sales', salesAnalytics.topServices, 'Top-Services')}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {(salesAnalytics.topServices || []).slice(0, 8).map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                          <span className="text-sm text-gray-800">{service.service}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">{service.quantity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Daily Sales Chart */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Daily Sales Trend</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Sales', salesAnalytics.dailySales, 'Daily-Sales')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Sales', salesAnalytics.dailySales, 'Daily-Sales')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={salesAnalytics.dailySales || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KWD ${value}`, 'Sales']} />
                      <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Daily Performance Table */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Daily Performance Summary</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Sales', dailyMetrics.dailyTable, 'Daily-Performance')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Sales', dailyMetrics.dailyTable, 'Daily-Performance')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales (KWD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(dailyMetrics.dailyTable || []).slice(0, 10).map((day, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-blue-600">
                            {day.orders}
                          </td>
                          <td className="px-4 py-2 text-sm font-semibold text-green-600">
                            {day.sales.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Order Analysis Tab */}
          {activeTab === 'orders' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Order KPIs */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Order Metrics</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Orders', orderAnalytics, 'Order-Metrics')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Orders', orderAnalytics, 'Order-Metrics')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <Package className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-blue-600">Avg Daily Orders</p>
                    <p className="text-xl font-bold text-blue-800">
                      {orderAnalytics.avgDailyOrders?.toFixed(1) || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-green-600">Order Trend</p>
                    <p className={`text-xl font-bold ${orderAnalytics.orderTrendPercentage >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                      {orderAnalytics.orderTrendPercentage >= 0 ? '+' : ''}{orderAnalytics.orderTrendPercentage?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl mb-2">🌐</div>
                    <p className="text-sm text-purple-600">Website Orders</p>
                    <p className="text-xl font-bold text-purple-800">
                      {orderAnalytics.orderSourceChart?.find(s => s.name === 'Website')?.value || 0}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg text-center">
                    <div className="text-2xl mb-2">🚶</div>
                    <p className="text-sm text-orange-600">Walk-in Orders</p>
                    <p className="text-xl font-bold text-orange-800">
                      {orderAnalytics.orderSourceChart?.find(s => s.name === 'Walk-in Customer')?.value || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Order Trend */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Daily Order Trends</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Orders', orderAnalytics.dailyOrderTrend, 'Daily-Trends')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Orders', orderAnalytics.dailyOrderTrend, 'Daily-Trends')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={orderAnalytics.dailyOrderTrend || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Total Orders" />
                      <Line type="monotone" dataKey="pickups" stroke="#10b981" strokeWidth={2} name="Pickups" />
                      <Line type="monotone" dataKey="deliveries" stroke="#f59e0b" strokeWidth={2} name="Deliveries" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Order Sources */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Order Sources</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Orders', orderAnalytics.orderSourceChart, 'Order-Sources')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Orders', orderAnalytics.orderSourceChart, 'Order-Sources')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderAnalytics.orderSourceChart || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {(orderAnalytics.orderSourceChart || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Branch Performance Tab */}
          {activeTab === 'branches' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Branch Performance</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Branches', branchAnalytics.branchPerformance, 'Branch-Performance')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Branches', branchAnalytics.branchPerformance, 'Branch-Performance')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {(branchAnalytics.branchPerformance || []).map((branch, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-6 h-6 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-gray-900">{branch.name}</h4>
                          <p className="text-sm text-gray-600">{branch.orders} orders</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">KWD {branch.revenue.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">Revenue</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Customer Insights Tab */}
          {activeTab === 'customers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Customer Analytics</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Customers', customerAnalytics, 'Customer-Analytics')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Customers', customerAnalytics, 'Customer-Analytics')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg text-center">
                    <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-blue-600">Total Customers</p>
                    <p className="text-2xl font-bold text-blue-800">
                      {customerAnalytics.totalCustomers || 0}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 p-6 rounded-lg text-center">
                    <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-green-600">Repeat Customers</p>
                    <p className="text-2xl font-bold text-green-800">
                      {customerAnalytics.repeatCustomers || 0}
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 p-6 rounded-lg text-center">
                    <Star className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-purple-600">Avg Orders/Customer</p>
                    <p className="text-2xl font-bold text-purple-800">
                      {customerAnalytics.avgOrdersPerCustomer?.toFixed(1) || 0}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Loss Analysis Tab */}
          {activeTab === 'losses' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Loss Analysis</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Losses', lostAnalytics, 'Loss-Analysis')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Losses', lostAnalytics, 'Loss-Analysis')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-red-50 p-6 rounded-lg text-center">
                    <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-sm text-red-600">Cancelled Orders</p>
                    <p className="text-2xl font-bold text-red-800">
                      {lostAnalytics.cancelledOrders || 0}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 p-6 rounded-lg text-center">
                    <DollarSign className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-orange-600">Lost Revenue</p>
                    <p className="text-2xl font-bold text-orange-800">
                      KWD {lostAnalytics.lostRevenue?.toFixed(2) || 0}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-6 rounded-lg text-center">
                    <TrendingDown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-yellow-600">Cancellation Rate</p>
                    <p className="text-2xl font-bold text-yellow-800">
                      {lostAnalytics.cancellationRate?.toFixed(1) || 0}%
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}