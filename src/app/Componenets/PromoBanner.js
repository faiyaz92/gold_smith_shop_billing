import { useEffect, useState } from 'react';

export default function PromoBanner() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!hidden && window.scrollY > 40) {
        setHidden(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hidden]);

  return (
    <div 
      className={`fixed top-0 inset-x-0 bg-blue-600 text-white text-sm flex items-center justify-center py-2 z-50 tracking-tight transition-transform duration-400 ease ${
        hidden ? '-translate-y-full' : ''
      }`}
    >
      20% OFF on First Laundry | Code: EASY20
    </div>
  );
}