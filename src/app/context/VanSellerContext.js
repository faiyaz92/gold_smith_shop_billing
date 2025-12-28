"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';

const VanSellerContext = createContext();

export function VanSellerProvider({ children }) {
  const [companyId] = useState(process.env.NEXT_PUBLIC_COMPANY_ID || 'laundry_q8');
  const [userRole] = useState('company_admin'); // This should come from auth context
  const [vanSellers, setVanSellers] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [stockAllocations, setStockAllocations] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalSellers: 0,
    activeSellers: 0,
    totalSales: 0,
    averageCommission: 0,
    topPerformers: [],
    lowStockAlerts: []
  });

  // Real-time listeners for van seller data
  useEffect(() => {
    if (!companyId) return;

    const vanSellersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/vanSellers`;
    const territoriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/territories`;
    const allocationsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/stockAllocations`;
    const commissionsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/commissions`;

    // Van Sellers listener
    const sellersQuery = query(collection(db, vanSellersPath), orderBy('createdAt', 'desc'));
    const unsubscribeSellers = onSnapshot(sellersQuery, (snapshot) => {
      const sellersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVanSellers(sellersData);
      calculateDashboardStats(sellersData, commissions);
    });

    // Territories listener
    const territoriesQuery = query(collection(db, territoriesPath));
    const unsubscribeTerritories = onSnapshot(territoriesQuery, (snapshot) => {
      const territoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setTerritories(territoriesData);
    });

    // Stock Allocations listener
    const allocationsQuery = query(collection(db, allocationsPath), orderBy('allocationDate', 'desc'));
    const unsubscribeAllocations = onSnapshot(allocationsQuery, (snapshot) => {
      const allocationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStockAllocations(allocationsData);
    });

    // Commissions listener
    const commissionsQuery = query(collection(db, commissionsPath), orderBy('periodStart', 'desc'));
    const unsubscribeCommissions = onSnapshot(commissionsQuery, (snapshot) => {
      const commissionsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCommissions(commissionsData);
      calculateDashboardStats(vanSellers, commissionsData);
    });

    setLoading(false);

    return () => {
      unsubscribeSellers();
      unsubscribeTerritories();
      unsubscribeAllocations();
      unsubscribeCommissions();
    };
  }, [companyId]);

  // Calculate dashboard statistics
  const calculateDashboardStats = (sellersData, commissionsData) => {
    if (!sellersData || !commissionsData) return;

    const activeSellers = sellersData.filter(s => s.status === 'active');
    const totalSales = commissionsData.reduce((sum, c) => sum + (c.totalSales || 0), 0);
    const avgCommission = commissionsData.length > 0
      ? commissionsData.reduce((sum, c) => sum + (c.totalCommission || 0), 0) / commissionsData.length
      : 0;

    // Top performers (highest sales)
    const sellerSales = sellersData.map(seller => {
      const sellerCommissions = commissionsData.filter(c => c.vanSellerId === seller.vanSellerId);
      const totalSellerSales = sellerCommissions.reduce((sum, c) => sum + (c.totalSales || 0), 0);
      return {
        ...seller,
        totalSales: totalSellerSales
      };
    });
    const topPerformers = sellerSales
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 5);

    setDashboardStats({
      totalSellers: sellersData.length,
      activeSellers: activeSellers.length,
      totalSales,
      averageCommission: avgCommission,
      topPerformers,
      lowStockAlerts: [] // Will be populated from stock allocations
    });
  };

  // Get seller by ID
  const getSellerById = (vanSellerId) => {
    return vanSellers.find(s => s.vanSellerId === vanSellerId);
  };

  // Get seller allocations
  const getSellerAllocations = (vanSellerId) => {
    return stockAllocations.filter(a => a.vanSellerId === vanSellerId);
  };

  // Get seller commissions
  const getSellerCommissions = (vanSellerId) => {
    return commissions.filter(c => c.vanSellerId === vanSellerId);
  };

  // Get territory by ID
  const getTerritoryById = (territoryId) => {
    return territories.find(t => t.territoryId === territoryId);
  };

  // Get available territories (not assigned)
  const getAvailableTerritories = () => {
    return territories.filter(t => !t.assignedVanSellerId || t.status === 'inactive');
  };

  // Van seller alerts
  const getVanSellerAlerts = () => {
    const alerts = {
      lowStockAlerts: [],
      inactiveSellers: [],
      commissionDue: []
    };

    // Low stock alerts
    stockAllocations.forEach(allocation => {
      const lowStockItems = allocation.items?.filter(item => item.allocatedQuantity < 10) || [];
      if (lowStockItems.length > 0) {
        const seller = getSellerById(allocation.vanSellerId);
        alerts.lowStockAlerts.push({
          sellerName: seller?.name || 'Unknown',
          vanSellerId: allocation.vanSellerId,
          items: lowStockItems.length,
          message: `${lowStockItems.length} items below minimum stock`
        });
      }
    });

    // Inactive sellers
    const inactiveSellers = vanSellers.filter(s => s.status === 'inactive');
    alerts.inactiveSellers = inactiveSellers.map(s => ({
      sellerName: s.name,
      vanSellerId: s.vanSellerId,
      message: `Seller inactive since ${s.updatedAt?.toDate().toLocaleDateString()}`
    }));

    // Commission due
    const unpaidCommissions = commissions.filter(c => c.status === 'calculated' && c.paidAmount === 0);
    alerts.commissionDue = unpaidCommissions.map(c => {
      const seller = getSellerById(c.vanSellerId);
      return {
        sellerName: seller?.name || 'Unknown',
        vanSellerId: c.vanSellerId,
        amount: c.totalCommission,
        message: `Commission pending: ${c.totalCommission.toFixed(2)}`
      };
    });

    return alerts;
  };

  return (
    <VanSellerContext.Provider
      value={{
        companyId,
        userRole,
        vanSellers,
        territories,
        stockAllocations,
        commissions,
        loading,
        dashboardStats,
        getSellerById,
        getSellerAllocations,
        getSellerCommissions,
        getTerritoryById,
        getAvailableTerritories,
        getVanSellerAlerts
      }}
    >
      {children}
    </VanSellerContext.Provider>
  );
}

export function useVanSeller() {
  const context = useContext(VanSellerContext);
  if (!context) {
    throw new Error('useVanSeller must be used within a VanSellerProvider');
  }
  return context;
}
