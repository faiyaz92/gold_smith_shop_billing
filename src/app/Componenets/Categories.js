'use client';
import React, { useState, useEffect } from 'react';
import { Shirt, Bed, Waves, Home } from 'lucide-react';
import PropTypes from 'prop-types';
import { db } from '@/app/firebase';
import { collection, getDocs } from 'firebase/firestore';
import Image from 'next/image';

function Categories({ isMobile }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch categories from Firebase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoriesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          categoriesname: doc.data().categoriesname,
          categoriesimage: doc.data().categoriesimage
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Default icons for fallback
  const defaultIcons = {
    "Shirts": <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Bedsheets": <Bed className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Towels": <Waves className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Curtains": <Home className="w-5 h-5 stroke-[1.5] text-blue-600" />
  };

  if (loading) {
    return (
      <section className={isMobile ? "lg:hidden w-full px-4 py-2" : "hidden lg:block basis-[20%] max-w-xs"}>
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-gray-800">
          Categories
        </h2>
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
      <h2 className="text-lg font-semibold tracking-tight mb-4 text-gray-800">
        Categories
      </h2>
      
      {isMobile ? (
        <div className="relative">
          <div className="flex space-x-3 pb-2 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.id}
                className="
                  flex-shrink-0 w-28
                  flex flex-col items-center gap-2 p-3 bg-white rounded-lg 
                  shadow-sm hover:shadow-md transition-all duration-300
                  border border-gray-100 hover:border-blue-200
                  transform hover:-translate-y-1
                "
              >
                {category.categoriesimage ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image 
                      src={category.categoriesimage} 
                      alt={category.categoriesname}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="p-2 bg-blue-50 rounded-full">
                    {defaultIcons[category.categoriesname] || 
                     <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />}
                  </span>
                )}
                <span className="text-xs text-gray-700 font-medium text-center">
                  {category.categoriesname}
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
              className="
                w-full
                flex items-center gap-3 p-3 bg-white rounded-lg
                shadow-sm hover:shadow-md transition-all duration-300
                border border-gray-100 hover:border-blue-200
                transform hover:-translate-y-1
              "
            >
              {category.categoriesimage ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                  <Image 
                    src={category.categoriesimage} 
                    alt={category.categoriesname}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="p-2 bg-blue-50 rounded-full">
                  {defaultIcons[category.categoriesname] || 
                   <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />}
                </span>
              )}
              <span className="text-sm text-gray-700 font-medium">
                {category.categoriesname}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

Categories.propTypes = {
  isMobile: PropTypes.bool
};

export default Categories;