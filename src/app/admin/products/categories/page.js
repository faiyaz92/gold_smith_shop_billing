'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Image as ImageIcon, Loader2 } from 'lucide-react';
import { collection, addDoc, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { v4 as uuidv4 } from 'uuid';

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    image: null,
    imagePreview: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);


  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Handle image upload to Cloudinary
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'your_upload_preset'); // Replace with your upload preset

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/your_cloud_name/image/upload`, // Replace with your cloud name
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.image) return;

    setIsUploading(true);

    try {
      // Upload image to Cloudinary
      const imageUrl = await uploadImage(formData.image);
      if (!imageUrl) throw new Error('Image upload failed');

      // Save category to Firestore
      const docRef = await addDoc(collection(db, 'categories'), {
        name: formData.name,
        imageUrl,
        createdAt: new Date().toISOString()
      });

      // Update local state
      setCategories(prev => [
        ...prev,
        {
          id: docRef.id,
          name: formData.name,
          imageUrl
        }
      ]);

      // Reset form
      setFormData({
        name: '',
        image: null,
        imagePreview: ''
      });
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle category deletion
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    setIsDeleting(id);

    try {
      // Delete from Firestore
      await deleteDoc(doc(db, 'categories', id));
      
      // Update local state
      setCategories(prev => prev.filter(category => category.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">Manage Categories</h1>
          <p className="text-gray-400">Add, edit, or delete product categories</p>
        </motion.div>

        {/* Add Category Form */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 mb-8 backdrop-blur-sm"
        >
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">Add New Category</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="name">
                  Category Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 outline-none transition"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" htmlFor="image">
                  Category Image
                </label>
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="image-upload"
                    className="flex-1 cursor-pointer px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-5 h-5" />
                    <span>{formData.image ? formData.image.name : 'Choose image'}</span>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      required
                    />
                  </label>

                  {formData.imagePreview && (
                    <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-600">
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isUploading}
                className="px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg flex items-center gap-2 disabled:opacity-70"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    Add Category
                  </>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>

        {/* Categories Table */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-sm overflow-x-auto"
        >
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No categories found. Add your first category above.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-yellow-400">#</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-yellow-400">Category Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-yellow-400">Image</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-yellow-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.id} className="border-b border-gray-700/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden border border-gray-600">
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-blue-600/30 hover:bg-blue-600/50 rounded-lg text-blue-400 border border-blue-500/20"
                          onClick={() => router.push(`/admin/products/categories/edit/${category.id}`)}
                        >
                          <Edit className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-2 bg-red-600/30 hover:bg-red-600/50 rounded-lg text-red-400 border border-red-500/20"
                          onClick={() => handleDelete(category.id)}
                          disabled={isDeleting === category.id}
                        >
                          {isDeleting === category.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </motion.button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </div>
    </div>
  );
}