"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';

const UserManagementContext = createContext();

export function UserManagementProvider({ children }) {
  const [companyId] = useState(process.env.NEXT_PUBLIC_COMPANY_ID || 'laundry_q8');
  const [userRole] = useState('company_admin'); // This should come from auth context
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingUsers: 0,
    usersByRole: {},
    usersByLocation: {},
    recentActivity: [],
    alerts: {
      securityAlerts: [],
      usageAnalytics: []
    }
  });
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listeners for user management data
  useEffect(() => {
    if (!companyId) return;

    const usersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users`;
    const rolesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/roles`;
    const activityPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/userActivity`;

    // Users listener
    const usersQuery = query(collection(db, usersPath), orderBy('lastLogin', 'desc'));
    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      calculateUserStats(usersData);
    });

    // Roles listener
    const rolesQuery = query(collection(db, rolesPath), orderBy('level'));
    const unsubscribeRoles = onSnapshot(rolesQuery, (snapshot) => {
      const rolesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRoles(rolesData);
    });

    // User activity listener (last 24 hours for performance)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const activityQuery = query(
      collection(db, activityPath),
      where('timestamp', '>=', Timestamp.fromDate(yesterday)),
      orderBy('timestamp', 'desc'),
      // Limit to prevent excessive data
    );
    const unsubscribeActivity = onSnapshot(activityQuery, (snapshot) => {
      const activityData = snapshot.docs.slice(0, 50).map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUserStats(prev => ({
        ...prev,
        recentActivity: activityData
      }));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRoles();
      unsubscribeActivity();
    };
  }, [companyId]);

  // Calculate user statistics from users data
  const calculateUserStats = (usersData) => {
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(user => user.isActive && user.status === 'active').length;
    const inactiveUsers = usersData.filter(user => !user.isActive || user.status === 'inactive').length;
    const pendingUsers = usersData.filter(user => user.status === 'pending').length;

    // Users by role
    const usersByRole = {};
    usersData.forEach(user => {
      const role = user.role || 'unassigned';
      usersByRole[role] = (usersByRole[role] || 0) + 1;
    });

    // Users by location (simplified - using branch/area)
    const usersByLocation = {};
    usersData.forEach(user => {
      const location = user.branchName || user.areaName || 'unassigned';
      usersByLocation[location] = (usersByLocation[location] || 0) + 1;
    });

    // Mock alerts (in real implementation, this would analyze login attempts, etc.)
    const securityAlerts = [
      { type: 'failed_login', count: 3, description: '3 failed logins' },
      { type: 'password_reset', count: 2, description: '2 password resets' },
      { type: 'account_locked', count: 1, description: '1 account locked' }
    ];

    const usageAnalytics = [
      { metric: 'peak_usage', value: '10-11AM', description: 'Peak usage: 10-11AM' },
      { metric: 'most_active', value: 'Cashiers', description: 'Most active: Cashiers' },
      { metric: 'low_activity', value: '2 users', description: 'Low activity: 2 users' }
    ];

    setUserStats(prev => ({
      ...prev,
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingUsers,
      usersByRole,
      usersByLocation,
      alerts: {
        securityAlerts,
        usageAnalytics
      }
    }));

    setLoading(false);
  };

  // Get user activity summary
  const getUserActivitySummary = () => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentLogins = users.filter(user => {
      if (!user.lastLogin) return false;
      const loginTime = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
      return loginTime >= last24Hours;
    }).length;

    const weeklyActive = users.filter(user => {
      if (!user.lastLogin) return false;
      const loginTime = user.lastLogin.toDate ? user.lastLogin.toDate() : new Date(user.lastLogin);
      return loginTime >= lastWeek;
    }).length;

    return {
      recentLogins,
      weeklyActive,
      totalUsers: users.length
    };
  };

  const value = {
    companyId,
    userRole,
    userStats,
    users,
    roles,
    loading,
    getUserActivitySummary,
    calculateUserStats
  };

  return (
    <UserManagementContext.Provider value={value}>
      {children}
    </UserManagementContext.Provider>
  );
}

export function useUserManagement() {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagement must be used within a UserManagementProvider');
  }
  return context;
}