'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Package, Boxes, ListTree, TrendingUp } from 'lucide-react';
import AdminLayout from '../AdminLayout'; // Change this line

export default function ProductsPage() {
    const router = useRouter();

    const productCards = [
        {
            id: 'categories',
            title: 'Categories',
            description: 'Manage metal categories',
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
            title: 'Products',
            description: 'Manage product catalog',
            icon: <Package className="w-8 h-8 text-blue-700" />,
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'metal-rates',
            title: 'Metal Rates',
            description: 'Update metal rates and conversions',
            icon: <TrendingUp className="w-8 h-8 text-green-600" />,
            bgColor: 'bg-green-50',
            borderColor: 'border-green-200'
        }
    ];

    const handleProductsNavigation = (path) => {
        router.push(`/admin/products/${path}`);
    };

    return (
        <AdminLayout> {/* Use AdminLayout instead of div and AdminHeader */}
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
        </AdminLayout>
    );
}