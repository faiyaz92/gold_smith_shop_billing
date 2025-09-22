'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/app/firebase';
import { 
  addDoc, 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { uploadToCloudinary, deleteFromCloudinary } from '@/app/cloudinary';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Edit, Trash2, Save, XCircle, ChevronDown
} from 'lucide-react';
import AdminLayout from '@/app/admin/AdminLayout'; // <-- Import AdminLayout

export default function SubcategoriesPage() {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const subcategoryPath = `${tenantCompaniesPath}/${companyId}/subcategories`;
  const categoryPath = `${tenantCompaniesPath}/${companyId}/categories`;

  // Form states
  const [subcategoryName, setSubcategoryName] = useState('');
  const [subcategoryImage, setSubcategoryImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadError, setUploadError] = useState('');

  // Data states
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter state
  const [filterCategory, setFilterCategory] = useState('');

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState('');
  const [editCategory, setEditCategory] = useState('');

  // UI states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Separate refs for add and edit file inputs
  const addFileInputRef = useRef(null);
  const editFileInputRef = useRef(null);

  const subcategoriesRef = collection(db, subcategoryPath);
  const categoriesRef = collection(db, categoryPath);

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

  const generateSubcategoryId = () => {
    return 'subcat-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
  };

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(categoriesRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setUploadError('Failed to load categories');
    }
  };

  const fetchSubcategories = async () => {
    try {
      const snapshot = await getDocs(subcategoriesRef);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const joinedData = await Promise.all(data.map(async subcat => {
        try {
          const categoryDoc = await getDoc(doc(db, categoryPath, subcat.categoryId));
          return {
            ...subcat,
            categoryName: categoryDoc.exists() ? categoryDoc.data().categoriesname : 'Unknown Category'
          };
        } catch (error) {
          console.error(`Error fetching category for subcategory ${subcat.id}:`, error);
          return {
            ...subcat,
            categoryName: 'Error loading category'
          };
        }
      }));

      setSubcategories(joinedData);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      setUploadError('Failed to load subcategories');
    }
  };

  const handleAddSubcategory = async () => {
    if (!subcategoryName) {
      setUploadError('Subcategory name is required');
      return;
    }
    if (!selectedCategory) {
      setUploadError('Please select a category');
      return;
    }

    setIsLoading(true);
    setUploadError('');

    try {
      let imageUrl = '';
      if (subcategoryImage) {
        imageUrl = await handleImageUpload(subcategoryImage);
      }

      const subcategoryId = generateSubcategoryId();

      await addDoc(subcategoriesRef, {
        subcategoryId,
        name: subcategoryName,
        image: imageUrl || '',
        categoryId: selectedCategory,
        createdAt: new Date(),
      });

      // Reset form
      setSubcategoryName('');
      setSubcategoryImage(null);
      setPreviewUrl('');
      setSelectedCategory('');
      if (addFileInputRef.current) {
        addFileInputRef.current.value = ''; // Clear add file input
      }
      
      fetchSubcategories();
    } catch (error) {
      console.error('Add Subcategory Error:', error);
      setUploadError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSubcategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subcategory?')) return;

    try {
      // Fetch the subcategory to get the image URL
      const subcategoryDoc = await getDoc(doc(db, subcategoryPath, id));
      if (subcategoryDoc.exists()) {
        const subcategoryData = subcategoryDoc.data();
        if (subcategoryData.image) {
          // Delete the image from Cloudinary
          await deleteFromCloudinary(subcategoryData.image);
        }
      }

      // Delete the subcategory from Firebase
      await deleteDoc(doc(db, subcategoryPath, id));
      fetchSubcategories();
    } catch (error) {
      console.error('Delete Error:', error);
      setUploadError('Failed to delete subcategory: ' + error.message);
    }
  };

  const handleEditSubcategory = (subcat) => {
    setEditingId(subcat.id);
    setEditName(subcat.name);
    setEditPreviewUrl(subcat.image || '');
    setEditCategory(subcat.categoryId);
    setEditImage(null);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ''; // Clear edit file input
    }
  };

const handleUpdateSubcategory = async () => {
    if (!editName) {
      setUploadError('Subcategory name cannot be empty');
      return;
    }
    if (!editCategory) {
      setUploadError('Please select a category');
      return;
    }

    setIsLoading(true);
    setUploadError('');

    try {
      const updateData = { 
        name: editName,
        categoryId: editCategory
      };

      if (editImage) {
        // Fetch the current subcategory to get the existing image URL
        const subcategoryDoc = await getDoc(doc(db, subcategoryPath, editingId));
        if (subcategoryDoc.exists()) {
          const subcategoryData = subcategoryDoc.data();
          if (subcategoryData.image) {
            // Delete the existing image from Cloudinary
            await deleteFromCloudinary(subcategoryData.image);
          }
        }

        // Upload the new image
        const imageUrl = await handleImageUpload(editImage);
        updateData.image = imageUrl;
      }

      // Update the subcategory in Firebase
      await updateDoc(doc(db, subcategoryPath, editingId), updateData);
      setEditingId(null);
      setEditName('');
      setEditImage(null);
      setEditPreviewUrl('');
      setEditCategory('');
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ''; // Clear edit file input
      }
      fetchSubcategories();
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
    setEditCategory('');
    setUploadError('');
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ''; // Clear edit file input
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchSubcategories();
  }, []);

  const filteredSubcategories = subcategories.filter(subcat => 
    filterCategory ? subcat.categoryId === filterCategory : true
  );

  return (
    <AdminLayout>
      <div className="p-6 space-y-8">
        {/* Add Subcategory Form */}
        <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">Add New Subcategory</h2>
          
          {uploadError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded border border-red-200">
              {uploadError}
            </div>
          )}

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Subcategory Name</label>
              <input
                type="text"
                placeholder="Enter subcategory name"
                value={subcategoryName}
                onChange={(e) => {
                  setSubcategoryName(e.target.value);
                  setUploadError('');
                }}
                className="w-full p-2 rounded bg-white border border-blue-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setUploadError('');
                  }}
                  className="w-full p-2 rounded bg-white border border-blue-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.categoriesname}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Subcategory Image (Optional)</label>
              <input
                type="file"
                accept="image/jpeg, image/png, image/webp"
                ref={addFileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSubcategoryImage(e.target.files[0]);
                    setPreviewUrl(URL.createObjectURL(e.target.files[0]));
                    setUploadError('');
                  } else {
                    setSubcategoryImage(null);
                    setPreviewUrl('');
                  }
                }}
                className="w-full p-2 rounded bg-white border border-blue-200 text-gray-800 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200"
              />
            </div>

            <div className="flex items-end">
              <button
                disabled={isLoading}
                onClick={handleAddSubcategory}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding...' : 'Add Subcategory'}
              </button>
            </div>
          </div>

          {previewUrl && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2 text-gray-700">Image Preview:</p>
              <div className="relative w-40 h-40 border-2 border-blue-200 rounded overflow-hidden">
                <Image
                  src={previewUrl}
                  alt="Subcategory preview"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>

        {/* Subcategories List */}
        <div className="bg-white p-6 rounded-lg border border-blue-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-600">Subcategories List</h2>
            <div className="space-y-2 max-w-xs">
              <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
              <div className="relative">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
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
          </div>
          
          {filteredSubcategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No subcategories found. Add your first subcategory above or adjust the filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-blue-600">
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">ID</th>
                    <th className="p-3 text-left">Image</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubcategories.map((subcat) => (
                    <tr key={subcat.id} className="border-b border-blue-100 hover:bg-blue-50 transition-colors">
                      <td className="p-3">
                        {editingId === subcat.id ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full p-2 rounded bg-white border border-blue-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        ) : (
                          <span>{subcat.name}</span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-600 font-mono">{subcat.subcategoryId}</td>
                      <td className="p-3">
                        {editingId === subcat.id ? (
                          <div className="flex flex-col space-y-2">
                            <input
                              type="file"
                              accept="image/jpeg, image/png, image/webp"
                              ref={editFileInputRef}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setEditImage(e.target.files[0]);
                                  setEditPreviewUrl(URL.createObjectURL(e.target.files[0]));
                                  setUploadError('');
                                } else {
                                  setEditImage(null);
                                  setEditPreviewUrl(subcat.image || '');
                                }
                              }}
                              className="text-gray-800 text-sm"
                            />
                            <div className="relative w-20 h-20 border border-blue-200 rounded overflow-hidden">
                              <Image
                                src={editPreviewUrl}
                                alt="Preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="relative w-20 h-20 border border-blue-200 rounded overflow-hidden">
                            {subcat.image ? (
                              <Image
                                src={subcat.image}
                                alt={subcat.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <span className="text-gray-500 text-sm flex items-center justify-center h-full">No Image</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === subcat.id ? (
                          <div className="relative">
                            <select
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              className="w-full p-2 rounded bg-white border border-blue-200 text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-8"
                            >
                              <option value="">Select Category</option>
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.categoriesname}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
                          </div>
                        ) : (
                          <span>{subcat.categoryName}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === subcat.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={handleUpdateSubcategory}
                              disabled={isLoading}
                              className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors disabled:opacity-50 text-white"
                              title="Save"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-white"
                              title="Cancel"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditSubcategory(subcat)}
                              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-white"
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(subcat.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-white"
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
    </AdminLayout>
  );
}