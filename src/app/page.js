'use client';

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ShoppingBag, Search, Star, Truck, Shield, Heart } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';
import { useTranslation } from '@/app/utils/useTranslation';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useFirestorePaths } from '@/app/utils/firestorePaths';

export default function Home() {
  const { t } = useTranslation();
  const { cartCount, addToCart } = useCart();
  const { getProductPath, getCategoryPath } = useFirestorePaths();

  // Static perfume images for demo purposes
  const getDummyPerfumeImage = (productId, index) => {
    // Static perfume bottle images (SVG files in public folder)
    const staticImages = [
      '/perfume-1.svg', // Midnight Rose EDP
      '/perfume-2.svg', // Ocean Breeze EDT
      '/perfume-3.svg', // Amber Nights EDP
      '/perfume-4.svg', // Citrus Sunrise EDT
      '/perfume-5.svg', // Vanilla Dreams EDP
      '/perfume-6.svg', // Woody Essence EDT
      '/perfume-7.svg', // Floral Fantasy EDP
      '/perfume-8.svg'  // Fresh Green EDT
    ];

    return staticImages[index % staticImages.length];
  };

  // Category images for shop by category section
  const getCategoryImage = (categoryName) => {
    const categoryImages = {
      'Floral': '/category-floral.svg',
      'Woody': '/category-woody.svg',
      'Oriental': '/category-oriental.svg'
    };

    return categoryImages[categoryName] || '/perfume-fallback.svg';
  };

  const [featuredProducts, setFeaturedProducts] = useState([
    {
      id: 'sample-1',
      name: 'Midnight Rose EDP',
      price: 85,
      discountedPrice: 68,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'A luxurious floral scent with notes of damask rose, jasmine, and vanilla. Perfect for evening wear.',
      notes: 'Top: Bergamot, Rose • Heart: Jasmine, Ylang-Ylang • Base: Vanilla, Patchouli'
    },
    {
      id: 'sample-2',
      name: 'Ocean Mist Cologne',
      price: 65,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'Fresh and invigorating aquatic fragrance inspired by the Mediterranean sea breeze.',
      notes: 'Top: Sea Salt, Lemon • Heart: Marine Accord, Lavender • Base: Amber, Musk'
    },
    {
      id: 'sample-3',
      name: 'Golden Amber Parfum',
      price: 120,
      discountedPrice: 96,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'An oriental masterpiece blending warm amber with exotic spices and precious woods.',
      notes: 'Top: Saffron, Cinnamon • Heart: Amber, Labdanum • Base: Oud, Sandalwood'
    },
    {
      id: 'sample-4',
      name: 'Fresh Citrus EDT',
      price: 45,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'Bright and energizing citrus fragrance perfect for daytime wear and casual occasions.',
      notes: 'Top: Grapefruit, Orange • Heart: Neroli, Petitgrain • Base: White Musk'
    },
    {
      id: 'sample-5',
      name: 'Velvet Jasmine EDP',
      price: 75,
      discountedPrice: 60,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'Sensual and romantic white floral fragrance featuring night-blooming jasmine.',
      notes: 'Top: Night Jasmine, Orange Blossom • Heart: Tuberose, Gardenia • Base: White Chocolate, Tonka'
    },
    {
      id: 'sample-6',
      name: 'Woody Cedar Cologne',
      price: 70,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'Masculine and sophisticated woody fragrance with fresh cedar and leather accents.',
      notes: 'Top: Grapefruit, Black Pepper • Heart: Cedar, Juniper • Base: Leather, Vetiver'
    },
    {
      id: 'sample-7',
      name: 'Sweet Vanilla Parfum',
      price: 95,
      discountedPrice: 76,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'Warm and comforting gourmand fragrance perfect for cooler seasons.',
      notes: 'Top: Caramel, Orange • Heart: Vanilla, Cinnamon • Base: Bourbon, Cocoa'
    },
    {
      id: 'sample-8',
      name: 'Fresh Green EDT',
      price: 50,
      image: '/hero-perfume.jpg', // Will be replaced with dummy perfume image
      description: 'Crisp and natural green fragrance inspired by fresh-cut grass and herbs.',
      notes: 'Top: Green Apple, Basil • Heart: Green Tea, Fennel • Base: White Musk, Amber'
    }
  ]);
  const [categories, setCategories] = useState([
    { id: 'cat-1', categoriesname: 'Floral' },
    { id: 'cat-2', categoriesname: 'Woody' },
    { id: 'cat-3', categoriesname: 'Oriental' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a small delay to ensure Firebase is initialized
    const timer = setTimeout(() => {
      fetchData();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      console.log('Company ID:', process.env.NEXT_PUBLIC_COMPANY_ID);

      // Check if Firebase is initialized
      if (!db) {
        console.error('Firebase db is not initialized');
        setFeaturedProducts([]);
        setCategories([]);
        return;
      }

      const productPath = getProductPath();
      const categoryPath = getCategoryPath();
      console.log('Product path:', productPath);
      console.log('Category path:', categoryPath);

      // Fetch featured products with error handling
      try {
        const productsQuery = query(collection(db, productPath), orderBy('price', 'desc'), limit(8));
        const productsSnapshot = await getDocs(productsQuery);
        const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Products fetched:', products.length);
        if (products.length > 0) {
          setFeaturedProducts(products);
        }
      } catch (productError) {
        console.error('Error fetching products:', productError);
        // Keep fallback data
      }

      // Fetch categories with error handling
      try {
        const categoriesSnapshot = await getDocs(collection(db, categoryPath));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('Categories fetched:', categoriesData.length);
        if (categoriesData.length > 0) {
          setCategories(categoriesData);
        }
      } catch (categoryError) {
        console.error('Error fetching categories:', categoryError);
        // Keep fallback data
      }
    } catch (error) {
      console.error('General error in fetchData:', error);
      setFeaturedProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50">
      <Head>
        <title>Luxe Perfumes - Premium Fragrances</title>
        <meta name="description" content="Discover the finest collection of luxury perfumes" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50">
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
              <Link href="/products" className="text-gray-700 hover:text-rose-600 transition-colors">
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
                <Search className="w-5 h-5 text-gray-500" />
              </div>
              <Link href="/cart" className="relative">
                <ShoppingBag className="w-6 h-6 text-gray-700" />
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                Discover Your
                <span className="text-rose-600"> Signature</span>
                <br />
                Scent
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Explore our curated collection of luxury perfumes from the world&apos;s finest fragrance houses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/products"
                  className="bg-rose-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-rose-700 transition-colors text-center"
                >
                  Shop Now
                </Link>
                <button className="border-2 border-rose-600 text-rose-600 px-8 py-3 rounded-full font-semibold hover:bg-rose-50 transition-colors">
                  Learn More
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  // TODO: Uncomment when proper image upload is implemented in admin panel
                  // src="/hero-perfume.jpg"
                  src="/perfume-1.svg"
                  alt="Luxury Perfume Collection"
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    e.target.src = '/perfume-fallback.svg';
                  }}
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-xl shadow-lg p-4">
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className="font-semibold text-gray-900">4.9/5</span>
                  <span className="text-gray-600">(2,847 reviews)</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
            <p className="text-gray-600 text-lg">Discover fragrances that match your personality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {categories.slice(0, 3).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="group cursor-pointer"
              >
                <Link href={`/products?category=${category.id}`}>
                  <div className="relative h-80 rounded-2xl overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-500 transform group-hover:-translate-y-2">
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>

                    {/* Background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-400/20 to-purple-600/20 z-5"></div>

                    <Image
                      src={getCategoryImage(category.categoriesname)}
                      alt={category.categoriesname}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        e.target.src = '/perfume-fallback.svg';
                      }}
                    />

                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                      <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-rose-200 transition-colors">
                        {category.categoriesname}
                      </h3>
                      <p className="text-white/90 text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {category.categoriesname === 'Floral' && 'Delicate blooms and fresh petals'}
                        {category.categoriesname === 'Woody' && 'Earthy woods and warm spices'}
                        {category.categoriesname === 'Oriental' && 'Exotic resins and precious amber'}
                      </p>
                      <div className="mt-4 flex items-center text-white/80 group-hover:text-white transition-colors">
                        <span className="text-sm font-medium">Explore Collection</span>
                        <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>

                    {/* Decorative elements */}
                    <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Call to action */}
          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white font-semibold rounded-full hover:from-rose-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              <span>View All Categories</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-rose-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block p-1 bg-gradient-to-r from-rose-400 to-pink-400 rounded-full mb-4">
              <div className="bg-white rounded-full px-6 py-2">
                <span className="text-sm font-semibold text-rose-600 uppercase tracking-wider">Premium Collection</span>
              </div>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Discover our most beloved fragrances, carefully curated for the discerning perfume enthusiast</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg animate-pulse overflow-hidden">
                  <div className="h-72 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-5 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative"
                >
                  <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-2 border border-gray-100">
                    {/* Product Image */}
                    <Link href={`/product/${product.id}`}>
                      <div className="relative h-72 overflow-hidden">
                        <Image
                          src={getDummyPerfumeImage(product.id, index)}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            e.target.src = '/perfume-fallback.svg';
                          }}
                        />

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                        {/* Sale badge */}
                        {product.discountedPrice && (
                          <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            SALE
                          </div>
                        )}

                        {/* Favorite button */}
                        <button className="absolute top-4 left-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white/30">
                          <Heart className="w-5 h-5 text-white" />
                        </button>

                        {/* Quick view overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-medium transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            Quick View
                          </div>
                        </div>
                      </div>
                    </Link>

                    {/* Product Info */}
                    <div className="p-6">
                      <Link href={`/product/${product.id}`}>
                        <h3 className="text-lg font-bold text-gray-900 mb-2 hover:text-rose-600 transition-colors overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                          {product.name}
                        </h3>
                      </Link>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">(4.5)</span>
                      </div>

                      {/* Notes preview */}
                      {product.notes && (
                        <p className="text-xs text-gray-500 mb-4 italic overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                          {product.notes}
                        </p>
                      )}

                      {/* Price and Add to Cart */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl font-bold text-gray-900">
                            KWD {product.discountedPrice || product.price}
                          </span>
                          {product.discountedPrice && (
                            <span className="text-sm text-gray-500 line-through">
                              KWD {product.price}
                            </span>
                          )}
                        </div>

                        <motion.button
                          onClick={() => handleAddToCart(product)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="bg-gradient-to-r from-rose-600 to-pink-600 text-white p-3 rounded-full hover:from-rose-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-xl group-hover:shadow-rose-200"
                        >
                          <ShoppingBag className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Decorative corner */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-rose-100 to-transparent rounded-bl-full opacity-50"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* View All Products CTA */}
          <div className="text-center mt-16">
            <div className="inline-block">
              <Link
                href="/products"
                className="group relative inline-flex items-center px-8 py-4 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 text-white font-semibold rounded-full hover:from-rose-700 hover:via-pink-700 hover:to-purple-700 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 overflow-hidden"
              >
                <span className="relative z-10">Explore All Fragrances</span>
                <svg className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Free Delivery</h3>
              <p className="text-gray-600">Free shipping on orders over KWD 50</p>
            </div>

            <div className="text-center">
              <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentic Products</h3>
              <p className="text-gray-600">100% genuine fragrances from authorized distributors</p>
            </div>

            <div className="text-center">
              <div className="bg-rose-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Advice</h3>
              <p className="text-gray-600">Personal fragrance recommendations from our experts</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Luxe Perfumes</h3>
              <p className="text-gray-400">
                Your destination for premium fragrances and luxury scents.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
                <li><Link href="/returns" className="hover:text-white transition-colors">Returns</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Customer Service</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                <li><Link href="/size-guide" className="hover:text-white transition-colors">Size Guide</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Newsletter</h4>
              <p className="text-gray-400 mb-4">
                Subscribe to get special offers and updates.
              </p>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l focus:outline-none focus:border-rose-500"
                />
                <button className="bg-rose-600 px-4 py-2 rounded-r hover:bg-rose-700 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Luxe Perfumes. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}