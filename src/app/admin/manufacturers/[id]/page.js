'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Edit, Phone, Mail, MapPin, FileText, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function ManufacturerViewPage() {
  const params = useParams();
  const router = useRouter();
  const [manufacturer, setManufacturer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchManufacturer();
      fetchRelatedData();
    }
  }, [params.id]);

  const fetchManufacturer = async () => {
    try {
      const manufacturerRef = doc(db, 'manufacturers', params.id);
      const manufacturerSnap = await getDoc(manufacturerRef);

      if (manufacturerSnap.exists()) {
        setManufacturer({
          id: manufacturerSnap.id,
          ...manufacturerSnap.data()
        });
      } else {
        router.push('/admin/manufacturers');
      }
    } catch (error) {
      console.error('Error fetching manufacturer:', error);
      router.push('/admin/manufacturers');
    }
  };

  const fetchRelatedData = async () => {
    try {
      // Fetch orders from this manufacturer
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(
        ordersRef,
        where('manufacturerId', '==', params.id),
        orderBy('createdAt', 'desc')
      );
      const ordersSnap = await getDocs(ordersQuery);
      const ordersData = ordersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);

      // Fetch payments to this manufacturer
      const paymentsRef = collection(db, 'payments');
      const paymentsQuery = query(
        paymentsRef,
        where('manufacturerId', '==', params.id),
        orderBy('paymentDate', 'desc')
      );
      const paymentsSnap = await getDocs(paymentsQuery);
      const paymentsData = paymentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching related data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBalanceSheet = () => {
    const totalPurchases = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const outstandingBalance = totalPurchases - totalPayments;

    return {
      totalPurchases,
      totalPayments,
      outstandingBalance
    };
  };

  if (loading || !manufacturer) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
        </div>
      </div>
    );
  }

  const balanceSheet = calculateBalanceSheet();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/manufacturers"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{manufacturer.name}</h1>
            <p className="text-gray-600">{manufacturer.manufacturerCode}</p>
          </div>
        </div>
        <Link
          href={`/admin/manufacturers/${manufacturer.id}/edit`}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Edit size={20} />
          Edit Manufacturer
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Manufacturer Details */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manufacturer Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Phone size={20} className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{manufacturer.phone}</p>
                  </div>
                </div>

                {manufacturer.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{manufacturer.email}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Specialization</p>
                    <p className="font-medium">{manufacturer.specialization || 'General'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {manufacturer.address && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                      <MapPin size={20} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">{manufacturer.address}</p>
                    </div>
                  </div>
                )}

                {manufacturer.gstNumber && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <FileText size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">GST Number</p>
                      <p className="font-medium">{manufacturer.gstNumber}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Terms</p>
                    <p className="font-medium">{manufacturer.paymentTerms || '15 Days'}</p>
                  </div>
                </div>
              </div>
            </div>

            {manufacturer.notes && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Notes</h3>
                <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">{manufacturer.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Balance Sheet Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Sheet</h2>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp size={20} className="text-red-600" />
                  <span className="text-sm font-medium text-red-700">Total Purchases</span>
                </div>
                <span className="text-lg font-bold text-red-700">
                  ₹{balanceSheet.totalPurchases.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  <span className="text-sm font-medium text-green-700">Total Payments</span>
                </div>
                <span className="text-lg font-bold text-green-700">
                  ₹{balanceSheet.totalPayments.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Outstanding Balance</span>
                </div>
                <span className={`text-lg font-bold ${
                  balanceSheet.outstandingBalance > 0 ? 'text-red-700' : 'text-green-700'
                }`}>
                  ₹{Math.abs(balanceSheet.outstandingBalance).toLocaleString()}
                  {balanceSheet.outstandingBalance < 0 && ' (Credit)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Orders</h2>

        {orders.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No orders found for this manufacturer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Order #</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm font-medium text-gray-900">
                      {order.orderNumber || order.id.slice(-8)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      ₹{order.totalAmount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Payments */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Payments</h2>

        {payments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No payments found for this manufacturer.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.slice(0, 5).map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {payment.paymentDate?.toDate?.()?.toLocaleDateString() || 'N/A'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      ₹{payment.amount?.toLocaleString() || '0'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {payment.paymentMethod || 'Cash'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {payment.reference || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}