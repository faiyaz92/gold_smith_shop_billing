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
                                ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                : 'hover:text-yellow-400'
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
                        className="flex items-center space-x-1 px-3 py-1 rounded-md bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/20"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                    </motion.button>
                </div>

                {/* Mobile Button */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="md:hidden p-2 text-yellow-400"
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
                        className="md:hidden bg-gray-800/95 backdrop-blur-lg border-b border-yellow-500/20 overflow-hidden"
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
                                    className={`px-4 py-3 text-left rounded-md ${activeTab === item.id ? 'bg-yellow-500/10 text-yellow-400' : 'hover:bg-gray-700/50'
                                        }`}
                                    onClick={() => handleNavigation(item.id)}
                                >
                                    {item.label}
                                </motion.button>
                            ))}
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-4 py-3 text-left rounded-md bg-red-900/30 hover:bg-red-900/50 text-red-400"
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
                                className="h-32 bg-gray-800/50 rounded-xl"
                            />
                        ) : (
                            <motion.div
                                key={index}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                whileHover={{ y: -5 }}
                                className="relative overflow-hidden bg-gray-800/50 border border-gray-700 rounded-xl p-5 backdrop-blur-sm hover:border-yellow-500/30 transition-all duration-300"
                            >
                                <div className="absolute -right-5 -top-5 w-20 h-20 bg-yellow-500/10 rounded-full blur-xl"></div>
                                <div className="flex items-start justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-400">{stat.label}</span>
                                        <span className="text-2xl sm:text-3xl font-bold mt-2">{stat.value}</span>
                                        <span className="text-xs mt-2 text-green-400">{stat.change}</span>
                                    </div>
                                    <div className="p-3 bg-yellow-500/10 rounded-lg">{stat.icon}</div>
                                </div>
                            </motion.div>
                        )
                    )}
                </motion.div>

                {/* Chart section can go here */}
            </div>
        </div>
    );
}