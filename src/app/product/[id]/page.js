'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Heart, Share2, Truck, Shield, RotateCcw, Search } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useFirestorePaths } from '@/app/utils/firestorePaths';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id;
  const { addToCart, cartCount } = useCart();
  const { getProductPath, getCategoryPath, getSubcategoryPath } = useFirestorePaths();

  // Static perfume images for demo purposes
  const getDummyPerfumeImages = (productId) => {
    // Static perfume bottle images (SVG files in public folder)
    const staticImages = [
      '/perfume-1.svg', // Midnight Rose EDP
      '/perfume-2.svg', // Ocean Breeze EDT
      '/perfume-3.svg', // Amber Nights EDP
      '/perfume-4.svg'  // Citrus Sunrise EDT
    ];

    // Use product ID to consistently get the same images for the same product
    const hash = productId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    const startIndex = Math.abs(hash) % staticImages.length;
    return staticImages.slice(startIndex).concat(staticImages.slice(0, startIndex));
  };

  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [subcategory, setSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      // Fetch product
      const productDoc = await getDoc(doc(db, getProductPath(), productId));
      if (productDoc.exists()) {
        const productData = { id: productDoc.id, ...productDoc.data() };
        setProduct(productData);

        // Fetch category if exists
        if (productData.categoryId) {
          const categoryDoc = await getDoc(doc(db, getCategoryPath(), productData.categoryId));
          if (categoryDoc.exists()) {
            setCategory({ id: categoryDoc.id, ...categoryDoc.data() });
          }
        }

        // Fetch subcategory if exists
        if (productData.subcategoryId) {
          const subcategoryDoc = await getDoc(doc(db, getSubcategoryPath(), productData.subcategoryId));
          if (subcategoryDoc.exists()) {
            setSubcategory({ id: subcategoryDoc.id, ...subcategoryDoc.data() });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-gradient-to-br from-rose-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-rose-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Fragrance Not Found</h1>
          <p className="text-gray-600 mb-8">The perfume you're looking for doesn't exist or has been removed.</p>
          <Link
            href="/products"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold rounded-full hover:from-rose-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Explore Our Collection
          </Link>
        </div>
      </div>
    );
  }

  const images = getDummyPerfumeImages(productId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-rose-50">
      {/* Navigation */}
      <nav className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-rose-600">
                Luxe Perfumes
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-rose-600 transition-colors">
                Home
              </Link>
              <Link href="/products" className="text-rose-600 font-semibold">
                Shop
              </Link>
              <Link href="/about" className="text-gray-700 hover:text-rose-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="text-gray-700 hover:text-rose-600 transition-colors">
                Contact
              </Link>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-500 cursor-pointer hover:text-rose-600 transition-colors" />
              </div>
              <Link href="/cart" className="relative">
                <ShoppingBag className="w-6 h-6 text-gray-700 hover:text-rose-600 transition-colors" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link href="/auth" className="text-gray-700 hover:text-rose-600 transition-colors">
                Account
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-rose-600 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-rose-600 transition-colors">Products</Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Product Images */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative h-[500px] lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white to-rose-50 border border-gray-100"
            >
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                onError={(e) => {
                  e.target.src = '/perfume-fallback.svg';
                }}
              />

              {/* Decorative overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>

              {/* Favorite button */}
              <button className="absolute top-6 right-6 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-all duration-300 hover:bg-white/30">
                <Heart className="w-6 h-6 text-white" />
              </button>
            </motion.div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex space-x-4 overflow-x-auto pb-2"
              >
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-300 ${
                      selectedImage === index
                        ? 'border-rose-500 shadow-lg scale-105'
                        : 'border-gray-200 hover:border-rose-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.target.src = '/perfume-fallback.svg';
                      }}
                    />
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              {/* Category Badge */}
              <div className="flex items-center space-x-2">
                <span className="inline-block px-4 py-2 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 rounded-full text-sm font-medium">
                  {category?.categoriesname || 'Premium Fragrance'}
                </span>
                {subcategory && (
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 rounded-full text-sm font-medium">
                    {subcategory.name}
                  </span>
                )}
              </div>

              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">{product.name}</h1>

              {/* Rating */}
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">4.5</span>
                </div>
                <span className="text-gray-600">•</span>
                <span className="text-gray-600">127 reviews</span>
                <span className="text-gray-600">•</span>
                <span className="text-green-600 font-medium">In Stock</span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-4 py-4">
                <span className="text-4xl font-bold text-gray-900">
                  KWD {product.discountedPrice || product.price}
                </span>
                {product.discountedPrice && (
                  <>
                    <span className="text-2xl text-gray-500 line-through">
                      KWD {product.price}
                    </span>
                    <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      {Math.round(((product.price - product.discountedPrice) / product.price) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">About This Fragrance</h3>
                  <p className="text-gray-700 leading-relaxed text-lg">{product.description}</p>
                </div>
              )}

              {/* Quantity Selector */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-100">
                <label className="block text-lg font-semibold text-gray-900 mb-4">Quantity</label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-full p-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors font-bold text-xl"
                    >
                      −
                    </motion.button>
                    <span className="w-16 text-center font-bold text-xl text-gray-900">{quantity}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors font-bold text-xl"
                    >
                      +
                    </motion.button>
                  </div>
                  <span className="text-gray-600 ml-4">bottles available</span>
                </div>
              </div>

              {/* Add to Cart Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white py-5 px-8 rounded-2xl hover:from-rose-700 hover:via-pink-700 hover:to-purple-700 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden relative group"
              >
                <span className="relative z-10 flex items-center justify-center space-x-3 font-bold text-xl">
                  <ShoppingBag className="w-6 h-6" />
                  <span>Add to Cart • KWD {(product.discountedPrice || product.price) * quantity}</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </motion.button>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center space-x-3 py-4 px-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 group"
                >
                  <Heart className="w-5 h-5 text-gray-600 group-hover:text-rose-600 transition-colors" />
                  <span className="font-semibold text-gray-700 group-hover:text-rose-600 transition-colors">Add to Wishlist</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center space-x-3 py-4 px-6 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 group"
                >
                  <Share2 className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                  <span className="font-semibold text-gray-700 group-hover:text-blue-600 transition-colors">Share</span>
                </motion.button>
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t"
            >
              <div className="flex items-center space-x-3">
                <Truck className="w-8 h-8 text-green-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Free Delivery</h4>
                  <p className="text-sm text-gray-600">Orders over KWD 25</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Secure Payment</h4>
                  <p className="text-sm text-gray-600">100% Protected</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <RotateCcw className="w-8 h-8 text-purple-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Easy Returns</h4>
                  <p className="text-sm text-gray-600">30 Day Policy</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}