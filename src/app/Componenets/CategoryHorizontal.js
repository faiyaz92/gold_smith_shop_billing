import { useEffect, useState } from 'react';
import { db } from '@/app/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function CategoriesHorizontal({
  activeCategory,
  setActiveCategory,
  activeSubcategory,
  setActiveSubcategory,
}) {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const categoryPath = `${tenantCompaniesPath}/${companyId}/categories`;
  const subcategoryPath = `${tenantCompaniesPath}/${companyId}/subcategories`;

  // Local state for fetched data
  const [categoriesState, setCategoriesState] = useState([]);
  const [subcategoriesState, setSubcategoriesState] = useState([]);

  useEffect(() => {
    const unsubCategories = onSnapshot(collection(db, categoryPath), (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          sortOrder: data.sortOrder ?? 999,
        };
      }).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
      setCategoriesState(categoriesData);
    });
    const unsubSubcategories = onSnapshot(collection(db, subcategoryPath), (snapshot) => {
      const subcategoriesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          sortOrder: data.sortOrder ?? 999,
        };
      }).sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
      setSubcategoriesState(subcategoriesData);
    });
    return () => {
      unsubCategories();
      unsubSubcategories();
    };
  }, [categoryPath, subcategoryPath]);

  // Filter subcategories for the active category
  const filteredSubcategories = subcategoriesState.filter(
    (sub) => sub.categoryId === activeCategory
  );

  const scrollToCluster = (dataAttr, id) => {
    const el = document.querySelector(`[${dataAttr}="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-white rounded-xl w-full">
      {/* Categories Horizontal Scroll */}
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-2 py-3 min-w-max">
          {categoriesState.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveSubcategory(null);
                scrollToCluster('data-categoryid', cat.id);
              }}
              className={`flex flex-col items-center justify-center rounded-xl border transition min-w-[90px] w-[90px] h-[90px] p-2
                ${activeCategory === cat.id
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}
            >
              {cat.categoriesimage ? (
                <img
                  src={cat.categoriesimage}
                  alt={cat.categoriesname}
                  className="w-10 h-10 mb-1 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 mb-1 rounded-full bg-blue-50" />
              )}
              <span className="text-xs text-center truncate w-full">{cat.categoriesname}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories Horizontal Scroll */}
      {filteredSubcategories.length > 0 && (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 px-2 py-2 min-w-max">
            {filteredSubcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveSubcategory(sub.id);
                  scrollToCluster('data-subcategoryid', sub.id);
                }}
                className={`rounded-full border text-xs px-4 py-2 transition min-w-[80px]
                  ${activeSubcategory === sub.id
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
              >
                {sub.name}
              </button>
            ))}
          </div>
          <div className="block lg:hidden sticky top-0 w-full h-1 bg-gray-200 mt-1" />
        </div>
      )}
    </div>
  );
}