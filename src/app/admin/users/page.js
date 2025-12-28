"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useUserManagement } from '@/app/context/UserManagementContext';
import { BarChart, PieChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, Bar, Pie } from 'recharts';
import { Plus, Search, Loader2, Crown, Edit2, Trash2, EyeOff, Eye, AlertTriangle, Users } from 'lucide-react';
import AdminLayout from '@/app/admin/AdminLayout';

// Metric Card Component
function MetricCard({ title, value, trend, icon, color = "blue" }) {
  return (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${color}-500`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
              {trend} MoM
            </p>
          )}
        </div>
        {icon && <div className={`text-${color}-500 text-2xl`}>{icon}</div>}
      </div>
    </div>
  );
}

// User Distribution Chart Component
function UserDistributionChart({ data, title, type = "bar" }) {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (type === "pie") {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={Object.entries(data).map(([key, value], index) => ({
                name: key,
                value,
                fill: colors[index % colors.length]
              }))}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {Object.entries(data).map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={Object.entries(data).map(([key, value]) => ({ name: key, value }))}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Recent User Activity Component
function RecentUserActivity({ activities }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'away': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Never';

    const now = new Date();
    const loginTime = lastLogin.toDate ? lastLogin.toDate() : new Date(lastLogin);
    const diffMs = now - loginTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins} mins ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return loginTime.toLocaleDateString();
  };

  // Mock data for demonstration (in real implementation, this would come from userActivity collection)
  const mockActivities = [
    { name: 'John Smith', role: 'Manager', lastLogin: new Date(Date.now() - 2 * 60 * 1000), status: 'active' },
    { name: 'Sarah Johnson', role: 'Cashier', lastLogin: new Date(Date.now() - 15 * 60 * 1000), status: 'active' },
    { name: 'Mike Davis', role: 'Van Seller', lastLogin: new Date(Date.now() - 60 * 60 * 1000), status: 'active' },
    { name: 'Lisa Brown', role: 'Supervisor', lastLogin: new Date(Date.now() - 3 * 60 * 60 * 1000), status: 'away' },
    { name: 'David Wilson', role: 'Delivery', lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000), status: 'inactive' }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">📋 Recent User Activity</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {mockActivities.map((user, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatLastLogin(user.lastLogin)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// User Management Alerts Component
function UserManagementAlerts({ alerts }) {
  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Security Alerts */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">⚠️ Security Alerts</h3>
        <div className="space-y-3">
          {alerts.securityAlerts.map((alert, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">{alert.description}</span>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {alert.count}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
          [View All Alerts]
        </button>
      </div>

      {/* Usage Analytics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📈 Usage Analytics</h3>
        <div className="space-y-3">
          {alerts.usageAnalytics.map((analytic, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">{analytic.description}</span>
              <span className="text-xs text-gray-500">
                {analytic.value}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium">
          [View Analytics]
        </button>
      </div>
    </div>
  );
}

// Main User Management Dashboard Component
export default function UserManagementDashboard() {
  const { userStats, loading } = useUserManagement();

  const formatPercentage = (value, total) => {
    return total > 0 ? ` (${Math.round((value / total) * 100)}%)` : '';
  };

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
  const [branchFilter, setBranchFilter] = useState(''); // Add branch filter state

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
    const userBranchId = localStorage.getItem('userBranchId'); // Add this line

    if (authStatus !== 'true') {
      router.push('/admin/login');
      return;
    }

    // Update setCurrentUser to include branchId
    setCurrentUser({ 
      role: userRole, 
      id: userId, 
      branchId: userBranchId // Add this line
    });

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

  // Loading check after all hooks
  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
    if (currentUser?.role === 'company_admin') return true;
    if (currentUser?.role === 'general_manager') {
      if (user.role === 'company_admin') return false;
      return true;
    }
    if (currentUser?.role === 'branch_manager') {
      if (user.role === 'company_admin' || user.role === 'general_manager') return false;
      return user.branchId === currentUser.branchId;
    }
    return currentUser?.id === user.id;
  };

  const canDelete = (user) => {
    if (currentUser?.role === 'company_admin') {
      return currentUser?.id !== user.id && user.role !== 'company_admin';
    }
    if (currentUser?.role === 'general_manager') {
      return currentUser?.id !== user.id && user.role !== 'company_admin';
    }
    if (currentUser?.role === 'branch_manager') {
      if (user.role === 'company_admin' || user.role === 'general_manager') return false;
      if (currentUser?.id === user.id) return false;
      return user.branchId === currentUser.branchId;
    }
    return false;
  };

  // Only allow edit/delete if NOT editing a company_admin
  const canEditOrDelete = (currentUser, targetUser) => {
    if (currentUser.role === 'company_admin') return true;
    if (currentUser.role === 'general_manager') {
      if (targetUser.role === 'company_admin') return false;
      if (currentUser.id === targetUser.id) return false; // can't change own role
      return true;
    }
    return false;
  };

  const filteredUsers = users.filter((user) => {
    const type = user.userType === 'staff' ? 'staff' : 'customer';

    // Branch Manager: Only see own branch staff + GM + Company Admin
    if (currentUser?.role === 'branch_manager') {
      const isOwnBranchStaff = user.branchId === currentUser.branchId && 
                              user.role !== 'company_admin' && 
                              user.role !== 'general_manager';
      const isAdminOrGM = user.role === 'company_admin' || user.role === 'general_manager';
      
      if (!(isOwnBranchStaff || isAdminOrGM)) return false;
      
      // Apply filters only to visible users
      const matchesSearch =
        user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesUserType = userTypeFilter ? type === userTypeFilter : true;
      const matchesRole = roleFilter ? user.role === roleFilter : true;
      
      return matchesSearch && matchesUserType && matchesRole;
    }

    // Company Admin & General Manager: Apply all filters including branch filter
    const matchesSearch =
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUserType = userTypeFilter ? type === userTypeFilter : true;
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    const matchesBranch = branchFilter ? user.branchId === branchFilter : true;

    return matchesSearch && matchesUserType && matchesRole && matchesBranch;
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
          {(currentUser?.role === 'company_admin' || currentUser?.role === 'general_manager') && (
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
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
              setBranchFilter(''); // Clear branch filter
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
                          (currentUser?.id === selectedUser.id && (currentUser?.role === 'company_admin' || currentUser?.role === 'general_manager')) ||
                          (currentUser?.role !== 'company_admin' && currentUser?.role !== 'general_manager')
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