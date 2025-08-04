'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import axios from 'axios';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Menu, X, Home, Package, ShoppingBag, Users,
  Edit, Trash2, Save, XCircle
} from 'lucide-react';

export default function CategoriesPage() {
  // Form states
  const [categoryName, setCategoryName] = useState('');
  const [categoryImage, setCategoryImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  
  // Data states
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  
  // UI states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const categoriesRef = collection(db, 'categories');

  // Image upload handler
  const handleImageUpload = async (imageFile) => {
    try {
      if (!imageFile || !imageFile.type.startsWith("image/")) {
        throw new Error("Invalid image file.");
      }

      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;

      const response = await axios.post(url, formData);
      return response.data.secure_url;
    } catch (error) {
      console.error("Upload Error:", error.response?.data || error.message);
      throw new Error("Image upload failed.");
    }
  };

  // Add new category
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

      // Reset form
      setCategoryName('');
      setCategoryImage(null);
      setPreviewUrl('');
      
      // Refresh list
      fetchCategories();
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all categories
  const fetchCategories = async () => {
    const snapshot = await getDocs(categoriesRef);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCategories(data);
  };

  // Delete category
  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchCategories();
    } catch (error) {
      console.error('Delete Error:', error);
      alert('Failed to delete category');
    }
  };

  // Start editing
  const handleEditCategory = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditPreviewUrl(category.image);
  };

  // Save edits
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
      
      // Reset edit state
      setEditingId(null);
      
      // Refresh list
      fetchCategories();
    } catch (error) {
      console.error('Update Error:', error);
      alert('Failed to update category');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditImage(null);
    setEditPreviewUrl('');
  };

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Navigation handler
  const handleNavigation = (id) => {
    window.location.href = `/admin/${id}`;
  };

  // Logout handler (to be implemented)
  const handleLogout = () => {
    // TODO: Implement logout
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

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Add Category Form */}
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
                className="w-full p-2 rounded bg-gray-800 border border-yellow-500/20 text-white focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
                className="w-full p-2 rounded bg-gray-800 border border-yellow-500/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
              />
            </div>
            
            <div className="flex items-end">
              <button
                disabled={isLoading}
                onClick={handleAddCategory}
                className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <th className="p-3 text-left border-b border-yellow-500/20">#</th>
                  <th className="p-3 text-left border-b border-yellow-500/20">Category Name</th>
                  <th className="p-3 text-left border-b border-yellow-500/20">Image</th>
                  <th className="p-3 text-left border-b border-yellow-500/20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat, index) => (
                  <tr key={cat.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                    <td className="p-3">{index + 1}</td>
                    
                    <td className="p-3">
                      {editingId === cat.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full p-2 rounded bg-gray-700 border border-yellow-500/20 focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="font-medium">{cat.name}</span>
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
                            className="w-full p-2 rounded bg-gray-700 border border-yellow-500/20 text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-yellow-500 file:text-black hover:file:bg-yellow-600"
                          />
                          <div className="relative w-20 h-20">
                            <Image
                              src={editPreviewUrl}
                              alt="Edit preview"
                              fill
                              className="rounded border border-yellow-500/20 object-cover"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-20 h-20">
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            className="rounded border border-yellow-500/20 object-cover"
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
                            className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                            title="Cancel"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditCategory(cat)}
                            className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                            title="Delete"
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