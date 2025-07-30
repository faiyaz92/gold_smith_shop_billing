'use client';

export default function Navbar() {
  return (
    <nav className="sticky top-0 w-full bg-white shadow-sm z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 lg:px-8 h-16">
        <div className="font-semibold tracking-tight text-lg text-blue-700 select-none">
          Easy2 Laundry
        </div>
        
        <div className="flex-1 mx-4 hidden sm:block">
          <input
            type="text"
            placeholder="Search clothes, services..."
            className="w-full max-w-md rounded-full border border-gray-300 bg-gray-100 py-2 px-4 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <div className="flex gap-6 items-center text-sm">
          <button className="hover:text-blue-600 transition">Help</button>
          <button className="py-1.5 px-4 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition">
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}