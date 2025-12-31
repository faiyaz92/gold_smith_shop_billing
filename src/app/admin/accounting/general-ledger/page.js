"use client";
import { useState, useEffect } from 'react';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAccounting } from '@/app/context/AccountingContext';
import AdminLayout from '@/app/admin/AdminLayout';
import { BookOpen, Calendar, Printer, Download, Search, ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function GeneralLedgerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { companyId } = useAccounting();
  
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [ledgerTransactions, setLedgerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!companyId) return;
    loadAccounts();
    
    // Check if account is passed via URL parameter
    const accountId = searchParams.get('accountId');
    if (accountId) {
      loadAccountById(accountId);
    }
  }, [companyId, searchParams]);

  useEffect(() => {
    if (selectedAccount) {
      loadLedgerTransactions();
    }
  }, [selectedAccount, dateFrom, dateTo]);

  const loadAccounts = async () => {
    try {
      const accountsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/accounts`;
      const accountsQuery = query(collection(db, accountsPath), orderBy('accountCode'));
      const snapshot = await getDocs(accountsQuery);
      
      const accountsData = snapshot.docs.map(doc => ({
        id: doc.id,
        accountId: doc.id,
        ...doc.data()
      }));

      setAccounts(accountsData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setLoading(false);
    }
  };

  const loadAccountById = async (accountId) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      setSelectedAccount(account);
    }
  };

  const loadLedgerTransactions = async () => {
    try {
      const entriesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`;
      const entriesQuery = query(collection(db, entriesPath), orderBy('date', 'asc'));
      const snapshot = await getDocs(entriesQuery);
      
      const entries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Filter entries that affect this account
      const relevantEntries = [];
      let runningBalance = selectedAccount.currentBalance || 0;
      
      // Start with opening balance
      const openingBalance = selectedAccount.currentBalance || 0;
      
      // Build transaction list with running balances
      const transactions = [];
      
      entries.forEach(entry => {
        if (!entry.lines) return;
        
        entry.lines.forEach(line => {
          if (line.accountId === selectedAccount.id || line.accountId === selectedAccount.accountId) {
            const debit = parseFloat(line.debit) || 0;
            const credit = parseFloat(line.credit) || 0;
            
            // Calculate balance change
            let balanceChange = 0;
            if (selectedAccount.balanceType === 'debit') {
              balanceChange = debit - credit;
            } else {
              balanceChange = credit - debit;
            }
            
            transactions.push({
              date: entry.date?.toDate ? entry.date.toDate() : new Date(entry.date),
              description: line.description || entry.description,
              reference: entry.reference || entry.id.substring(0, 8),
              debit: debit,
              credit: credit,
              balanceChange: balanceChange,
              entryId: entry.id
            });
          }
        });
      });

      // Sort by date
      transactions.sort((a, b) => a.date - b.date);

      // Apply date filters
      let filteredTransactions = transactions;
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredTransactions = filteredTransactions.filter(t => t.date >= fromDate);
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59);
        filteredTransactions = filteredTransactions.filter(t => t.date <= toDate);
      }

      // Calculate running balances
      let balance = openingBalance;
      const transactionsWithBalance = filteredTransactions.map(txn => {
        balance += txn.balanceChange;
        return {
          ...txn,
          runningBalance: balance
        };
      });

      setLedgerTransactions(transactionsWithBalance);
    } catch (error) {
      console.error('Error loading ledger transactions:', error);
    }
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setDateFrom('');
    setDateTo('');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredAccounts = accounts.filter(acc => 
    (acc.accountCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     acc.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     acc.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openingBalance = selectedAccount?.currentBalance || 0;
  const closingBalance = ledgerTransactions.length > 0 
    ? ledgerTransactions[ledgerTransactions.length - 1].runningBalance 
    : openingBalance;

  const totalDebits = ledgerTransactions.reduce((sum, txn) => sum + txn.debit, 0);
  const totalCredits = ledgerTransactions.reduce((sum, txn) => sum + txn.credit, 0);

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
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => router.push('/admin/accounting')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="text-blue-600" size={36} />
              General Ledger
            </h1>
          </div>
          <p className="text-gray-600 ml-14">
            Detailed transaction history for individual accounts
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Account Selection Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Select Account</h2>
              
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search accounts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Account List */}
              <div className="space-y-1 max-h-[600px] overflow-y-auto">
                {filteredAccounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelect(account)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'bg-blue-100 text-blue-900 font-medium'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-mono text-xs text-gray-600">{account.accountCode}</div>
                    <div className="truncate">{account.accountName || account.name}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Ledger Display */}
          <div className="lg:col-span-3">
            {!selectedAccount ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <BookOpen size={64} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">Select an account to view its ledger</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md">
                {/* Account Header */}
                <div className="border-b border-gray-200 p-6 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedAccount.accountCode} - {selectedAccount.accountName || selectedAccount.name}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span className="capitalize">{selectedAccount.accountType}</span>
                        <span>•</span>
                        <span>{selectedAccount.category}</span>
                        <span>•</span>
                        <span className="capitalize">{selectedAccount.balanceType} Balance</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                      >
                        <Printer size={16} />
                        Print
                      </button>
                    </div>
                  </div>

                  {/* Date Filters */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-gray-400" />
                      <label className="text-sm text-gray-600">From:</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600">To:</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => { setDateFrom(''); setDateTo(''); }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Balance Summary */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Opening Balance</div>
                      <div className="text-lg font-bold text-gray-900">{formatCurrency(openingBalance)}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Total Movement</div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(Math.abs(closingBalance - openingBalance))}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Closing Balance</div>
                      <div className="text-lg font-bold text-green-600">{formatCurrency(closingBalance)}</div>
                    </div>
                  </div>
                </div>

                {/* Ledger Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ref
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Debit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Credit
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Balance
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {/* Opening Balance Row */}
                      <tr className="bg-blue-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">-</td>
                        <td className="px-4 py-3 text-sm font-semibold text-gray-900">Opening Balance</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">-</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">-</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-500">-</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                          {formatCurrency(openingBalance)}
                        </td>
                      </tr>

                      {/* Transaction Rows */}
                      {ledgerTransactions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                            No transactions found for this account in the selected period.
                          </td>
                        </tr>
                      ) : (
                        ledgerTransactions.map((txn, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(txn.date)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {txn.description}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {txn.reference}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {txn.debit > 0 ? formatCurrency(txn.debit) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                              {txn.credit > 0 ? formatCurrency(txn.credit) : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                              {formatCurrency(txn.runningBalance)}
                            </td>
                          </tr>
                        ))
                      )}

                      {/* Totals Row */}
                      {ledgerTransactions.length > 0 && (
                        <tr className="bg-gray-50 font-semibold">
                          <td colSpan="3" className="px-4 py-3 text-sm text-gray-900 text-right">
                            TOTALS:
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(totalDebits)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-900">
                            {formatCurrency(totalCredits)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-green-600">
                            {formatCurrency(closingBalance)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer Summary */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Showing {ledgerTransactions.length} transaction{ledgerTransactions.length !== 1 ? 's' : ''}
                      {(dateFrom || dateTo) && ' (filtered)'}
                    </span>
                    <span className="text-gray-600">
                      Current Balance: <span className="font-semibold text-gray-900">{formatCurrency(selectedAccount.currentBalance || 0)}</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
