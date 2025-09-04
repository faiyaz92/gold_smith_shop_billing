'use client';
import React, { useEffect, useState, useRef } from 'react';
import { db } from '@/app/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function Products({ addToCart, removeFromCart, cart, onActiveCategoryChange, searchQuery = '' }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const categoryRefs = useRef({});

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'your-company-id';
  const productPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/products`;
  const categoryPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/categories`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!companyId) {
          throw new Error('NEXT_PUBLIC_COMPANY_ID is not defined');
        }
        const productsSnapshot = await getDocs(collection(db, productPath));
        const productsData = await Promise.all(
          productsSnapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            let categoryName = 'Uncategorized';
            if (data.categoryId) {
              const categoryDoc = await getDoc(doc(db, categoryPath, data.categoryId));
              if (categoryDoc.exists()) {
                categoryName = categoryDoc.data().categoriesname;
              }
            }
            return { id: docSnap.id, ...data, categoryName };
          })
        );
        setProducts(productsData);

        const categoriesSnapshot = await getDocs(collection(db, categoryPath));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find(entry => entry.isIntersecting);
        if (visible) {
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

  const getQuantity = (productName) => {
    const found = cart.find((item) => item.name === productName);
    return found ? found.quantity : 0;
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const productsByCategory = {};
  filteredProducts.forEach(product => {
    const categoryId = product.categoryId || 'uncategorized';
    if (!productsByCategory[categoryId]) {
      const category = categories.find(cat => cat.id === categoryId) || { id: 'uncategorized', categoriesname: 'Uncategorized' };
      productsByCategory[categoryId] = { name: category.categoriesname, products: [] };
    }
    productsByCategory[categoryId].products.push(product);
  });

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  return (
    <section className="w-full px-4 py-6">
      <h2 className="text-xl font-semibold mb-6">Services</h2>
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
                      const quantity = getQuantity(product.name);
                      return (
                        <div key={product.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                          <div className="w-16 h-16 rounded-lg overflow-hidden">
                            <Image src={product.image} alt={product.name} width={64} height={64} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium">{product.name}</h3>
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
                              onClick={() => addToCart(product.name, product.discountedPrice || product.price)}
                              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              ADD +
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => removeFromCart(product.name)}
                                className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
                              >
                                −
                              </button>
                              <span className="min-w-[20px] text-center">{quantity}</span>
                              <button
                                onClick={() => addToCart(product.name, product.discountedPrice || product.price)}
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