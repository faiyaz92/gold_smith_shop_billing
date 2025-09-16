'use client';
import AdminHeader from './Componenets/AdminHeader';
import AdminSidebar from './Componenets/AdminSidebar/AdminSidebar';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-white text-gray-800 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}