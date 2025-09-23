'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Home,
  ShoppingBag,
  Package,
  MessageSquare,
  Users,
  CreditCard,
  Tag,
  MapPin,
  Globe,
  ExternalLink,
  Truck,
  Building,
  Shield,
  BarChart3,  // Added for Analytics
  Settings, // Add this import if not already present
} from 'lucide-react';

const allMenuItems = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: <Home className="w-4 h-4" />, 
    href: '/admin/dashboard',
    roles: ['company_admin', 'general_manager', 'branch_manager']
  },
  { 
    id: 'analytics', 
    label: 'Analytics', 
    icon: <BarChart3 className="w-4 h-4" />, 
    href: '/admin/analytics',
    roles: ['company_admin', 'general_manager']  // Only for top-level management
  },
  { 
    id: 'billing', 
    label: 'Billing (POS)', 
    icon: <CreditCard className="w-4 h-4" />, 
    href: '/admin/billing',
    roles: ['company_admin', 'general_manager', 'branch_manager', 'cashier']
  },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: <ShoppingBag className="w-4 h-4" />, 
    href: '/admin/orders',
    roles: ['company_admin', 'general_manager', 'branch_manager', 'cashier', 'delivery_man', 'pickup_man']
  },
  { 
    id: 'products', 
    label: 'Products', 
    icon: <Package className="w-4 h-4" />, 
    href: '/admin/products',
    roles: ['company_admin', 'general_manager', 'branch_manager']
  },
  { 
    id: 'inquiries', 
    label: 'Inquiries', 
    icon: <MessageSquare className="w-4 h-4" />, 
    href: '/admin/inquiries',
    roles: ['company_admin', 'general_manager', 'branch_manager']
  },
  { 
    id: 'users',
    label: 'Users',
    icon: <Users className="w-4 h-4" />,
    href: '/admin/users',
    roles: ['company_admin', 'general_manager'] // <-- Add general_manager here
  },
  { 
    id: 'coupons', 
    label: 'Coupons', 
    icon: <Tag className="w-4 h-4" />, 
    href: '/admin/coupons',
    roles: ['company_admin', 'general_manager', 'branch_manager']
  },
  { 
    id: 'areas', 
    label: 'Areas', 
    icon: <Globe className="w-4 h-4" />, 
    href: '/admin/areas',
    roles: ['company_admin', 'general_manager']
  },
  { 
    id: 'branches', 
    label: 'Branches', 
    icon: <MapPin className="w-4 h-4" />, 
    href: '/admin/branches',
    roles: ['company_admin', 'general_manager']
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-4 h-4" />,
    href: '/admin/settings',
    roles: ['company_admin', 'general_manager'] // Only these roles can see it
  },
];

// Define default pages for each role
const roleDefaults = {
  company_admin: '/admin/dashboard',
  general_manager: '/admin/dashboard',
  branch_manager: '/admin/dashboard',
  cashier: '/admin/billing',
  delivery_man: '/admin/orders',
  pickup_man: '/admin/orders',
};

export default function AdminSidebar({ toggleSidebar }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState('');
  const [filteredMenu, setFilteredMenu] = useState([]);

  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem('userRole') || '';
    setUserRole(role);

    // Filter menu items based on user role
    const allowedMenuItems = allMenuItems.filter(item => 
      item.roles.includes(role)
    );
    setFilteredMenu(allowedMenuItems);

    // Auto-redirect to default page for role if on restricted page
    if (role && pathname === '/admin/dashboard' && roleDefaults[role] !== '/admin/dashboard') {
      // Only redirect if user is trying to access dashboard but their default is different
      window.location.href = roleDefaults[role];
    }
  }, [pathname]);

  // Get role-specific styling
  const getRoleInfo = (role) => {
    switch (role) {
      case 'company_admin':
        return { color: 'text-purple-700', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' };
      case 'general_manager':
        return { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
      case 'branch_manager':
        return { color: 'text-green-700', bgColor: 'bg-green-50', borderColor: 'border-green-200' };
      case 'cashier':
        return { color: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' };
      case 'delivery_man':
        return { color: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' };
      case 'pickup_man':
        return { color: 'text-teal-700', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' };
      default:
        return { color: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' };
    }
  };

  const roleStyle = getRoleInfo(userRole);

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'company_admin': return <Shield className="w-3 h-3" />;
      case 'general_manager': return <Building className="w-3 h-3" />;
      case 'branch_manager': return <MapPin className="w-3 h-3" />;
      case 'cashier': return <CreditCard className="w-3 h-3" />;
      case 'delivery_man': return <Truck className="w-3 h-3" />;
      case 'pickup_man': return <Package className="w-3 h-3" />;
      default: return <Users className="w-3 h-3" />;
    }
  };

  const formatRoleLabel = (role) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <aside className={`${roleStyle.bgColor} border-r ${roleStyle.borderColor} min-h-screen w-56 flex flex-col py-6 px-2`}>
      {/* Header with role indicator */}
      <div className="mb-6 px-4">
        <div className={`text-xl font-bold ${roleStyle.color} tracking-tight mb-2`}>
          EASY2 Admin
        </div>
        {userRole && (
          <div
            className={`flex items-center gap-2 text-xs ${roleStyle.color} px-2 py-1 rounded border ${roleStyle.borderColor}`}
            style={{ marginTop: '22px' }}
          >
            {getRoleIcon(userRole)}
            <span>{formatRoleLabel(userRole)}</span>
          </div>
        )}
      </div>

      {/* Make nav scrollable, no other changes */}
      <nav
        className="flex flex-col gap-1 overflow-y-auto flex-1 pr-1"
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        {filteredMenu.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            onClick={() => toggleSidebar()}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              pathname.startsWith(item.href)
                ? `bg-blue-600 text-white`
                : `${roleStyle.color} hover:bg-blue-100`
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}

        {/* Open Laundry - Available to all roles */}
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 px-4 py-2 ${roleStyle.color} hover:bg-blue-100 transition-colors duration-200 rounded-lg mt-2 border-t ${roleStyle.borderColor} pt-4`}
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Laundry</span>
        </Link>
      </nav>

      {/* User info at bottom */}
      <div className={`mt-auto mx-2 p-3 rounded-lg border ${roleStyle.borderColor} ${roleStyle.bgColor}`}>
        <div className={`text-xs ${roleStyle.color}`}>
          <div className="font-medium">{localStorage.getItem('userName') || 'User'}</div>
          <div className="opacity-75">{localStorage.getItem('userEmail') || ''}</div>
        </div>
      </div>
    </aside>
  );
}