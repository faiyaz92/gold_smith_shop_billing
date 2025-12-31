'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../AdminLayout';
import { db } from '@/app/firebase';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  where,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  getDocs,
  getDoc
} from 'firebase/firestore';
import {
  Receipt,
  CreditCard,
  Banknote,
  Plus,
  Search,
  Eye,
  Edit,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  IndianRupee,
  FileText,
  Phone
} from 'lucide-react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { AccountingEngine } from '@/utils/accountingEngine';
import { AutomatedTransactionEngine } from '@/app/utils/automatedTransactionEngine';

// Gold Smith Billing & Payment Management System
export default function GoldSmithBilling() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Core Data States
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'cash',
    reference: '',
    notes: ''
  });

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const ordersPath = `companies/${companyId}/orders`;
  const customersPath = `companies/${companyId}/customers`;
  const paymentsPath = `companies/${companyId}/payments`;
  const invoicesPath = `companies/${companyId}/invoices`;

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setIsLoading(true);

      // Fetch orders (delivered but not completed)
      const ordersQuery = query(
        collection(db, ordersPath),
        where('status', 'in', ['Delivered', 'Completed']),
        orderBy('updatedAt', 'desc')
      );
      const ordersUnsubscribe = onSnapshot(ordersQuery, (snapshot) => {
        const ordersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        setOrders(ordersData);
      });

      // Fetch customers
      const customersQuery = query(collection(db, customersPath));
      const customersUnsubscribe = onSnapshot(customersQuery, (snapshot) => {
        const customersData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCustomers(customersData);
      });

      // Fetch payments
      const paymentsQuery = query(collection(db, paymentsPath), orderBy('createdAt', 'desc'));
      const paymentsUnsubscribe = onSnapshot(paymentsQuery, (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));
        setPayments(paymentsData);
      });

      // Fetch invoices
      const invoicesQuery = query(collection(db, invoicesPath), orderBy('createdAt', 'desc'));
      const invoicesUnsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
        const invoicesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          dueDate: doc.data().dueDate?.toDate() || null
        }));
        setInvoices(invoicesData);
      });

      return () => {
        ordersUnsubscribe();
        customersUnsubscribe();
        paymentsUnsubscribe();
        invoicesUnsubscribe();
      };

    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate billing metrics
  const billingMetrics = useMemo(() => {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Pending billing (delivered but not billed)
    const pendingBilling = orders.filter(order =>
      order.status === 'Delivered' && !order.billingStatus
    );

    // Outstanding invoices
    const outstandingInvoices = invoices.filter(invoice =>
      invoice.status !== 'Paid' && invoice.dueDate
    );

    // Overdue invoices
    const overdueInvoices = outstandingInvoices.filter(invoice =>
      invoice.dueDate < today
    );

    // Today's payments
    const todayPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.createdAt);
      return paymentDate.toDateString() === today.toDateString();
    });

    // This month's revenue
    const monthlyRevenue = payments
      .filter(payment => payment.createdAt >= thisMonth)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    return {
      pendingBilling: pendingBilling.length,
      outstandingAmount: outstandingInvoices.reduce((sum, inv) => sum + (inv.remainingBalance || inv.total || 0), 0),
      overdueAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.remainingBalance || inv.total || 0), 0),
      todayPayments: todayPayments.length,
      todayPaymentAmount: todayPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0),
      monthlyRevenue
    };
  }, [orders, invoices, payments]);

  // Filter orders for billing
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = !searchTerm ||
        order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'pending' && order.status === 'Delivered' && !order.billingStatus) ||
        (statusFilter === 'billed' && order.billingStatus === 'Billed') ||
        (statusFilter === 'paid' && order.billingStatus === 'Paid');

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  const handleBillOrder = async (order, paymentType) => {
    try {
      if (paymentType === 'cash') {
        // Create bill/receipt for cash payment
        const billData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          total: order.total,
          paymentType: 'cash',
          paymentMethod: 'cash',
          status: 'Paid',
          createdAt: serverTimestamp(),
          items: order.items || [],
          billingType: 'bill'
        };

        await addDoc(collection(db, invoicesPath), billData);

        // Update order status
        await updateDoc(doc(db, ordersPath, order.id), {
          billingStatus: 'Paid',
          status: 'Completed',
          paymentMethod: 'cash',
          updatedAt: serverTimestamp()
        });

        // Generate PDF receipt
        generateBillPDF(billData, 'bill');

      } else if (paymentType === 'credit') {
        // Create invoice for credit payment
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 15); // 15 days credit

        const invoiceData = {
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerId: order.customerId,
          customerName: order.customerName,
          total: order.total,
          remainingBalance: order.total,
          dueDate: dueDate,
          status: 'Billed',
          createdAt: serverTimestamp(),
          items: order.items || [],
          billingType: 'invoice'
        };

        await addDoc(collection(db, invoicesPath), invoiceData);

        // Update order status
        await updateDoc(doc(db, ordersPath, order.id), {
          billingStatus: 'Billed',
          status: 'Delivered',
          paymentMethod: 'credit',
          updatedAt: serverTimestamp()
        });

        // Generate PDF invoice
        generateBillPDF(invoiceData, 'invoice');
      }

      alert(`Order ${paymentType === 'cash' ? 'billed and completed' : 'invoiced'} successfully!`);

    } catch (error) {
      console.error('Error billing order:', error);
      alert('Error processing billing. Please try again.');
    }
  };

  // Calculate and record commission for completed order
  const calculateAndRecordCommission = async (orderId) => {
    try {
      // Get order details
      const orderDoc = await getDoc(doc(db, ordersPath, orderId));
      if (!orderDoc.exists()) return;

      const order = orderDoc.data();

      // Calculate commission: Customer Price - Manufacturing Cost
      const customerPrice = order.total || 0;
      const manufacturingCost = order.metalCost + (order.makingChargeTotal || 0);
      const commissionAmount = customerPrice - manufacturingCost;

      if (commissionAmount <= 0) {
        console.log('No commission to record for order:', orderId);
        return;
      }

      // Initialize accounting engines
      const accountingEngine = new AccountingEngine(companyId);
      const transactionEngine = new AutomatedTransactionEngine(companyId);

      // Record commission recognition (income)
      const commissionEntry = transactionEngine.createCommissionRecognitionEntry({
        orderId,
        commissionAmount,
        date: new Date()
      });

      // Record the transaction
      await accountingEngine.recordTransaction({
        description: commissionEntry.description,
        debitAccountId: commissionEntry.lines[0].accountId, // Commission Income
        creditAccountId: commissionEntry.lines[1].accountId, // Current Year Profit/Loss
        amount: commissionAmount,
        referenceType: 'commission_recognition',
        referenceId: orderId
      });

      // Update order with commission details
      await updateDoc(doc(db, ordersPath, orderId), {
        commissionAmount,
        commissionRecorded: true,
        commissionRecordedAt: serverTimestamp()
      });

      console.log(`Commission recorded: ₹${commissionAmount} for order ${orderId}`);

    } catch (error) {
      console.error('Error calculating commission:', error);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedOrder || !paymentData.amount) return;

    try {
      const paymentAmount = parseFloat(paymentData.amount);

      // Create payment record
      const paymentRecord = {
        orderId: selectedOrder.id,
        invoiceId: selectedOrder.invoiceId,
        customerId: selectedOrder.customerId,
        customerName: selectedOrder.customerName,
        amount: paymentAmount,
        method: paymentData.method,
        reference: paymentData.reference,
        notes: paymentData.notes,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, paymentsPath), paymentRecord);

      // Update invoice balance
      if (selectedOrder.invoiceId) {
        const invoiceRef = doc(db, invoicesPath, selectedOrder.invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);

        if (invoiceSnap.exists()) {
          const invoice = invoiceSnap.data();
          const newBalance = (invoice.remainingBalance || invoice.total) - paymentAmount;

          await updateDoc(invoiceRef, {
            remainingBalance: Math.max(0, newBalance),
            status: newBalance <= 0 ? 'Paid' : 'Partially Paid',
            updatedAt: serverTimestamp()
          });

          // Update order status if fully paid
          if (newBalance <= 0) {
            await updateDoc(doc(db, ordersPath, selectedOrder.id), {
              billingStatus: 'Paid',
              status: 'Completed',
              updatedAt: serverTimestamp()
            });

            // Calculate and record commission if not already done
            if (!selectedOrder.commissionRecorded) {
              await calculateAndRecordCommission(selectedOrder.id);
            }
          }
        }
      }

      // Generate payment receipt
      generatePaymentReceipt(paymentRecord);

      setShowPaymentModal(false);
      setSelectedOrder(null);
      setPaymentData({ amount: '', method: 'cash', reference: '', notes: '' });

      alert('Payment recorded successfully!');

    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  const generateBillPDF = (data, type) => {
    const pdf = new jsPDF();

    // Header
    pdf.setFontSize(20);
    pdf.text('GOLD SMITH WHOLESALER', 105, 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.text(`${type.toUpperCase()}: ${data.orderNumber}`, 105, 35, { align: 'center' });
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

    // Customer details
    pdf.text(`Customer: ${data.customerName}`, 20, 60);
    pdf.text(`Order #: ${data.orderNumber}`, 20, 70);

    // Items table
    const tableData = data.items.map(item => [
      item.categoryName || 'Gold Jewelry',
      `${item.weight}g ${item.karat}k`,
      `₹${item.metalRatePerGram}/g`,
      `₹${item.makingChargePerGram}/g`,
      `₹${item.subtotal}`
    ]);

    pdf.autoTable({
      startY: 80,
      head: [['Item', 'Details', 'Metal Rate', 'Making', 'Amount']],
      body: tableData,
      theme: 'grid'
    });

    // Total
    const finalY = pdf.lastAutoTable.finalY + 10;
    pdf.text(`Total: ₹${data.total}`, 150, finalY);

    if (type === 'invoice') {
      pdf.text(`Due Date: ${data.dueDate.toLocaleDateString()}`, 20, finalY + 10);
      pdf.text('Payment Terms: 15 days', 20, finalY + 20);
    } else {
      pdf.text('Payment Status: PAID', 20, finalY + 10);
    }

    pdf.save(`${type}_${data.orderNumber}.pdf`);
  };

  const generatePaymentReceipt = (payment) => {
    const pdf = new jsPDF();

    pdf.setFontSize(20);
    pdf.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });

    pdf.setFontSize(12);
    pdf.text(`Receipt #: ${payment.id.slice(-8)}`, 105, 35, { align: 'center' });
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, 45);

    pdf.text(`Customer: ${payment.customerName}`, 20, 60);
    pdf.text(`Order #: ${payment.orderId}`, 20, 70);
    pdf.text(`Amount: ₹${payment.amount}`, 20, 80);
    pdf.text(`Method: ${payment.method}`, 20, 90);

    if (payment.reference) {
      pdf.text(`Reference: ${payment.reference}`, 20, 100);
    }

    pdf.save(`receipt_${payment.id.slice(-8)}.pdf`);
  };

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-800">Billing & Payments</h1>
          <p className="text-gray-600 mt-2">Manage invoices, payments, and billing for gold smith orders</p>
        </div>

        {/* Billing Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Billing</p>
                <p className="text-2xl font-bold text-gray-900">{billingMetrics.pendingBilling}</p>
                <p className="text-sm text-gray-500">Orders to bill</p>
              </div>
              <Receipt className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-red-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">₹{billingMetrics.outstandingAmount.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Unpaid invoices</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-green-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today&apos;s Payments</p>
                <p className="text-2xl font-bold text-gray-900">{billingMetrics.todayPayments}</p>
                <p className="text-sm text-gray-500">₹{billingMetrics.todayPaymentAmount.toLocaleString()}</p>
              </div>
              <IndianRupee className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{billingMetrics.monthlyRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: Eye },
                { id: 'pending', label: 'Pending Billing', icon: Clock },
                { id: 'invoices', label: 'Invoices', icon: FileText },
                { id: 'payments', label: 'Payments', icon: DollarSign }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 inline mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('pending')}
                  className="flex flex-col items-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <Receipt className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-orange-600">Bill Orders</span>
                </button>

                <button
                  onClick={() => setActiveTab('invoices')}
                  className="flex flex-col items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FileText className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-blue-600">View Invoices</span>
                </button>

                <button
                  onClick={() => setActiveTab('payments')}
                  className="flex flex-col items-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-green-600">Record Payment</span>
                </button>

                <button
                  onClick={() => router.push('/admin/customers')}
                  className="flex flex-col items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <Phone className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-purple-600">Customer Balances</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Recent Billing Activity</h3>
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Payment from {payment.customerName}
                        </p>
                        <p className="text-xs text-gray-500">
                          ₹{payment.amount} • {payment.method}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {payment.createdAt.toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {payments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No recent payments</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Orders Ready for Billing</h3>
              <div className="flex space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Billing</option>
                  <option value="billed">Billed</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{order.orderNumber}</h4>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {order.weight}g {order.karat} • ₹{order.total?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'Delivered' && !order.billingStatus
                          ? 'bg-orange-100 text-orange-800'
                          : order.billingStatus === 'Billed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {order.status === 'Delivered' && !order.billingStatus
                          ? 'Ready to Bill'
                          : order.billingStatus || 'Completed'}
                      </span>
                    </div>
                  </div>

                  {order.status === 'Delivered' && !order.billingStatus && (
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleBillOrder(order, 'cash')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Banknote className="w-4 h-4 mr-2" />
                        Cash Payment
                      </button>
                      <button
                        onClick={() => handleBillOrder(order, 'credit')}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Credit Invoice
                      </button>
                    </div>
                  )}

                  {order.billingStatus === 'Billed' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowPaymentModal(true);
                      }}
                      className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      Record Payment
                    </button>
                  )}
                </div>
              ))}

              {filteredOrders.length === 0 && (
                <p className="text-gray-500 text-center py-8">No orders found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-6">Invoice Management</h3>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Invoice #{invoice.id.slice(-8)}
                      </h4>
                      <p className="text-sm text-gray-600">{invoice.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{invoice.total?.toLocaleString()}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        invoice.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'Partially Paid'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>

                  {invoice.remainingBalance > 0 && (
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Remaining: ₹{invoice.remainingBalance?.toLocaleString()}</span>
                      <span>Due: {invoice.dueDate?.toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}

              {invoices.length === 0 && (
                <p className="text-gray-500 text-center py-8">No invoices found</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-6">Payment History</h3>
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Payment from {payment.customerName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        ₹{payment.amount} • {payment.method}
                      </p>
                      {payment.reference && (
                        <p className="text-xs text-gray-500">Ref: {payment.reference}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {payment.createdAt.toLocaleDateString()}
                      </p>
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Completed
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {payments.length === 0 && (
                <p className="text-gray-500 text-center py-8">No payments found</p>
              )}
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Recording payment for {selectedOrder.customerName} - {selectedOrder.orderNumber}
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter payment amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentData.method}
                    onChange={(e) => setPaymentData({...paymentData, method: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="upi">UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reference Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={paymentData.reference}
                    onChange={(e) => setPaymentData({...paymentData, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Cheque number, UTR, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}