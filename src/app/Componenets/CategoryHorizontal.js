import { useEffect, useState } from 'react';
import { db } from '@/app/firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  const [collapsed, setCollapsed] = useState(false);

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
      setCategories(categoriesData);
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
      setSubcategories(subcategoriesData);
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

  // Find selected category/subcategory
  const selectedCategory = categories.find(cat => cat.id === activeCategory);
  const selectedSubcategory = filteredSubcategories.find(sub => sub.id === activeSubcategory);

  return (
    <div className="sticky top-[56px] z-30 bg-gray-50">
      {/* Collapsed: Show only selected category > subcategory, arrow right */}
      {collapsed ? (
        <div className="flex items-center justify-between gap-2 px-2 py-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCategory && (
              <div className="flex items-center bg-blue-100 border border-blue-400 rounded-xl px-2 py-1 min-w-0">
                {selectedCategory.categoriesimage ? (
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white mr-2">
                    <Image src={selectedCategory.categoriesimage} alt={selectedCategory.categoriesname} width={32} height={32} className="object-cover" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-50 mr-2" />
                )}
                <span className="text-sm font-medium truncate">{selectedCategory.categoriesname}</span>
              </div>
            )}
            {selectedSubcategory && (
              <>
                <span className="mx-2 text-lg text-blue-400 font-bold">{'>'}</span>
                <div className="flex items-center bg-blue-100 border border-blue-400 rounded-xl px-2 py-1 min-w-0">
                  {selectedSubcategory.image ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white mr-2">
                      <Image src={selectedSubcategory.image} alt={selectedSubcategory.name} width={32} height={32} className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-50 mr-2" />
                  )}
                  <span className="text-sm font-medium truncate">{selectedSubcategory.name}</span>
                </div>
              </>
            )}
          </div>
          <button
            className="p-1 rounded-full bg-blue-100 text-blue-700 ml-2"
            onClick={() => setCollapsed(false)}
            aria-label="Expand categories"
          >
            <ChevronDown size={20} />
          </button>
        </div>
      ) : (
        <>
          {/* Arrow right-aligned at top */}
          <div className="flex justify-end items-center pr-2">
            <button
              className="p-1 rounded-full bg-blue-100 text-blue-700"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse categories"
            >
              <ChevronUp size={20} />
            </button>
          </div>
          {/* Categories and Subcategories with divider and labels */}
          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-0">
            {/* Categories */}
            <div className="flex flex-col items-center w-full">
              <span className="text-xs font-semibold text-blue-700 mb-1">Services</span>
              <div className="overflow-x-auto overflow-y-hidden scrollbar-hide w-full">
                <div className="inline-flex space-x-3 py-2 px-1">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setActiveCategory(cat.id);
                        setActiveSubcategory(null);
                        scrollToCluster('data-categoryid', cat.id);
                      }}
                      className={`flex flex-col items-center justify-center rounded-xl border transition shrink-0
                        w-20 h-20 min-w-[88px] min-h-[88px] max-w-[88px] max-h-[88px]
                        ${activeCategory === cat.id
                          ? 'bg-blue-100 border-blue-400 text-blue-700'
                          : 'bg-gray-100 border-gray-200 text-gray-700'
                        }`}
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
            </div>
            {/* Divider */}
            {filteredSubcategories.length > 0 && (
              <div className="flex items-center justify-center w-full my-1">
                {/* Horizontal divider for mobile, vertical for desktop */}
                <div className="h-px w-16 bg-blue-200 mx-2 sm:hidden" />
                <div className="w-px h-10 bg-blue-200 mx-2 hidden sm:block" />
              </div>
            )}
            {/* Subcategories */}
            {filteredSubcategories.length > 0 && (
              <div className="flex flex-col items-center w-full">
                <span className="text-xs font-semibold text-blue-700 mb-1">Types</span>
                <div className="overflow-x-auto overflow-y-hidden scrollbar-hide w-full">
                  <div className="inline-flex space-x-3 py-1 px-1">
                    {filteredSubcategories.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveSubcategory(sub.id);
                          scrollToCluster('data-subcategoryid', sub.id);
                        }}
                        className={`flex items-center rounded-xl border transition shrink-0
                          h-14 min-h-[56px] px-2 pr-4
                          ${activeSubcategory === sub.id
                            ? 'bg-blue-100 border-blue-400 text-blue-700'
                            : 'bg-gray-100 border-gray-200 text-gray-700'
                          }`}
                        style={{ minWidth: 140, maxWidth: 200 }}
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
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}