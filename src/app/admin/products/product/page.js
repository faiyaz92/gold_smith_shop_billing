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
import { uploadToCloudinary, deleteFromCloudinary } from '@/app/cloudinary';
import AdminLayout from '@/app/admin/AdminLayout'; // <-- Add this import

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
    productName: '',
    categoryId: '',
    subcategoryId: '',
    makingChargePerGram: '',
    karat: '22k',
    description: '',
    image: '',
    active: true
  });
  const [editingId, setEditingId] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('products');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [filterError, setFilterError] = useState('');
  const [loading, setLoading] = useState(true);

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
    } finally {
      setLoading(false);
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
    if (!form.productName || !form.categoryId || !form.makingChargePerGram) {
      return alert('Product name, category, and making charge are required');
    }

    try {
      const productData = {
        productName: form.productName,
        categoryId: form.categoryId,
        subcategoryId: form.subcategoryId || '',
        makingChargePerGram: parseFloat(form.makingChargePerGram),
        karat: form.karat,
        description: form.description || '',
        image: form.image || '',
        active: form.active !== false,
        updatedAt: new Date()
      };

      if (editingId) {
        // Update existing product
        await updateDoc(doc(db, productPath, editingId), productData);
        setEditingId(null);
      } else {
        // Add new product
        productData.createdAt = new Date();
        await addDoc(collection(db, productPath), productData);
      }
      
      setForm({
        productName: '',
        categoryId: '',
        subcategoryId: '',
        makingChargePerGram: '',
        karat: '22k',
        description: '',
        image: '',
        active: true
      });
      setSubcategories([]);
      await fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product');
    }
  };

  const handleEdit = async product => {
    setForm({
      productName: product.productName || '',
      categoryId: product.categoryId || '',
      subcategoryId: product.subcategoryId || '',
      makingChargePerGram: product.makingChargePerGram || '',
      karat: product.karat || '22k',
      description: product.description || '',
      image: product.image || '',
      active: product.active !== false
    });
    setEditingId(product.id);
    if (product.categoryId) {
      await fetchSubcategories(product.categoryId);
    }
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-blue-600 relative mb-6">
              <span className="absolute inset-0 flex items-center justify-center text-5xl">
                🧺
              </span>
            </div>
            <div className="text-blue-700 text-xl font-semibold mt-2 animate-pulse">
              Loading your laundry products...
            </div>
            <div className="text-blue-400 mt-1 text-sm">
              Please wait while we freshen up your dashboard!
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-white text-gray-800">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-bold mb-4 text-blue-600">Manage Products</h2>

          {/* Add/Edit Product Section - Gold Smith Jewelry Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="col-span-full">
              <h3 className="font-semibold text-gray-700 mb-2">
                {editingId ? 'Edit Product' : 'Add New Product'}
              </h3>
            </div>
            
            <input
              type="text"
              placeholder="Product Name (e.g., Gold Necklace - Design A)"
              className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.productName}
              onChange={e => setForm({ ...form, productName: e.target.value })}
            />
            
            <div className="relative">
              <select
                className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
                value={form.categoryId}
                onChange={handleCategoryChange}
              >
                <option value="">Select Metal Category *</option>
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
                <option value="">Select Subcategory (Optional)</option>
                {subcategories.map(subcat => (
                  <option key={subcat.id} value={subcat.id}>
                    {subcat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
            </div>
            
            <input
              type="number"
              placeholder="Making Charge per Gram (₹) *"
              className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={form.makingChargePerGram}
              onChange={e => setForm({ ...form, makingChargePerGram: e.target.value })}
            />
            
            <div className="relative">
              <select
                className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
                value={form.karat}
                onChange={e => setForm({ ...form, karat: e.target.value })}
              >
                <option value="24k">24 Karat (Pure Gold)</option>
                <option value="22k">22 Karat (91.67%)</option>
                <option value="18k">18 Karat (75%)</option>
              </select>
              <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
            </div>
            
            <div className="col-span-full">
              <textarea
                placeholder="Description (Optional)"
                className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
                rows="2"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>
            
            <div className="col-span-full">
              <label className="block text-sm text-gray-600 mb-1">Product Image (Optional)</label>
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

          <div className="overflow-x-auto w-full">
            <table className="min-w-[600px] w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-200">
                  <th className="p-3 text-sm font-medium text-gray-600">Image</th>
                  <th className="p-3 text-sm font-medium text-gray-600">Product Name</th>
                  <th className="p-3 text-sm font-medium text-gray-600">Making Charge/Gram</th>
                  <th className="p-3 text-sm font-medium text-gray-600">Karat</th>
                  <th className="p-3 text-sm font-medium text-gray-600">Category</th>
                  <th className="p-3 text-sm font-medium text-gray-600">Subcategory</th>
                  <th className="p-3 text-sm font-medium text-gray-600">Status</th>
                  <th className="p-3 text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map(p => (
                    <tr key={p.id} className="border-b border-gray-200 hover:bg-gray-100 transition-colors">
                      <td className="p-3">
                        {p.image ? (
                          <Image
                            src={p.image}
                            alt={p.productName || 'Product'}
                            width={60}
                            height={60}
                            className="rounded border border-gray-300 object-cover"
                          />
                        ) : (
                          <div className="w-[60px] h-[60px] bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="p-3 font-medium">{p.productName || '-'}</td>
                      <td className="p-3 text-green-600 font-semibold">₹{p.makingChargePerGram || 0}/g</td>
                      <td className="p-3">{p.karat || '22k'}</td>
                      <td className="p-3 text-gray-500">{p.categoryName}</td>
                      <td className="p-3 text-gray-500">{p.subcategoryName}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          p.active !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {p.active !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
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
                    <td colSpan="8" className="p-4 text-center text-gray-500">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
