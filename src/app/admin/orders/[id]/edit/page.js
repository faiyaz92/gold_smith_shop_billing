"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAccounting } from '@/app/context/AccountingContext';
import { ArrowLeft, Save, X, User, Package, Truck, DollarSign } from 'lucide-react';

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const orderId = params.id;

  const [order, setOrder] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    customerId: '',
    manufacturerId: '',
    productId: '',
    productName: '',
    productType: '',
    productPureGold: '',
    makingCharges: '',
    commissionAmount: '',
    notes: '',
    status: ''
  });

  useEffect(() => {
    if (!orderId || !companyId) return;
    fetchData();
  }, [orderId, companyId]);

  const fetchData = async () => {
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
      setFormData({
        customerId: orderData.customerId || '',
        manufacturerId: orderData.manufacturerId || '',
        productId: orderData.productId || '',
        productName: orderData.productName || '',
        productType: orderData.productType || '',
        productPureGold: orderData.productPureGold || '',
        makingCharges: orderData.makingCharges || '',
        commissionAmount: orderData.commissionAmount || '',
        notes: orderData.notes || '',
        status: orderData.status || 'Draft'
      });

      // Fetch customers
      const customersRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/customers`);
      const customersSnap = await getDocs(customersRef);
      const customersData = customersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(customersData);

      // Fetch manufacturers
      const manufacturersRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/manufacturers`);
      const manufacturersSnap = await getDocs(manufacturersRef);
      const manufacturersData = manufacturersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setManufacturers(manufacturersData);

      // Fetch products
      const productsRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/products`);
      const productsSnap = await getDocs(productsRef);
      const productsData = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(productsData);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load order data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!order) return;

    try {
      setSaving(true);

      const updateData = {
        ...formData,
        productPureGold: parseFloat(formData.productPureGold) || 0,
        makingCharges: parseFloat(formData.makingCharges) || 0,
        commissionAmount: parseFloat(formData.commissionAmount) || 0,
        updatedAt: serverTimestamp()
      };

      const orderRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/orders`, orderId);
      await updateDoc(orderRef, updateData);

      // Success - redirect back to order details
      router.push(`/admin/orders/${orderId}`);

    } catch (err) {
      console.error('Error updating order:', err);
      setError('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-fill product details when product is selected
    if (field === 'productId' && value) {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productName: selectedProduct.name || selectedProduct.productName || '',
          productType: selectedProduct.type || selectedProduct.productType || '',
          productPureGold: selectedProduct.pureGold || selectedProduct.productPureGold || ''
        }));
      }
    }
  };

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
          <X className="mx-auto h-12 w-12 text-red-500" />
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
                Back to Order Details
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Order #{order.id.slice(-8)}</h1>
                <p className="text-sm text-gray-500">Update order information</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/admin/orders/${orderId}`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Customer Information */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer *</label>
                  <select
                    value={formData.customerId}
                    onChange={(e) => handleInputChange('customerId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name || customer.customerName || 'Unnamed Customer'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Package className="h-5 w-5 mr-2 text-blue-600" />
                Product Information
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product</label>
                  <select
                    value={formData.productId}
                    onChange={(e) => handleInputChange('productId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Product (Optional)</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name || product.productName || 'Unnamed Product'}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                  <input
                    type="text"
                    value={formData.productType}
                    onChange={(e) => handleInputChange('productType', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ring, Necklace, Bracelet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pure Gold Weight (grams) *</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.productPureGold}
                    onChange={(e) => handleInputChange('productPureGold', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Manufacturer Information */}
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                  <select
                    value={formData.manufacturerId}
                    onChange={(e) => handleInputChange('manufacturerId', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Manufacturer (Optional)</option>
                    {manufacturers.map((manufacturer) => (
                      <option key={manufacturer.id} value={manufacturer.id}>
                        {manufacturer.manufacturerName || manufacturer.name || 'Unnamed Manufacturer'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                Financial Information
              </h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Making Charges (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.makingCharges}
                    onChange={(e) => handleInputChange('makingCharges', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commission Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.commissionAmount}
                    onChange={(e) => handleInputChange('commissionAmount', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Status & Notes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Order Status & Notes</h2>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Challan Issued">Challan Issued</option>
                    <option value="In Production">In Production</option>
                    <option value="Ready for Delivery">Ready for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Additional notes about the order..."
                  />
                </div>
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}