'use client';
import React, { useState, useEffect } from 'react';
import { Shirt, Bed, Waves, Home } from 'lucide-react';
import PropTypes from 'prop-types';
import { db } from '@/app/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';

function Categories({ isMobile, onCategoryClick, activeCategory }) {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const categoryPath = `${tenantCompaniesPath}/${companyId}/categories`;
  const productPath = `${tenantCompaniesPath}/${companyId}/products`;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localActiveCategory, setLocalActiveCategory] = useState(activeCategory); // Local state for UI

  const defaultIcons = {
    "Shirts": <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Bedsheets": <Bed className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Towels": <Waves className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Curtains": <Home className="w-5 h-5 stroke-[1.5] text-blue-600" />
  };

  // Sync localActiveCategory with activeCategory prop
  useEffect(() => {
    setLocalActiveCategory(activeCategory);
  }, [activeCategory]);

  // Real-time sync for categories and products
  useEffect(() => {
    setLoading(true);
    const unsubCategories = onSnapshot(collection(db, categoryPath), (categoriesSnapshot) => {
      const categoriesData = categoriesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const { categoriesname, categoriesimage, sortOrder } = data;
        return {
          id: doc.id,
          categoriesname,
          categoriesimage,
          sortOrder: sortOrder ?? 999,
        };
      });
      setCategories(categoriesData);
      setLoading(false);
    });

    const unsubProducts = onSnapshot(collection(db, productPath), (productsSnapshot) => {
      setProducts(productsSnapshot.docs.map(doc => doc.data()));
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, [categoryPath, productPath]);

  // Set the first category as active by default if no activeCategory is provided
  useEffect(() => {
    if (categories.length > 0 && !activeCategory && !localActiveCategory) {
      setLocalActiveCategory(categories[0].id);
      onCategoryClick(categories[0].id);
    }
    // eslint-disable-next-line
  }, [categories, activeCategory, onCategoryClick]);

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    setLocalActiveCategory(categoryId); // Update local state for immediate UI feedback
    onCategoryClick(categoryId); // Notify parent for filtering/scrolling
  };

  // Count products per category
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: products.filter((product) => product.categoryId === cat.id).length,
  }));

  if (loading) {
    return (
      <section className={isMobile ? "lg:hidden w-full px-4 py-2" : "hidden lg:block basis-[20%] max-w-xs"}>
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-gray-800">Categories</h2>
        <div className="flex space-x-3 pb-2 overflow-x-auto scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-28 h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={isMobile ? "lg:hidden w-full px-4 py-2" : "hidden lg:block basis-[20%] max-w-xs"}>
      <h2 className="text-lg font-semibold tracking-tight mb-4 text-gray-800">Categories</h2>

      {categoriesWithCount.length === 0 ? (
        <p className="text-sm text-gray-500">No categories found.</p>
      ) : isMobile ? (
        <div className="relative">
          <div className="flex space-x-3 pb-2 overflow-x-auto scrollbar-hide">
            {categoriesWithCount.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex-shrink-0 w-28 flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-300 transform hover:-translate-y-1 ${
                  localActiveCategory === category.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'
                }`}
              >
                {category.categoriesimage ? (
                  <div className="relative w-10 h-10 overflow-hidden rounded-full">
                    <Image src={category.categoriesimage} alt={category.categoriesname} fill className="object-cover" />
                  </div>
                ) : (
                  <span className="p-2 bg-blue-50 rounded-full">
                    {defaultIcons[category.categoriesname] || <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />}
                  </span>
                )}
                <span className="text-xs text-gray-700 font-medium text-center">
                  {category.categoriesname} ({category.count})
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categoriesWithCount.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 transform hover:-translate-y-1 ${
                localActiveCategory === category.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'
              }`}
            >
              {category.categoriesimage ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image src={category.categoriesimage} alt={category.categoriesname} fill className="object-cover" />
                </div>
              ) : (
                <span className="p-2 bg-blue-50 rounded-full">
                  {defaultIcons[category.categoriesname] || <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />}
                </span>
              )}
              <span className="text-sm text-gray-700 font-medium">
                {category.categoriesname} ({category.count})
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

Categories.propTypes = {
  isMobile: PropTypes.bool,
  onCategoryClick: PropTypes.func,
  activeCategory: PropTypes.string
};

export default Categories;