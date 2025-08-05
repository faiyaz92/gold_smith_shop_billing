'use client';
import React, { useEffect, useState } from 'react';
import { db } from '@/app/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Products({ addToCart, removeFromCart, cart }) {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const productList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productList);
    };

    fetchProducts();
  }, []);

  const getQuantity = (productName) => {
    const found = cart.find((item) => item.name === productName);
    return found ? found.quantity : 0;
  };

  return (
    <section className="w-full px-4 py-6">
      <h2 className="text-xl font-semibold mb-6">Services</h2>
      <div className="space-y-4">
        {products.map((product) => {
          const quantity = getQuantity(product.name);

          return (
            <div key={product.id} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
              {/* Product Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Name & Price */}
              <div className="flex-1">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-gray-600">₹{product.discountedPrice || product.price}/item</p>
              </div>

              {/* ADD or Quantity Controls */}
              {quantity === 0 ? (
                <button
                  onClick={() => addToCart(product.name, product.discountedPrice || product.price)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  ADD +
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => removeFromCart(product.name)}
                    className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                  >−</button>
                  <span>{quantity}</span>
                  <button
                    onClick={() => addToCart(product.name, product.discountedPrice || product.price)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >+</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
