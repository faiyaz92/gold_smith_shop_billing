'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [orders, setOrders] = useState([
    { status: 'Pending', rawTimestamp: { toDate: () => new Date() } },
    { status: 'Completed', rawTimestamp: { toDate: () => new Date() } },
    { status: 'Processing', rawTimestamp: { toDate: () => new Date() } },
    { status: 'Delivered', rawTimestamp: { toDate: () => new Date() } },
    { status: 'Pending', rawTimestamp: { toDate: () => new Date() } },
  ]);
  const [topSellingItems, setTopSellingItems] = useState([]);

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

        const orders = snapshot.docs
          .map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(),
            timestamp: docSnap.data().timestamp?.toDate() || new Date(),
            status: docSnap.data().status || 'Pending',
            total: Number(docSnap.data().total || 0),
            items: docSnap.data().items || [], // Ensure items array exists
          }))
          .filter(order =>
            order.timestamp >= startDate &&
            order.timestamp <= new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
          );

        setTotalSales(orders.reduce((sum, order) => sum + (order.total || 0), 0));

        // Calculate top-selling items
        const itemQuantities = {};
        orders.forEach(order => {
          order.items.forEach(item => {
            const itemKey = `${item.name}|${item.categoryName || 'Other'}`; // Unique key by name and category
            if (!itemQuantities[itemKey]) {
              itemQuantities[itemKey] = {
                name: item.name,
                category: item.categoryName || 'Other',
                totalQuantity: 0,
              };
            }
            itemQuantities[itemKey].totalQuantity += Number(item.quantity || 1);
          });
        });

        const topItems = Object.values(itemQuantities)
          .sort((a, b) => b.totalQuantity - a.totalQuantity)
          .slice(0, 5); // Top 5 items
        setTopSellingItems(topItems);

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
  }, [router, startDate, endDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date) => {
    if (!date) return false;
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  };

  const todaysPlacedOrders = orders.filter(order => isToday(order.rawTimestamp?.toDate())).length;
  const todaysDeliveredOrders = orders.filter(order => 
    (order.status === 'Completed' || order.status === 'Delivered') && isToday(order.rawTimestamp?.toDate())
  ).length;
  const pendingOrders = orders.filter(order => order.status === 'Pending').length;
  const todaysDelivery = orders.filter(order =>
    (order.status === 'Completed' || order.status === 'Delivered') && isToday(order.rawTimestamp?.toDate())
  ).length;
  const todaysPickup = orders.filter(order =>
    (order.status === 'Processing' || order.status === 'PickedUp') && isToday(order.rawTimestamp?.toDate())
  ).length;

  const stats = [
    {
      label: 'Total Sales',
      value: `₹${totalSales.toLocaleString()}`,
      icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '',
      onClick: () => {},
      bgColor: 'bg-blue-400/10',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Orders',
      value: orderCount,
      icon: <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+23%',
      onClick: () => router.push('/admin/orders'),
      bgColor: 'bg-blue-400/10',
      textColor: 'text-blue-600',
    },
    {
      label: 'Pending Orders',
      value: pendingOrders,
      icon: <Clock className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '',
      onClick: () => router.push('/admin/orders'),
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      label: "Today's Placed Orders",
      value: todaysPlacedOrders,
      icon: <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '',
      onClick: () => router.push('/admin/orders'),
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: "Today's Delivered Orders",
      value: todaysDeliveredOrders,
      icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '',
      onClick: () => router.push('/admin/orders'),
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      label: "Today's Delivery",
      value: todaysDelivery,
      icon: <Truck className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '',
      onClick: () => router.push('/admin/orders'),
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700',
    },
    {
      label: "Today's Pickup",
      value: todaysPickup,
      icon: <PackageCheck className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '',
      onClick: () => router.push('/admin/orders'),
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      label: 'Total Users',
      value: userCount,
      icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+12%',
      onClick: () => router.push('/admin/users'),
      bgColor: 'bg-blue-400/10',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Products',
      value: productCount,
      icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+5%',
      onClick: () => router.push('/admin/products'),
      bgColor: 'bg-blue-400/10',
      textColor: 'text-blue-600',
    },
    {
      label: 'Total Inquiries',
      value: inquiryCount,
      icon: <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />,
      change: '+10%',
      onClick: () => router.push('/admin/inquiries'),
      bgColor: 'bg-blue-400/10',
      textColor: 'text-blue-600',
    },
  ];

  if (!isClient) return null;

  return (
    <AdminLayout>
      {/* Sticky Header */}
      <div className="block lg:hidden sticky top-0 w-full h-1 bg-gray-200 mt-1" />
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
      {/* Dashboard Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 mt-1"
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
                <div className={`p-3 ${stat.bgColor} rounded-lg ${stat.textColor}`}>{stat.icon}</div>
              </div>
            </motion.div>
          )
        )}
      </motion.div>
 {/* Top Selling Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 mb-8"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Items</h3>
        {isLoading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : topSellingItems.length === 0 ? (
          <div className="text-center text-gray-500">No items found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-blue-50 text-blue-800 text-xs sm:text-sm">
                <tr>
                  <th className="p-3 text-left border-b border-gray-200">Item Name</th>
                  <th className="p-3 text-left border-b border-gray-200">Category</th>
                  <th className="p-3 text-left border-b border-gray-200">Total Quantity Sold</th>
                </tr>
              </thead>
              <tbody>
                {topSellingItems.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-blue-50 text-xs sm:text-sm">
                    <td className="p-3">{item.name}</td>
                    <td className="p-3">{item.category}</td>
                    <td className="p-3">{item.totalQuantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
     

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
        transition={{ delay: 0.4, duration: 0.5 }}
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
    </AdminLayout>
  );
}