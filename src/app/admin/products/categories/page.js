'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { uploadToCloudinary } from '@/app/cloudinary'; // ✅ Cloudinary uploader
import Image from 'next/image';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Menu, X, Home, Package, ShoppingBag, Users,
  Edit, Trash2, Save, XCircle
} from 'lucide-react';

export default function CategoriesPage() {
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const categoriesRef = collection(db, 'categories');

  // ✅ Use custom Cloudinary uploader
  const handleImageUpload = async (imageFile) => {
    try {
      const imageUrl = await uploadToCloudinary(imageFile);
      return imageUrl;
    } catch (error) {
      console.error("Upload Error:", error.message);
      throw new Error("Image upload failed.");
    }
  };

  const handleAddCategory = async () => {
    if (!categoryName || !categoryImage) {
      alert('Please fill all fields');
      return;
    }

    setIsLoading(true);
    try {
      const imageUrl = await handleImageUpload(categoryImage);

      await addDoc(categoriesRef, {
        name: categoryName,
        image: imageUrl,
        createdAt: new Date(),
      });

      setCategoryName('');
      setCategoryImage(null);
      setPreviewUrl('');
      fetchCategories();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const snapshot = await getDocs(categoriesRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCategories(data);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (error) {
      console.error('Delete Error:', error);
      alert('Failed to delete category');
    }
  };

  const handleEditCategory = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditPreviewUrl(category.image);
  };

  const handleUpdateCategory = async () => {
    if (!editName) {
      alert('Category name cannot be empty'); 
      return;
    }

    setIsLoading(true);
    try {
      const updateData = { name: editName };

      if (editImage) {
        const imageUrl = await handleImageUpload(editImage);
        updateData.image = imageUrl;
      }

      await updateDoc(doc(db, 'categories', editingId), updateData);
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error('Update Error:', error);
      alert('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditImage(null);
    setEditPreviewUrl('');
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNavigation = (id) => {
    window.location.href = `/admin/${id}`;
  };

  const handleLogout = () => {
    // TODO: implement logout
  };

  return (
    <div className="min-h-screen bg-black text-white">
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
            { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> }]
            .map((item) => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
                  activeTab === item.id
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

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="md:hidden p-2 text-yellow-400"
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
            className="md:hidden bg-gray-800/95 backdrop-blur-lg border-b border-yellow-500/20 overflow-hidden"
          >
            <div className="flex flex-col space-y-2 p-4">
              {['dashboard', 'products', 'orders', 'users'].map((item) => (
                <motion.button
                  key={item}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-3 text-left rounded-md ${
                    activeTab === item
                      ? 'bg-yellow-500/10 text-yellow-400'
                      : 'hover:bg-gray-700/50'
                  }`}
                  onClick={() => handleNavigation(item)}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
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

      {/* Main */}
      <div className="p-6 space-y-8">
        {/* Add Form */}
        <div className="bg-gray-900/50 p-6 rounded-lg border border-yellow-500/20">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Add New Category</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Category Name</label>
              <input
                type="text"
                placeholder="Enter category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 border border-yellow-500/20 text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Category Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  setCategoryImage(e.target.files[0]);
                  setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                }}
                className="w-full p-2 rounded bg-gray-800 border border-yellow-500/20 text-white"
              />
            </div>

            <div className="flex items-end">
              <button
                disabled={isLoading}
                onClick={handleAddCategory}
                className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded"
              >
                {isLoading ? 'Adding...' : 'Add Category'}
              </button>
            </div>
          </div>

          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Image Preview:</p>
              <Image
                src={previewUrl}
                alt="Category preview"
                width={200}
                height={200}
                className="rounded border-2 border-yellow-500/30 object-cover"
              />
            </div>
          )}
        </div>

        {/* Categories Table */}
        <div className="bg-gray-900/50 p-6 rounded-lg border border-yellow-500/20">
          <h2 className="text-2xl font-bold mb-6 text-yellow-400">Categories List</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-800 text-yellow-400">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">
                      {editingId === cat.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2 rounded bg-gray-700 border border-yellow-500/20"
                        />
                      ) : (
                        <span>{cat.name}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === cat.id ? (
                        <div className="flex flex-col space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              setEditImage(e.target.files[0]);
                              setEditPreviewUrl(URL.createObjectURL(e.target.files[0]));
                            }}
                            className="text-white"
                          />
                          <div className="relative w-20 h-20">
                            <Image
                              src={editPreviewUrl}
                              alt="Preview"
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-20 h-20">
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      {editingId === cat.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={handleUpdateCategory}
                            disabled={isLoading}
                            className="p-2 bg-green-600 hover:bg-green-700 rounded"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
