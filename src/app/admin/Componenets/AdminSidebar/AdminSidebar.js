'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ShoppingBag,
  Package,
  MessageSquare,
  Users,
  CreditCard,
} from 'lucide-react';

const menu = [
  { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" />, href: '/admin/dashboard' },
  { id: 'orders', label: 'Orders', icon: <ShoppingBag className="w-4 h-4" />, href: '/admin/orders' },
  { id: 'products', label: 'Products', icon: <Package className="w-4 h-4" />, href: '/admin/products' },
  { id: 'inquiries', label: 'Inquiries', icon: <MessageSquare className="w-4 h-4" />, href: '/admin/inquiries' },
  { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, href: '/admin/users' },
  { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" />, href: '/admin/billing' },
];

export default function AdminSidebar({ toggleSidebar }) {
  const pathname = usePathname();

  return (
    <aside className="bg-blue-50 border-r border-blue-200 min-h-screen w-56 flex flex-col py-6 px-2">
      <div className="mb-8 px-4 text-xl font-bold text-blue-700 tracking-tight">
        EASY2 Admin
      </div>
      <nav className="flex flex-col gap-1">
        {menu.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => toggleSidebar()} // Close sidebar after navigation
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              pathname.startsWith(item.href)
                ? 'bg-blue-600 text-white'
                : 'text-blue-700 hover:bg-blue-100'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
