'use client';

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Boxes, Tags, ListTree, Home, ShoppingBag, Users, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function ProductsPage() {
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('products');

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

    const productCards = [
        {
            id: 'categories',
            title: 'Categories',
            description: 'Manage product categories',
            icon: <ListTree className="w-8 h-8 text-blue-600" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'subcategories',
            title: 'Subcategories',
            description: 'Manage product subcategories',
            icon: <Boxes className="w-8 h-8 text-blue-500" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'product',
            title: 'Product',
            description: 'Manage all product',
            icon: <Package className="w-8 h-8 text-blue-700" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        }
    ];

    const handleProductsNavigation = (path) => {
        router.push(`/admin/products/${path}`);
    };

    return (
        <div className="min-h-screen bg-white text-gray-800">
            {/* Navbar - Same as dashboard */}
            <motion.nav
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6 bg-white backdrop-blur-md border-b border-blue-200 shadow-sm"
            >
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent"
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
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
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
                        className="md:hidden bg-white backdrop-blur-lg border-b border-blue-200 shadow-sm overflow-hidden"
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
                                    className={`px-4 py-3 text-left rounded-md ${activeTab === item.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50'
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">Products Management</h1>
                    <p className="text-gray-600">Manage your store&apos;s products, categories, and subcategories</p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {productCards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`p-6 rounded-xl border ${card.borderColor} ${card.bgColor} backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-md`}
                            onClick={() => handleProductsNavigation(card.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2 text-blue-800">{card.title}</h3>
                                    <p className="text-gray-600 text-sm">{card.description}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-white">
                                    {card.icon}
                                </div>
                            </div>
                            <motion.div 
                                whileHover={{ x: 5 }}
                                className="mt-4 text-sm text-blue-600 flex items-center"
                            >
                                Go to {card.title.toLowerCase()} →
                            </motion.div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}