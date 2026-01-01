"use client";
import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAccounting } from '@/app/context/AccountingContext';
import AdminLayout from '@/app/admin/AdminLayout';
import { TrendingUp, TrendingDown, DollarSign, Scale } from 'lucide-react';

export default function BalanceSheetPage() {
  const { companyId, userRole } = useAccounting();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [balanceSheet, setBalanceSheet] = useState({
    assets: { current: [], fixed: [], total: 0 },
    liabilities: { current: [], longTerm: [], total: 0 },
    equity: { accounts: [], total: 0 }
  });

  useEffect(() => {
    if (!companyId) return;
    loadAccounts();
  }, [companyId]);

  const loadAccounts = async () => {
    try {
      const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
      const accountsQuery = query(collection(db, accountsPath));
      const snapshot = await getDocs(accountsQuery);
      
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setAccounts(accountsData);
      calculateBalanceSheet(accountsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setLoading(false);
    }
  };

  const calculateBalanceSheet = (accountsData) => {
    // Assets
    const assetAccounts = accountsData.filter(acc => acc.accountType === 'asset');
    const currentAssetAccounts = assetAccounts.filter(acc =>
      acc.accountCode?.startsWith('11') || acc.accountCode?.startsWith('12') || acc.accountCode?.startsWith('13') ||
      acc.accountCode?.startsWith('MAIN-1')
    );
    const fixedAssetAccounts = assetAccounts.filter(acc =>
      acc.accountCode?.startsWith('14') || acc.accountCode?.startsWith('15') ||
      acc.accountCode?.startsWith('MAIN-2')
    );

    const currentAssetsTotal = currentAssetAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    const fixedAssetsTotal = fixedAssetAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
    const totalAssets = currentAssetsTotal + fixedAssetsTotal;

    // Liabilities
    const liabilityAccounts = accountsData.filter(acc => acc.accountType === 'liability');
    const currentLiabilityAccounts = liabilityAccounts.filter(acc =>
      acc.accountCode?.startsWith('21') || acc.accountCode?.startsWith('MAIN-2')
    );
    const longTermLiabilityAccounts = liabilityAccounts.filter(acc =>
      acc.accountCode?.startsWith('22') || acc.accountCode?.startsWith('MAIN-3')
    );

    const currentLiabilitiesTotal = currentLiabilityAccounts.reduce((sum, acc) => sum + Math.abs(acc.currentBalance || 0), 0);
    const longTermLiabilitiesTotal = longTermLiabilityAccounts.reduce((sum, acc) => sum + Math.abs(acc.currentBalance || 0), 0);
    const totalLiabilities = currentLiabilitiesTotal + longTermLiabilitiesTotal;

    // Equity
    const equityAccounts = accountsData.filter(acc => acc.accountType === 'equity');
    const totalEquity = equityAccounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

    setBalanceSheet({
      assets: {
        current: currentAssetAccounts,
        fixed: fixedAssetAccounts,
        currentTotal: currentAssetsTotal,
        fixedTotal: fixedAssetsTotal,
        total: totalAssets
      },
      liabilities: {
        current: currentLiabilityAccounts,
        longTerm: longTermLiabilityAccounts,
        currentTotal: currentLiabilitiesTotal,
        longTermTotal: longTermLiabilitiesTotal,
        total: totalLiabilities
      },
      equity: {
        accounts: equityAccounts,
        total: totalEquity
      },
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
      balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (value, total) => {
    return total > 0 ? ((value / total) * 100).toFixed(1) + '%' : '0%';
  };

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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Scale className="text-blue-600" size={36} />
            Balance Sheet
          </h1>
          <p className="text-gray-600 mt-1">
            Financial position as of {new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}
          </p>
        </div>

        {/* Balance Check */}
        {!balanceSheet.balanced && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-semibold">⚠️ Balance Sheet Does Not Balance!</p>
            <p className="text-red-600 text-sm mt-1">
              Assets: {formatCurrency(balanceSheet.assets.total)} ≠ Liabilities + Equity: {formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}
            </p>
            <p className="text-red-600 text-sm">
              Difference: {formatCurrency(Math.abs(balanceSheet.assets.total - balanceSheet.totalLiabilitiesAndEquity))}
            </p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-green-600 font-medium">Total Assets</div>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-green-900 mt-1">
              {formatCurrency(balanceSheet.assets.total)}
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-red-600 font-medium">Total Liabilities</div>
              <TrendingDown className="text-red-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-red-900 mt-1">
              {formatCurrency(balanceSheet.liabilities.total)}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-600 font-medium">Total Equity</div>
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-blue-900 mt-1">
              {formatCurrency(balanceSheet.equity.total)}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-purple-600 font-medium">Current Ratio</div>
              <Scale className="text-purple-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-purple-900 mt-1">
              {balanceSheet.liabilities.currentTotal > 0
                ? (balanceSheet.assets.currentTotal / balanceSheet.liabilities.currentTotal).toFixed(2)
                : '∞'}
            </div>
            <div className="text-xs text-purple-600 mt-1">
              {balanceSheet.liabilities.currentTotal > 0 && (balanceSheet.assets.currentTotal / balanceSheet.liabilities.currentTotal) >= 2
                ? '✓ Healthy'
                : balanceSheet.liabilities.currentTotal > 0
                ? '⚠️ Watch'
                : '✓ No debt'}
            </div>
          </div>
        </div>

        {/* Balance Sheet Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ASSETS SIDE */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-green-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold">ASSETS</h2>
              <p className="text-sm text-green-100 mt-1">Resources owned by the business</p>
            </div>

            <div className="p-6">
              {/* Current Assets */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  Current Assets
                  <span className="text-sm font-normal text-gray-500">
                    {formatPercent(balanceSheet.assets.currentTotal, balanceSheet.assets.total)}
                  </span>
                </h3>
                <div className="space-y-2">
                  {balanceSheet.assets.current.map(account => (
                    <div key={account.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {account.accountName || account.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{account.accountCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(account.currentBalance || 0)}
                        </div>
                        {account.currentBalanceGold > 0 && (
                          <div className="text-xs text-yellow-600">
                            {account.currentBalanceGold.toFixed(3)}g
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded font-semibold">
                    <span className="text-sm text-gray-700">Total Current Assets</span>
                    <span className="text-sm text-green-700">{formatCurrency(balanceSheet.assets.currentTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Fixed Assets */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  Fixed Assets
                  <span className="text-sm font-normal text-gray-500">
                    {formatPercent(balanceSheet.assets.fixedTotal, balanceSheet.assets.total)}
                  </span>
                </h3>
                <div className="space-y-2">
                  {balanceSheet.assets.fixed.length === 0 ? (
                    <div className="text-sm text-gray-500 italic py-2">No fixed assets</div>
                  ) : (
                    balanceSheet.assets.fixed.map(account => (
                      <div key={account.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            {account.accountName || account.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{account.accountCode}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(account.currentBalance || 0)}
                        </div>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between items-center py-2 px-3 bg-green-50 rounded font-semibold">
                    <span className="text-sm text-gray-700">Total Fixed Assets</span>
                    <span className="text-sm text-green-700">{formatCurrency(balanceSheet.assets.fixedTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Total Assets */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className="flex justify-between items-center py-2 px-3 bg-green-100 rounded">
                  <span className="text-base font-bold text-gray-900">TOTAL ASSETS</span>
                  <span className="text-base font-bold text-green-900">{formatCurrency(balanceSheet.assets.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* LIABILITIES & EQUITY SIDE */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-purple-600 text-white p-4 rounded-t-lg">
              <h2 className="text-xl font-bold">LIABILITIES & EQUITY</h2>
              <p className="text-sm text-purple-100 mt-1">Claims on business resources</p>
            </div>

            <div className="p-6">
              {/* Current Liabilities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  Current Liabilities
                  <span className="text-sm font-normal text-gray-500">
                    {formatPercent(balanceSheet.liabilities.currentTotal, balanceSheet.assets.total)}
                  </span>
                </h3>
                <div className="space-y-2">
                  {balanceSheet.liabilities.current.length === 0 ? (
                    <div className="text-sm text-gray-500 italic py-2">No current liabilities</div>
                  ) : (
                    balanceSheet.liabilities.current.map(account => (
                      <div key={account.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            {account.accountName || account.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{account.accountCode}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Math.abs(account.currentBalance || 0))}
                        </div>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded font-semibold">
                    <span className="text-sm text-gray-700">Total Current Liabilities</span>
                    <span className="text-sm text-red-700">{formatCurrency(balanceSheet.liabilities.currentTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Long-term Liabilities */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  Long-term Liabilities
                  <span className="text-sm font-normal text-gray-500">
                    {formatPercent(balanceSheet.liabilities.longTermTotal, balanceSheet.assets.total)}
                  </span>
                </h3>
                <div className="space-y-2">
                  {balanceSheet.liabilities.longTerm.length === 0 ? (
                    <div className="text-sm text-gray-500 italic py-2">No long-term liabilities</div>
                  ) : (
                    balanceSheet.liabilities.longTerm.map(account => (
                      <div key={account.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-700">
                            {account.accountName || account.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">{account.accountCode}</div>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {formatCurrency(Math.abs(account.currentBalance || 0))}
                        </div>
                      </div>
                    ))
                  )}
                  <div className="flex justify-between items-center py-2 px-3 bg-red-50 rounded font-semibold">
                    <span className="text-sm text-gray-700">Total Long-term Liabilities</span>
                    <span className="text-sm text-red-700">{formatCurrency(balanceSheet.liabilities.longTermTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities */}
              <div className="mb-6 border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center py-2 px-3 bg-red-100 rounded font-bold">
                  <span className="text-sm text-gray-900">TOTAL LIABILITIES</span>
                  <span className="text-sm text-red-900">{formatCurrency(balanceSheet.liabilities.total)}</span>
                </div>
              </div>

              {/* Equity */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-between">
                  Owner&apos;s Equity
                  <span className="text-sm font-normal text-gray-500">
                    {formatPercent(balanceSheet.equity.total, balanceSheet.assets.total)}
                  </span>
                </h3>
                <div className="space-y-2">
                  {balanceSheet.equity.accounts.map(account => (
                    <div key={account.id} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">
                          {account.accountName || account.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{account.accountCode}</div>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(account.currentBalance || 0)}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center py-2 px-3 bg-blue-50 rounded font-semibold">
                    <span className="text-sm text-gray-700">Total Owner&apos;s Equity</span>
                    <span className="text-sm text-blue-700">{formatCurrency(balanceSheet.equity.total)}</span>
                  </div>
                </div>
              </div>

              {/* Total Liabilities & Equity */}
              <div className="border-t-2 border-gray-300 pt-4">
                <div className={`flex justify-between items-center py-2 px-3 rounded ${
                  balanceSheet.balanced ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className="text-base font-bold text-gray-900">TOTAL LIAB & EQUITY</span>
                  <span className={`text-base font-bold ${balanceSheet.balanced ? 'text-green-900' : 'text-red-900'}`}>
                    {formatCurrency(balanceSheet.totalLiabilitiesAndEquity)}
                  </span>
                </div>
                {balanceSheet.balanced && (
                  <div className="text-center mt-2 text-sm text-green-600 font-semibold">
                    ✓ Balance Sheet is balanced!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Accounting Equation */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">Accounting Equation</h3>
          <div className="flex items-center justify-center gap-4 text-lg">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Assets</div>
              <div className="font-bold text-green-700">{formatCurrency(balanceSheet.assets.total)}</div>
            </div>
            <div className="text-2xl text-gray-400">=</div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Liabilities</div>
              <div className="font-bold text-red-700">{formatCurrency(balanceSheet.liabilities.total)}</div>
            </div>
            <div className="text-2xl text-gray-400">+</div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">Equity</div>
              <div className="font-bold text-blue-700">{formatCurrency(balanceSheet.equity.total)}</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
