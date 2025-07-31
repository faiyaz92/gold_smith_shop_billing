'use client';
import React from 'react';
import { Shirt, Bed, Waves, Home } from 'lucide-react';
import PropTypes from 'prop-types';

function Categories({ isMobile }) {
  const categories = [
    { name: "Shirts", icon: <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" /> },
    { name: "Bedsheets", icon: <Bed className="w-5 h-5 stroke-[1.5] text-blue-600" /> },
    { name: "Towels", icon: <Waves className="w-5 h-5 stroke-[1.5] text-blue-600" /> },
    { name: "Curtains", icon: <Home className="w-5 h-5 stroke-[1.5] text-blue-600" /> }
  ];

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
                key={category.name}
                className="
                  flex-shrink-0 w-28
                  flex flex-col items-center gap-2 p-3 bg-white rounded-lg 
                  shadow-sm hover:shadow-md transition-all duration-300
                  border border-gray-100 hover:border-blue-200
                  transform hover:-translate-y-1
                "
              >
                <span className="p-2 bg-blue-50 rounded-full">
                  {React.cloneElement(category.icon, { className: "w-5 h-5 stroke-[1.5] text-blue-600" })}
                </span>
                <span className="text-xs text-gray-700 font-medium text-center">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">  {/* Changed to flex-col for vertical layout */}
          {categories.map((category) => (
            <button
              key={category.name}
              className="
                w-full
                flex items-center gap-3 p-3 bg-white rounded-lg  /* Changed to items-center and gap-3 */
                shadow-sm hover:shadow-md transition-all duration-300
                border border-gray-100 hover:border-blue-200
                transform hover:-translate-y-1
              "
            >
              <span className="p-2 bg-blue-50 rounded-full">
                {React.cloneElement(category.icon, { className: "w-5 h-5 stroke-[1.5] text-blue-600" })}
              </span>
              <span className="text-sm text-gray-700 font-medium">
                {category.name}
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