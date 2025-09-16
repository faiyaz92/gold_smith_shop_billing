'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebase';
import AdminLayout from '../AdminLayout';

export default function AdminUsers() {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const usersPath = `${tenantCompaniesPath}/${companyId}/users`;

  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }
    setIsLoading(true);
    const usersCollection = collection(db, usersPath);
    const unsubscribe = onSnapshot(usersCollection, (usersSnapshot) => {
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        lastLogin: formatLastLogin(doc.data().lastLogin),
      }));
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    });
    return () => unsubscribe();
    // eslint-disable-next-line
  }, [router]);

  const formatLastLogin = (timestamp) => {
    if (!timestamp) return 'Never logged in';
    const now = new Date();
    const loginDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInSeconds = Math.floor((now - loginDate) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return loginDate.toLocaleDateString();
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto mt-4">
        <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-xs sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-blue-50 text-blue-800 text-xs sm:text-sm">
              <tr>
                <th className="p-3 text-left border-b border-gray-200">SR No</th>
                <th className="p-3 text-left border-b border-gray-200">Name</th>
                <th className="p-3 text-left border-b border-gray-200 hidden sm:table-cell">Email</th>
                <th className="p-3 text-left border-b border-gray-200 hidden md:table-cell">Role</th>
                <th className="p-3 text-left border-b border-gray-200 hidden lg:table-cell">Status</th>
                <th className="p-3 text-left border-b border-gray-200 hidden lg:table-cell">Last Login</th>
                <th className="p-3 text-right border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm sm:text-base">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500 text-sm sm:text-base">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className="hover:bg-blue-50 transition text-xs sm:text-sm">
                    <td className="p-3 text-gray-500">{index + 1}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{user.name || 'No name'}</div>
                      <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                    </td>
                    <td className="p-3 text-gray-700 hidden sm:table-cell">{user.email}</td>
                    <td className="p-3 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.role === 'Admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role || 'User'}
                      </span>
                    </td>
                    <td className="p-3 hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 hidden lg:table-cell">{user.lastLogin}</td>
                    <td className="p-3 text-right">
                      <div className="space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm">Edit</button>
                        <button className="text-red-600 hover:text-red-800 text-xs sm:text-sm">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}