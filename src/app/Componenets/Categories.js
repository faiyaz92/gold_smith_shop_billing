'use client';
import { ChevronDown, ChevronUp, Shirt, Bed, Waves, Home } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { db } from '@/app/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import { useTranslation } from '@/app/utils/useTranslation';

function Categories({ isMobile, onCategoryClick, onSubcategoryClick, activeCategory, activeSubcategory }) {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const categoryPath = `${tenantCompaniesPath}/${companyId}/categories`;
  const productPath = `${tenantCompaniesPath}/${companyId}/products`;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subcategories, setSubcategories] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showAllSubcats, setShowAllSubcats] = useState({});
  const sidebarRef = useRef();

  const { t } = useTranslation();

  const defaultIcons = {
    "Shirts": <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Bedsheets": <Bed className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Towels": <Waves className="w-5 h-5 stroke-[1.5] text-blue-600" />,
    "Curtains": <Home className="w-5 h-5 stroke-[1.5] text-blue-600" />
  };

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
          sortOrder: sortOrder ?? 999, // Fallback if no sortOrder
        };
      }).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)); // Sort by sortOrder ascending
      console.log('Sorted Categories:', categoriesData); // Debug: Log sorted categories
      setCategories(categoriesData);
      setLoading(false);
    });

    const unsubProducts = onSnapshot(collection(db, productPath), (productsSnapshot) => {
      const productsData = productsSnapshot.docs.map(doc => doc.data());
      setProducts(productsData);
    });

    return () => {
      unsubCategories();
      unsubProducts();
    };
  }, [categoryPath, productPath]);

  // Fetch subcategories
  useEffect(() => {
    const subcategoryPath = `${tenantCompaniesPath}/${companyId}/subcategories`;
    const unsubSubcategories = onSnapshot(collection(db, subcategoryPath), (snapshot) => {
      const subcategoriesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          sortOrder: data.sortOrder ?? 999, // Fallback if no sortOrder
        };
      }).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999)); // Sort by sortOrder ascending
      console.log('Sorted Subcategories:', subcategoriesData); // Debug: Log sorted subcategories
      setSubcategories(subcategoriesData);
    });
    return () => unsubSubcategories();
  }, [companyId, tenantCompaniesPath]);

  // Set the first category as active by default if no activeCategory is provided
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      console.log('Setting default active category:', categories[0].id); // Debug
      onCategoryClick(categories[0].id);
    }
  }, [categories, activeCategory, onCategoryClick]);

  // Click outside to collapse
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setExpandedCategory(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle chevron click (expand/collapse)
  const handleChevronClick = (e, categoryId) => {
    e.stopPropagation();
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Handle category row click (select and scroll)
  const handleCategoryRowClick = (categoryId) => {
    setExpandedCategory(null);
    onCategoryClick(categoryId); // Update parent state and trigger scroll
  };

  // Count products per category
  const categoriesWithCount = categories.map((cat) => ({
    ...cat,
    count: products.filter((product) => product.categoryId === cat.id).length,
  }));

  if (loading) {
    return (
      <section className={isMobile ? "lg:hidden w-full px-4 py-2" : "hidden lg:block basis-[20%] max-w-xs"}>
        <h2 className="text-lg font-semibold tracking-tight mb-4 text-gray-800">{t('categories')}</h2>
        <div className="flex space-x-3 pb-2 overflow-x-auto scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-28 h-24 bg-gray-100 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sidebarRef}
      className={isMobile ? "lg:hidden w-full px-4 py-2" : "hidden lg:block basis-[20%] max-w-xs"}
    >
      <h2 className="text-lg font-semibold tracking-tight mb-4 text-gray-800">{t('services')}</h2>
      <div className="flex flex-col gap-3">
        {categoriesWithCount.map((category, index) => {
          const subcats = subcategories.filter(sub => sub.categoryId === category.id);
          const showAll = showAllSubcats[category.id];
          const visibleSubcats = showAll ? subcats : subcats.slice(0, 2);
          const isExpanded = expandedCategory === category.id;
          console.log(`Category ${category.categoriesname}: sortOrder=${category.sortOrder}, index=${index}`); // Debug
          return (
            <div key={category.id}>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 cursor-pointer relative
                  ${activeCategory === category.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100'}
                  hover:bg-blue-100`}
                onClick={() => handleCategoryRowClick(category.id)}
                style={{ minHeight: 48 }}
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
                <span className="text-sm text-gray-700 font-medium flex-1">
                  {category.categoriesname} ({category.count})
                </span>
                {subcats.length > 0 && (
                  <button
                    className="ml-2 flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-blue-200 transition"
                    onClick={e => handleChevronClick(e, category.id)}
                    tabIndex={-1}
                    aria-label={isExpanded ? t('collapse') : t('expand')}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-blue-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                )}
              </div>
              {isExpanded && (
                <div className="ml-10 mt-2 flex flex-wrap gap-2">
                  {visibleSubcats.map(sub => (
                    <button
                      key={sub.id}
                      onClick={e => {
                        e.stopPropagation();
                        if (onSubcategoryClick) onSubcategoryClick(sub.id);
                      }}
                      className={`px-3 py-1 rounded-full text-xs border transition
                        ${activeSubcategory === sub.id
                          ? 'bg-blue-100 border-blue-400 text-blue-700'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}
                    >
                      {sub.name}
                    </button>
                  ))}
                  {subcats.length > 2 && !showAll && (
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setShowAllSubcats(prev => ({ ...prev, [category.id]: true }));
                      }}
                      className="px-3 py-1 rounded-full text-xs border bg-gray-200 border-gray-300 text-gray-700"
                    >
                      {t('showMore')}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

Categories.propTypes = {
  isMobile: PropTypes.bool,
  onCategoryClick: PropTypes.func,
  onSubcategoryClick: PropTypes.func,
  activeCategory: PropTypes.string,
  activeSubcategory: PropTypes.string,
};

export default Categories;
