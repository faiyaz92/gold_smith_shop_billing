'use client';

export default function Products({ addToCart }) {
  const products = [
    {
      name: "Wash & Fold",
      price: 30,
      image: "https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80"
    },
    {
      name: "Dry Clean",
      price: 45,
      image: "https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=1080&q=80"
    },
    {
      name: "Ironing",
      price: 15,
      image: "https://images.unsplash.com/photo-1635151227785-429f420c6b9d?w=1080&q=80"
    },
    {
      name: "Shoe Cleaning",
      price: 199,
      image: "https://images.unsplash.com/photo-1621619856624-42fd193a0661?w=1080&q=80"
    }
  ];

  return (
    <section className="flex-1 basis-[40%]">
      <h2 className="text-2xl font-semibold tracking-tight mb-4">Services</h2>
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {products.map((product) => (
          <div key={product.name} className="bg-white rounded-xl shadow-sm hover:shadow-md transition flex flex-col">
            <img 
              src={product.image} 
              alt={product.name}
              className="rounded-t-xl aspect-video object-cover"
            />
            <div className="flex-1 p-4 flex flex-col">
              <h3 className="font-medium mb-1 text-lg tracking-tight">{product.name}</h3>
              <p className="text-sm text-gray-600 mb-3">₹{product.price}/kg</p>
              <button
                onClick={() => addToCart(product.name, product.price)}
                className="mt-auto py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}