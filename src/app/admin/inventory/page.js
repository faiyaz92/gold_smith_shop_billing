// ✅ TASK 8.1: Inventory Tracking (Pure Gold)
// Gold Smith Inventory Management - Pure Gold Based (Account 1103)
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCcw,
  Plus,
  Minus,
  Calendar,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


export default function InventoryManagement() {
  const [isClient, setIsClient] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, in, out, adjustment
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'movements', 'breakdown'
  const [showAdjustmentDialog, setShowAdjustmentDialog] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add', // 'add', 'remove', 'wastage'
    goldAmount: '',
    karat: '24k',
    reason: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'default-company';
  const basePath = `companies/${companyId}`;

  // Purity coefficients for karat conversion
  const purityCoefficients = {
    '24k': 1.0,
    '22k': 0.9166,
    '21k': 0.875,
    '18k': 0.75,
    '14k': 0.5833
  };

  useEffect(() => {
    setIsClient(true);
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setIsLoading(true);

      // Fetch all accounting transactions for inventory account (1103)
      const transactionsPath = `${basePath}/transactions`;
      const transactionsQuery = query(
        collection(db, transactionsPath),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
        const transactionsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        }));

        // Filter for inventory-related transactions (account 1103)
        const inventoryTransactions = transactionsData.filter(trans => 
          trans.entries?.some(entry => entry.accountCode === '1103')
        );

        setTransactions(inventoryTransactions);
      });

      // Fetch orders for reference
      const ordersQuery = query(collection(db, `${basePath}/orders`), orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);

      setIsLoading(false);
      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching inventory data:', error);
      setIsLoading(false);
    }
  };

  // Calculate current inventory balance
  const inventoryBalance = useMemo(() => {
    let balance = 0;
    
    transactions.forEach(trans => {
      const inventoryEntry = trans.entries?.find(entry => entry.accountCode === '1103');
      if (inventoryEntry) {
        balance += (inventoryEntry.debit || 0) - (inventoryEntry.credit || 0);
      }
    });

    return balance;
  }, [transactions]);

  // Calculate inventory by karat breakdown
  const karatBreakdown = useMemo(() => {
    const breakdown = {
      '24k': 0,
      '22k': 0,
      '21k': 0,
      '18k': 0,
      '14k': 0
    };

    transactions.forEach(trans => {
      const inventoryEntry = trans.entries?.find(entry => entry.accountCode === '1103');
      if (inventoryEntry && inventoryEntry.notes) {
        // Try to extract karat from notes
        const match = inventoryEntry.notes.match(/\b(24k|22k|21k|18k|14k)\b/i);
        if (match) {
          const karat = match[1].toLowerCase();
          const debit = inventoryEntry.debit || 0;
          const credit = inventoryEntry.credit || 0;
          breakdown[karat] += debit - credit;
        }
      }
    });

    return breakdown;
  }, [transactions]);

  // Calculate inventory statistics
  const inventoryStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayIn = 0, todayOut = 0;
    let weekIn = 0, weekOut = 0;
    let monthIn = 0, monthOut = 0;

    transactions.forEach(trans => {
      const inventoryEntry = trans.entries?.find(entry => entry.accountCode === '1103');
      if (!inventoryEntry) return;

      const debit = inventoryEntry.debit || 0;
      const credit = inventoryEntry.credit || 0;

      if (trans.date >= todayStart) {
        todayIn += debit;
        todayOut += credit;
      }
      if (trans.date >= weekStart) {
        weekIn += debit;
        weekOut += credit;
      }
      if (trans.date >= monthStart) {
        monthIn += debit;
        monthOut += credit;
      }
    });

    return {
      today: { in: todayIn, out: todayOut, net: todayIn - todayOut },
      week: { in: weekIn, out: weekOut, net: weekIn - weekOut },
      month: { in: monthIn, out: monthOut, net: monthIn - monthOut }
    };
  }, [transactions]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(trans =>
        trans.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trans.referenceId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trans.transactionType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(trans => {
        const inventoryEntry = trans.entries?.find(entry => entry.accountCode === '1103');
        if (!inventoryEntry) return false;

        if (typeFilter === 'in') return (inventoryEntry.debit || 0) > 0;
        if (typeFilter === 'out') return (inventoryEntry.credit || 0) > 0;
        if (typeFilter === 'adjustment') return trans.transactionType === 'inventory_adjustment';
        return true;
      });
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate;
      
      if (dateFilter === 'today') {
        filterDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateFilter === 'week') {
        filterDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === 'month') {
        filterDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      filtered = filtered.filter(trans => trans.date >= filterDate);
    }

    return filtered;
  }, [transactions, searchQuery, typeFilter, dateFilter]);

  // Handle inventory adjustment
  const handleInventoryAdjustment = async () => {
    try {
      const { type, goldAmount, karat, reason, notes } = adjustmentData;

      if (!goldAmount || parseFloat(goldAmount) <= 0) {
        alert('Please enter a valid gold amount');
        return;
      }

      if (!reason || reason.trim() === '') {
        alert('Please enter a reason for the adjustment');
        return;
      }

      const actualGold = parseFloat(goldAmount);
      const pureGold = actualGold * (purityCoefficients[karat] || 1.0);

      const accountingEngine = new AccountingEngine(companyId);

      if (type === 'add') {
        // Direct Purchase: Debit 1103 Inventory, Credit 1001 Cash
        await accountingEngine.createEntry({
          date: new Date(),
          description: `Direct gold purchase - ${reason}`,
          transactionType: 'inventory_adjustment',
          referenceId: `ADJ-${Date.now()}`,
          referenceType: 'adjustment',
          entries: [
            {
              accountCode: '1103',
              accountName: 'Finished Goods Inventory',
              debit: pureGold,
              credit: 0,
              balanceType: 'gold',
              notes: `${actualGold}g ${karat} (${pureGold.toFixed(3)}g pure). ${notes || ''}`
            },
            {
              accountCode: '1001',
              accountName: 'Cash in Hand',
              debit: 0,
              credit: pureGold,
              balanceType: 'gold',
              notes: `Purchase of ${actualGold}g ${karat} gold`
            }
          ]
        });
        alert(`Successfully added ${pureGold.toFixed(3)}g pure gold to inventory`);
      } else if (type === 'remove' || type === 'wastage') {
        // Removal/Wastage: Debit expense, Credit 1103 Inventory
        const accountName = type === 'wastage' ? 'Gold Wastage Expense' : 'Gold Usage Expense';
        const accountCode = type === 'wastage' ? '5103' : '5102';

        await accountingEngine.createEntry({
          date: new Date(),
          description: `Inventory ${type} - ${reason}`,
          transactionType: 'inventory_adjustment',
          referenceId: `ADJ-${Date.now()}`,
          referenceType: 'adjustment',
          entries: [
            {
              accountCode,
              accountName,
              debit: pureGold,
              credit: 0,
              balanceType: 'gold',
              notes: `${actualGold}g ${karat} (${pureGold.toFixed(3)}g pure). ${notes || ''}`
            },
            {
              accountCode: '1103',
              accountName: 'Finished Goods Inventory',
              debit: 0,
              credit: pureGold,
              balanceType: 'gold',
              notes: `${type} of ${actualGold}g ${karat} gold`
            }
          ]
        });
        alert(`Successfully recorded ${pureGold.toFixed(3)}g pure gold ${type}`);
      }

      // Close dialog
      setShowAdjustmentDialog(false);
      setAdjustmentData({
        type: 'add',
        goldAmount: '',
        karat: '24k',
        reason: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error processing adjustment:', error);
      alert('Error processing adjustment: ' + error.message);
    }
  };

  const getTransactionIcon = (trans) => {
    const inventoryEntry = trans.entries?.find(entry => entry.accountCode === '1103');
    if (!inventoryEntry) return null;

    if ((inventoryEntry.debit || 0) > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
  };

  const getTransactionType = (trans) => {
    const type = trans.transactionType || '';
    
    if (type.includes('invoice')) return 'Customer Delivery';
    if (type.includes('adjustment')) return 'Manual Adjustment';
    if (type.includes('product_received')) return 'Product Received';
    if (type.includes('purchase')) return 'Direct Purchase';
    if (type.includes('challan')) return 'Product Received';
    
    return trans.description || 'Unknown';
  };

  const exportInventoryReport = () => {
    const doc = new jsPDF();
    const goldPrice = 145.43; // TODO: Fetch from gold price service

    // English Header
    doc.setFontSize(20);
    doc.text('Inventory Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
    
    // Current Balance
    doc.setFontSize(14);
    doc.text('Current Inventory Balance', 20, 45);
    doc.setFontSize(12);
    doc.text(`${inventoryBalance.toFixed(3)}g Pure Gold (24k equivalent)`, 20, 52);
    doc.text(`$${(inventoryBalance * goldPrice).toFixed(2)} USD (Reference)`, 20, 59);

    // Karat Breakdown
    doc.setFontSize(12);
    doc.text('Inventory Breakdown by Karat', 20, 72);
    
    const breakdownData = Object.entries(karatBreakdown).map(([karat, amount]) => [
      karat.toUpperCase(),
      `${amount.toFixed(3)}g`,
      `$${(amount * goldPrice).toFixed(2)}`
    ]);
    
    doc.autoTable({
      startY: 77,
      head: [['Karat', 'Pure Gold Equivalent', 'USD Value (Ref)']],
      body: breakdownData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    // Recent Transactions
    doc.setFontSize(12);
    const finalY = doc.lastAutoTable.finalY || 77;
    doc.text('Recent Transactions', 20, finalY + 15);
    
    const tableData = filteredTransactions.slice(0, 20).map(trans => {
      const inventoryEntry = trans.entries?.find(entry => entry.accountCode === '1103');
      const debit = inventoryEntry?.debit || 0;
      const credit = inventoryEntry?.credit || 0;
      
      return [
        trans.date.toLocaleDateString(),
        getTransactionType(trans),
        debit > 0 ? `+${debit.toFixed(3)}g` : '',
        credit > 0 ? `-${credit.toFixed(3)}g` : '',
        trans.referenceId || 'N/A'
      ];
    });
    
    doc.autoTable({
      startY: finalY + 20,
      head: [['Date', 'Type', 'In (+)', 'Out (-)', 'Reference']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 }
    });
    
    doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };


  if (!isClient) {
    return <div>Loading...</div>;
  }

  const goldPrice = 145.43; // TODO: Fetch from gold price service (TASK 2.2)

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              Inventory Management
            </h1>
            <p className="text-gray-600">Track finished goods inventory (Pure Gold Based - Account 1103)</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAdjustmentDialog(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adjust Inventory
            </button>
            <button
              onClick={exportInventoryReport}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Current Balance Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Current Inventory Balance</h2>
              <p className="text-4xl font-bold text-blue-800">
                {inventoryBalance.toFixed(3)}g
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Pure Gold (24k equivalent) - Account 1103
              </p>
              <p className="text-lg font-semibold text-blue-600 mt-2">
                ${(inventoryBalance * goldPrice).toFixed(2)} USD
              </p>
              <p className="text-xs text-blue-600">Reference value at ${goldPrice}/g</p>
            </div>
            <Package className="w-20 h-20 text-blue-500 opacity-20" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Today */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Today</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> In
                </span>
                <span className="font-semibold text-green-800">
                  +{inventoryStats.today.in.toFixed(3)}g
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Out
                </span>
                <span className="font-semibold text-red-800">
                  -{inventoryStats.today.out.toFixed(3)}g
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-xs font-medium text-gray-700">Net</span>
                <span className={`font-bold ${inventoryStats.today.net >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {inventoryStats.today.net >= 0 ? '+' : ''}{inventoryStats.today.net.toFixed(3)}g
                </span>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-3">This Week</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> In
                </span>
                <span className="font-semibold text-green-800">
                  +{inventoryStats.week.in.toFixed(3)}g
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Out
                </span>
                <span className="font-semibold text-red-800">
                  -{inventoryStats.week.out.toFixed(3)}g
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-xs font-medium text-gray-700">Net</span>
                <span className={`font-bold ${inventoryStats.week.net >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {inventoryStats.week.net >= 0 ? '+' : ''}{inventoryStats.week.net.toFixed(3)}g
                </span>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-700 mb-3">This Month</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> In
                </span>
                <span className="font-semibold text-green-800">
                  +{inventoryStats.month.in.toFixed(3)}g
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Out
                </span>
                <span className="font-semibold text-red-800">
                  -{inventoryStats.month.out.toFixed(3)}g
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-xs font-medium text-gray-700">Net</span>
                <span className={`font-bold ${inventoryStats.month.net >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {inventoryStats.month.net >= 0 ? '+' : ''}{inventoryStats.month.net.toFixed(3)}g
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Transaction History
            </button>
            <button
              onClick={() => setActiveTab('valuation')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'valuation'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Valuation Report
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'breakdown'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Karat Breakdown
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="in">Inventory In (+)</option>
              <option value="out">Inventory Out (-)</option>
              <option value="adjustment">Adjustments Only</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Type</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Description</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">In (+)</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Out (-)</th>
                    <th className="p-3 text-left text-sm font-medium text-gray-600">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        <RefreshCcw className="w-12 h-12 mx-auto mb-2 text-gray-400 animate-spin" />
                        Loading inventory transactions...
                      </td>
                    </tr>
                  ) : filteredTransactions.length > 0 ? (
                    filteredTransactions.map((trans) => {
                      const inventoryEntry = trans.entries?.find(entry => entry.accountCode === '1103');
                      const debit = inventoryEntry?.debit || 0;
                      const credit = inventoryEntry?.credit || 0;

                      return (
                        <tr key={trans.id} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3 text-sm text-gray-900 whitespace-nowrap">
                            {trans.date.toLocaleDateString()}
                          </td>
                          <td className="p-3 text-sm">
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(trans)}
                              <span className="text-gray-900">{getTransactionType(trans)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-gray-900">
                            <div>{trans.description}</div>
                            {inventoryEntry?.notes && (
                              <div className="text-xs text-gray-500 mt-1">{inventoryEntry.notes}</div>
                            )}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {debit > 0 && (
                              <span className="font-semibold text-green-600">
                                +{debit.toFixed(3)}g
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-sm whitespace-nowrap">
                            {credit > 0 && (
                              <span className="font-semibold text-red-600">
                                -{credit.toFixed(3)}g
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-sm text-gray-500 whitespace-nowrap">
                            {trans.referenceId || '-'}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p>No inventory transactions found</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Valuation Report Tab */}
        {activeTab === 'valuation' && (
          <div className="space-y-6">
            {/* Market Valuation Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Current Market Valuation
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-green-700 mb-1">Total Pure Gold</p>
                  <p className="text-3xl font-bold text-green-900">{inventoryBalance.toFixed(3)}g</p>
                  <p className="text-xs text-green-600">24k equivalent</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Market Value (USD)</p>
                  <p className="text-3xl font-bold text-green-900">${(inventoryBalance * goldPrice).toFixed(2)}</p>
                  <p className="text-xs text-green-600">At ${goldPrice}/g</p>
                </div>
                <div>
                  <p className="text-sm text-green-700 mb-1">Valuation Date</p>
                  <p className="text-lg font-semibold text-green-900">{new Date().toLocaleDateString()}</p>
                  <p className="text-xs text-green-600">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>

            {/* Karat Valuation Breakdown */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Inventory Valuation by Karat</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Karat</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Purity</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Pure Gold (24k eq.)</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Market Value (USD)</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">% of Total</th>
                      <th className="p-3 text-left text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(karatBreakdown).map(([karat, amount]) => {
                      const percentage = inventoryBalance > 0 ? (amount / inventoryBalance * 100) : 0;
                      const isLowStock = amount < 50; // Low stock threshold: 50g
                      
                      return (
                        <tr key={karat} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-3 text-sm font-semibold text-gray-900">{karat.toUpperCase()}</td>
                          <td className="p-3 text-sm text-gray-700">{(purityCoefficients[karat] * 100).toFixed(2)}%</td>
                          <td className="p-3 text-sm font-semibold text-blue-600">{amount.toFixed(3)}g</td>
                          <td className="p-3 text-sm font-semibold text-green-600">${(amount * goldPrice).toFixed(2)}</td>
                          <td className="p-3 text-sm text-gray-700">{percentage.toFixed(1)}%</td>
                          <td className="p-3">
                            {amount === 0 ? (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                Empty
                              </span>
                            ) : isLowStock ? (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 flex items-center gap-1 w-fit">
                                <AlertCircle className="w-3 h-3" />
                                Low Stock
                              </span>
                            ) : (
                              <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                                Normal
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                    <tr>
                      <td colSpan="2" className="p-3 text-sm font-bold text-gray-900">TOTAL</td>
                      <td className="p-3 text-sm font-bold text-blue-900">{inventoryBalance.toFixed(3)}g</td>
                      <td className="p-3 text-sm font-bold text-green-900">${(inventoryBalance * goldPrice).toFixed(2)}</td>
                      <td className="p-3 text-sm font-bold text-gray-900">100%</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Low Stock Alerts */}
            {Object.entries(karatBreakdown).filter(([karat, amount]) => amount > 0 && amount < 50).length > 0 && (
              <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Low Stock Alerts
                </h3>
                <div className="space-y-3">
                  {Object.entries(karatBreakdown)
                    .filter(([karat, amount]) => amount > 0 && amount < 50)
                    .map(([karat, amount]) => (
                      <div key={karat} className="bg-white p-4 rounded-lg border border-red-300">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{karat.toUpperCase()} Gold</p>
                            <p className="text-sm text-gray-600">Current Stock: <span className="font-semibold text-red-600">{amount.toFixed(3)}g</span></p>
                            <p className="text-xs text-gray-500">Threshold: 50g pure gold equivalent</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-red-700">${(amount * goldPrice).toFixed(2)}</p>
                            <p className="text-xs text-gray-600">Market Value</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button 
                            onClick={() => setShowAdjustmentDialog(true)}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add Stock
                          </button>
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                            Set Alert Threshold
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* No Low Stock Message */}
            {Object.entries(karatBreakdown).filter(([karat, amount]) => amount > 0 && amount < 50).length === 0 && (
              <div className="bg-green-50 p-6 rounded-lg border border-green-200 text-center">
                <Package className="w-12 h-12 mx-auto mb-3 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900 mb-2">All Stock Levels Normal</h3>
                <p className="text-gray-700">No low stock alerts at this time. All karat levels are above the 50g threshold.</p>
              </div>
            )}

            {/* Export Options */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={exportInventoryReport}
                  className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download Valuation Report (PDF)
                </button>
                <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Email Report to Management
                </button>
                <button className="px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule Monthly Report
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breakdown' && (
          <div className="space-y-4">
            {/* Karat Breakdown Cards */}
            {Object.entries(karatBreakdown).map(([karat, amount]) => (
              <motion.div
                key={karat}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="w-8 h-8 text-blue-500" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {karat.toUpperCase()} Gold
                      </h3>
                      <p className="text-sm text-gray-600">
                        Purity: {(purityCoefficients[karat] * 100).toFixed(2)}%
                      </p>
                      <p className="text-2xl font-bold text-blue-600 mt-2">
                        {amount.toFixed(3)}g
                      </p>
                      <p className="text-xs text-gray-500">Pure gold equivalent (24k)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-800">
                      ${(amount * goldPrice).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-600">USD (Reference)</div>
                  </div>
                </div>
              </motion.div>
            ))}

            {Object.values(karatBreakdown).every(v => v === 0) && (
              <div className="bg-white p-8 rounded-lg shadow text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Inventory Data</h3>
                <p className="text-gray-600">No inventory tracked by karat yet</p>
              </div>
            )}
          </div>
        )}

        {/* Inventory Adjustment Dialog */}
        {showAdjustmentDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-xl w-full">
              <div className="bg-blue-600 text-white p-6 rounded-t-lg">
                <h3 className="text-xl font-bold">Inventory Adjustment</h3>
                <p className="text-blue-100 text-sm">Add, remove, or record wastage of gold inventory</p>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {/* Adjustment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adjustment Type *
                    </label>
                    <select
                      value={adjustmentData.type}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="add">Add to Inventory (Purchase)</option>
                      <option value="remove">Remove from Inventory (Usage)</option>
                      <option value="wastage">Wastage/Loss</option>
                    </select>
                  </div>

                  {/* Karat */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Karat *
                    </label>
                    <select
                      value={adjustmentData.karat}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, karat: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="24k">24k (Pure Gold - 100%)</option>
                      <option value="22k">22k (91.66%)</option>
                      <option value="21k">21k (87.5%)</option>
                      <option value="18k">18k (75%)</option>
                      <option value="14k">14k (58.33%)</option>
                    </select>
                  </div>

                  {/* Gold Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gold Amount (grams) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={adjustmentData.goldAmount}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, goldAmount: e.target.value })}
                      placeholder="Enter gold amount"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    {adjustmentData.goldAmount && adjustmentData.karat !== '24k' && (
                      <p className="text-sm text-gray-600 mt-1">
                        Pure gold equivalent: {(parseFloat(adjustmentData.goldAmount) * purityCoefficients[adjustmentData.karat]).toFixed(3)}g
                      </p>
                    )}
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason *
                    </label>
                    <input
                      type="text"
                      value={adjustmentData.reason}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, reason: e.target.value })}
                      placeholder="Enter reason for adjustment"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Notes (Optional)
                    </label>
                    <textarea
                      value={adjustmentData.notes}
                      onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                      placeholder="Add any additional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Accounting Preview */}
                  {adjustmentData.goldAmount && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Accounting Impact:</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {adjustmentData.type === 'add' && (
                          <>
                            <div>• Debit: 1103 Finished Goods Inventory (+{(parseFloat(adjustmentData.goldAmount) * purityCoefficients[adjustmentData.karat]).toFixed(3)}g)</div>
                            <div>• Credit: 1001 Cash in Hand (-{(parseFloat(adjustmentData.goldAmount) * purityCoefficients[adjustmentData.karat]).toFixed(3)}g)</div>
                          </>
                        )}
                        {(adjustmentData.type === 'remove' || adjustmentData.type === 'wastage') && (
                          <>
                            <div>• Debit: {adjustmentData.type === 'wastage' ? '5103 Gold Wastage Expense' : '5102 Gold Usage Expense'} (+{(parseFloat(adjustmentData.goldAmount) * purityCoefficients[adjustmentData.karat]).toFixed(3)}g)</div>
                            <div>• Credit: 1103 Finished Goods Inventory (-{(parseFloat(adjustmentData.goldAmount) * purityCoefficients[adjustmentData.karat]).toFixed(3)}g)</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button
                    onClick={() => {
                      setShowAdjustmentDialog(false);
                      setAdjustmentData({
                        type: 'add',
                        goldAmount: '',
                        karat: '24k',
                        reason: '',
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleInventoryAdjustment}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Process Adjustment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
