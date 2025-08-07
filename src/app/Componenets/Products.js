'use client';
import React, { useEffect, useState } from 'react';
import { db } from '@/app/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';

export default function Products({ addToCart, removeFromCart, cart }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      // Fetch products
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = await Promise.all(
        productsSnapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          // Get category name
          let categoryName = 'Uncategorized';
          if (data.categoryId) {
            const categoryDoc = await getDoc(doc(db, 'categories', data.categoryId));
            if (categoryDoc.exists()) {
              categoryName = categoryDoc.data().categoriesname;
            }
          }
          return {
            id: docSnap.id,
            ...data,
            categoryName
          };
        })
      );
      setProducts(productsData);

      // Fetch categories
      const categoriesSnapshot = await getDocs(collection(db, 'categories'));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoriesData);
    };

    fetchData();
  }, []);

  const getQuantity = (productName) => {
    const found = cart.find((item) => item.name === productName);
    return found ? found.quantity : 0;
  };

  // Group products by category
  const productsByCategory = {};
  products.forEach(product => {
    const categoryId = product.categoryId || 'uncategorized';
    if (!productsByCategory[categoryId]) {
      const category = categories.find(cat => cat.id === categoryId) || {
        id: 'uncategorized',
        categoriesname: 'Uncategorized'
      };
      productsByCategory[categoryId] = {
        name: category.categoriesname,
        products: []
      };
    }
    productsByCategory[categoryId].products.push(product);
  });

  const toggleCategoryExpansion = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  return (
    <section className="w-full px-4 py-6">
      <h2 className="text-xl font-semibold mb-6">Services</h2>
      <div className="space-y-6">
        {Object.entries(productsByCategory).map(([categoryId, categoryData]) => {
          const isExpanded = expandedCategories[categoryId];
          const displayProducts = isExpanded 
            ? categoryData.products 
            : categoryData.products.slice(0, 5);
          const hasMore = categoryData.products.length > 5;

          return (
            <div key={categoryId} className="space-y-3">
              <h3 className="text-lg font-medium text-gray-800">{categoryData.name}</h3>
              
              <div className="space-y-3">
                {displayProducts.map((product) => {
                  const quantity = getQuantity(product.name);

                  return (
                    <div key={product.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
                      {/* Product Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
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

                      {/* Add to Cart Controls */}
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
                })}
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
    </section>
  );
}