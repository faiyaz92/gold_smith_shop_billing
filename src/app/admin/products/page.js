'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import AdminLayout from '../AdminLayout';
import { db } from '@/app/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';

export default function ProductsPage() {
  const router = useRouter();
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const categoryPath = `${tenantCompaniesPath}/${companyId}/categories`;
  const subcategoryPath = `${tenantCompaniesPath}/${companyId}/subcategories`;
  const productsPath = `${tenantCompaniesPath}/${companyId}/products`;

  // States
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [filterError, setFilterError] = useState('');
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const fetchData = async () => {
    try {
      setIsDataLoaded(false);
      setFilterError('');

      // Fetch categories, subcategories, and products concurrently
      const [categoriesSnapshot, subcategoriesSnapshot, productsSnapshot] = await Promise.all([
        getDocs(collection(db, categoryPath)),
        getDocs(collection(db, subcategoryPath)),
        getDocs(collection(db, productsPath))
      ]);

      // Process categories
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);

      // Process subcategories
      const subcategoriesData = subcategoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSubcategories(subcategoriesData);

      // Process products with joined category and subcategory names
      const productsData = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const joinedProducts = productsData.map(product => ({
        ...product,
        categoryName: categoriesData.find(cat => cat.id === product.categoryId)?.categoriesname || 'Unknown Category',
        subcategoryName: subcategoriesData.find(subcat => subcat.id === product.subcategoryId)?.name || 'Unknown Subcategory'
      }));
      setProducts(joinedProducts);

      setIsDataLoaded(true);
    } catch (error) {
      console.error('Error fetching data:', error);
      setFilterError('Failed to load data. Please try again.');
      setIsDataLoaded(true);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter products based on selected category and subcategory
  const filteredProducts = products.filter(product => {
    if (selectedSubcategory) {
      return product.subcategoryId === selectedSubcategory;
    }
    if (selectedCategory) {
      return product.categoryId === selectedCategory;
    }
    return true; // Show all products if no filters are applied
  });

  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter(subcat =>
    selectedCategory ? subcat.categoryId === selectedCategory : true
  );

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Header and Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex justify-between items-center"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-2">Products Management</h1>
            <p className="text-gray-600">Manage your store&apos;s products, categories, and subcategories</p>
          </div>
          <div className="flex space-x-4">
            <div className="space-y-2 max-w-xs">
              <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory(''); // Reset subcategory when category changes
                    setFilterError('');
                  }}
                  className="w-full p-2 rounded bg-white border border-blue-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.categoriesname}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
              </div>
            </div>
            <div className="space-y-2 max-w-xs">
              <label className="block text-sm font-medium text-gray-700">Filter by Subcategory</label>
              <div className="relative">
                <select
                  value={selectedSubcategory}
                  onChange={(e) => {
                    setSelectedSubcategory(e.target.value);
                    setFilterError('');
                  }}
                  className="w-full p-2 rounded bg-white border border-blue-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                  disabled={!selectedCategory} // Disable if no category is selected
                >
                  <option value="">All Subcategories</option>
                  {filteredSubcategories.map(subcat => (
                    <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
              </div>
            </div>
          </div>
        </motion.div>
        {/* End Header and Filters Section */}

        {filterError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
            {filterError}
          </div>
        )}

        {!isDataLoaded ? (
          <div className="text-center py-8 text-gray-500">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No products found. Adjust the category or subcategory filter.
          </div>
        ) : (
          <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">Product List</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-blue-600">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Image</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Subcategory</th>
                    <th className="p-3 text-left">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                      <td className="p-3">{product.name || 'Unnamed Product'}</td>
                      <td className="p-3">
                        <div className="relative w-20 h-20 border border-blue-200 rounded overflow-hidden">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name || 'Product image'}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <span className="text-gray-500 text-sm flex items-center justify-center h-full">No Image</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">{product.categoryName}</td>
                      <td className="p-3">{product.subcategoryName}</td>
                      <td className="p-3">₹{product.price ? Number(product.price).toLocaleString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
