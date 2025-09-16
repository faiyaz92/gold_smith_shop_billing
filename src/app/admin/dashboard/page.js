'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  Package,
  ShoppingBag,
  MessageSquare,
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
} from 'recharts';
import { motion } from 'framer-motion';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebase';
import Footer from '@/app/Componenets/Footer';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import AdminLayout from '../AdminLayout';

export default function AdminDashboard() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [userCount, setUserCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [ordersData, setOrdersData] = useState([]);
  const [totalSales, setTotalSales] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [endDate, setEndDate] = useState(() => new Date());
  const [salesChartData, setSalesChartData] = useState([]);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const usersPath = `${tenantCompaniesPath}/${companyId}/users`;
  const productsPath = `${tenantCompaniesPath}/${companyId}/products`;
  const ordersPath = `${tenantCompaniesPath}/${companyId}/orders`;
  const contactPath = `${tenantCompaniesPath}/${companyId}/contactUs`;

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }

    // Real-time listeners
    const unsubUsers = onSnapshot(collection(db, usersPath), (snapshot) => {
      setUserCount(snapshot.size);
    });

    const unsubProducts = onSnapshot(collection(db, productsPath), (snapshot) => {
      setProductCount(snapshot.size);
    });

    const unsubOrders = onSnapshot(
      query(collection(db, ordersPath), orderBy('timestamp', 'desc')),
      (snapshot) => {
        setOrderCount(snapshot.size);

        // Filter orders by selected date range
        const orders = snapshot.docs
          .map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            timestamp: docSnap.data().timestamp?.toDate() || new Date(),
            status: docSnap.data().status || 'Pending',
            total: Number(docSnap.data().total || 0),
          }))
          .filter(order =>
            order.timestamp >= startDate &&
            order.timestamp <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
          );

        // Total sales calculation
        const sales = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        setTotalSales(sales);

        // Sales chart data (by day)
        const salesByDay = {};
        for (let i = 0; i < 30; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().slice(0, 10);
          salesByDay[key] = 0;
        }
        orders.forEach(order => {
          const key = order.timestamp.toISOString().slice(0, 10);
          if (salesByDay[key] !== undefined) {
            salesByDay[key] += order.total || 0;
          }
        });
        setSalesChartData(
          Object.entries(salesByDay).map(([date, value]) => ({
            date,
            Sales: value,
          }))
        );

        // Order status chart data (by month and status)
        const months = [];
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          months.push({
            name: date.toLocaleString('default', { month: 'short' }),
            Pending: 0,
            Processing: 0,
            Shipped: 0,
            Completed: 0,
            Cancelled: 0,
          });
        }
        orders.forEach(order => {
          const orderDate = new Date(order.timestamp);
          const monthIndex = months.findIndex(
            month => month.name === orderDate.toLocaleString('default', { month: 'short' })
          );
          if (monthIndex !== -1 && order.status in months[monthIndex]) {
            months[monthIndex][order.status]++;
          }
        });
        setOrdersData(months);
        setIsLoading(false);
      }
    );

    const unsubInquiries = onSnapshot(collection(db, contactPath), (snapshot) => {
      setInquiryCount(snapshot.size);
    });

    return () => {
      unsubUsers();
      unsubProducts();
      unsubOrders();
      unsubInquiries();
    };
  // Add startDate and endDate as dependencies
  }, [router, startDate, endDate]);

  const stats = [
    {
      label: 'Total Users',
      value: userCount,
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+12%', // Placeholder
      onClick: () => router.push('/admin/users'),
    },
    {
      label: 'Total Products',
      value: productCount,
      icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+5%', // Placeholder
      onClick: () => router.push('/admin/products'),
    },
    {
      label: 'Total Orders',
      value: orderCount,
      icon: <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+23%', // Placeholder
      onClick: () => router.push('/admin/orders'),
    },
    {
      label: 'Total Inquiries',
      value: inquiryCount,
      icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+10%', // Placeholder
      onClick: () => router.push('/admin/inquiries'),
    },
    {
      label: 'Total Sales',
      value: `₹${totalSales.toLocaleString()}`,
      icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '', // Placeholder
      onClick: () => {},
    },
  ];

  if (!isClient) return null;

  return (
    <AdminLayout>
      {/* Dashboard Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8"
      >
        {stats.map((stat, index) =>
          isLoading ? (
            <motion.div
              key={index}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0.8 }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1 }}
              className="h-32 bg-gray-200/50 rounded-xl"
            />
          ) : (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ y: -5 }}
              className="relative overflow-hidden bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-400 transition-all duration-300 cursor-pointer"
              onClick={stat.onClick}
            >
              <div className="absolute -right-5 -top-5 w-20 h-20 bg-blue-400/10 rounded-full blur-xl"></div>
              <div className="flex items-start justify-between">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-600">{stat.label}</span>
                  <span className="text-2xl sm:text-3xl font-bold mt-2 text-gray-800">{stat.value}</span>
                  <span className="text-xs mt-2 text-green-600">{stat.change}</span>
                </div>
                <div className="p-3 bg-blue-400/10 rounded-lg text-blue-600">{stat.icon}</div>
              </div>
            </motion.div>
          )
        )}
      </motion.div>

      {/* Date Range Picker */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <label className="font-medium text-gray-700">Filter Orders By Date:</label>
        <DatePicker
          selected={startDate}
          onChange={date => setStartDate(date)}
          selectsStart
          startDate={startDate}
          endDate={endDate}
          maxDate={endDate}
          className="border px-3 py-2 rounded mr-2"
          dateFormat="yyyy-MM-dd"
        />
        <span className="mx-2">to</span>
        <DatePicker
          selected={endDate}
          onChange={date => setEndDate(date)}
          selectsEnd
          startDate={startDate}
          endDate={endDate}
          minDate={startDate}
          maxDate={new Date()}
          className="border px-3 py-2 rounded"
          dateFormat="yyyy-MM-dd"
        />
      </div>

      {/* Sales Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-8"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales Chart</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={salesChartData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => `₹${value}`}
              />
              <Legend />
              <Bar dataKey="Sales" fill="#3b82f6" name="Sales" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Order Status Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Status Analytics</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={ordersData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" stroke="#666" />
              <YAxis stroke="#666" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '0.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              />
              <Legend />
              <Bar dataKey="Pending" fill="#3b82f6" name="Pending" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Processing" fill="#f59e0b" name="Processing" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Shipped" fill="#10b981" name="Shipped" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Completed" fill="#6366f1" name="Completed" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Cancelled" fill="#ef4444" name="Cancelled" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      <Footer />
    </AdminLayout>
  );
}
