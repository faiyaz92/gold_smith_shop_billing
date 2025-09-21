'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const roleDefaults = {
  company_admin: '/admin/dashboard',
  general_manager: '/admin/dashboard', 
  branch_manager: '/admin/dashboard',
  cashier: '/admin/billing',
  delivery_man: '/admin/orders',
  pickup_man: '/admin/orders',
};

export default function RoleBasedRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userRole = localStorage.getItem('userRole');
    const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
    
    if (isAuthenticated && userRole && roleDefaults[userRole]) {
      router.push(roleDefaults[userRole]);
    }
  }, [router]);

  return null;
}