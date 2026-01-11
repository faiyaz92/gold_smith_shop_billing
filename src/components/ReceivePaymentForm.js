"use client";
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, limit } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';
import { X, Calculator, DollarSign, CreditCard } from 'lucide-react';
import GoldPricePopup from './GoldPricePopup';

export default function ReceivePaymentForm({ isOpen, onClose, companyId, userRole }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showGoldPricePopup, setShowGoldPricePopup] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerId: '',
    paymentAmount: '',
    paymentMethod: 'gold', // Always gold payment
    description: '',
    goldPriceData: null,
    isOrderPayment: false,
    orderId: '',
    orderData: null
  });

  const [errors, setErrors] = useState({});

  // Load customers with account balances
  useEffect(() => {
    if (!isOpen || !companyId) return;

    const loadCustomersWithBalances = async () => {
      try {
        const customersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/customers`;
        const customersQuery = query(collection(db, customersPath), orderBy('customerName'));
        
        const customersUnsubscribe = onSnapshot(customersQuery, async (snapshot) => {
          const customersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Fetch account balances for each customer
          const accountManager = new HierarchicalAccountManager(companyId);
          const customersWithBalances = await Promise.all(
            customersData.map(async (customer) => {
              try {
                let balance = 0;
                let customerAccount = null;

                // Method 1: Use accountCode from customer document if available
                if (customer.accountCode) {
                  const account = await accountManager.getAccountByCode(customer.accountCode);
                  customerAccount = account;
                  balance = account ? (account.currentBalanceGold || account.currentBalance || 0) : 0;
                } else {
                  // Method 2: Try to find account by customerId
                  const allAccounts = await accountManager.getAllAccounts();
                  customerAccount = allAccounts.find(account =>
                    account.customerId === customer.id && account.accountCode?.startsWith('CUST-')
                  );
                  balance = customerAccount ?
                    (customerAccount.currentBalanceGold || customerAccount.currentBalance || 0) : 0;
                }

                return {
                  ...customer,
                  accountBalance: balance,
                  accountCode: customerAccount?.accountCode
                };
              } catch (error) {
                console.error(`Error fetching balance for customer ${customer.id}:`, error);
                return {
                  ...customer,
                  accountBalance: 0,
                  accountCode: null
                };
              }
            })
          );

          setCustomers(customersWithBalances);
        });

        return () => {
          customersUnsubscribe();
        };
      } catch (error) {
        console.error('Error setting up customers listener:', error);
      }
    };

    loadCustomersWithBalances();
  }, [isOpen, companyId]);

  // Load order details when order ID changes
  const loadOrderDetails = async (orderId) => {
    if (!orderId || !companyId) {
      setFormData(prev => ({ ...prev, orderData: null }));
      return;
    }

    setOrderLoading(true);
    try {
      const ordersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`;
      const orderRef = doc(db, ordersPath, orderId);
      const orderSnap = await getDoc(orderRef);

      if (orderSnap.exists()) {
        const orderData = { id: orderSnap.id, ...orderSnap.data() };
        setFormData(prev => ({
          ...prev,
          orderData,
          customerId: orderData.customerId || '',
          description: `Payment for Order ${orderData.orderNumber || orderId}`
        }));
      } else {
        setFormData(prev => ({ ...prev, orderData: null }));
        alert('Order not found. Please check the Order ID.');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      alert('Error loading order details.');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleOrderIdChange = (orderId) => {
    setFormData(prev => ({ ...prev, orderId }));
    if (orderId.length >= 6) { // Assuming order IDs are at least 6 characters
      loadOrderDetails(orderId);
    } else {
      setFormData(prev => ({ ...prev, orderData: null }));
    }
  };

  const handleGoldPriceConfirm = (priceData) => {
    setFormData(prev => ({
      ...prev,
      goldPriceData: priceData,
      paymentAmount: priceData.usdAmount.toString()
    }));
    setShowGoldPricePopup(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.isOrderPayment) {
      if (!formData.orderId) {
        newErrors.orderId = 'Please enter Order ID';
      }
      if (!formData.orderData) {
        newErrors.orderId = 'Please enter a valid Order ID';
      }
    } else {
      if (!formData.customerId) {
        newErrors.customerId = 'Please select a customer';
      }
    }

    if (!formData.paymentAmount || parseFloat(formData.paymentAmount) <= 0) {
      newErrors.paymentAmount = 'Please enter valid payment amount';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Please enter payment description';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const accountingEngine = new AccountingEngine(companyId);
      const paymentsPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/payments`;

      const selectedCustomer = formData.isOrderPayment
        ? { id: formData.orderData.customerId, name: formData.orderData.customerName, accountCode: formData.orderData.customerAccountCode }
        : customers.find(c => c.id === formData.customerId);

      // Validate that selected customer exists
      if (!selectedCustomer) {
        throw new Error('Selected customer not found. Please refresh the page and try again.');
      }

      if (!selectedCustomer.customerName && !selectedCustomer.name) {
        throw new Error('Customer name is missing. Please check customer data.');
      }

      // Normalize customer name field
      const customerName = selectedCustomer.customerName || selectedCustomer.name;

      // Generate payment reference number
      const paymentsSnapshot = await onSnapshot(query(collection(db, paymentsPath), orderBy('createdAt', 'desc'), limit(1)), () => {});
      let paymentNumber = 'PAY-001-' + new Date().getFullYear();
      // Note: In a real implementation, you'd get the actual snapshot data

      // Create payment record
      const usdAmount = parseFloat(formData.paymentAmount);
      const goldEquivalent = formData.goldPriceData ? 
        (usdAmount / formData.goldPriceData.pricePerGram) : 0;

      const paymentData = {
        paymentNumber,
        paymentType: formData.isOrderPayment ? 'order_payment' : 'customer_gold_payment',
        customerId: selectedCustomer.id,
        customerName: customerName,
        paymentAmount: usdAmount,
        goldEquivalent: goldEquivalent,
        paymentMethod: 'gold', // Always gold payment
        description: formData.description,
        status: 'received',
        receivedDate: serverTimestamp(),
        accountingRecorded: false,
        goldPriceData: formData.goldPriceData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        companyId: companyId,
        createdBy: userRole,
        ...(formData.isOrderPayment && {
          orderId: formData.orderId,
          orderNumber: formData.orderData.orderNumber,
          invoiceId: formData.orderData.invoiceId,
          invoiceNumber: formData.orderData.invoiceNumber
        })
      };

      const paymentRef = await addDoc(collection(db, paymentsPath), paymentData);

      // ✅ ACCOUNT CODE AUDIT: Ensure customer has account code
      let customerAccountCode = selectedCustomer?.accountCode;
      if (!customerAccountCode) {
        // Create customer account if missing
        const accountManager = new HierarchicalAccountManager(companyId);
        const customerAccountResult = await accountManager.createCustomerAccount(selectedCustomer);
        if (!customerAccountResult.success) {
          throw new Error(`Failed to create customer account: ${customerAccountResult.message}`);
        }
        customerAccountCode = customerAccountResult.account.accountCode;
        // Update customer document with new account code
        await updateDoc(doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/customers`, selectedCustomer.id), {
          accountCode: customerAccountCode,
          updatedAt: serverTimestamp()
        });
        // Update local data
        selectedCustomer.accountCode = customerAccountCode;
      }

      // Create accounting entry: Debit Gold in Hand, Credit Customer Receivables (Gold)
      await accountingEngine.createEntry({
        date: new Date(),
        description: `Gold payment received from ${customerName} - ${formData.description}`,
        transactionType: 'customer_gold_payment',
        referenceId: paymentRef.id,
        referenceType: 'payment',
        entries: [
          {
            accountCode: '1104', // Gold in Hand
            accountName: 'Gold in Hand',
            debit: goldEquivalent,
            credit: 0,
            balanceType: 'gold'
          },
          {
            accountCode: customerAccountCode,
            accountName: `${customerName} - Receivables`,
            debit: 0,
            credit: goldEquivalent,
            balanceType: 'gold'
          }
        ]
      });

      // Update payment with accounting status
      await updateDoc(paymentRef, {
        accountingRecorded: true,
        updatedAt: serverTimestamp()
      });

      // Update order/invoice status if this is an order payment
      if (formData.isOrderPayment && formData.orderData) {
        const ordersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`;
        const orderRef = doc(db, ordersPath, formData.orderId);
        
        // Update order payment status
        await updateDoc(orderRef, {
          paymentStatus: 'Paid',
          paymentAmount: (formData.orderData.paymentAmount || 0) + parseFloat(formData.paymentAmount),
          paymentDate: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // Update invoice if exists
        if (formData.orderData.invoiceId) {
          const invoicesPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/invoices`;
          const invoiceRef = doc(db, invoicesPath, formData.orderData.invoiceId);
          await updateDoc(invoiceRef, {
            paymentStatus: 'Paid',
            paymentAmount: (formData.orderData.paymentAmount || 0) + parseFloat(formData.paymentAmount),
            paymentDate: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }

      alert(`✅ Gold payment received successfully!\n\nPayment: ${paymentNumber}\nUSD Amount: $${usdAmount.toFixed(2)}\nGold Equivalent: ${goldEquivalent.toFixed(3)}g\nFrom: ${customerName}${formData.isOrderPayment ? `\nOrder: ${formData.orderData.orderNumber}` : ''}`);
      onClose();

      // Reset form
      setFormData({
        customerId: '',
        paymentAmount: '',
        paymentMethod: 'cash',
        description: '',
        goldPriceData: null,
        isOrderPayment: false,
        orderId: '',
        orderData: null
      });
      setErrors({});

    } catch (error) {
      console.error('Error recording payment:', error);
      alert('❌ Failed to record payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Receive Payment from Customer
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Description */}
          <div className="px-6 py-3 bg-green-50 border-b">
            <p className="text-sm text-green-800">
              Record customer gold payments against outstanding receivables. Enter USD amount and convert to gold equivalent using current market price. Gold received will increase &quot;Gold in Hand&quot; account and reduce customer receivables.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Payment Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={!formData.isOrderPayment}
                    onChange={() => setFormData(prev => ({ 
                      ...prev, 
                      isOrderPayment: false,
                      orderId: '',
                      orderData: null,
                      customerId: '',
                      description: ''
                    }))}
                    className="mr-2"
                  />
                  General Payment
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentType"
                    checked={formData.isOrderPayment}
                    onChange={() => setFormData(prev => ({ 
                      ...prev, 
                      isOrderPayment: true,
                      customerId: '',
                      description: ''
                    }))}
                    className="mr-2"
                  />
                  Order Payment
                </label>
              </div>
            </div>

            {/* Order ID Input (when order payment is selected) */}
            {formData.isOrderPayment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID *
                </label>
                <input
                  type="text"
                  value={formData.orderId}
                  onChange={(e) => handleOrderIdChange(e.target.value)}
                  placeholder="Enter Order ID"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.orderId ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {orderLoading && <p className="text-blue-600 text-xs mt-1">Loading order details...</p>}
                {formData.orderData && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Order:</strong> {formData.orderData.orderNumber}<br/>
                      <strong>Customer:</strong> {formData.orderData.customerName}<br/>
                      <strong>Amount:</strong> ${formData.orderData.totalAmount?.toFixed(2) || 'N/A'}
                    </p>
                  </div>
                )}
                {errors.orderId && (
                  <p className="text-red-500 text-xs mt-1">{errors.orderId}</p>
                )}
              </div>
            )}

            {/* Customer Selection (when general payment is selected) */}
            {!formData.isOrderPayment && (
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData(prev => ({ ...prev, customerId: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.customerName || customer.name} {customer.phone ? `(${customer.phone})` : ''} 
                    {customer.accountBalance > 0 ? ` - Balance: ${customer.accountBalance.toFixed(3)}g gold` : ''}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-red-500 text-xs mt-1">{errors.customerId}</p>
              )}
              </div>
            )}

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Amount (USD) - Will be converted to Gold Equivalent *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: e.target.value }))}
                  placeholder="Enter USD amount to convert to gold"
                  step="0.01"
                  min="0"
                  className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.paymentAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowGoldPricePopup(true)}
                  className="px-3 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 rounded-md flex items-center gap-1"
                >
                  <Calculator className="w-4 h-4" />
                  Convert to Gold
                </button>
              </div>
              {formData.goldPriceData && formData.paymentAmount && (
                <p className="text-green-600 text-xs mt-1">
                  Gold Equivalent: {(parseFloat(formData.paymentAmount) / formData.goldPriceData.pricePerGram).toFixed(3)}g at ${formData.goldPriceData.pricePerGram}/g
                </p>
              )}
              {errors.paymentAmount && (
                <p className="text-red-500 text-xs mt-1">{errors.paymentAmount}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter payment description (e.g., Payment for Invoice #123)"
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.description && (
                <p className="text-red-500 text-xs mt-1">{errors.description}</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Gold Price Popup */}
      <GoldPricePopup
        isOpen={showGoldPricePopup}
        onClose={() => setShowGoldPricePopup(false)}
        onPriceConfirm={handleGoldPriceConfirm}
        initialAmount={parseFloat(formData.paymentAmount) || 0}
        amountType="usd"
      />
    </>
  );
}