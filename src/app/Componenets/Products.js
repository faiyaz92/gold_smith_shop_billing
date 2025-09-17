'use client';
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/app/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

// TypeScript interfaces (uncomment if using TypeScript)
// interface Product {
//   id: string;
//   name: string;
//   price: number;
//   discountedPrice?: number;
//   image: string;
//   categoryId?: string;
//   subcategoryId?: string;
//   categoryName: string;
//   subcategoryName: string;
// }
// interface Category {
//   id: string;
//   categoriesname: string;
// }
// interface Subcategory {
//   id: string;
//   name: string;
//   categoryId: string;
// }
// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
// }

export default function Products({
  addToCart,
  removeFromCart,
  cart,
  onActiveCategoryChange,
  searchQuery = '',
}) {
  const [products, setProducts] = useState([]); // Product[]
  const [categories, setCategories] = useState([]); // Category[]
  const [subcategories, setSubcategories] = useState([]); // Subcategory[]
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categoryRefs = useRef({});

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;

  const productPath = companyId
    ? `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/products`
    : '';
  const categoryPath = companyId
    ? `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/categories`
    : '';
  const subcategoryPath = companyId
    ? `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/subcategories`
    : '';

  useEffect(() => {
    if (!companyId) {
      setError('Company ID is not defined. Please check your environment variables.');
      setLoading(false);
      return;
    }

    setLoading(true);

    // Real-time sync for products
    const unsubProducts = onSnapshot(
      collection(db, productPath),
      async (productsSnapshot) => {
        try {
          const productsData = await Promise.all(
            productsSnapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              let categoryName = 'Uncategorized';
              let subcategoryName = 'None';

              if (data.categoryId) {
                const categoryDoc = await getDoc(doc(db, categoryPath, data.categoryId));
                if (categoryDoc.exists()) {
                  categoryName = categoryDoc.data().categoriesname || 'Uncategorized';
                }
              }
              if (data.subcategoryId) {
                const subcategoryDoc = await getDoc(doc(db, subcategoryPath, data.subcategoryId));
                if (subcategoryDoc.exists()) {
                  subcategoryName = subcategoryDoc.data().name || 'None';
                }
              }

              return {
                id: docSnap.id,
                name: data.name || '',
                price: data.price || 0,
                discountedPrice: data.discountedPrice || null,
                image: data.image || '',
                categoryId: data.categoryId || '',
                subcategoryId: data.subcategoryId || '',
                categoryName,
                subcategoryName,
              };
            })
          );
          setProducts(productsData);
          setLoading(false);
        } catch (err) {
          setError('Failed to load products: ' + err.message);
          setLoading(false);
        }
      },
      (err) => {
        setError('Error fetching products: ' + err.message);
        setLoading(false);
      }
    );

    // Real-time sync for categories
    const unsubCategories = onSnapshot(
      collection(db, categoryPath),
      (categoriesSnapshot) => {
        try {
          const categoriesData = categoriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            categoriesname: doc.data().categoriesname || 'Unknown',
          }));
          setCategories(categoriesData);
        } catch (err) {
          setError('Error fetching categories: ' + err.message);
        }
      },
      (err) => {
        setError('Error fetching categories: ' + err.message);
      }
    );

    // Real-time sync for subcategories
    const unsubSubcategories = onSnapshot(
      collection(db, subcategoryPath),
      (subcategoriesSnapshot) => {
        try {
          const subcategoriesData = subcategoriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name || 'Unknown',
            categoryId: doc.data().categoryId || '',
          }));
          setSubcategories(subcategoriesData);
        } catch (err) {
          setError('Error fetching subcategories: ' + err.message);
        }
      },
      (err) => {
        setError('Error fetching subcategories: ' + err.message);
      }
    );

    return () => {
      unsubProducts();
      unsubCategories();
      unsubSubcategories();
    };
  }, [companyId, productPath, categoryPath, subcategoryPath]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible && onActiveCategoryChange) {
          onActiveCategoryChange(visible.target.dataset.categoryid);
        }
      },
      { threshold: 0.4 }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [products, categories, onActiveCategoryChange]);

  const getQuantity = (productId) => {
    const found = cart.find((item) => item.id === productId);
    return found ? found.quantity : 0;
  };

  // Handle category filter change
  const handleCategoryFilterChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubcategory(''); // Reset subcategory when category changes
  };

  // Filter products based on search query, category, and subcategory
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
    const matchesSubcategory = selectedSubcategory
      ? product.subcategoryId === selectedSubcategory
      : true;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  // Filter subcategories based on selected category
  const filteredSubcategories = subcategories.filter((subcat) =>
    selectedCategory ? subcat.categoryId === selectedCategory : true
  );

  const productsByCategory = {};
  filteredProducts.forEach((product) => {
    const categoryId = product.categoryId || 'uncategorized';
    if (!productsByCategory[categoryId]) {
      const category = categories.find((cat) => cat.id === categoryId) || {
        id: 'uncategorized',
        categoriesname: 'Uncategorized',
      };
      productsByCategory[categoryId] = { name: category.categoriesname, products: [] };
    }
    productsByCategory[categoryId].products.push(product);
  });

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <section className="w-full px-4 py-6">
      <h2 className="text-xl font-semibold mb-6">Services</h2>

      {/* Filter Dropdowns */}
      <div className="mb-6 flex flex-col sm:flex-row justify-end space-x-0 sm:space-x-4 space-y-4 sm:space-y-0">
        <div className="space-y-2 max-w-xs w-full">
          <label className="block text-sm font-medium text-gray-700">Filter by Category</label>
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={handleCategoryFilterChange}
              className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.categoriesname}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
          </div>
        </div>
        <div className="space-y-2 max-w-xs w-full">
          <label className="block text-sm font-medium text-gray-700">Filter by Subcategory</label>
          <div className="relative">
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full appearance-none pr-8"
              disabled={!selectedCategory || filteredSubcategories.length === 0}
            >
              <option value="">All Subcategories</option>
              {filteredSubcategories.map((subcat) => (
                <option key={subcat.id} value={subcat.id}>
                  {subcat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[200px]">
          <div className="laundry-loader"></div>
          <p className="mt-4 text-gray-600">Washing your services, please wait...</p>
        </div>
      ) : error ? (
        <div className="text-red-500">Error: {error}</div>
      ) : filteredProducts.length === 0 ? (
        <div>No products found.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(productsByCategory).map(([categoryId, categoryData]) => {
            const isExpanded = expandedCategories[categoryId];
            const displayProducts = isExpanded ? categoryData.products : categoryData.products.slice(0, 5);
            const hasMore = categoryData.products.length > 5;

            return (
              <div
                key={categoryId}
                data-categoryid={categoryId}
                ref={(el) => (categoryRefs.current[categoryId] = el)}
                className="space-y-3 transition-all duration-500 ease-in-out"
              >
                <h3 className="text-lg font-medium text-gray-800">{categoryData.name}</h3>
                <div className="space-y-3">
                  {displayProducts.length === 0 ? (
                    <p>No products in this category</p>
                  ) : (
                    displayProducts.map((product) => {
                      const quantity = getQuantity(product.id);
                      return (
                        <div
                          key={product.id}
                          className="bg-white rounded-lg shadow p-4 flex items-center gap-4"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <Image
                              src={product.image}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{product.name}</h3>
                            <p className="text-sm text-gray-500">{product.subcategoryName}</p>
                            <div className="flex gap-2">
                              {product.discountedPrice ? (
                                <>
                                  <p className="text-gray-500 line-through">₹{product.price}</p>
                                  <p className="text-gray-600 font-medium">₹{product.discountedPrice}</p>
                                </>
                              ) : (
                                <p className="text-gray-600">₹{product.price}</p>
                              )}
                            </div>
                          </div>
                          {quantity === 0 ? (
                            <button
                              onClick={() =>
                                addToCart(product.id, product.name, product.discountedPrice || product.price)
                              }
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              ADD +
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(product.id)}
                                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                              >
                                −
                              </button>
                              <span className="min-w-[20px] text-center">{quantity}</span>
                              <button
                                onClick={() =>
                                  addToCart(product.id, product.name, product.discountedPrice || product.price)
                                }
                                className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                {hasMore && (
                  <button
                    onClick={() => toggleCategoryExpansion(categoryId)}
                    className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                  >
                    {isExpanded ? 'Show Less' : `See More (${categoryData.products.length - 5} more)`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      <style jsx>{`
        .laundry-loader {
          border: 8px solid #e0e7ff;
          border-top: 8px solid #3b82f6;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1.5s linear infinite;
          position: relative;
          background: radial-gradient(circle, #ffffff 10%, #e0e7ff 20%, transparent 60%);
        }

        .laundry-loader::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: #3b82f6;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </section>
  );
}