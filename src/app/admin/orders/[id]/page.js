"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import { doc, getDoc, collection, query, where, orderBy, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useAccounting } from '@/app/context/AccountingContext';
import { ArrowLeft, Eye, Edit, FileText, Truck, DollarSign, User, Package, Calendar, MapPin, Phone, Mail, CreditCard, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [manufacturer, setManufacturer] = useState(null);
  const [challans, setChallans] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Status colors and icons
  const getStatusConfig = (status) => {
    const configs = {
      'Draft': { color: 'bg-gray-100 text-gray-800', icon: Clock, label: 'Draft' },
      'Confirmed': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
      'Challan Issued': { color: 'bg-purple-100 text-purple-800', icon: Truck, label: 'Challan Issued' },
      'In Production': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'In Production' },
      'Ready for Delivery': { color: 'bg-green-100 text-green-800', icon: Package, label: 'Ready for Delivery' },
      'Delivered': { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Delivered' },
      'Cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
    };
    return configs[status] || configs['Draft'];
  };

  useEffect(() => {
    if (!orderId || !companyId) {
      return;
    }
    fetchOrderDetails();
  }, [orderId, companyId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Fetch order
      const orderRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`, orderId);
      const orderSnap = await getDoc(orderRef);

      if (!orderSnap.exists()) {
        setError('Order not found');
        return;
      }

      const orderData = { id: orderSnap.id, ...orderSnap.data() };
      setOrder(orderData);

      // Fetch customer
      if (orderData.customerId) {
        const customerRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/customers`, orderData.customerId);
        const customerSnap = await getDoc(customerRef);
        if (customerSnap.exists()) {
          setCustomer({ id: customerSnap.id, ...customerSnap.data() });
        }
      }

      // Fetch manufacturer
      if (orderData.manufacturerId) {
        const manufacturerRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`, orderData.manufacturerId);
        const manufacturerSnap = await getDoc(manufacturerRef);
        if (manufacturerSnap.exists()) {
          setManufacturer({ id: manufacturerSnap.id, ...manufacturerSnap.data() });
        }
      }

      // Fetch challans
      const challansRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/challans`);
      const challansQuery = query(challansRef, where('orderId', '==', orderId), orderBy('createdAt', 'desc'));
      const challansSnap = await getDocs(challansQuery);
      const challansData = challansSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChallans(challansData);

      // Fetch journal entries
      const journalRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/journalEntries`);
      const journalQuery = query(journalRef, where('referenceId', '==', orderId), where('referenceType', '==', 'order'));
      const journalSnap = await getDocs(journalQuery);
      const journalData = journalSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJournalEntries(journalData);

    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatGold = (amount) => {
    return `${(amount || 0).toFixed(3)}g`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error || 'Order not found'}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Orders
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Order #{order.id.slice(-8)}</h1>
                <p className="text-sm text-gray-500">Order Details</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                <statusConfig.icon className="h-4 w-4 mr-1" />
                {statusConfig.label}
              </span>
              <button 
                onClick={() => router.push(`/admin/orders/${orderId}/edit`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Order
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  Order Information
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order Date</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-sm text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(order.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <p className="mt-1 text-sm text-gray-900">{order.productName || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product Type</label>
                    <p className="mt-1 text-sm text-gray-900">{order.productType || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gold Weight</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold text-yellow-600">
                      {formatGold(order.productPureGold)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Making Charges</label>
                    <p className="mt-1 text-sm text-gray-900 font-semibold text-green-600">
                      {formatCurrency(order.makingCharges)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            {customer && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-green-600" />
                    Customer Information
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{customer.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {customer.phone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {customer.email || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="mt-1 text-sm text-gray-900 flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {customer.location || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Manufacturer Information */}
            {manufacturer && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Truck className="h-5 w-5 mr-2 text-purple-600" />
                    Manufacturer Information
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="mt-1 text-sm text-gray-900">{manufacturer.manufacturerName || manufacturer.name || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Code</label>
                      <p className="mt-1 text-sm text-gray-900">{manufacturer.manufacturerCode || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gold in Transit</label>
                      <p className="mt-1 text-sm text-gray-900 font-semibold text-yellow-600">
                        {formatGold(manufacturer.goldInTransit)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact</label>
                      <p className="mt-1 text-sm text-gray-900">{manufacturer.contactPerson || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Challans */}
            {challans.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-orange-600" />
                    Challans ({challans.length})
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-4">
                    {challans.map((challan) => (
                      <div key={challan.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-900">{challan.challanNumber}</h3>
                            <p className="text-sm text-gray-500">
                              {challan.challanType === 'gold_return' ? 'Gold Return' : challan.challanType === 'additional_gold' ? 'Additional Gold' : 'Gold Issue'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-yellow-600">{formatGold(challan.pureGoldAmount)}</p>
                            <p className="text-sm text-gray-500">{formatDate(challan.createdAt)}</p>
                          </div>
                        </div>
                        {challan.notes && (
                          <p className="mt-2 text-sm text-gray-600">{challan.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-8">

            {/* Order Status */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Order Status</h2>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Current Status</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                      <statusConfig.icon className="h-3 w-3 mr-1" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {order.challanNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Challan Number</span>
                      <span className="text-sm font-mono text-gray-900">{order.challanNumber}</span>
                    </div>
                  )}

                  {order.challanIssuedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Challan Issued</span>
                      <span className="text-sm text-gray-900">{formatDate(order.challanIssuedAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                  Financial Summary
                </h2>
              </div>
              <div className="px-6 py-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Gold Weight</span>
                    <span className="text-sm font-semibold text-yellow-600">{formatGold(order.productPureGold)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Making Charges</span>
                    <span className="text-sm font-semibold text-green-600">{formatCurrency(order.makingCharges)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Commission</span>
                    <span className="text-sm font-semibold text-blue-600">{formatCurrency(order.commissionAmount)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-900">Total Value</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatCurrency((order.makingCharges || 0) + (order.commissionAmount || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting Entries */}
            {journalEntries.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
                    Accounting Entries ({journalEntries.length})
                  </h2>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {journalEntries.map((entry) => (
                      <div key={entry.id} className="text-sm">
                        <p className="font-medium text-gray-900">{entry.description}</p>
                        <p className="text-gray-500">{formatDate(entry.date)}</p>
                        <div className="mt-2 space-y-1">
                          {entry.entries?.map((line, index) => (
                            <div key={index} className="flex justify-between text-xs">
                              <span className="text-gray-600">{line.accountName}</span>
                              <span className={`font-medium ${line.debit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {line.debit > 0 ? '+' : '-'}{formatGold(Math.abs(line.debit || line.credit))}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}