
"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, ChevronDown, ChevronUp, Package, ShoppingBag, Users, Home } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/app/firebase';

export default function AdminOrders() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      const fetchOrders = async () => {
        try {
          const q = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
          const snapshot = await getDocs(q);
          const fetchedOrders = snapshot.docs.map(docSnap => {
            const data = docSnap.data();
            const orderDate = data.timestamp?.toDate();
            const deliveryDate = data.deliveryDate?.toDate() || new Date(orderDate?.getTime() + 5 * 86400000);
            return {
              id: docSnap.id,
              customer: data.name || "No Name",
              email: data.email || "N/A",
              address: `${data.address || ''}, ${data.city || ''}, ${data.zip || ''}`,
              items: data.cart || [],
              amount: Number(data.total) || 0,
              paymentMethod: data.paymentMethod || "N/A",
              paymentId: data.paymentId || "",
              status: data.status || "Pending",
              date: orderDate?.toLocaleDateString() || 'Invalid/Missing Timestamp',
              rawTimestamp: data.timestamp,
              deliveryDate: deliveryDate,
            };
          });
          setOrders(fetchedOrders);
        } catch (err) {
          console.error('Error fetching orders from Firestore:', err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrders();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/admin/login');
  };

  const handleNavigation = (path) => {
    router.push(`/admin/${path}`);
  };

  const toggleOrderExpand = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: newStatus });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleDeliveryDateChange = async (orderId, newDate) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const deliveryDate = new Date(newDate);
      await updateDoc(orderRef, { deliveryDate });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, deliveryDate } : o));
    } catch (err) {
      console.error("Failed to update delivery date", err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter ? order.status === statusFilter : true;

    const now = new Date();
    const orderDate = order.rawTimestamp?.toDate() || new Date(0);
    let matchesDate = true;
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      matchesDate = orderDate >= sevenDaysAgo;
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      matchesDate = orderDate >= thirtyDaysAgo;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6 bg-gray-900/80 backdrop-blur-md border-b border-yellow-500/30"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-xl font-bold tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent"
        >
          EASY2 Admin
        </motion.div>

        <div className="hidden md:flex items-center space-x-6 text-sm">
          {[{ id: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
          { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
          { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> }].map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${item.id === 'orders' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'hover:text-yellow-400'}`}
              onClick={() => handleNavigation(item.id)}
            >
              {item.icon}
              {item.label}
            </motion.button>
          ))}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center space-x-1 px-3 py-1 rounded-md bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </motion.button>
        </div>
      </motion.nav>

      {/* Orders Section */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600 bg-clip-text text-transparent mb-6">Orders Management</h2>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by Order ID or Customer"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-700"
          />

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm rounded px-3 py-2 text-yellow-400"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-sm rounded px-3 py-2 text-yellow-400"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800 text-sm text-gray-300">
                <th className="p-3 border-b border-gray-700">Sr No</th>
                <th className="p-3 border-b border-gray-700">Order ID</th>
                <th className="p-3 border-b border-gray-700">Customer</th>
                <th className="p-3 border-b border-gray-700">Address</th>
                <th className="p-3 border-b border-gray-700">Payment Method</th>
                <th className="p-3 border-b border-gray-700">Amount</th>
                <th className="p-3 border-b border-gray-700">Delivery Date</th>
                <th className="p-3 border-b border-gray-700">Status</th>
                <th className="p-3 border-b border-gray-700">Order Date</th>
                <th className="p-3 border-b border-gray-700">Expand</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={10} className="text-center text-gray-400 p-6">Loading...</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-gray-400 p-6">No orders found</td></tr>
              ) : (
                filteredOrders.map((order, index) => (
                  <>
                    <tr key={order.id} className="hover:bg-gray-800">
                      <td className="p-3 border-b border-gray-700">{index + 1}</td>
                      <td className="p-3 border-b border-gray-700">{order.id}</td>
                      <td className="p-3 border-b border-gray-700">{order.customer}</td>
                      <td className="p-3 border-b border-gray-700">{order.address}</td>
                      <td className="p-3 border-b border-gray-700">{order.paymentMethod}</td>
                      <td className="p-3 border-b border-gray-700">₹{order.amount.toFixed(2)}</td>
                      <td className="p-3 border-b border-gray-700">
                        <input
                          type="date"
                          value={order.deliveryDate.toISOString().split('T')[0]}
                          onChange={(e) => handleDeliveryDateChange(order.id, e.target.value)}
                          className="bg-gray-900 border border-gray-700 text-yellow-400 text-sm rounded px-2 py-1"
                        />
                      </td>
                      <td className="p-3 border-b border-gray-700">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="bg-gray-900 border border-gray-700 text-yellow-400 text-sm rounded px-2 py-1"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-3 border-b border-gray-700">{order.date}</td>
                      <td className="p-3 border-b border-gray-700">
                        <button onClick={() => toggleOrderExpand(order.id)}>
                          {expandedOrder === order.id ? <ChevronUp /> : <ChevronDown />}
                        </button>
                      </td>
                    </tr>
                    {expandedOrder === order.id && (
                      <tr>
                        <td colSpan={10} className="bg-gray-900 p-4">
                          <p className="font-semibold text-yellow-400 mb-2">Order Items:</p>
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm text-gray-300">
                              <span>{item.name} x{item.quantity}</span>
                              <span>₹{Number(item.price || 0).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="mt-3 text-right text-yellow-400 font-semibold">
                            Total: ₹{order.amount.toFixed(2)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
