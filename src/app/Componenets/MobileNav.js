'use client';
import { Home, ShoppingCart, User } from 'lucide-react';

export default function MobileNav({ cart, openCart }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white shadow-lg lg:hidden z-40">
      <div className="flex justify-around py-2">
        <button 
          className="flex flex-col items-center text-xs" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <Home className="w-6 h-6 stroke-[1.5]" /> Home
        </button>
        
        <button className="relative flex flex-col items-center text-xs" onClick={openCart}>
          <ShoppingCart className="w-6 h-6 stroke-[1.5]" /> Cart
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-blue-600 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
        
        <button className="flex flex-col items-center text-xs">
          <User className="w-6 h-6 stroke-[1.5]" /> Account
        </button>
      </div>
    </nav>
  );
}