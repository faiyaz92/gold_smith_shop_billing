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
  searchQuery = '',
}) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categoryRefs = useRef({});
  const subcategoryRefs = useRef({});

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

  const handleCategoryFilterChange = (e) => {
    const categoryId = e.target.value;
    setSelectedCategory(categoryId);
    setSelectedSubcategory('');
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory ? product.categoryId === selectedCategory : true;
    const matchesSubcategory = selectedSubcategory
      ? product.subcategoryId === selectedSubcategory
      : true;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const filteredSubcategories = subcategories.filter((subcat) =>
    selectedCategory ? subcat.categoryId === selectedCategory : true
  );

  // Group products by category and subcategory
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

  return (
    <section className="w-full">
      {/* Filter Dropdowns */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Category Filter */}
        <div className="max-w-xs w-full">
          <select
            value={selectedCategory}
            onChange={handleCategoryFilterChange}
            className="border border-gray-300 bg-white text-gray-800 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.categoriesname}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Product List with Sticky Category Headers */}
      <div className="space-y-8">
        {Object.entries(productsByCategory).map(([categoryId, subcats]) => (
          <div key={categoryId} data-categoryid={categoryId}>
            {/* Sticky Category Header */}
            <div className="sticky top-0 z-10 bg-gray-50 py-2 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-blue-700">
                {(categories.find(cat => cat.id === categoryId) || {}).categoriesname || 'Uncategorized'}
              </h3>
            </div>
            {/* Subcategory clusters */}
            {Object.entries(subcats).map(([subcatId, products]) => {
              const isExpanded = expandedCategories[categoryId];
              const displayProducts = isExpanded ? products : products.slice(0, 5);
              const hasMore = products.length > 5;

              return (
                <div
                  key={subcatId}
                  data-subcategoryid={subcatId}
                  ref={el => (subcategoryRefs.current[subcatId] = el)}
                  className="space-y-3"
                >
                  {/* Sticky Subcategory Header */}
                  <div className="sticky top-12 z-10 bg-gray-100 py-1 border-b border-gray-200">
                    <h4 className="text-base font-semibold text-blue-600">
                      {(subcategories.find(sub => sub.id === subcatId) || {}).name || 'Other'}
                    </h4>
                  </div>
                  <ul className="space-y-3">
                    {displayProducts.map(product => {
                      const quantity = getQuantity(product.id);
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
                        </li>
                      );
                    })}
                  </ul>
                  {hasMore && (
                    <button
                      onClick={() => toggleCategoryExpansion(categoryId)}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      {isExpanded ? 'Show Less' : `See More (${products.length - 5} more)`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
