'use client';
import React from 'react';
import { Shirt, Bed, Waves, Home } from 'lucide-react'; // Using Home as an alternative
import PropTypes from 'prop-types';

function Categories({ isMobile }) {
  const categories = [
    { name: "Shirts", icon: <Shirt className="w-5 h-5 stroke-[1.5] text-blue-600" /> },
    { name: "Bedsheets", icon: <Bed className="w-5 h-5 stroke-[1.5] text-blue-600" /> },
    { name: "Towels", icon: <Waves className="w-5 h-5 stroke-[1.5] text-blue-600" /> },
    { name: "Curtains", icon: <Home className="w-5 h-5 stroke-[1.5] text-blue-600" /> } // Using Home icon
  ];

  return (
    <section className={isMobile ? "lg:hidden" : "hidden lg:block basis-[20%]"}>
      <h2 className="text-lg font-semibold tracking-tight mb-4">
        Categories
      </h2>
      
      <div className={isMobile ? "grid grid-cols-4 gap-3" : "grid gap-3"}>
        {categories.map((category) => (
          <button
            key={category.name}
            className={`flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm hover:shadow transition ${
              isMobile ? "flex-col" : ""
            }`}
          >
            {category.icon}
            <span className={isMobile ? "text-xs" : "text-sm"}>{category.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

Categories.propTypes = {
  isMobile: PropTypes.bool
};

export default Categories;