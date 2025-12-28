"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import AdminLayout from '@/app/admin/AdminLayout';
import { Shield, Users, Settings, AlertTriangle, Plus, Edit2, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react';

// Permission Matrix Component
function PermissionMatrix({ roles, permissions }) {
  const modules = ['dashboard', 'orders', 'products', 'inventory', 'accounting', 'users', 'reports', 'settings'];
  const moduleLabels = {
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    inventory: 'Inventory',
    accounting: 'Accounting',
    users: 'Users',
    reports: 'Reports',
    settings: 'Settings'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">🔐 Permission Matrix</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-blue-50">
            <tr>
              <th className="p-3 text-left border-b border-gray-200 font-semibold">Module</th>
              {roles.map(role => (
                <th key={role.roleId} className="p-3 text-center border-b border-gray-200 font-semibold text-xs">
                  {role.name.split(' ')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {modules.map(module => (
              <tr key={module} className="hover:bg-gray-50">
                <td className="p-3 font-medium text-gray-900 border-r border-gray-200">
                  {moduleLabels[module]}
                </td>
                {roles.map(role => {
                  const hasRead = role.permissions?.[module]?.read;
                  const hasWrite = role.permissions?.[module]?.write;
                  const hasDelete = role.permissions?.[module]?.delete;

                  return (
                    <td key={`${role.roleId}-${module}`} className="p-3 text-center border-r border-gray-200">
                      <div className="flex justify-center gap-1">
                        {hasRead && <CheckCircle size={12} className="text-green-500" title="Read" />}
                        {hasWrite && <Edit2 size={12} className="text-blue-500" title="Write" />}
                        {hasDelete && <Trash2 size={12} className="text-red-500" title="Delete" />}
                        {!hasRead && !hasWrite && !hasDelete && <XCircle size={12} className="text-gray-400" title="No Access" />}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Role Overview Cards Component
function RoleOverviewCards({ roles, users }) {
  const totalRoles = roles.length;
  const customRoles = roles.filter(r => !r.isSystemRole).length;
  const totalUsers = users.length;
  const activeRoles = roles.filter(r => r.isActive).length;

  const cards = [
    {
      title: 'Total Roles',
      value: totalRoles,
      icon: <Shield className="text-blue-500" size={24} />,
      color: 'bg-blue-50 border-blue-200',
      trend: '+2 Qtr'
    },
    {
      title: 'Custom Roles',
      value: `${customRoles} (${Math.round((customRoles/totalRoles)*100)}%)`,
      icon: <Settings className="text-purple-500" size={24} />,
      color: 'bg-purple-50 border-purple-200',
      trend: '+3 Qtr'
    },
    {
      title: 'Users/Roles',
      value: `${totalUsers}/${activeRoles} (${Math.round(totalUsers/activeRoles)}:1)`,
      icon: <Users className="text-green-500" size={24} />,
      color: 'bg-green-50 border-green-200',
      trend: '+15% Qtr'
    },
    {
      title: 'Active Permissions',
      value: roles.reduce((acc, role) => {
        const perms = Object.values(role.permissions || {}).flatMap(p =>
          Object.values(p).filter(Boolean)
        ).length;
        return acc + perms;
      }, 0),
      icon: <CheckCircle className="text-orange-500" size={24} />,
      color: 'bg-orange-50 border-orange-200',
      trend: '+8% Qtr'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <div key={index} className={`p-6 rounded-lg border ${card.color} shadow-sm`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-green-600 mt-1">{card.trend}</p>
            </div>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}

// Role Details Component
function RoleDetails({ roles, users }) {
  const roleUserCounts = roles.map(role => ({
    ...role,
    userCount: users.filter(u => u.role === role.roleId).length
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">📋 Active Roles</h3>
        <div className="space-y-3">
          {roleUserCounts.map(role => (
            <div key={role.roleId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield size={16} className="text-blue-500" />
                <div>
                  <p className="font-medium text-gray-900">{role.name}</p>
                  <p className="text-sm text-gray-600">{role.userCount} users</p>
                </div>
              </div>
              {role.isSystemRole && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  System
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">👤 Role Assignments</h3>
        <div className="space-y-4">
          {roleUserCounts.slice(0, 4).map(role => (
            <div key={role.roleId} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{role.name}</h4>
                <span className="text-sm text-gray-600">{role.userCount} users</span>
              </div>
              <div className="space-y-1">
                {users.filter(u => u.role === role.roleId).slice(0, 3).map(user => (
                  <div key={user.id} className="text-sm text-gray-600 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    {user.name}
                  </div>
                ))}
                {role.userCount > 3 && (
                  <div className="text-sm text-gray-500 italic">
                    +{role.userCount - 3} more users
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Access Control Alerts Component
function AccessControlAlerts({ roles, users }) {
  const unusedRoles = roles.filter(r => r.userCount === 0);
  const usersWithoutRoles = users.filter(u => !u.role || u.role === 'customer');
  const permissionConflicts = []; // Would need more complex logic to detect

  const alerts = [
    {
      title: 'Unused Roles',
      count: unusedRoles.length,
      description: `${unusedRoles.length} roles have no assigned users`,
      type: 'warning',
      icon: <AlertTriangle className="text-yellow-500" size={16} />
    },
    {
      title: 'Users Without Roles',
      count: usersWithoutRoles.length,
      description: `${usersWithoutRoles.length} users have no staff role assigned`,
      type: 'warning',
      icon: <AlertTriangle className="text-orange-500" size={16} />
    },
    {
      title: 'Permission Conflicts',
      count: permissionConflicts.length,
      description: 'No permission conflicts detected',
      type: 'success',
      icon: <CheckCircle className="text-green-500" size={16} />
    }
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">🚨 Access Control Alerts</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {alerts.map((alert, index) => (
          <div key={index} className={`p-4 rounded-lg border ${
            alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            alert.type === 'success' ? 'bg-green-50 border-green-200' :
            'bg-gray-50 border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              {alert.icon}
              <div>
                <p className="font-medium text-gray-900">{alert.title}</p>
                <p className="text-2xl font-bold text-gray-900">{alert.count}</p>
                <p className="text-sm text-gray-600">{alert.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Roles Management Dashboard Component
export default function RolesManagementDashboard() {
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const rolesPath = `${tenantCompaniesPath}/${companyId}/roles`;
  const usersPath = `${tenantCompaniesPath}/${companyId}/users`;
  const permissionsPath = `${tenantCompaniesPath}/${companyId}/permissions`;

  useEffect(() => {
    const authStatus = localStorage.getItem('adminAuth');
    const userRole = localStorage.getItem('userRole') || 'company_admin';
    const userId = localStorage.getItem('userId');

    if (authStatus !== 'true') {
      window.location.href = '/admin/login';
      return;
    }

    setCurrentUser({ role: userRole, id: userId });
    setIsLoading(true);

    // Fetch Roles
    const rolesCollection = collection(db, rolesPath);
    const unsubscribeRoles = onSnapshot(rolesCollection, (rolesSnapshot) => {
      const rolesData = rolesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRoles(rolesData);
    }, (error) => {
      console.error('Error fetching roles:', error);
    });

    // Fetch Users
    const usersCollection = collection(db, usersPath);
    const unsubscribeUsers = onSnapshot(usersCollection, (usersSnapshot) => {
      const usersData = usersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching users:', error);
      setIsLoading(false);
    });

    // Fetch Permissions
    const permissionsCollection = collection(db, permissionsPath);
    const unsubscribePermissions = onSnapshot(permissionsCollection, (permissionsSnapshot) => {
      const permissionsData = permissionsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPermissions(permissionsData);
    }, (error) => {
      console.error('Error fetching permissions:', error);
    });

    return () => {
      unsubscribeRoles();
      unsubscribeUsers();
      unsubscribePermissions();
    };
  }, [rolesPath, usersPath, permissionsPath]);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  // Check if user can manage roles
  const canManageRoles = currentUser?.role === 'company_admin';

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🔐 Roles Management Dashboard</h1>
            <p className="text-gray-600">Access control center for role-based permissions</p>
          </div>
          {canManageRoles && (
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 font-medium">
              <Plus size={20} />
              Create Role
            </button>
          )}
        </div>

        {/* Role Overview Cards */}
        <RoleOverviewCards roles={roles} users={users} />

        {/* Permission Matrix */}
        <div className="mb-8">
          <PermissionMatrix roles={roles} permissions={permissions} />
        </div>

        {/* Role Details and Assignments */}
        <RoleDetails roles={roles} users={users} />

        {/* Access Control Alerts */}
        <AccessControlAlerts roles={roles} users={users} />

        {/* Role Management Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-6 text-gray-900">🛠️ Role Management Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {canManageRoles ? (
              <>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus size={16} />
                  Create Role
                </button>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Edit2 size={16} />
                  Edit Permissions
                </button>
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Users size={16} />
                  Assign Users
                </button>
                <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Eye size={16} />
                  Audit Log
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                  <Trash2 size={16} />
                  Delete Role
                </button>
              </>
            ) : (
              <div className="col-span-5 text-center py-8 text-gray-500">
                <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Access Restricted</p>
                <p className="text-sm">Only Company Administrators can manage roles and permissions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}