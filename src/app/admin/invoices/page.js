// ✅ TASK 9.3: Invoice List & Outstanding View
// Gold Smith Invoice Management - Pure Gold Based
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import {
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Download,
  Plus,
  Calendar,
  TrendingUp
} from 'lucide-react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';
import invoiceGenerator from '@/utils/invoiceGenerator';

export default function InvoicesManagement() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, not_paid, partially_paid, paid, overdue
  const [sortBy, setSortBy] = useState('invoiceDate'); // invoiceDate, dueDate, amount
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'default-company';
  const basePath = `companies/${companyId}`;
  const invoicesPath = `${basePath}/invoices`;

  useEffect(() => {
    setIsClient(true);
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);

      // Fetch all invoices
      const invoicesQuery = query(
        collection(db, invoicesPath),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          invoiceDate: doc.data().invoiceDate?.toDate ? doc.data().invoiceDate.toDate() : new Date(doc.data().invoiceDate),
          dueDate: doc.data().dueDate?.toDate ? doc.data().dueDate.toDate() : new Date(doc.data().dueDate),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        }));
        setInvoices(invoicesData);
      });

      // Fetch customers for reference
      const customersQuery = query(collection(db, `${basePath}/customers`));
      const customersSnapshot = await getDocs(customersQuery);
      const customersData = customersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCustomers(customersData);

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary statistics
  const statistics = useMemo(() => {
    const totalInvoices = invoices.length;
    const unpaid = invoices.filter(inv => inv.paymentStatus === 'not_paid').length;
    const partiallyPaid = invoices.filter(inv => inv.paymentStatus === 'partially_paid').length;
    const paid = invoices.filter(inv => inv.paymentStatus === 'paid').length;
    const overdue = invoices.filter(inv => inv.status === 'overdue').length;

    const totalOwedGold = invoices
      .filter(inv => inv.paymentStatus !== 'paid')
      .reduce((sum, inv) => sum + (inv.remainingPureGold || 0), 0);

    const totalPaidGold = invoices.reduce((sum, inv) => sum + (inv.paidPureGold || 0), 0);

    const goldPrice = 145.43; // TODO: Fetch from gold price service

    return {
      totalInvoices,
      unpaid,
      partiallyPaid,
      paid,
      overdue,
      totalOwedGold,
      totalOwedUSD: totalOwedGold * goldPrice,
      totalPaidGold,
      totalPaidUSD: totalPaidGold * goldPrice
    };
  }, [invoices]);

  // Aging analysis: 0-30 days, 31-60 days, 61+ days
  const agingAnalysis = useMemo(() => {
    const today = new Date();
    const aging = {
      '0-30': { count: 0, gold: 0 },
      '31-60': { count: 0, gold: 0 },
      '61+': { count: 0, gold: 0 }
    };

    invoices
      .filter(inv => inv.paymentStatus !== 'paid')
      .forEach(inv => {
        const daysOverdue = Math.floor((today - inv.dueDate) / (1000 * 60 * 60 * 24));
        const gold = inv.remainingPureGold || 0;

        if (daysOverdue >= 0 && daysOverdue <= 30) {
          aging['0-30'].count++;
          aging['0-30'].gold += gold;
        } else if (daysOverdue > 30 && daysOverdue <= 60) {
          aging['31-60'].count++;
          aging['31-60'].gold += gold;
        } else if (daysOverdue > 60) {
          aging['61+'].count++;
          aging['61+'].gold += gold;
        }
      });

    return aging;
  }, [invoices]);

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let filtered = invoices.filter(invoice => {
      const matchesSearch = !searchQuery ||
        invoice.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.orderId?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || invoice.paymentStatus === statusFilter || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'invoiceDate':
          aValue = a.invoiceDate;
          bValue = b.invoiceDate;
          break;
        case 'dueDate':
          aValue = a.dueDate;
          bValue = b.dueDate;
          break;
        case 'amount':
          aValue = a.totalPureGold || 0;
          bValue = b.totalPureGold || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoices, searchQuery, statusFilter, sortBy, sortOrder]);

  const getStatusBadge = (invoice) => {
    if (invoice.status === 'overdue') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </span>
      );
    }

    switch (invoice.paymentStatus) {
      case 'paid':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        );
      case 'partially_paid':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Partially Paid
          </span>
        );
      case 'not_paid':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Not Paid
          </span>
        );
      default:
        return null;
    }
  };

  const handleDownloadInvoice = async (invoice) => {
    try {
      // Fetch order data
      const orderRef = doc(db, `${basePath}/orders`, invoice.orderId);
      const orderSnap = await getDoc(orderRef);
      const orderData = orderSnap.exists() ? { id: orderSnap.id, ...orderSnap.data() } : null;

      // Fetch customer data
      const customerRef = doc(db, `${basePath}/customers`, invoice.customerId);
      const customerSnap = await getDoc(customerRef);
      const customerData = customerSnap.exists() ? customerSnap.data() : null;

      if (!orderData || !customerData) {
        alert('Order or customer data not found');
        return;
      }

      // Download invoice PDF
      await invoiceGenerator.downloadInvoice(
        invoice,
        orderData,
        customerData
      );
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Error downloading invoice. Please try again.');
    }
  };

  const handleRecordPayment = (invoice) => {
    // Navigate to orders page with payment dialog for this invoice
    router.push(`/admin/orders?invoiceId=${invoice.id}&action=recordPayment`);
  };

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Invoice Management
          </h1>
          <p className="text-gray-600 mt-1">Track and manage customer invoices (Pure Gold Based)</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Outstanding */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-red-900">Total Outstanding</h3>
              <TrendingUp className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-800">
              {statistics.totalOwedGold.toFixed(3)}g
            </p>
            <p className="text-xs text-red-700 mt-1">
              ${statistics.totalOwedUSD.toFixed(2)} USD ref
            </p>
          </div>

          {/* Total Paid */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-green-900">Total Paid</h3>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-800">
              {statistics.totalPaidGold.toFixed(3)}g
            </p>
            <p className="text-xs text-green-700 mt-1">
              ${statistics.totalPaidUSD.toFixed(2)} USD ref
            </p>
          </div>

          {/* Unpaid Count */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Unpaid Invoices</h3>
              <FileText className="w-5 h-5 text-gray-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{statistics.unpaid}</p>
            <p className="text-xs text-gray-700 mt-1">
              + {statistics.partiallyPaid} partially paid
            </p>
          </div>

          {/* Overdue Count */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-orange-900">Overdue</h3>
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-800">{statistics.overdue}</p>
            <p className="text-xs text-orange-700 mt-1">
              Requires immediate attention
            </p>
          </div>
        </div>

        {/* Aging Analysis */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Aging Analysis</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-900">0-30 Days</p>
              <p className="text-xl font-bold text-green-800">{agingAnalysis['0-30'].count}</p>
              <p className="text-xs text-green-700 mt-1">
                {agingAnalysis['0-30'].gold.toFixed(3)}g owed
              </p>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm font-medium text-yellow-900">31-60 Days</p>
              <p className="text-xl font-bold text-yellow-800">{agingAnalysis['31-60'].count}</p>
              <p className="text-xs text-yellow-700 mt-1">
                {agingAnalysis['31-60'].gold.toFixed(3)}g owed
              </p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm font-medium text-red-900">61+ Days</p>
              <p className="text-xl font-bold text-red-800">{agingAnalysis['61+'].count}</p>
              <p className="text-xs text-red-700 mt-1">
                {agingAnalysis['61+'].gold.toFixed(3)}g owed
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="not_paid">Not Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="invoiceDate">Sort by Invoice Date</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="amount">Sort by Amount</option>
              </select>
            </div>
            <div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total (Gold)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining (Gold)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      Loading invoices...
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.customerName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {invoice.invoiceDate.toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className={`${invoice.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-900'}`}>
                          {invoice.dueDate.toLocaleDateString()}
                        </div>
                        {invoice.status === 'overdue' && (
                          <span className="text-xs text-red-600">
                            {Math.floor((new Date() - invoice.dueDate) / (1000 * 60 * 60 * 24))} days overdue
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="font-semibold text-gray-900">
                          {invoice.totalPureGold?.toFixed(3) || '0.000'}g
                        </div>
                        <div className="text-xs text-gray-500">
                          ${((invoice.totalPureGold || 0) * 145.43).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className={`font-semibold ${invoice.remainingPureGold > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {invoice.remainingPureGold?.toFixed(3) || '0.000'}g
                        </div>
                        <div className="text-xs text-gray-500">
                          ${((invoice.remainingPureGold || 0) * 145.43).toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(invoice)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {invoice.paymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleRecordPayment(invoice)}
                              className="text-green-600 hover:text-green-900"
                              title="Record Payment"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
