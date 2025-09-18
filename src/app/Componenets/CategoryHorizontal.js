import { useEffect, useState, useRef } from 'react';
import { db } from '@/app/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';

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

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  useEffect(() => {
    const unsubCategories = onSnapshot(collection(db, categoryPath), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubSubcategories = onSnapshot(collection(db, subcategoryPath), (snapshot) => {
      setSubcategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => {
      unsubCategories();
      unsubSubcategories();
    };
  }, [categoryPath, subcategoryPath]);

  // Get subcategories for the active category
  const filteredSubcategories = subcategories.filter(
    (sub) => sub.categoryId === activeCategory
  );

  // Helper to scroll to product cluster
  const scrollToCluster = (dataAttr, id) => {
    const el = document.querySelector(`[${dataAttr}="${id}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sticky top-[56px] z-30 bg-gray-50 pb-2">
      {/* Categories horizontal scroll (4 per row) */}
      <div className="flex justify-center">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide py-2 px-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setActiveSubcategory(null);
                scrollToCluster('data-categoryid', cat.id);
              }}
              className={`flex flex-col items-center justify-center rounded-xl border transition
                w-20 h-20 min-w-[80px] min-h-[80px] max-w-[80px] max-h-[80px]
                ${activeCategory === cat.id
                  ? 'bg-blue-100 border-blue-400 text-blue-700'
                  : 'bg-gray-100 border-gray-200 text-gray-700'
                }`}
              style={{ flex: '0 0 80px' }}
            >
              {cat.categoriesimage ? (
                <div className="w-12 h-12 mb-1 rounded-full overflow-hidden bg-white">
                  <Image src={cat.categoriesimage} alt={cat.categoriesname} width={48} height={48} className="object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 mb-1 rounded-full bg-blue-50" />
              )}
              <span className="text-xs text-center truncate w-full">{cat.categoriesname}</span>
            </button>
          ))}
        </div>
      </div>
      {/* Subcategories horizontal scroll (rectangle: image + name in row) */}
      {filteredSubcategories.length > 0 && (
        <div className="flex justify-center">
          <div className="flex space-x-3 overflow-x-auto scrollbar-hide py-1 px-1">
            {filteredSubcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setActiveSubcategory(sub.id);
                  scrollToCluster('data-subcategoryid', sub.id);
                }}
                className={`flex items-center rounded-xl border transition
                  h-14 min-h-[56px] px-2 pr-4
                  ${activeSubcategory === sub.id
                    ? 'bg-blue-100 border-blue-400 text-blue-700'
                    : 'bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                style={{ minWidth: 140, maxWidth: 200, flex: '0 0 auto' }}
              >
                {sub.image ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-white mr-2">
                    <Image src={sub.image} alt={sub.name} width={40} height={40} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-50 mr-2" />
                )}
                <span className="text-sm text-left truncate">{sub.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}