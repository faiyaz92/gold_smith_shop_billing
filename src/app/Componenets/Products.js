'use client';
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/app/firebase';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { ChevronDown } from 'lucide-react';

export default function Products({
  addToCart,
  removeFromCart,
  cart,
  onActiveCategoryChange,
  onActiveSubcategoryChange, // <-- add this
  searchQuery = '',
  activeSubcategory,
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('list');
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
                const subcategoryDoc = await getDoc(
                  doc(db, subcategoryPath, data.subcategoryId)
                );
                if (subcategoryDoc.exists()) {
                  subcategoryName = subcategoryDoc.data().name || 'None';
                }
              }

              return {
                id: docSnap.id,
                name: data.name || '',
                price: data.price || 0,
                discountedPrice: data.discountedPrice || null,
                image: data.image || '/placeholder.png',
                categoryId: data.categoryId || '',
                subcategoryId: data.subcategoryId || '',
                categoryName,
                subcategoryName,
                sortOrder: data.sortOrder ?? 999, // Fallback for products
                createdAt: data.createdAt || new Date().toISOString(), // Fallback
              };
            })
          );
          // Sort products by sortOrder (or createdAt if sortOrder not available)
          const sortedProductsData = productsData.sort((a, b) => 
            (a.sortOrder ?? a.createdAt) < (b.sortOrder ?? b.createdAt) ? -1 : 1
          );
          setProducts(sortedProductsData);
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

    const unsubCategories = onSnapshot(
      collection(db, categoryPath),
      (categoriesSnapshot) => {
        try {
          const categoriesData = categoriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            categoriesname: doc.data().categoriesname || 'Unknown',
            sortOrder: doc.data().sortOrder ?? 999, // Fallback
          })).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)); // Sort by sortOrder
          setCategories(categoriesData);
        } catch (err) {
          setError('Error fetching categories: ' + err.message);
        }
      },
      (err) => {
        setError('Error fetching categories: ' + err.message);
      }
    );

    const unsubSubcategories = onSnapshot(
      collection(db, subcategoryPath),
      (subcategoriesSnapshot) => {
        try {
          const subcategoriesData = subcategoriesSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name || 'Unknown',
            categoryId: doc.data().categoryId || '',
            sortOrder: doc.data().sortOrder ?? 999, // Fallback
          })).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)); // Sort by sortOrder
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
        let mostVisible = null;
        let maxRatio = 0;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            mostVisible = entry;
            maxRatio = entry.intersectionRatio;
          }
        });

        if (mostVisible) {
          if (onActiveCategoryChange) {
            onActiveCategoryChange(mostVisible.target.dataset.categoryid);
          }
          if (onActiveSubcategoryChange && mostVisible.target.dataset.subcategoryid) {
            onActiveSubcategoryChange(mostVisible.target.dataset.subcategoryid);
          }
        }
      },
      { threshold: [0.4, 0.6, 0.8] }
    );

    Object.values(categoryRefs.current).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [products, categories, onActiveCategoryChange, onActiveSubcategoryChange]);

  const getQuantity = (productId) => {
    const found = cart.find((item) => item.id === productId);
    return found ? found.quantity : 0;
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubcategory = selectedSubcategory
      ? product.subcategoryId === selectedSubcategory
      : true;
    return matchesSearch && matchesSubcategory;
  });

  const filteredSubcategories = subcategories;

  // Group products by category and subcategory (sorted by sortOrder)
  const productsByCategory = {};
  filteredProducts.forEach((product) => {
    const categoryId = product.categoryId || 'uncategorized';
    const subcategoryId = product.subcategoryId || 'none';
    if (!productsByCategory[categoryId]) productsByCategory[categoryId] = {};
    if (!productsByCategory[categoryId][subcategoryId]) productsByCategory[categoryId][subcategoryId] = [];
    productsByCategory[categoryId][subcategoryId].push(product);
  });

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  // Helper to get sorted subcategories for a category
  const getSortedSubcatsForCategory = (categoryId) => {
    const catSubcats = productsByCategory[categoryId] || {};
    return Object.entries(catSubcats)
      .map(([subcatId, prods]) => {
        const subcat = subcategories.find(s => s.id === subcatId);
        return { subcatId, products: prods, sortOrder: subcat?.sortOrder ?? 999 };
      })
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
      .map(item => [item.subcatId, item.products]);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-blue-600 relative mb-6">
            <span className="absolute inset-0 flex items-center justify-center text-4xl">
              🧺
            </span>
          </div>
          <div className="text-blue-700 text-lg font-semibold mt-2 animate-pulse">
            Loading your laundry products...
          </div>
          <div className="text-blue-400 mt-1 text-sm">
            Please wait while we freshen up your products!
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <section className="w-full">
      <div className="space-y-8">
        {categories.map((category) => {
          const categorySubcats = getSortedSubcatsForCategory(category.id);
          if (categorySubcats.length === 0) return null;
          return (
            <div key={category.id} data-categoryid={category.id} ref={(el) => (categoryRefs.current[category.id] = el)}>
              {/* Category Header - Fixed for mobile sticky */}
              <div className="sticky top-0 z-30 bg-blue-900 py-2 border-b border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-white text-center">
                  {category.categoriesname}
                </h3>
              </div>
              {categorySubcats.map(([subcatId, products]) => {
                const isExpanded = expandedCategories[category.id];
                const displayProducts = isExpanded ? products : products.slice(0, 5);
                const hasMore = products.length > 5;
                const subcatName = subcategories.find(sub => sub.id === subcatId)?.name || 'Other';

                return (
                  <div
                    key={subcatId}
                    data-subcategoryid={subcatId}
                    className={`space-y-3 ${activeSubcategory === subcatId ? 'bg-blue-50 border-l-4 border-blue-300' : ''}`}
                  >
                    {/* Subcategory Header - Fixed for mobile sticky */}
                    <div className="sticky z-20 bg-blue-400 py-1 border-b border-gray-200 shadow-sm" style={{ top: '48px' }}>
                      <h4 className="text-base font-semibold text-white text-center">
                        {subcatName}
                      </h4>
                    </div>
                    <ul className="space-y-3 relative z-0">
                      {displayProducts.map(product => {
                        const quantity = getQuantity(product.id);
                        const prodCategory = categories.find(cat => cat.id === product.categoryId);
                        const prodSubcategory = subcategories.find(sub => sub.id === product.subcategoryId);
                        return (
                          <li key={product.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
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
                              <div className="mb-1">
                                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">
                                  {(prodCategory?.categoriesname || '')}
                                  {prodSubcategory ? ` / ${prodSubcategory.name}` : ''}
                                </span>
                              </div>
                              <h3 className="font-medium">{product.name}</h3>
                              <p className="text-sm text-gray-500">{product.subcategoryName}</p>
                              <div className="flex gap-2">
                                {product.discountedPrice ? (
                                  <>
                                    <p className="text-gray-500 line-through">KWD {product.price}</p>
                                    <p className="text-gray-600 font-medium">KWD {product.discountedPrice}</p>
                                  </>
                                ) : (
                                  <p className="text-gray-600">KWD {product.price}</p>
                                )}
                              </div>
                            </div>
                            {quantity === 0 ? (
                              <button
                                onClick={() => addToCart(product)}
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
                                  onClick={() => addToCart(product)}
                                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors"
                                >
                                  +
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {hasMore && (
                      <div className="relative z-0">
                        <button
                          onClick={() => toggleCategoryExpansion(category.id)}
                          className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                        >
                          {isExpanded ? 'Show Less' : `See More (${products.length - 5} more)`}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}