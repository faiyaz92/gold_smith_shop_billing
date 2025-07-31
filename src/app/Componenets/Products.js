'use client';
import React from 'react';

export default function Products({ addToCart, removeFromCart, cart }) {
  const products = [
    {
      name: "Wash & Iron",
      price: 10,
      image: "https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80"
    },
    {
      name: "Kurta/Kurti",
      price: 15,
      image: "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=1080&q=80"
    },
    {
      name: "Shorts",
      price: 10,
      image: "https://images.unsplash.com/photo-1635151227785-429f420c6b9d?w=1080&q=80"
    },
    {
      name: "Banyan or Inner",
      price: 5,
      image: "https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80"
    }
  ];

  // 👇 get quantity of a product from cart
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
            <div key={product.name} className="bg-white rounded-lg shadow p-4 flex items-center gap-4">
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
                <p className="text-gray-600">₹{product.price}/item</p>
              </div>

              {/* ADD or Quantity Controls */}
              {quantity === 0 ? (
                <button
                  onClick={() => addToCart(product.name, product.price)}
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
                    onClick={() => addToCart(product.name, product.price)}
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
