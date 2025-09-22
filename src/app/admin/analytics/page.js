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

  // Add these missing state definitions after your existing state declarations
  const [branchSpecificData, setBranchSpecificData] = useState({});
  const [staffSpecificData, setStaffSpecificData] = useState({});

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
    // ✅ Use same fallback logic as orders page
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      const orderTotal = order.finalTotal || order.total || 0;
      return sum + orderTotal;
    }, 0);
    
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Revenue growth calculation
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthRevenue = filteredOrders
      .filter(order => order.timestamp.getMonth() === currentMonth && order.timestamp.getFullYear() === currentYear)
      .reduce((sum, order) => {
        const orderTotal = order.finalTotal || order.total || 0;
        return sum + orderTotal;
      }, 0);

    const lastMonthRevenue = filteredOrders
      .filter(order => order.timestamp.getMonth() === lastMonth && order.timestamp.getFullYear() === lastMonthYear)
      .reduce((sum, order) => {
        const orderTotal = order.finalTotal || order.total || 0;
        return sum + orderTotal;
      }, 0);

    const revenueGrowth = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Daily sales data
    const dailySalesMap = {};
    filteredOrders.forEach(order => {
      const day = order.timestamp.toISOString().split('T')[0];
      const orderTotal = order.finalTotal || order.total || 0;
      dailySalesMap[day] = (dailySalesMap[day] || 0) + orderTotal;
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
      // ✅ Use same fallback logic
      const orderTotal = order.finalTotal || order.total || 0;
      dailyData[day].sales += orderTotal;
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
        id: branch.id,
        name: branch.name,
        orders: 0,
        revenue: 0,
        staff: {}
      };
    });

    filteredOrders.forEach(order => {
      if (order.branchId && branchStats[order.branchId]) {
        branchStats[order.branchId].orders += 1;
        // ✅ Use same fallback logic
        const orderTotal = order.finalTotal || order.total || 0;
        branchStats[order.branchId].revenue += orderTotal;
      }
    });

    const branchPerformance = Object.values(branchStats)
      .filter(branch => branch.orders > 0)
      .sort((a, b) => b.revenue - a.revenue);

    // Ensure chart has data
    const branchChart = branchPerformance.length > 0 ? branchPerformance.map(branch => ({
      name: branch.name,
      orders: branch.orders,
      revenue: branch.revenue
    })) : [];

    setBranchAnalytics({ 
      branchPerformance,
      branchChart 
    });
  };

  // Calculate customer analytics
  const calculateCustomerAnalytics = (filteredOrders) => {
    const customerStats = {
      totalCustomers: new Set(filteredOrders.map(o => o.userId || o.customerId)).size,
      repeatCustomers: 0,
      avgOrdersPerCustomer: 0,
    };

    const customerOrderCount = {};
    const customerSpending = {};
    
    filteredOrders.forEach(order => {
      const customerId = order.userId || order.customerId;
      if (customerId) {
        customerOrderCount[customerId] = (customerOrderCount[customerId] || 0) + 1;
        // ✅ Use same fallback logic
        const orderTotal = order.finalTotal || order.total || 0;
        customerSpending[customerId] = (customerSpending[customerId] || 0) + orderTotal;
      }
    });

    customerStats.repeatCustomers = Object.values(customerOrderCount).filter(count => count > 1).length;
    customerStats.avgOrdersPerCustomer = customerStats.totalCustomers > 0 ? 
      filteredOrders.length / customerStats.totalCustomers : 0;

    // Customer segmentation
    const spendingValues = Object.values(customerSpending);
    if (spendingValues.length > 0) {
      const avgSpending = spendingValues.reduce((sum, val) => sum + val, 0) / spendingValues.length;
      
      const highSpenders = spendingValues.filter(spending => spending > avgSpending * 1.5).length;
      const mediumSpenders = spendingValues.filter(spending => spending >= avgSpending * 0.5 && spending <= avgSpending * 1.5).length;
      const lowSpenders = spendingValues.filter(spending => spending < avgSpending * 0.5).length;

      const customerSegmentation = [
        { name: 'High Spenders', value: highSpenders, color: '#00C49F' },
        { name: 'Medium Spenders', value: mediumSpenders, color: '#FFBB28' },
        { name: 'Low Spenders', value: lowSpenders, color: '#FF8042' }
      ].filter(segment => segment.value > 0);

      setCustomerAnalytics({
        ...customerStats,
        customerSegmentation,
        avgSpending: avgSpending || 0
      });
    } else {
      setCustomerAnalytics({
        ...customerStats,
        customerSegmentation: [],
        avgSpending: 0
      });
    }
  };

  // Calculate lost analytics
  const calculateLostAnalytics = (filteredOrders) => {
    const cancelledOrders = filteredOrders.filter(order => order.status === 'cancelled' || order.status === 'Cancelled').length;
    const lostRevenue = filteredOrders
      .filter(order => order.status === 'cancelled' || order.status === 'Cancelled')
      .reduce((sum, order) => {
        // ✅ Use same fallback logic
        const orderTotal = order.finalTotal || order.total || 0;
        return sum + orderTotal;
      }, 0);

    // Loss reasons analysis
    const lossReasons = {
      'Customer Cancelled': filteredOrders.filter(o => (o.status === 'cancelled' || o.status === 'Cancelled') && o.cancellationReason === 'customer').length,
      'Quality Issues': filteredOrders.filter(o => (o.status === 'cancelled' || o.status === 'Cancelled') && o.cancellationReason === 'quality').length,
      'Delivery Issues': filteredOrders.filter(o => (o.status === 'cancelled' || o.status === 'Cancelled') && o.cancellationReason === 'delivery').length,
      'Other': filteredOrders.filter(o => (o.status === 'cancelled' || o.status === 'Cancelled') && !o.cancellationReason).length
    };

    const lossChart = Object.entries(lossReasons).map(([reason, count]) => ({
      name: reason,
      value: count
    })).filter(item => item.value > 0);

    setLostAnalytics({
      cancelledOrders,
      lostRevenue,
      cancellationRate: filteredOrders.length > 0 ? (cancelledOrders / filteredOrders.length) * 100 : 0,
      lossChart
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

      // Calculate branch-specific analytics if branch is selected
      if (selectedBranch) {
        const branchData = calculateBranchSpecificAnalytics(filteredOrders, selectedBranch);
        setBranchSpecificData(branchData);
      } else {
        setBranchSpecificData({});
      }

      // Calculate staff-specific analytics if staff is selected
      if (selectedStaff) {
        const staffData = calculateStaffSpecificAnalytics(filteredOrders, selectedStaff);
        setStaffSpecificData(staffData);
      } else {
        setStaffSpecificData({});
      }
    }
  };

  // Update the export functions to create beautiful PDFs with proper formatting
  const exportToPDF = (tabName, data, sectionName = null) => {
    const doc = new jsPDF();
    
    // Colors and styling (similar to billing PDF)
    const primaryColor = [41, 98, 255]; // Blue
    const secondaryColor = [107, 114, 128]; // Gray
    const textColor = [17, 24, 39]; // Dark gray
    const successColor = [34, 197, 94]; // Green
    const warningColor = [245, 158, 11]; // Orange

    // Header with company branding
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('EASY2 Laundry Analytics', 105, 16, { align: 'center' });

    // Report title
    doc.setTextColor(...textColor);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`${tabName} Report${sectionName ? ` - ${sectionName}` : ''}`, 105, 40, { align: 'center' });

    // Report details section
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...secondaryColor);

    // Period and generation info
    doc.text(`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, 105, 50, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 58, { align: 'center' });

    let yPos = 75;

    // Add metrics based on tab
    if (tabName === 'Sales Analytics' || tabName === 'Sales') {
      // KPIs Section
      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFont(undefined, 'bold');
      doc.text('KEY PERFORMANCE INDICATORS', 20, yPos + 5);
      yPos += 15;

      doc.setFont(undefined, 'normal');
      doc.setTextColor(...textColor);
      doc.text(`Total Revenue: KWD ${salesAnalytics.totalRevenue?.toLocaleString() || 0}`, 20, yPos);
      doc.text(`Total Orders: ${salesAnalytics.totalOrders?.toLocaleString() || 0}`, 110, yPos);
      yPos += 8;
      doc.text(`Average Order Value: KWD ${salesAnalytics.avgOrderValue?.toFixed(2) || 0}`, 20, yPos);
      doc.text(`Revenue Growth: ${salesAnalytics.revenueGrowth >= 0 ? '+' : ''}${salesAnalytics.revenueGrowth?.toFixed(1) || 0}%`, 110, yPos);
      yPos += 15;

      // Top Services Section
      if (salesAnalytics.topServices && salesAnalytics.topServices.length > 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos, 180, 8, 'F');
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text('TOP SERVICES', 20, yPos + 5);
        yPos += 15;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...textColor);
        salesAnalytics.topServices.slice(0, 10).forEach((service, index) => {
          doc.text(`${index + 1}. ${service.service}`, 20, yPos);
          doc.text(`${service.quantity} orders`, 150, yPos);
          yPos += 6;
        });
        yPos += 10;
      }

      // Payment Methods Section
      if (salesAnalytics.paymentMethodChart && salesAnalytics.paymentMethodChart.length > 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos, 180, 8, 'F');
        doc.setTextColor(...primaryColor);
        doc.setFont(undefined, 'bold');
        doc.text('PAYMENT METHODS', 20, yPos + 5);
        yPos += 15;

        doc.setFont(undefined, 'normal');
        doc.setTextColor(...textColor);
        salesAnalytics.paymentMethodChart.forEach((method, index) => {
          const percentage = ((method.value / salesAnalytics.totalOrders) * 100).toFixed(1);
          doc.text(`${method.name}: ${method.value} orders (${percentage}%)`, 20, yPos);
          yPos += 6;
        });
      }
    }

    // Add daily performance table if available
    if (dailyMetrics.dailyTable && dailyMetrics.dailyTable.length > 0) {
      // Check if we need a new page
      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(248, 250, 252);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setTextColor(...primaryColor);
      doc.setFont(undefined, 'bold');
      doc.text('DAILY PERFORMANCE SUMMARY', 20, yPos + 5);
      yPos += 15;

      // Table header
      doc.setFillColor(...primaryColor);
      doc.rect(15, yPos, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text('Date', 20, yPos + 5);
      doc.text('Orders', 60, yPos + 5);
      doc.text('Pickups', 100, yPos + 5);
      doc.text('Deliveries', 140, yPos + 5);
      doc.text('Sales (KWD)', 170, yPos + 5);
      yPos += 10;

      // Table rows
      doc.setTextColor(...textColor);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      
      dailyMetrics.dailyTable.slice(0, 15).forEach((day, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(15, yPos - 2, 180, 6, 'F');
        }

        doc.text(new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), 20, yPos + 2);
        doc.text(day.orders.toString(), 60, yPos + 2);
        doc.text(day.pickups.toString(), 100, yPos + 2);
        doc.text(day.deliveries.toString(), 140, yPos + 2);
        doc.text(day.sales.toFixed(2), 170, yPos + 2);
        yPos += 6;
      });
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text('Generated by EASY2 Laundry Management System', 105, 285, { align: 'center' });

    doc.save(`${tabName.toLowerCase().replace(' ', '-')}${sectionName ? `-${sectionName.toLowerCase()}` : ''}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToExcel = (tabName, data, sectionName = null) => {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet with proper formatting
    if (tabName === 'Sales Analytics' || tabName === 'Sales') {
      const summaryData = [
        ['EASY2 Laundry - Sales Analytics Report', '', '', ''],
        [`Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`, '', '', ''],
        ['Generated:', new Date().toLocaleString(), '', ''],
        ['', '', '', ''],
        ['KEY PERFORMANCE INDICATORS', '', '', ''],
        ['Metric', 'Value', 'Trend', 'Notes'],
        ['Total Revenue', `KWD ${salesAnalytics.totalRevenue?.toLocaleString() || 0}`, salesAnalytics.revenueGrowth >= 0 ? '↗️' : '↘️', 'Monthly Revenue'],
        ['Total Orders', salesAnalytics.totalOrders || 0, '', 'Order Count'],
        ['Average Order Value', `KWD ${salesAnalytics.avgOrderValue?.toFixed(2) || 0}`, '', 'Per Order'],
        ['Revenue Growth', `${salesAnalytics.revenueGrowth?.toFixed(1) || 0}%`, salesAnalytics.revenueGrowth >= 0 ? 'Growing' : 'Declining', 'Month over Month'],
        ['', '', '', ''],
      ];

      // Add top services
      if (salesAnalytics.topServices && salesAnalytics.topServices.length > 0) {
        summaryData.push(['TOP SERVICES', '', '', '']);
        summaryData.push(['Rank', 'Service Name', 'Orders', 'Percentage']);
        salesAnalytics.topServices.forEach((service, index) => {
          const percentage = ((service.quantity / salesAnalytics.totalOrders) * 100).toFixed(1);
          summaryData.push([index + 1, service.service, service.quantity, `${percentage}%`]);
        });
        summaryData.push(['', '', '', '']);
      }

      // Add payment methods
      if (salesAnalytics.paymentMethodChart && salesAnalytics.paymentMethodChart.length > 0) {
        summaryData.push(['PAYMENT METHODS', '', '', '']);
        summaryData.push(['Method', 'Count', 'Percentage', 'Notes']);
        salesAnalytics.paymentMethodChart.forEach(method => {
          const percentage = ((method.value / salesAnalytics.totalOrders) * 100).toFixed(1);
          summaryData.push([method.name, method.value, `${percentage}%`, '']);
        });
      }

      const summaryWS = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Style the header
      summaryWS['A1'] = { v: summaryData[0][0], s: { font: { bold: true, sz: 16 }, fill: { fgColor: { rgb: "2962FF" } } } };
      
      XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary');
    }

    // Daily performance sheet
    if (dailyMetrics.dailyTable && dailyMetrics.dailyTable.length > 0) {
      const dailyData = [
        ['Daily Performance Report', '', '', '', ''],
        ['Date', 'Orders', 'Pickups', 'Deliveries', 'Sales (KWD)'],
      ];
      
      dailyMetrics.dailyTable.forEach(day => {
        dailyData.push([
          new Date(day.date).toLocaleDateString(),
          day.orders,
          day.pickups,
          day.deliveries,
          day.sales.toFixed(2)
        ]);
      });
      
      const dailyWS = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, dailyWS, 'Daily Performance');
    }

    XLSX.writeFile(wb, `${tabName.toLowerCase().replace(' ', '-')}${sectionName ? `-${sectionName.toLowerCase()}` : ''}-${new Date().toISOString().split('T')[0]}.xlsx`);
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
                      onClick={() => exportToPDF('Sales Analytics', salesAnalytics, 'KPIs')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Sales Analytics', salesAnalytics, 'KPIs')}
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

              {/* Daily Sales Chart - Moved up */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Daily Sales Trend</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Sales Analytics', salesAnalytics.dailySales, 'Daily-Sales')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Sales Analytics', salesAnalytics.dailySales, 'Daily-Sales')}
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

              {/* Payment Methods & Top Services - Now below chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Payment Methods</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToPDF('Sales Analytics', salesAnalytics.paymentMethodChart, 'Payment-Methods')}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => exportToExcel('Sales Analytics', salesAnalytics.paymentMethodChart, 'Payment-Methods')}
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
                        onClick={() => exportToPDF('Sales Analytics', salesAnalytics.topServices, 'Top-Services')}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => exportToExcel('Sales Analytics', salesAnalytics.topServices, 'Top-Services')}
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

              {/* New AOV Trend & Metrics Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Average Order Value Trend</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToPDF('Sales Analytics', salesAnalytics.avgOrderValue, 'AOV-Trend')}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => exportToExcel('Sales Analytics', salesAnalytics.avgOrderValue, 'AOV-Trend')}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-sm text-purple-600">Current AOV</p>
                        <p className="text-2xl font-bold text-purple-800">KWD {salesAnalytics.avgOrderValue?.toFixed(2) || 0}</p>
                      </div>
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-600">AOV Growth</p>
                        <p className={`text-2xl font-bold ${salesAnalytics.revenueGrowth >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                          {salesAnalytics.revenueGrowth >= 0 ? '+' : ''}{salesAnalytics.revenueGrowth?.toFixed(1) || 0}%
                        </p>
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <p className="text-sm text-gray-600">
                        Target AOV: <span className="font-medium">KWD {(salesAnalytics.avgOrderValue * 1.1)?.toFixed(2) || 0}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">AOV Analytics Chart</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportToPDF('Sales Analytics', salesAnalytics, 'AOV-Chart')}
                        className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        📄
                      </button>
                      <button
                        onClick={() => exportToExcel('Sales Analytics', salesAnalytics, 'AOV-Chart')}
                        className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                      >
                        📊
                      </button>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesAnalytics.dailySales || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`KWD ${(value / (salesAnalytics.totalOrders || 1)).toFixed(2)}`, 'Avg Order Value']} />
                        <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={0.6} fill="#8884d8" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Enhanced Daily Performance Table */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Daily Performance Summary</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportToPDF('Sales Analytics', dailyMetrics.dailyTable, 'Daily-Performance')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Sales Analytics', dailyMetrics.dailyTable, 'Daily-Performance')}
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
                        {!selectedStaff && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pickups</th>}
                        {!selectedStaff && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Deliveries</th>}
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Sales (KWD)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(dailyMetrics.dailyTable || []).slice(0, 15).map((day, index) => (
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
                          {!selectedStaff && (
                            <td className="px-4 py-2 text-sm font-semibold text-purple-600">
                              {day.pickups}
                            </td>
                          )}
                          {!selectedStaff && (
                            <td className="px-4 py-2 text-sm font-semibold text-orange-600">
                              {day.deliveries}
                            </td>
                          )}
                          <td className="px-4 py-2 text-sm font-semibold text-green-600">
                            {(typeof day.sales === 'number' && !isNaN(day.sales) ? day.sales : 0).toFixed(2)}
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
                      onClick={() => exportToPDF('Branch Analytics', branchAnalytics.branchPerformance, 'Branch-Performance')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Branch Analytics', branchAnalytics.branchPerformance, 'Branch-Performance')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>

                {/* Branch Performance Chart */}
                <div className="mb-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={branchAnalytics.branchChart || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" />
                        <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Revenue (KWD)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(branchAnalytics.branchPerformance || []).map((branch, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-6 h-6 text-blue-500" />
                          <div>
                            <h4 className="font-medium text-gray-900">{branch.name}</h4>
                            <p className="text-sm text-gray-600">{branch.orders} orders • KWD {branch.revenue.toFixed(2)} revenue</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Staff Performance in Branch */}
                      {Object.keys(branch.staff || {}).length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Staff Performance:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {Object.values(branch.staff).map((staff, staffIndex) => (
                              <div key={staffIndex} className="bg-white p-2 rounded border">
                                <p className="text-xs font-medium">{staff.name}</p>
                                <p className="text-xs text-gray-500">{staff.role}</p>
                                <p className="text-xs text-blue-600">
                                  {staff.orders} orders • KWD {staff.revenue.toFixed(2)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
                      onClick={() => exportToPDF('Customer Analytics', customerAnalytics, 'Customer-Analytics')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Customer Analytics', customerAnalytics, 'Customer-Analytics')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

                {/* Customer Segmentation Chart */}
                <div className="bg-white p-4 rounded-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Segmentation</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={customerAnalytics.customerSegmentation || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {(customerAnalytics.customerSegmentation || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
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
                      onClick={() => exportToPDF('Loss Analytics', lostAnalytics, 'Loss-Analysis')}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                    >
                      📄
                    </button>
                    <button
                      onClick={() => exportToExcel('Loss Analytics', lostAnalytics, 'Loss-Analysis')}
                      className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                    >
                      📊
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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

                {/* Loss Reasons Chart */}
                {lostAnalytics.lossChart && lostAnalytics.lossChart.length > 0 && (
                  <div className="bg-white p-4 rounded-lg border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Cancellation Reasons</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={lostAnalytics.lossChart}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {lostAnalytics.lossChart.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}