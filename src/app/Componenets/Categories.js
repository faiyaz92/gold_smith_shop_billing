'use client';
import React, { useState, useEffect } from 'react';
import { Shirt, Bed, Waves, Home } from 'lucide-react';
import PropTypes from 'prop-types';
import { db } from '@/app/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';

function Categories({ isMobile, onCategoryClick, activeCategory }) {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const categoryPath = `${tenantCompaniesPath}/${companyId}/categories`;
  const productPath = `${tenantCompaniesPath}/${companyId}/products`;

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const defaultIcons = {
    "Shirts": <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Bedsheets": <Bed className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Towels": <Waves className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Curtains": <Home className="w-5 h-5 stroke-[1.5] text-blue-600" />
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriesSnapshot = await getDocs(collection(db, categoryPath));
        const productsSnapshot = await getDocs(collection(db, productPath));
        const products = productsSnapshot.docs.map(doc => doc.data());

        const categoriesData = categoriesSnapshot.docs.map((doc) => {
          const data = doc.data();
          const { categoriesname, categoriesimage, sortOrder } = data;
          const count = products.filter((product) => product.categoryId === doc.id).length;

          return {
            id: doc.id,
            categoriesname,
            categoriesimage,
            sortOrder: sortOrder ?? 999,
            count,
          };
        });

        const sorted = categoriesData.sort((a, b) => a.sortOrder - b.sortOrder);
        setCategories(sorted);
      } catch (error) {
        console.error('Error fetching categories/products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      {categories.length === 0 ? (
        <p className="text-sm text-gray-500">No categories found.</p>
      ) : isMobile ? (
        <div className="relative">
          <div className="flex space-x-3 pb-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={`flex-shrink-0 w-28 flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-300 transform hover:-translate-y-1 ${
                  activeCategory === category.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'
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
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategoryClick(category.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 transform hover:-translate-y-1 ${
                activeCategory === category.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'
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
