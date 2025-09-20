'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/app/firebase';
import Image from 'next/image';
import { Trash2, Edit, Home, Package, ShoppingBag, Users, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadToCloudinary, deleteFromCloudinary } from '@/app/cloudinary'; // Add deleteFromCloudinary here
///Add delete edit products
export default function ProductPage() {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const productPath = `${tenantCompaniesPath}/${companyId}/products`;
  const categoryPath = `${tenantCompaniesPath}/${companyId}/categories`;
  const subcategoryPath = `${tenantCompaniesPath}/${companyId}/subcategories`;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(''); // For filtering product list
  const [selectedSubcategory, setSelectedSubcategory] = useState(''); // For filtering product list
  const [form, setForm] = useState({
    name: '',
    price: '',
    discountedPrice: '',
    image: '',
    categoryId: '',
    subcategoryId: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filterError, setFilterError] = useState('');

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, categoryPath));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setFilterError('Failed to load categories');
    }
  };

  const fetchSubcategories = async (categoryId = '') => {
    try {
      const snapshot = await getDocs(collection(db, subcategoryPath));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filter subcategories by categoryId if provided, otherwise fetch all
      const filteredData = categoryId
        ? data.filter(subcat => subcat.categoryId === categoryId)
        : data;
      setSubcategories(filteredData);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setFilterError('Failed to load subcategories');
    }
  };

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, productPath));
      const data = await Promise.all(
        snapshot.docs.map(async docSnap => {
          const data = docSnap.data();
          const categoryDoc = await getDoc(doc(db, categoryPath, data.categoryId));
          let subcategoryName = 'None';
          if (data.subcategoryId) {
            const subcategoryDoc = await getDoc(doc(db, subcategoryPath, data.subcategoryId));
            subcategoryName = subcategoryDoc.exists() ? subcategoryDoc.data().name : 'Unknown';
          }
          return {
            id: docSnap.id,
            ...data,
            categoryName: categoryDoc.exists() ? categoryDoc.data().categoriesname : 'Unknown',
            subcategoryName
          };
        })
      );
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setFilterError('Failed to load products');
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchSubcategories(); // Fetch all subcategories initially for add product section
  }, []);

  const handleImageUpload = async e => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      setForm({ ...form, image: imageUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleCategoryChange = async e => {
    const categoryId = e.target.value;
    setForm({ ...form, categoryId, subcategoryId: '' }); // Reset subcategory when category changes
    await fetchSubcategories(categoryId); // Fetch subcategories for the selected category
  };

  const handleFilterCategoryChange = async e => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubcategory(''); // Reset subcategory when category changes
    setFilterError('');
    await fetchSubcategories(categoryId); // Fetch subcategories for the selected category
  };

const handleSubmit = async () => {
    if (!form.name || !form.image || !form.price || !form.categoryId) {
      return alert('Name, image, price, and category are required');
    }

    try {
      if (editingId) {
        // Fetch the current product to get the existing image URL
        const productDoc = await getDoc(doc(db, productPath, editingId));
        if (productDoc.exists()) {
          const productData = productDoc.data();
          // Check if a new image is being uploaded (form.image has changed)
          if (form.image !== productData.image && productData.image) {
            // Delete the existing image from Cloudinary
            await deleteFromCloudinary(productData.image);
          }
        }

        // Update the product in Firebase
        await updateDoc(doc(db, productPath, editingId), form);
        setEditingId(null);
      } else {
        // Add new product
        await addDoc(collection(db, productPath), form);
      }
      setForm({ name: '', price: '', discountedPrice: '', image: '', categoryId: '', subcategoryId: '' });
      setSubcategories([]); // Clear subcategories after submit
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = async product => {
    setForm({
      name: product.name,
      price: product.price,
      discountedPrice: product.discountedPrice || '',
      image: product.image,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId || ''
    });
    setEditingId(product.id);
    await fetchSubcategories(product.categoryId); // Fetch subcategories for the product's category
  };

  const handleDelete = async id => {
  if (!confirm('Are you sure you want to delete this product?')) return;

  try {
    // Fetch the product to get the image URL
    const productDoc = await getDoc(doc(db, productPath, id));
    if (productDoc.exists()) {
      const productData = productDoc.data();
      if (productData.image) {
        // Delete the image from Cloudinary
        await deleteFromCloudinary(productData.image);
      }
    }

    // Delete the product from Firebase
    await deleteDoc(doc(db, productPath, id));
    await fetchProducts();
  } catch (error) {
    console.error('Error deleting product:', error);
    alert('Failed to delete product');
  }
};

  const handleNavigation = (id) => {
    window.location.href = `/admin/${id}`;
  };

  const handleLogout = () => {
    console.log('Logout clicked');
  };

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

  // Filter subcategories for the product list filter dropdown
  const filteredSubcategories = subcategories.filter(subcat =>
    selectedCategory ? subcat.categoryId === selectedCategory : true
  );

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 sm:px-6 bg-blue-50 backdrop-blur-md border-b border-blue-200"
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"
        >
          EASY2 Admin
        </motion.div>

        <div className="hidden md:flex items-center space-x-6 text-sm">
          {[{ id: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
            { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" /> },
            { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" /> },
            { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> }]
            .map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${activeTab === item.id
                    ? 'bg-blue-100 text-blue-600 border border-blue-200'
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

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="md:hidden p-2 text-blue-600"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-blue-50 backdrop-blur-lg border-b border-blue-200 overflow-hidden"
          >
            <div className="flex flex-col space-y-2 p-4">
              {['dashboard', 'products', 'orders', 'users'].map((item) => (
                <motion.button
                  key={item}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-3 text-left rounded-md ${activeTab === item
                      ? 'bg-blue-100 text-blue-600'
                      : 'hover:bg-blue-100'
                    }`}
                  onClick={() => handleNavigation(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
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

      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-600">Manage Products</h2>

        {/* Add/Edit Product Section (Unchanged) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <input
            type="text"
            placeholder="Product Name"
            className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Price"
            className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.price}
            onChange={e => setForm({ ...form, price: e.target.value })}
          />
          <input
            type="number"
            placeholder="Discounted Price"
            className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={form.discountedPrice}
            onChange={e => setForm({ ...form, discountedPrice: e.target.value })}
          />
          <div className="relative">
            <select
              className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
              value={form.categoryId}
              onChange={handleCategoryChange}
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoriesname}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
          </div>
          <div className="relative">
            <select
              className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
              value={form.subcategoryId}
              onChange={e => setForm({ ...form, subcategoryId: e.target.value })}
              disabled={!form.categoryId || subcategories.length === 0}
            >
              <option value="">Select Subcategory</option>
              {subcategories.map(subcat => (
                <option key={subcat.id} value={subcat.id}>
                  {subcat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm text-gray-600 mb-1">Product Image</label>
            <input
              type="file"
              onChange={handleImageUpload}
              className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
              accept="image/*"
            />
            {imageUploading && <p className="text-sm text-blue-500 mt-1">Uploading image...</p>}
          </div>
          {form.image && (
            <div className="col-span-full flex items-center gap-4">
              <Image
                src={form.image}
                alt="product"
                width={80}
                height={80}
                className="object-cover rounded border border-gray-300"
              />
              <span className="text-sm text-gray-500">Image preview</span>
            </div>
          )}
          <motion.button
            onClick={handleSubmit}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={imageUploading}
            className={`px-4 py-2 rounded transition col-span-full font-medium ${imageUploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-500'
              }`}
          >
            {editingId ? 'Update Product' : 'Add Product'}
          </motion.button>
        </div>

        {/* Product List Section with Filter Dropdowns */}
        <div className="mb-6 flex justify-end space-x-4">
          <div className="space-y-2 max-w-xs">
            <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={handleFilterCategoryChange}
                className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.categoriesname}
                  </option>
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
                onChange={e => {
                  setSelectedSubcategory(e.target.value);
                  setFilterError('');
                }}
                className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
                disabled={!selectedCategory || filteredSubcategories.length === 0}
              >
                <option value="">All Subcategories</option>
                {filteredSubcategories.map(subcat => (
                  <option key={subcat.id} value={subcat.id}>
                    {subcat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        {filterError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
            {filterError}
          </div>
        )}

        <div className="overflow-x-auto bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 text-sm font-medium text-gray-600">Image</th>
                <th className="p-3 text-sm font-medium text-gray-600">Name</th>
                <th className="p-3 text-sm font-medium text-gray-600">Price</th>
                <th className="p-3 text-sm font-medium text-gray-600">Discount</th>
                <th className="p-3 text-sm font-medium text-gray-600">Category</th>
                <th className="p-3 text-sm font-medium text-gray-600">Subcategory</th>
                <th className="p-3 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(p => (
                  <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-100 transition-colors">
                    <td className="p-3">
                      <Image
                        src={p.image}
                        alt={p.name}
                        width={60}
                        height={60}
                        className="rounded border border-gray-300"
                      />
                    </td>
                    <td className="p-3">{p.name}</td>
                    <td className="p-3">KWD {p.price}</td>
                    <td className="p-3">{p.discountedPrice ? `KWD ${p.discountedPrice}` : '-'}</td>
                    <td className="p-3 text-gray-500">{p.categoryName}</td>
                    <td className="p-3 text-gray-500">{p.subcategoryName}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => handleEdit(p)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 rounded hover:bg-blue-500/20"
                        >
                          <Edit className="w-4 h-4 text-blue-600" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDelete(p.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="p-1 rounded hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
