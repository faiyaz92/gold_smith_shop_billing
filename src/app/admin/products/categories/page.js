'use client';

import { useState, useEffect } from 'react';
import { db } from '@/app/firebase';
import { addDoc, collection, getDocs, doc, deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { uploadToCloudinary } from '@/app/cloudinary';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Menu, X, Home, Package, ShoppingBag, Users,
  Edit, Trash2, Save, XCircle, ArrowUp, ArrowDown
} from 'lucide-react';

export default function CategoriesPage() {
  const [categoriesname, setCategoriesname] = useState('');
  const [categoriesimage, setCategoriesimage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadError, setUploadError] = useState('');

  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  const categoriesRef = collection(db, 'categories');

  // Initialize sort orders for existing categories (run once)
  const initializeSortOrders = async () => {
    try {
      const snapshot = await getDocs(categoriesRef);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc, index) => {
        if (typeof doc.data().sortOrder === 'undefined') {
          batch.update(doc.ref, { sortOrder: index });
        }
      });

      await batch.commit();
      console.log('Sort orders initialized successfully');
      fetchCategories();
    } catch (error) {
      console.error('Error initializing sort orders:', error);
    }
  };

  const handleImageUpload = async (imageFile) => {
    try {
      if (!imageFile) throw new Error('No image file selected');

      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validTypes.includes(imageFile.type)) {
        throw new Error('Only JPEG, PNG, and WebP images are allowed');
      }

      if (imageFile.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const imageUrl = await uploadToCloudinary(imageFile);
      if (!imageUrl) throw new Error('Failed to upload image to Cloudinary');

      return imageUrl;
    } catch (error) {
      console.error("Upload Error:", error.message);
      setUploadError(error.message);
      throw error;
    }
  };

  const generateCategoriesId = () => {
    return 'cat-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  };

  const handleAddCategory = async () => {
    if (!categoriesname) {
      setUploadError('Category name is required');
      return;
    }
    if (!categoriesimage) {
      setUploadError('Category image is required');
      return;
    }

    setIsLoading(true);
    setUploadError('');

    try {
      const imageUrl = await handleImageUpload(categoriesimage);
      const categoriesid = generateCategoriesId();

      await addDoc(categoriesRef, {
        categoriesid,
        categoriesname,
        categoriesimage: imageUrl,
        sortOrder: categories.length,
        createdAt: new Date(),
      });

      setCategoriesname('');
      setCategoriesimage(null);
      setPreviewUrl('');
      fetchCategories();
    } catch (error) {
      console.error('Add Category Error:', error);
      setUploadError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(categoriesRef);
      const data = snapshot.docs.map((doc, index) => ({
        id: doc.id,
        sortOrder: doc.data().sortOrder ?? index, // Fallback to index if missing
        ...doc.data()
      }));
      data.sort((a, b) => a.sortOrder - b.sortOrder);
      setCategories(data);
    } catch (error) {
      console.error('Fetch Error:', error);
      setUploadError('Failed to load categories');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteDoc(doc(db, 'categories', id));
      const updatedCategories = categories.filter(cat => cat.id !== id);
      const batch = writeBatch(db);
      
      updatedCategories.forEach((cat, index) => {
        batch.update(doc(db, 'categories', cat.id), { 
          sortOrder: index 
        });
      });

      await batch.commit();
      fetchCategories();
    } catch (error) {
      console.error('Delete Error:', error);
      setUploadError('Failed to delete category: ' + error.message);
    }
  };

  const handleMoveCategory = async (id, direction) => {
    try {
      const index = categories.findIndex(cat => cat.id === id);
      if (index === -1) throw new Error('Category not found');

      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= categories.length) {
        throw new Error('Cannot move category further in this direction');
      }

      const batch = writeBatch(db);
      
      // Get current sort orders with fallbacks
      const currentSortOrder = categories[index].sortOrder ?? index;
      const targetSortOrder = categories[newIndex].sortOrder ?? newIndex;

      batch.update(doc(db, 'categories', id), { 
        sortOrder: targetSortOrder 
      });
      batch.update(doc(db, 'categories', categories[newIndex].id), { 
        sortOrder: currentSortOrder 
      });

      await batch.commit();
      fetchCategories();
    } catch (error) {
      console.error('Move Error:', error);
      setUploadError(`Failed to move category: ${error.message}`);
    }
  };

  const handleEditCategory = (category) => {
    setEditingId(category.id);
    setEditName(category.categoriesname);
    setEditPreviewUrl(category.categoriesimage);
    setEditImage(null);
  };

  const handleUpdateCategory = async () => {
    if (!editName) {
      setUploadError('Category name cannot be empty');
      return;
    }

    setIsLoading(true);
    setUploadError('');

    try {
      const updateData = { categoriesname: editName };

      if (editImage) {
        const imageUrl = await handleImageUpload(editImage);
        updateData.categoriesimage = imageUrl;
      }

      await updateDoc(doc(db, 'categories', editingId), updateData);
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error('Update Error:', error);
      setUploadError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditImage(null);
    setEditPreviewUrl('');
    setUploadError('');
  };

  useEffect(() => {
    fetchCategories();
    // Uncomment to initialize sort orders for existing categories (run once)
    // initializeSortOrders();
  }, []);

  const handleNavigation = (id) => {
    window.location.href = `/admin/${id}`;
  };

  const handleLogout = () => {
    // TODO: implement logout
    console.log('Logout clicked');
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

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Add Category Form */}
        <div className="bg-gray-900/50 p-6 rounded-lg border border-yellow-500/20">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">Add New Category</h2>
          
          {uploadError && (
            <div className="mb-4 p-3 bg-red-900/50 text-red-300 rounded border border-red-500/30">
              {uploadError}
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">Category Name</label>
              <input
                type="text"
                placeholder="Enter category name"
                value={categoriesname}
                onChange={(e) => {
                  setCategoriesname(e.target.value);
                  setUploadError('');
                }}
                className="w-full p-2 rounded bg-gray-800 border border-yellow-500/20 text-white focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Category Image</label>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setCategoriesimage(e.target.files[0]);
                    setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                    setUploadError('');
                  }
                }}
                className="w-full p-2 rounded bg-gray-800 border border-yellow-500/20 text-white file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-yellow-500/20 file:text-yellow-400 hover:file:bg-yellow-500/30"
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
              <div className="relative w-40 h-40 border-2 border-yellow-500/30 rounded overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Category preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Categories List */}
        <div className="bg-gray-900/50 p-6 rounded-lg border border-yellow-500/20">
          <h2 className="text-2xl font-bold mb-6 text-yellow-400">Categories List</h2>
          
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No categories found. Add your first category above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-800 text-yellow-400">
                    <th className="p-3 text-left">#</th>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Image</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat, index) => (
                    <tr key={cat.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                      <td className="p-3">{index + 1}</td>
                      <td className="p-3 text-sm text-gray-400 font-mono">{cat.categoriesid}</td>
                      <td className="p-3">
                        {editingId === cat.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 border border-yellow-500/20 focus:outline-none focus:ring-1 focus:ring-yellow-500/50"
                          />
                        ) : (
                          <span>{cat.categoriesname}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === cat.id ? (
                          <div className="flex flex-col space-y-2">
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/webp"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setEditImage(e.target.files[0]);
                                  setEditPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                  setUploadError('');
                                }
                              }}
                              className="text-white text-sm"
                            />
                            <div className="relative w-20 h-20 border border-yellow-500/30 rounded overflow-hidden">
                              <Image
                                src={editPreviewUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-20 h-20 border border-yellow-500/30 rounded overflow-hidden">
                            <Image
                              src={cat.categoriesimage}
                              alt={cat.categoriesname}
                              fill
                              className="object-cover"
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
                              onClick={() => handleMoveCategory(cat.id, 'up')}
                              disabled={index === 0}
                              className={`p-2 rounded transition-colors ${
                                index === 0 
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                              title="Move Up"
                            >
                              <ArrowUp size={18} />
                            </button>
                            <button
                              onClick={() => handleMoveCategory(cat.id, 'down')}
                              disabled={index === categories.length - 1}
                              className={`p-2 rounded transition-colors ${
                                index === categories.length - 1
                                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                              title="Move Down"
                            >
                              <ArrowDown size={18} />
                            </button>
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
          )}
        </div>
      </div>
    </div>
  );
}