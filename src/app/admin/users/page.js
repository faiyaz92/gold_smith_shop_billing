'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  AlertTriangle,
  Crown,
  Building,
  Shield,
  Truck,
  Package,
  CreditCard,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  setDoc
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { db, auth } from '@/app/firebase';
import AdminLayout from '../AdminLayout';

const USER_ROLES = [
  { value: 'company_admin', label: 'Company Admin', icon: <Crown size={14} />, color: 'bg-purple-100 text-purple-800' },
  { value: 'general_manager', label: 'General Manager', icon: <Shield size={14} />, color: 'bg-blue-100 text-blue-800' },
  { value: 'branch_manager', label: 'Branch Manager', icon: <Building size={14} />, color: 'bg-green-100 text-green-800' },
  { value: 'cashier', label: 'Cashier', icon: <CreditCard size={14} />, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'delivery_man', label: 'Delivery Man', icon: <Truck size={14} />, color: 'bg-orange-100 text-orange-800' },
  { value: 'pickup_man', label: 'Pickup Man', icon: <Package size={14} />, color: 'bg-teal-100 text-teal-800' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-green-100 text-green-800' },
  { value: 'inactive', label: 'Inactive', color: 'bg-red-100 text-red-800' },
  { value: 'suspended', label: 'Suspended', color: 'bg-gray-100 text-gray-800' },
];

const USER_TYPES = [
  { value: 'customer', label: 'Customer' },
  { value: 'staff', label: 'Staff/Employee' },
];

export default function AdminUsers() {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const usersPath = `${tenantCompaniesPath}/${companyId}/users`;
  const branchesPath = `${tenantCompaniesPath}/${companyId}/branches`;

  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Filter states
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'customer',
    role: 'cashier',
    status: 'active',
    phone: '',
    branchId: '',
    notes: '',
  });

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    const userRole = localStorage.getItem('userRole') || 'company_admin';
    const userId = localStorage.getItem('userId');

    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }

    setCurrentUser({ role: userRole, id: userId });

    setIsLoading(true);

    // Fetch Users
    const usersCollection = collection(db, usersPath);
    const unsubscribeUsers = onSnapshot(usersCollection, (usersSnapshot) => {
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        userType: doc.data().userType || 'customer', // Default to customer if not set
        lastLogin: formatLastLogin(doc.data().lastLogin),
        createdAt: doc.data().createdAt?.toDate(),
      }));
      setUsers(usersData);
    }, (error) => {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    });

    // Fetch Branches
    const branchesCollection = collection(db, branchesPath);
    const unsubscribeBranches = onSnapshot(branchesCollection, (branchesSnapshot) => {
      const branchesData = branchesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBranches(branchesData.filter(b => b.isActive));
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching branches:', error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeBranches();
    };
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

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      userType: 'customer',
      role: 'cashier',
      status: 'active',
      phone: '',
      branchId: '',
      notes: '',
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Only company_admin can create users
    if (currentUser?.role !== 'company_admin') {
      alert('Only Company Admin can create users');
      return;
    }

    try {
      // Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore using Firebase Auth UID as document ID
      const userDocRef = doc(db, usersPath, firebaseUser.uid);
      await setDoc(userDocRef, {
        name: formData.name,
        email: formData.email,
        userType: formData.userType,
        role: formData.userType === 'staff' ? formData.role : null, // Only set role for staff
        status: formData.status,
        phone: formData.phone || null,
        branchId: formData.branchId || null,
        notes: formData.notes || null,
        firebaseUid: firebaseUser.uid, // Store for reference
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUser?.id,
      });

      // Sign out the newly created user
      await signOut(auth);

      setShowCreateModal(false);
      resetForm();
      alert('User created successfully');
    } catch (err) {
      console.error('Error creating user:', err);
      alert(`Failed to create user: ${err.message}`);
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    // Check permissions
    if (currentUser?.role !== 'company_admin' && currentUser?.id !== selectedUser?.id) {
      alert('You can only edit your own profile');
      return;
    }

    // Prevent company_admin role changes
    if (selectedUser?.role === 'company_admin' && formData.role !== 'company_admin' && currentUser?.id !== selectedUser?.id) {
      alert('Cannot change Company Admin role');
      return;
    }

    // Prevent self role change for company_admin
    if (currentUser?.id === selectedUser?.id && currentUser?.role === 'company_admin' && formData.role !== 'company_admin') {
      alert('Company Admin cannot change their own role');
      return;
    }

    try {
      const userRef = doc(db, `${usersPath}/${selectedUser.id}`);
      const updateData = {
        name: formData.name,
        userType: formData.userType,
        phone: formData.phone || null,
        branchId: formData.branchId || null,
        notes: formData.notes || null,
        updatedAt: serverTimestamp(),
      };

      // Only set role if userType is staff
      if (formData.userType === 'staff') {
        updateData.role = formData.role;
      } else {
        updateData.role = null; // Clear role for customers
      }

      // Only allow role and status changes by company_admin (except for their own role)
      if (currentUser?.role === 'company_admin' && currentUser?.id !== selectedUser?.id) {
        updateData.status = formData.status;
      }

      await updateDoc(userRef, updateData);
      setShowEditModal(false);
      setSelectedUser(null);
      resetForm();
      alert('User updated successfully');
    } catch (err) {
      console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    // Only company_admin can delete users
    if (currentUser?.role !== 'company_admin') {
      alert('Only Company Admin can delete users');
      return;
    }

    // Prevent self-deletion
    if (currentUser?.id === showDeleteDialog?.id) {
      alert('Company Admin cannot delete their own account');
      return;
    }

    // Prevent deleting other company_admins
    if (showDeleteDialog?.role === 'company_admin') {
      alert('Cannot delete Company Admin accounts');
      return;
    }

    try {
      const userRef = doc(db, `${usersPath}/${showDeleteDialog.id}`);
      await deleteDoc(userRef);

      setShowDeleteDialog(null);
      alert('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleEditClick = (user) => {
    // Check if user can edit this profile
    if (currentUser?.role !== 'company_admin' && currentUser?.id !== user.id) {
      alert('You can only edit your own profile');
      return;
    }

    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Never show password
      userType: user.userType || 'customer',
      role: user.role || 'cashier',
      status: user.status || 'active',
      phone: user.phone || '',
      branchId: user.branchId || '',
      notes: user.notes || '',
    });
    setShowEditModal(true);
  };

  const getRoleInfo = (role) => {
    return USER_ROLES.find(r => r.value === role) || {
      value: role,
      label: role || 'User',
      icon: <Users size={14} />,
      color: 'bg-gray-100 text-gray-800'
    };
  };

  const getStatusInfo = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || {
      value: status,
      label: status || 'Unknown',
      color: 'bg-gray-100 text-gray-800'
    };
  };

  const getBranchName = (branchId) => {
    return branches.find(b => b.id === branchId)?.name || 'No Branch';
  };

  const canEdit = (user) => {
    return currentUser?.role === 'company_admin' || currentUser?.id === user.id;
  };

  const canDelete = (user) => {
    return currentUser?.role === 'company_admin' &&
      currentUser?.id !== user.id &&
      user.role !== 'company_admin';
  };

  const filteredUsers = users.filter((user) => {
    // Always treat missing userType as 'customer'
    const type = user.userType === 'staff' ? 'staff' : 'customer';

    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUserType = userTypeFilter ? type === userTypeFilter : true;
    const matchesRole = roleFilter ? user.role === roleFilter : true;

    return matchesSearch && matchesUserType && matchesRole;
  });

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            User Management
          </h2>
          {currentUser?.role === 'company_admin' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
            >
              <Plus size={16} />
              Add User
            </button>
          )}
        </div>

        {/* Search, Filters, and Count in one row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 gap-3 mb-6">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 text-xs sm:text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select
            value={userTypeFilter}
            onChange={(e) => {
              setUserTypeFilter(e.target.value);
              if (e.target.value !== 'staff') setRoleFilter('');
            }}
            className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
          >
            <option value="">All User Types</option>
            {USER_TYPES.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {userTypeFilter === 'staff' && (
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300 focus:ring-1 focus:ring-blue-200"
            >
              <option value="">All Roles</option>
              {USER_ROLES.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          )}
          <div className="text-sm text-gray-600 px-3 py-2 bg-blue-50 rounded border ml-auto">
            Total: {filteredUsers.length} users
          </div>
          {/* Add this Clear Filters button */}
          <button
            onClick={() => {
              setSearchQuery('');
              setUserTypeFilter('');
              setRoleFilter('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-blue-50 text-blue-800 text-xs sm:text-sm">
              <tr>
                <th className="p-3 text-left border-b border-gray-200">SR No</th>
                <th className="p-3 text-left border-b border-gray-200">Name</th>
                <th className="p-3 text-left border-b border-gray-200 hidden sm:table-cell">Email</th>
                <th className="p-3 text-left border-b border-gray-200">Type</th>
                <th className="p-3 text-left border-b border-gray-200">Role</th>
                <th className="p-3 text-left border-b border-gray-200 hidden md:table-cell">Branch</th>
                <th className="p-3 text-left border-b border-gray-200 hidden lg:table-cell">Status</th>
                <th className="p-3 text-left border-b border-gray-200 hidden lg:table-cell">Last Login</th>
                <th className="p-3 text-right border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 text-sm sm:text-base">
                    <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500 text-sm sm:text-base">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const roleInfo = getRoleInfo(user.role);
                  const statusInfo = getStatusInfo(user.status);

                  return (
                    <tr key={user.id} className="hover:bg-blue-50 transition text-xs sm:text-sm">
                      <td className="p-3 text-gray-500">{index + 1}</td>
                      <td className="p-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium text-gray-900 flex items-center gap-1">
                              {user.name || 'No name'}
                              {user.role === 'company_admin' && <Crown size={12} className="text-purple-500" />}
                            </div>
                            <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 text-gray-700 hidden sm:table-cell">{user.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          (user.userType === 'staff') ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {(user.userType === 'staff') ? 'Staff' : 'Customer'}
                        </span>
                      </td>
                      <td className="p-3">
                        {user.userType === 'staff' && user.role ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                            {roleInfo.icon}
                            {roleInfo.label}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-700 hidden md:table-cell">
                        {user.branchId ? getBranchName(user.branchId) : 'No Branch'}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="p-3 text-gray-500 hidden lg:table-cell">{user.lastLogin}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit(user) && (
                            <button
                              onClick={() => handleEditClick(user)}
                              className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                          {canDelete(user) && (
                            <button
                              onClick={() => setShowDeleteDialog(user)}
                              className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="+965 XXXX XXXX"
                  />
                </div>
                
                {/* User Type and Role in same row */}
                <div className="md:col-span-2 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
                    <select
                      value={formData.userType}
                      onChange={(e) => setFormData({...formData, userType: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      required
                    >
                      {USER_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.userType === 'staff' && (
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                        required
                      >
                        {USER_ROLES.filter(role => role.value !== 'company_admin').map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch (Optional)</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  >
                    <option value="">No Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    rows="2"
                    placeholder="Additional notes about this user..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900">
              Edit User: {selectedUser.name}
            </h3>
            <form onSubmit={handleEditUser}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="+965 XXXX XXXX"
                  />
                </div>
                
                {/* User Type and Role in same row */}
                <div className="md:col-span-2 flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
                    <select
                      value={formData.userType}
                      onChange={(e) => setFormData({...formData, userType: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      required
                    >
                      {USER_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  {formData.userType === 'staff' && (
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                        disabled={
                          (selectedUser.role === 'company_admin') ||
                          (currentUser?.id === selectedUser.id && currentUser?.role === 'company_admin') ||
                          (currentUser?.role !== 'company_admin')
                        }
                      >
                        {USER_ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                      {(selectedUser.role === 'company_admin' || (currentUser?.id === selectedUser.id && currentUser?.role === 'company_admin')) && (
                        <p className="text-xs text-gray-500 mt-1">Company Admin role cannot be changed</p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch (Optional)</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({...formData, branchId: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  >
                    <option value="">No Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    disabled={currentUser?.role !== 'company_admin' || currentUser?.id === selectedUser.id}
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    rows="2"
                    placeholder="Additional notes about this user..."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                    resetForm();
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  Update User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="text-red-500" size={20} />
              <h3 className="text-lg font-medium text-gray-900">Delete User</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete &quot;{showDeleteDialog.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}