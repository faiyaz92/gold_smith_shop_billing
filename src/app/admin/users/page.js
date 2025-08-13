'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Search,
  Loader2,
  LayoutDashboard,
  Package,
  ShoppingCart
} from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';

export default function AdminUsers() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      fetchUsers();
    }
  }, [router]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastLogin: formatLastLogin(doc.data().lastLogin),
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastLogin = (timestamp) => {
    if (!timestamp) return 'Never logged in';
    const now = new Date();
    const loginDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - loginDate) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return loginDate.toLocaleDateString();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    router.push('/admin/login');
  };

  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false);
    router.push(`/admin/${path}`);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isClient) return null;

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 sm:px-6 bg-white shadow-md border-b border-blue-200"
      >
        <div className="flex items-center justify-between w-full md:w-auto">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
          >
            EASY2 Admin
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="md:hidden p-2 text-blue-600"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 text-sm">
          <button onClick={() => handleNavigation('dashboard')} className="flex items-center gap-2 hover:text-blue-600">
            <LayoutDashboard size={16} /> Dashboard
          </button>
          <button onClick={() => handleNavigation('products')} className="flex items-center gap-2 hover:text-blue-600">
            <Package size={16} /> Products
          </button>
          <button onClick={() => handleNavigation('orders')} className="flex items-center gap-2 hover:text-blue-600">
            <ShoppingCart size={16} /> Orders
          </button>
          <button className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-md border border-blue-200">
            <Users size={16} /> Users
          </button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-700 border border-red-200">
            <LogOut size={16} /> Logout
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="mt-3 flex flex-col space-y-2 md:hidden text-sm">
            <button onClick={() => handleNavigation('dashboard')} className="flex items-center gap-2 px-3 py-2 hover:text-blue-600">
              <LayoutDashboard size={16} /> Dashboard
            </button>
            <button onClick={() => handleNavigation('products')} className="flex items-center gap-2 px-3 py-2 hover:text-blue-600">
              <Package size={16} /> Products
            </button>
            <button onClick={() => handleNavigation('orders')} className="flex items-center gap-2 px-3 py-2 hover:text-blue-600">
              <ShoppingCart size={16} /> Orders
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 border border-blue-200 rounded-md">
              <Users size={16} /> Users
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 rounded-md">
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </motion.nav>

      {/* Main Content */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100 text-gray-700 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left">SR No</th>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Last Login</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                        <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.role || 'User'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {user.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{user.lastLogin}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="space-x-2">
                          <button className="text-blue-600 hover:text-blue-800">Edit</button>
                          <button className="text-red-600 hover:text-red-800">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}