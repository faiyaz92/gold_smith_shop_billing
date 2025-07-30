'use client';
import { ShoppingCart, X } from 'lucide-react';

export default function Cart({ cart, total, isMobile, onClose }) {
  if (isMobile) {
    return (
      <div className="fixed inset-0 bg-black/40 z-50">
        <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl p-6 max-h-[70vh] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Your Cart</h2>
            <button onClick={onClose}>
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>
          
          <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm">No items yet</p>
            ) : (
              cart.map((item, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                  <span>{item.name}</span>
                  <span>₹{item.price}</span>
                </li>
              ))
            )}
          </ul>
          
          <div className="border-t pt-4 mt-4 text-sm">
            <div className="flex justify-between mb-3">
              <span className="font-medium">Total</span>
              <span className="font-semibold">₹{total}</span>
            </div>
            <button 
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50" 
              disabled={cart.length === 0}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="hidden lg:block basis-[30%]">
      <div className="sticky top-24 bg-white rounded-xl shadow-md p-6 flex flex-col h-[70vh]">
        <h2 className="text-xl font-semibold tracking-tight mb-4 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 stroke-[1.5]" /> Cart
        </h2>
        
        <ul className="space-y-3 flex-1 overflow-y-auto pr-1">
          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm">No items yet</p>
          ) : (
            cart.map((item, index) => (
              <li key={index} className="flex justify-between items-center text-sm">
                <span>{item.name}</span>
                <span>₹{item.price}</span>
              </li>
            ))
          )}
        </ul>
        
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between mb-3">
            <span className="font-medium">Total</span>
            <span className="font-semibold">₹{total}</span>
          </div>
          <button 
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50" 
            disabled={cart.length === 0}
          >
            Checkout
          </button>
        </div>
      </div>
    </aside>
  );
}