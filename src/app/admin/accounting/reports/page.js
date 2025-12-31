"use client";
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAccounting } from '@/app/context/AccountingContext';
import { AccountingEngine } from '@/utils/accountingEngine';
import AdminLayout from '@/app/admin/AdminLayout';
import { FileText, Download, Calendar, TrendingUp, Users, Building, Receipt, DollarSign } from 'lucide-react';

// Customer Balance Summary Component
function CustomerBalanceSummary({ data }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-500" />
          Customer Balance Summary
        </h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
          <Download className="w-4 h-4 mr-1" />
          Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outstanding Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {customer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatCurrency(customer.balance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {customer.lastPayment ? new Date(customer.lastPayment.toDate()).toLocaleDateString('en-IN') : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    customer.balance > 10000
                      ? 'bg-red-100 text-red-800'
                      : customer.balance > 5000
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {customer.balance > 10000 ? 'High' : customer.balance > 5000 ? 'Medium' : 'Low'}
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

// Manufacturer Balance Summary Component
function ManufacturerBalanceSummary({ data }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Building className="w-5 h-5 mr-2 text-green-500" />
          Manufacturer Balance Summary
        </h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
          <Download className="w-4 h-4 mr-1" />
          Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Manufacturer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Outstanding Balance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Payment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((manufacturer) => (
              <tr key={manufacturer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {manufacturer.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {formatCurrency(manufacturer.balance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {manufacturer.lastPayment ? new Date(manufacturer.lastPayment.toDate()).toLocaleDateString('en-IN') : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    manufacturer.balance > 50000
                      ? 'bg-red-100 text-red-800'
                      : manufacturer.balance > 25000
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {manufacturer.balance > 50000 ? 'High' : manufacturer.balance > 25000 ? 'Medium' : 'Low'}
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

// Daily Transaction Summary Component
function DailyTransactionSummary({ data }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Receipt className="w-5 h-5 mr-2 text-purple-500" />
          Daily Transaction Summary
        </h3>
        <div className="flex items-center space-x-2">
          <input
            type="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          />
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{data.totalTransactions}</div>
          <div className="text-sm text-blue-800">Total Transactions</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{formatCurrency(data.totalSales)}</div>
          <div className="text-sm text-green-800">Total Sales</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{formatCurrency(data.totalPayments)}</div>
          <div className="text-sm text-red-800">Total Payments</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(data.netCashFlow)}</div>
          <div className="text-sm text-yellow-800">Net Cash Flow</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Reference
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.transactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    transaction.type === 'sale'
                      ? 'bg-green-100 text-green-800'
                      : transaction.type === 'payment'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {transaction.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.reference}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Basic P&L Preview Component
function BasicPLPreview({ data }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
          Basic P&L Preview
        </h3>
        <div className="flex items-center space-x-2">
          <select className="px-3 py-1 border border-gray-300 rounded text-sm">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Revenue Section */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Revenue</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Sales Revenue</span>
              <span className="text-sm font-medium">{formatCurrency(data.revenue.sales)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Other Income</span>
              <span className="text-sm font-medium">{formatCurrency(data.revenue.other)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-2 border-gray-300 font-semibold">
              <span className="text-sm text-gray-900">Total Revenue</span>
              <span className="text-sm font-bold">{formatCurrency(data.revenue.total)}</span>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-3">Expenses</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Cost of Goods Sold</span>
              <span className="text-sm font-medium">{formatCurrency(data.expenses.cogs)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-600">Operating Expenses</span>
              <span className="text-sm font-medium">{formatCurrency(data.expenses.operating)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b-2 border-gray-300 font-semibold">
              <span className="text-sm text-gray-900">Total Expenses</span>
              <span className="text-sm font-bold">{formatCurrency(data.expenses.total)}</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Net Profit</span>
            <span className={`text-lg font-bold ${data.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(data.netProfit)}
            </span>
          </div>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${data.netProfit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(Math.abs(data.profitMargin), 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Profit Margin: {data.profitMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Reports Page Component
export default function AccountingReportsPage() {
  const { companyId, financialData } = useAccounting();
  const [activeTab, setActiveTab] = useState('customers');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    customers: [],
    manufacturers: [],
    dailyTransactions: {
      totalTransactions: 0,
      totalSales: 0,
      totalPayments: 0,
      netCashFlow: 0,
      transactions: []
    },
    plPreview: {
      revenue: { sales: 0, other: 0, total: 0 },
      expenses: { cogs: 0, operating: 0, total: 0 },
      netProfit: 0,
      profitMargin: 0
    }
  });

  // Load report data
  useEffect(() => {
    if (!companyId) return;

    const loadReportData = async () => {
      try {
        // Load customer balances
        const customersQuery = query(collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/customers`));
        const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
          const customers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            balance: doc.data().outstandingBalance || 0
          }));
          setReportData(prev => ({ ...prev, customers }));
        });

        // Load manufacturer balances
        const manufacturersQuery = query(collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`));
        const manufacturersUnsubscribe = onSnapshot(manufacturersQuery, (snapshot) => {
          const manufacturers = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            balance: doc.data().payableBalance || 0
          }));
          setReportData(prev => ({ ...prev, manufacturers }));
        });

        // Load daily transactions (mock data for now)
        const today = new Date();
        const mockTransactions = [
          { time: '09:30 AM', type: 'sale', description: 'Gold necklace sale', amount: 45000, reference: 'ORD-001' },
          { time: '11:15 AM', type: 'payment', description: 'Payment received', amount: 25000, reference: 'PAY-001' },
          { time: '02:45 PM', type: 'sale', description: 'Gold ring sale', amount: 18000, reference: 'ORD-002' },
          { time: '04:20 PM', type: 'payment', description: 'Payment received', amount: 30000, reference: 'PAY-002' }
        ];

        setReportData(prev => ({
          ...prev,
          dailyTransactions: {
            totalTransactions: mockTransactions.length,
            totalSales: mockTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.amount, 0),
            totalPayments: mockTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0),
            netCashFlow: mockTransactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0),
            transactions: mockTransactions
          }
        }));

        // Set P&L preview from financial data
        setReportData(prev => ({
          ...prev,
          plPreview: {
            revenue: {
              sales: financialData.revenue || 0,
              other: 0,
              total: financialData.revenue || 0
            },
            expenses: {
              cogs: (financialData.expenses || 0) * 0.7,
              operating: (financialData.expenses || 0) * 0.3,
              total: financialData.expenses || 0
            },
            netProfit: financialData.netProfit || 0,
            profitMargin: financialData.revenue > 0 ? ((financialData.netProfit || 0) / financialData.revenue) * 100 : 0
          }
        }));

        setLoading(false);

        return () => {
          customersUnsubscribe();
          manufacturersUnsubscribe();
        };
      } catch (error) {
        console.error('Error loading report data:', error);
        setLoading(false);
      }
    };

    loadReportData();
  }, [companyId, financialData]);

  const tabs = [
    { id: 'customers', label: 'Customer Balances', icon: Users },
    { id: 'manufacturers', label: 'Manufacturer Balances', icon: Building },
    { id: 'daily', label: 'Daily Transactions', icon: Receipt },
    { id: 'pl', label: 'P&L Preview', icon: TrendingUp }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 Jewelry Accounting Reports</h1>
          <p className="text-gray-600 mt-1">Jewelry business financial summaries and transaction reports</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Report Content */}
        <div className="space-y-6">
          {activeTab === 'customers' && (
            <CustomerBalanceSummary data={reportData.customers} />
          )}

          {activeTab === 'manufacturers' && (
            <ManufacturerBalanceSummary data={reportData.manufacturers} />
          )}

          {activeTab === 'daily' && (
            <DailyTransactionSummary data={reportData.dailyTransactions} />
          )}

          {activeTab === 'pl' && (
            <BasicPLPreview data={reportData.plPreview} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}