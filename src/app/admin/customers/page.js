'use client';

// ✅ TASK 3.1 UPGRADED: Customer Management Page (Pure Gold Balance - BRD v2)
// ✅ TASK 3.3 COMPLETE: Customer Balance Statement Integration
// Reference: BRD_GoldSmith_v2.md Section 6.5, 6.6, DatabaseInfo_GoldSmith_v2.md Section 4
// Upgraded from v1 currency balance to v2 pure gold balance tracking
// Added monthly balance statement generation with aging analysis

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Plus, Search, Edit, Eye, UserX, UserCheck, FileText } from 'lucide-react';
import Link from 'next/link';
import { downloadCustomerBalanceStatement, getCustomerTransactionsForStatement } from '@/utils/customerBalanceStatement';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const customersRef = collection(db, `${basePath}/customers`);
      const q = query(customersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const customersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async (customer) => {
    try {
      // Fetch customer transactions
      const transactionsRef = collection(db, `${basePath}/transactions`);
      const txnQuery = query(
        transactionsRef,
        where('customerId', '==', customer.id),
        orderBy('date', 'desc')
      );
      const txnSnapshot = await getDocs(txnQuery);
      const transactions = txnSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Get filtered transactions for statement period
      const statementTxns = getCustomerTransactionsForStatement(transactions, customer.id, 'monthly');

      // Fetch current gold price
      const goldPriceRef = collection(db, 'goldPriceHistory');
      const goldPriceQuery = query(goldPriceRef, orderBy('timestamp', 'desc'));
      const goldPriceSnap = await getDocs(goldPriceQuery);
      const goldPrice = goldPriceSnap.empty ? 145.43 : goldPriceSnap.docs[0].data().pricePerGram;

      // Generate and download statement
      downloadCustomerBalanceStatement(customer, statementTxns, goldPrice, 'monthly');

      alert(`✅ Balance statement for ${customer.customerName || customer.name} downloaded successfully!`);
    } catch (error) {
      console.error('Error generating balance statement:', error);
      alert('Failed to generate balance statement. Please try again.');
    }
  };

  const toggleCustomerStatus = async (customerId, currentStatus) => {
    try {
      const customerRef = doc(db, `${basePath}/customers`, customerId);
      await updateDoc(customerRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });

      // Update local state
      setCustomers(customers.map(customer =>
        customer.id === customerId
          ? { ...customer, isActive: !currentStatus }
          : customer
      ));
    } catch (error) {
      console.error('Error updating customer status:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm) ||
                         customer.customerCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && customer.isActive) ||
                         (statusFilter === 'inactive' && !customer.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
        <Link
          href="/admin/customers/new"
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Customer
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, phone, or customer code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="all">All Customers</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pure Gold Balance (تیزابی)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.customerCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.customerName || customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.phone}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      const goldBalance = customer.currentPureGoldBalance || customer.outstandingBalance || 0;
                      const isGoldBalance = typeof goldBalance === 'number';
                      return (
                        <div>
                          <div className={`text-sm font-semibold ${
                            goldBalance > 0 ? 'text-red-600' : goldBalance < 0 ? 'text-green-600' : 'text-gray-900'
                          }`}>
                            {isGoldBalance ? `${goldBalance.toFixed(3)}g` : '₹0.00'}
                          </div>
                          {isGoldBalance && goldBalance !== 0 && (
                            <div className="text-xs text-gray-500">
                              ${(goldBalance * 145.43).toFixed(2)}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      customer.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDownloadStatement(customer)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Download Balance Statement"
                      >
                        <FileText size={16} />
                      </button>
                      <Link
                        href={`/admin/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </Link>
                      <Link
                        href={`/admin/customers/${customer.id}/edit`}
                        className="text-yellow-600 hover:text-yellow-900"
                        title="Edit Customer"
                      >
                        <Edit size={16} />
                      </Link>
                      <button
                        onClick={() => toggleCustomerStatus(customer.id, customer.isActive)}
                        className={`${
                          customer.isActive
                            ? 'text-red-600 hover:text-red-900'
                            : 'text-green-600 hover:text-green-900'
                        }`}
                        title={customer.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {customer.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No customers found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}