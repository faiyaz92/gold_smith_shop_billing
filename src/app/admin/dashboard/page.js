'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    Users,
    Package,
    ShoppingBag,
    LogOut,
    Menu,
    X,
    Home,
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
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';

export default function AdminDashboard() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    const [userCount, setUserCount] = useState(0);
    const [productCount, setProductCount] = useState(0);
    const [orderCount, setOrderCount] = useState(0);

    useEffect(() => {
        setIsClient(true);
        const authStatus = localStorage.getItem('adminAuth');
        if (authStatus !== 'true') {
            router.push('/admin/login');
        } else {
            const fetchCounts = async () => {
                try {
                    const usersSnapshot = await getDocs(collection(db, 'users'));
                    const productsSnapshot = await getDocs(collection(db, 'products'));
                    const ordersSnapshot = await getDocs(collection(db, 'orders'));

                    setUserCount(usersSnapshot.size);
                    setProductCount(productsSnapshot.size);
                    setOrderCount(ordersSnapshot.size);
                } catch (error) {
                    console.error('Error fetching dashboard counts:', error);
                } finally {
                    setTimeout(() => setIsLoading(false), 1500);
                }
            };

            fetchCounts();
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('adminAuth');
        router.push('/admin/login');
    };

    const handleNavigation = (path) => {
        setActiveTab(path);
        setIsMobileMenuOpen(false);
        if (path !== 'dashboard') {
            router.push(`/admin/${path}`);
        }
    };

    const stats = [
        {
            label: 'Total Users',
            value: userCount,
            icon: <Users className="w-5 h-5 sm:w-6 sm:h-6" />,
            change: '+12%',
        },
        {
            label: 'Total Products',
            value: productCount,
            icon: <Package className="w-5 h-5 sm:w-6 sm:h-6" />,
            change: '+5%',
        },
        {
            label: 'Total Orders',
            value: orderCount,
            icon: <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />,
            change: '+23%',
        },
    ];

    const ordersData = [
        { name: 'Jan', orders: 65, returns: 4 },
        { name: 'Feb', orders: 59, returns: 3 },
        { name: 'Mar', orders: 80, returns: 6 },
        { name: 'Apr', orders: 81, returns: 5 },
        { name: 'May', orders: 56, returns: 2 },
        { name: 'Jun', orders: 55, returns: 3 },
        { name: 'Jul', orders: 70, returns: 4 },
    ];

    if (!isClient) return null;

    return (
        <div className="min-h-screen bg-white text-gray-800">
            {/* Navbar */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6 bg-white backdrop-blur-md border-b border-blue-500/30 shadow-sm"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent"
                >
                    EASY2 Admin
                </motion.div>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center space-x-6 text-sm">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
                        { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
                        { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
                        { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
                    ].map((item) => (
                        <motion.button
                            key={item.id}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${activeTab === item.id
                                ? 'bg-blue-500/20 text-blue-700 border border-blue-500/30'
                                : 'hover:text-blue-600'
                                }`}
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
                        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-600 border border-red-200"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </motion.button>
                </div>

                {/* Mobile Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="md:hidden p-2 text-blue-600"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.button>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden bg-white backdrop-blur-lg border-b border-blue-500/20 overflow-hidden shadow-md"
                    >
                        <div className="flex flex-col space-y-2 p-4">
                            {[
                                { id: 'dashboard', label: 'Dashboard' },
                                { id: 'products', label: 'Products' },
                                { id: 'orders', label: 'Orders' },
                                { id: 'users', label: 'Users' },
                            ].map((item) => (
                                <motion.button
                                    key={item.id}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-3 text-left rounded-md ${activeTab === item.id ? 'bg-blue-500/20 text-blue-700' : 'hover:bg-gray-100'
                                        }`}
                                    onClick={() => handleNavigation(item.id)}
                                >
                                    {item.label}
                                </motion.button>
                            ))}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-3 text-left rounded-md bg-red-100 hover:bg-red-200 text-red-600"
                            >
                                <LogOut className="w-5 h-5" />
                                <span>Logout</span>
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                {/* Stats Cards */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8"
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
                                className="relative overflow-hidden bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-blue-400 transition-all duration-300"
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

                {/* Chart Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200"
                >
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Analytics</h3>
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
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="returns" fill="#ef4444" name="Returns" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}