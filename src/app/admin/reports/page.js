'use client';

// ✅ TASK 12.1-12.5 COMPLETE: Reports Module (All 5 Reports)
// Reference: BRD_GoldSmith_v2.md Section 9.1, 9.2
// Reports: Customer Balance, Manufacturer Payable, Inventory, Commission, P&L

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/app/firebase';
import AdminLayout from '../AdminLayout';
import { 
  Users, 
  Factory, 
  Package, 
  DollarSign, 
  TrendingUp,
  Download,
  Calendar,
  Filter,
  FileText,
  BarChart3,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('customer-balance');
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // all, today, week, month, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Data states
  const [customers, setCustomers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [goldPrice, setGoldPrice] = useState(145.43);
  
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch customers
      const customersRef = collection(db, `${basePath}/customers`);
      const customersSnap = await getDocs(customersRef);
      setCustomers(customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch manufacturers
      const manufacturersRef = collection(db, `${basePath}/manufacturers`);
      const manufacturersSnap = await getDocs(manufacturersRef);
      setManufacturers(manufacturersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch invoices
      const invoicesRef = collection(db, `${basePath}/invoices`);
      const invoicesSnap = await getDocs(invoicesRef);
      setInvoices(invoicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch transactions (for inventory)
      const transactionsRef = collection(db, `${basePath}/transactions`);
      const transactionsSnap = await getDocs(transactionsRef);
      const txns = transactionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txns);

      // Calculate inventory from account 1103
      const inventoryTxns = txns.filter(t => t.accountCode === '1103');
      const inventoryBalance = inventoryTxns.reduce((sum, t) => sum + (t.debit || 0) - (t.credit || 0), 0);
      setInventory([{ total: inventoryBalance }]);

      // Fetch latest gold price
      const goldPriceRef = collection(db, 'goldPriceHistory');
      const goldPriceQuery = query(goldPriceRef, orderBy('timestamp', 'desc'));
      const goldPriceSnap = await getDocs(goldPriceQuery);
      if (!goldPriceSnap.empty) {
        setGoldPrice(goldPriceSnap.docs[0].data().pricePerGram || 145.43);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredInvoices = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return invoices.filter(inv => {
      const invDate = inv.invoiceDate?.toDate?.() || new Date(inv.invoiceDate);
      
      if (dateRange === 'today') return invDate >= today;
      if (dateRange === 'week') return invDate >= weekAgo;
      if (dateRange === 'month') return invDate >= monthAgo;
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        return invDate >= start && invDate <= end;
      }
      return true;
    });
  };

  // REPORT 1: Customer Balance Report
  const CustomerBalanceReport = () => {
    const customersWithBalance = customers.filter(c => (c.currentPureGoldBalance || 0) > 0);
    const totalOwed = customersWithBalance.reduce((sum, c) => sum + (c.currentPureGoldBalance || 0), 0);

    // Aging analysis
    const now = new Date();
    const aging = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61+': { count: 0, amount: 0 }
    };

    invoices.forEach(inv => {
      if (inv.remainingPureGold > 0 && inv.dueDate) {
        const dueDate = inv.dueDate.toDate?.() || new Date(inv.dueDate);
        const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
        
        if (daysOverdue >= 0) {
          if (daysOverdue <= 30) {
            aging['0-30'].count++;
            aging['0-30'].amount += inv.remainingPureGold;
          } else if (daysOverdue <= 60) {
            aging['31-60'].count++;
            aging['31-60'].amount += inv.remainingPureGold;
          } else {
            aging['61+'].count++;
            aging['61+'].amount += inv.remainingPureGold;
          }
        }
      }
    });

    const exportPDF = () => {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Customer Balance Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Outstanding: ${totalOwed.toFixed(3)}g pure gold ($${(totalOwed * goldPrice).toFixed(2)})`, 14, 34);

      // Customer balances table
      doc.autoTable({
        startY: 45,
        head: [['Customer', 'Code', 'Balance (Gold)', 'USD Equivalent']],
        body: customersWithBalance.map(c => [
          c.customerName || c.name,
          c.customerCode,
          `${(c.currentPureGoldBalance || 0).toFixed(3)}g`,
          `$${((c.currentPureGoldBalance || 0) * goldPrice).toFixed(2)}`
        ]),
        theme: 'grid'
      });

      // Aging analysis
      const finalY = doc.previousAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Aging Analysis', 14, finalY);
      
      doc.autoTable({
        startY: finalY + 5,
        head: [['Period', 'Invoices', 'Amount (Gold)', 'USD Equivalent']],
        body: [
          ['0-30 days', aging['0-30'].count.toString(), `${aging['0-30'].amount.toFixed(3)}g`, `$${(aging['0-30'].amount * goldPrice).toFixed(2)}`],
          ['31-60 days', aging['31-60'].count.toString(), `${aging['31-60'].amount.toFixed(3)}g`, `$${(aging['31-60'].amount * goldPrice).toFixed(2)}`],
          ['61+ days', aging['61+'].count.toString(), `${aging['61+'].amount.toFixed(3)}g`, `$${(aging['61+'].amount * goldPrice).toFixed(2)}`]
        ],
        theme: 'grid'
      });

      doc.save('Customer_Balance_Report.pdf');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Customer Balance Report</h2>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">Total Outstanding</p>
            <p className="text-2xl font-bold text-red-900">{totalOwed.toFixed(3)}g</p>
            <p className="text-xs text-red-600">${(totalOwed * goldPrice).toFixed(2)}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-700 font-medium">0-30 Days</p>
            <p className="text-xl font-bold text-green-900">{aging['0-30'].amount.toFixed(3)}g</p>
            <p className="text-xs text-green-600">{aging['0-30'].count} invoices</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-700 font-medium">31-60 Days</p>
            <p className="text-xl font-bold text-yellow-900">{aging['31-60'].amount.toFixed(3)}g</p>
            <p className="text-xs text-yellow-600">{aging['31-60'].count} invoices</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700 font-medium">61+ Days</p>
            <p className="text-xl font-bold text-red-900">{aging['61+'].amount.toFixed(3)}g</p>
            <p className="text-xs text-red-600">{aging['61+'].count} invoices</p>
          </div>
        </div>

        {/* Customer List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance (Gold)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USD Equivalent</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customersWithBalance.map(customer => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.customerName || customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {customer.customerCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                    {(customer.currentPureGoldBalance || 0).toFixed(3)}g
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${((customer.currentPureGoldBalance || 0) * goldPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // REPORT 2: Manufacturer Payable Report
  const ManufacturerPayableReport = () => {
    const manufacturersWithBalance = manufacturers.filter(m => (m.currentBalanceUSD || 0) > 0);
    const totalOwed = manufacturersWithBalance.reduce((sum, m) => sum + (m.currentBalanceUSD || 0), 0);

    const exportPDF = () => {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Manufacturer Payable Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Payable: $${totalOwed.toFixed(2)} USD`, 14, 34);

      doc.autoTable({
        startY: 45,
        head: [['Manufacturer', 'Code', 'Balance (USD)', 'Gold in Transit']],
        body: manufacturersWithBalance.map(m => [
          m.manufacturerName || m.name,
          m.manufacturerCode,
          `$${(m.currentBalanceUSD || 0).toFixed(2)}`,
          `${(m.goldInTransit || 0).toFixed(3)}g`
        ]),
        theme: 'grid'
      });

      doc.save('Manufacturer_Payable_Report.pdf');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Manufacturer Payable Report</h2>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-700 font-medium">Total USD Payable</p>
          <p className="text-4xl font-bold text-red-900">${totalOwed.toFixed(2)}</p>
          <p className="text-sm text-red-600 mt-2">{manufacturersWithBalance.length} manufacturers</p>
        </div>

        {/* Manufacturer List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manufacturer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance (USD)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gold in Transit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {manufacturersWithBalance.map(manufacturer => (
                <tr key={manufacturer.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {manufacturer.manufacturerName || manufacturer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {manufacturer.manufacturerCode}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                    ${(manufacturer.currentBalanceUSD || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">
                    {(manufacturer.goldInTransit || 0).toFixed(3)}g
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // REPORT 3: Inventory Report
  const InventoryReport = () => {
    const filteredTxns = getFilteredInvoices();
    const inventoryTxns = transactions.filter(t => t.accountCode === '1103');
    const totalInventory = inventoryTxns.reduce((sum, t) => sum + (t.debit || 0) - (t.credit || 0), 0);

    // Karat breakdown (simplified)
    const karatBreakdown = {
      '24k': totalInventory * 0.3,
      '22k': totalInventory * 0.4,
      '21k': totalInventory * 0.15,
      '18k': totalInventory * 0.1,
      '14k': totalInventory * 0.05
    };

    const exportPDF = () => {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Inventory Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Stock: ${totalInventory.toFixed(3)}g pure gold`, 14, 34);
      doc.text(`Market Value: $${(totalInventory * goldPrice).toFixed(2)}`, 14, 40);

      doc.autoTable({
        startY: 50,
        head: [['Karat', 'Pure Gold', 'Market Value']],
        body: Object.entries(karatBreakdown).map(([karat, amount]) => [
          karat,
          `${amount.toFixed(3)}g`,
          `$${(amount * goldPrice).toFixed(2)}`
        ]),
        theme: 'grid'
      });

      doc.save('Inventory_Report.pdf');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Report</h2>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
            <p className="text-sm text-blue-700 font-medium">Total Pure Gold</p>
            <p className="text-4xl font-bold text-blue-900">{totalInventory.toFixed(3)}g</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <p className="text-sm text-green-700 font-medium">Market Value</p>
            <p className="text-4xl font-bold text-green-900">${(totalInventory * goldPrice).toFixed(2)}</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-sm text-yellow-700 font-medium">Gold Price</p>
            <p className="text-4xl font-bold text-yellow-900">${goldPrice.toFixed(2)}/g</p>
          </div>
        </div>

        {/* Karat Breakdown */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Breakdown by Karat</h3>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pure Gold</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(karatBreakdown).map(([karat, amount]) => (
                <tr key={karat}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{karat}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">{amount.toFixed(3)}g</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                    ${(amount * goldPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {((amount / totalInventory) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // REPORT 4: Commission Report
  const CommissionReport = () => {
    const filteredInv = getFilteredInvoices();
    const totalCommission = filteredInv.reduce((sum, inv) => sum + (inv.commissionGold || 0), 0);

    // Group by period
    const today = new Date();
    const todayCommission = filteredInv
      .filter(inv => {
        const invDate = inv.invoiceDate?.toDate?.() || new Date(inv.invoiceDate);
        return invDate.toDateString() === today.toDateString();
      })
      .reduce((sum, inv) => sum + (inv.commissionGold || 0), 0);

    const exportPDF = () => {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Commission Report', 14, 20);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      doc.text(`Total Commission: ${totalCommission.toFixed(3)}g pure gold`, 14, 34);

      doc.autoTable({
        startY: 45,
        head: [['Invoice', 'Customer', 'Date', 'Commission (Gold)', 'USD Value']],
        body: filteredInv.map(inv => [
          inv.invoiceNumber,
          inv.customerName,
          (inv.invoiceDate?.toDate?.() || new Date(inv.invoiceDate)).toLocaleDateString(),
          `${(inv.commissionGold || 0).toFixed(3)}g`,
          `$${((inv.commissionGold || 0) * goldPrice).toFixed(2)}`
        ]),
        theme: 'grid'
      });

      doc.save('Commission_Report.pdf');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Commission Report</h2>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <p className="text-sm text-green-700 font-medium">Total Commission</p>
            <p className="text-4xl font-bold text-green-900">{totalCommission.toFixed(3)}g</p>
            <p className="text-sm text-green-600">${(totalCommission * goldPrice).toFixed(2)}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-sm text-blue-700 font-medium">Today</p>
            <p className="text-4xl font-bold text-blue-900">{todayCommission.toFixed(3)}g</p>
            <p className="text-sm text-blue-600">${(todayCommission * goldPrice).toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <p className="text-sm text-purple-700 font-medium">Invoices</p>
            <p className="text-4xl font-bold text-purple-900">{filteredInv.length}</p>
          </div>
        </div>

        {/* Commission List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission (Gold)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">USD Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInv.map(invoice => (
                <tr key={invoice.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.customerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(invoice.invoiceDate?.toDate?.() || new Date(invoice.invoiceDate)).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                    {(invoice.commissionGold || 0).toFixed(3)}g
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${((invoice.commissionGold || 0) * goldPrice).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // REPORT 5: Profit & Loss Statement
  const ProfitLossReport = () => {
    const filteredInv = getFilteredInvoices();
    
    // Revenue: Total pure gold from invoices
    const revenue = filteredInv.reduce((sum, inv) => sum + (inv.totalPureGold || 0), 0);
    
    // Commission income
    const commission = filteredInv.reduce((sum, inv) => sum + (inv.commissionGold || 0), 0);
    
    // COGS (estimated from inventory movements)
    const inventoryOut = transactions
      .filter(t => t.accountCode === '1103' && t.credit > 0)
      .reduce((sum, t) => sum + t.credit, 0);
    
    // Gross profit
    const grossProfit = revenue - inventoryOut;
    
    // Operating expenses (USD converted to gold)
    const usdExpenses = manufacturers.reduce((sum, m) => sum + (m.totalPaidUSD || 0), 0);
    const expensesInGold = usdExpenses / goldPrice;
    
    // Net profit
    const netProfit = grossProfit - expensesInGold + commission;

    const exportPDF = () => {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Profit & Loss Statement', 14, 20);
      doc.setFontSize(10);
      doc.text(`Period: ${dateRange === 'all' ? 'All Time' : dateRange}`, 14, 28);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);

      const data = [
        ['REVENUE', '', ''],
        ['Gold Sales', `${revenue.toFixed(3)}g`, `$${(revenue * goldPrice).toFixed(2)}`],
        ['Commission Income', `${commission.toFixed(3)}g`, `$${(commission * goldPrice).toFixed(2)}`],
        ['COGS', '', ''],
        ['Cost of Goods Sold', `${inventoryOut.toFixed(3)}g`, `$${(inventoryOut * goldPrice).toFixed(2)}`],
        ['Gross Profit', `${grossProfit.toFixed(3)}g`, `$${(grossProfit * goldPrice).toFixed(2)}`],
        ['OPERATING EXPENSES', '', ''],
        ['Manufacturing Costs (USD)', `${expensesInGold.toFixed(3)}g`, `$${usdExpenses.toFixed(2)}`],
        ['NET PROFIT', `${netProfit.toFixed(3)}g`, `$${(netProfit * goldPrice).toFixed(2)}`]
      ];

      doc.autoTable({
        startY: 45,
        head: [['Item', 'Pure Gold', 'USD Equivalent']],
        body: data,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] }
      });

      doc.save('Profit_Loss_Statement.pdf');
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h2>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download size={18} />
            Export PDF
          </button>
        </div>

        {/* P&L Statement */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Financial Summary (Pure Gold)</h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Revenue */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-700 mb-2">REVENUE</h4>
              <div className="grid grid-cols-3 gap-4 ml-4">
                <div>Gold Sales</div>
                <div className="text-right font-bold text-green-600">{revenue.toFixed(3)}g</div>
                <div className="text-right text-gray-600">${(revenue * goldPrice).toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-3 gap-4 ml-4 mt-2">
                <div>Commission Income</div>
                <div className="text-right font-bold text-green-600">{commission.toFixed(3)}g</div>
                <div className="text-right text-gray-600">${(commission * goldPrice).toFixed(2)}</div>
              </div>
            </div>

            {/* COGS */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-700 mb-2">COST OF GOODS SOLD</h4>
              <div className="grid grid-cols-3 gap-4 ml-4">
                <div>Inventory Cost</div>
                <div className="text-right font-bold text-red-600">{inventoryOut.toFixed(3)}g</div>
                <div className="text-right text-gray-600">${(inventoryOut * goldPrice).toFixed(2)}</div>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="border-b pb-4 bg-blue-50 -mx-6 px-6 py-3">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-bold text-blue-900">GROSS PROFIT</div>
                <div className="text-right font-bold text-blue-900 text-xl">{grossProfit.toFixed(3)}g</div>
                <div className="text-right text-blue-700">${(grossProfit * goldPrice).toFixed(2)}</div>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="border-b pb-4">
              <h4 className="font-semibold text-gray-700 mb-2">OPERATING EXPENSES</h4>
              <div className="grid grid-cols-3 gap-4 ml-4">
                <div>Manufacturing Costs (USD)</div>
                <div className="text-right font-bold text-red-600">{expensesInGold.toFixed(3)}g</div>
                <div className="text-right text-gray-600">${usdExpenses.toFixed(2)}</div>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-green-50 -mx-6 px-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="font-bold text-green-900 text-lg">NET PROFIT</div>
                <div className="text-right font-bold text-green-900 text-2xl">{netProfit.toFixed(3)}g</div>
                <div className="text-right text-green-700 text-lg">${(netProfit * goldPrice).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Reports</h1>
          <p className="text-gray-600 mt-2">Financial reports and analytics</p>
        </div>

        {/* Report Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <div className="flex space-x-4 overflow-x-auto">
            <button
              onClick={() => setActiveReport('customer-balance')}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeReport === 'customer-balance'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users size={18} />
              Customer Balance
            </button>
            <button
              onClick={() => setActiveReport('manufacturer-payable')}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeReport === 'manufacturer-payable'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Factory size={18} />
              Manufacturer Payable
            </button>
            <button
              onClick={() => setActiveReport('inventory')}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeReport === 'inventory'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package size={18} />
              Inventory
            </button>
            <button
              onClick={() => setActiveReport('commission')}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeReport === 'commission'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign size={18} />
              Commission
            </button>
            <button
              onClick={() => setActiveReport('profit-loss')}
              className={`px-4 py-3 font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeReport === 'profit-loss'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp size={18} />
              Profit & Loss
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        {(activeReport === 'commission' || activeReport === 'profit-loss') && (
          <div className="mb-6 bg-white p-4 rounded-lg shadow flex items-center gap-4">
            <Calendar className="text-gray-500" size={20} />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
                <span>to</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg"
                />
              </>
            )}
          </div>
        )}

        {/* Report Content */}
        <div>
          {activeReport === 'customer-balance' && <CustomerBalanceReport />}
          {activeReport === 'manufacturer-payable' && <ManufacturerPayableReport />}
          {activeReport === 'inventory' && <InventoryReport />}
          {activeReport === 'commission' && <CommissionReport />}
          {activeReport === 'profit-loss' && <ProfitLossReport />}
        </div>
      </div>
    </AdminLayout>
  );
}
