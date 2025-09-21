'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Eye, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import AdminLayout from '../AdminLayout';
import { 
  onSnapshot, 
  query, 
  collection, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '@/app/firebase';

// Coupon types and discount types
const COUPON_TYPES = [
  { value: 'percentage', label: 'Percentage Off' },
  { value: 'fixed', label: 'Fixed Amount Off' },
  { value: 'free_delivery', label: 'Free Delivery' },
  { value: 'bogo', label: 'Buy One Get One' },
];

const USAGE_LIMITS = [
  { value: 'unlimited', label: 'Unlimited' },
  { value: 'once_per_user', label: 'Once Per User' },
  { value: 'limited_total', label: 'Limited Total Uses' },
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  expired: 'bg-red-100 text-red-800',
};

export default function AdminCoupons() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: '',
    minimumOrderValue: '',
    maximumDiscount: '',
    usageLimit: 'unlimited',
    totalUsageLimit: '',
    validFrom: '',
    validUntil: '',
    isActive: true,
    applicableCategories: [],
    excludedCategories: [],
  });

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const couponsPath = `${tenantCompaniesPath}/${companyId}/coupons`;

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      // Fetch coupons from Firestore
      const q = query(collection(db, couponsPath), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedCoupons = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          const now = new Date();
          const validUntil = data.validUntil?.toDate();
          
          // Determine status
          let status = 'active';
          if (!data.isActive) {
            status = 'inactive';
          } else if (validUntil && validUntil < now) {
            status = 'expired';
          }

          return {
            id: docSnap.id,
            ...data,
            validFrom: data.validFrom?.toDate(),
            validUntil: data.validUntil?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            status,
            usedCount: data.usedCount || 0,
          };
        });
        setCoupons(fetchedCoupons);
        setIsLoading(false);
      }, (err) => {
        console.error('Error fetching coupons:', err);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [router]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: '',
      minimumOrderValue: '',
      maximumDiscount: '',
      usageLimit: 'unlimited',
      totalUsageLimit: '',
      validFrom: '',
      validUntil: '',
      isActive: true,
      applicableCategories: [],
      excludedCategories: [],
    });
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const couponData = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: Number(formData.value),
        minimumOrderValue: formData.minimumOrderValue ? Number(formData.minimumOrderValue) : 0,
        maximumDiscount: formData.maximumDiscount ? Number(formData.maximumDiscount) : null,
        totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : null,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : new Date(),
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        usedCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, couponsPath), couponData);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating coupon:', err);
      alert('Failed to create coupon');
    }
  };

  const handleEditCoupon = async (e) => {
    e.preventDefault();
    try {
      const couponRef = doc(db, `${couponsPath}/${selectedCoupon.id}`);
      const updateData = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: Number(formData.value),
        minimumOrderValue: formData.minimumOrderValue ? Number(formData.minimumOrderValue) : 0,
        maximumDiscount: formData.maximumDiscount ? Number(formData.maximumDiscount) : null,
        totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : null,
        validFrom: formData.validFrom ? new Date(formData.validFrom) : new Date(),
        validUntil: formData.validUntil ? new Date(formData.validUntil) : null,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(couponRef, updateData);
      setShowEditModal(false);
      setSelectedCoupon(null);
      resetForm();
    } catch (err) {
      console.error('Error updating coupon:', err);
      alert('Failed to update coupon');
    }
  };

  const handleDeleteCoupon = async () => {
    try {
      const couponRef = doc(db, `${couponsPath}/${showDeleteDialog.id}`);
      await deleteDoc(couponRef);
      setShowDeleteDialog(null);
    } catch (err) {
      console.error('Error deleting coupon:', err);
      alert('Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (couponId, currentStatus) => {
    try {
      const couponRef = doc(db, `${couponsPath}/${couponId}`);
      await updateDoc(couponRef, {
        isActive: !currentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error toggling coupon status:', err);
    }
  };

  const handleEditClick = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value.toString(),
      minimumOrderValue: coupon.minimumOrderValue?.toString() || '',
      maximumDiscount: coupon.maximumDiscount?.toString() || '',
      usageLimit: coupon.usageLimit,
      totalUsageLimit: coupon.totalUsageLimit?.toString() || '',
      validFrom: coupon.validFrom ? coupon.validFrom.toISOString().split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.toISOString().split('T')[0] : '',
      isActive: coupon.isActive,
      applicableCategories: coupon.applicableCategories || [],
      excludedCategories: coupon.excludedCategories || [],
    });
    setShowEditModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Coupon code copied to clipboard!');
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = 
      coupon.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coupon.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? coupon.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    return date ? date.toLocaleDateString() : 'N/A';
  };

  const formatCouponValue = (coupon) => {
    switch (coupon.type) {
      case 'percentage':
        return `${coupon.value}% OFF`;
      case 'fixed':
        return `KWD ${coupon.value} OFF`;
      case 'free_delivery':
        return 'FREE DELIVERY';
      case 'bogo':
        return 'BOGO';
      default:
        return `${coupon.value}`;
    }
  };

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            Coupon Management
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Create Coupon
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by coupon code or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 p-2 rounded bg-gray-50 border border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-200 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm rounded px-3 py-2 text-blue-600 focus:border-blue-300"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>

        {/* Coupons Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-blue-50 text-blue-800 text-xs sm:text-sm">
              <tr>
                <th className="p-3 text-left border-b border-gray-200">Code</th>
                <th className="p-3 text-left border-b border-gray-200">Name</th>
                <th className="p-3 text-left border-b border-gray-200">Type</th>
                <th className="p-3 text-left border-b border-gray-200">Value</th>
                <th className="p-3 text-left border-b border-gray-200">Min Order</th>
                <th className="p-3 text-left border-b border-gray-200">Usage</th>
                <th className="p-3 text-left border-b border-gray-200">Valid Until</th>
                <th className="p-3 text-left border-b border-gray-200">Status</th>
                <th className="p-3 text-left border-b border-gray-200">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 p-6">Loading...</td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-gray-500 p-6">No coupons found</td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b hover:bg-blue-50 text-xs sm:text-sm">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">{coupon.code}</span>
                        <button
                          onClick={() => copyToClipboard(coupon.code)}
                          className="text-gray-400 hover:text-blue-600"
                          title="Copy code"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="p-3">{coupon.name}</td>
                    <td className="p-3 capitalize">
                      {COUPON_TYPES.find(t => t.value === coupon.type)?.label}
                    </td>
                    <td className="p-3 font-semibold text-green-600">
                      {formatCouponValue(coupon)}
                    </td>
                    <td className="p-3">
                      {coupon.minimumOrderValue ? `KWD ${coupon.minimumOrderValue}` : 'No minimum'}
                    </td>
                    <td className="p-3">
                      {coupon.totalUsageLimit ? `${coupon.usedCount}/${coupon.totalUsageLimit}` : `${coupon.usedCount}/∞`}
                    </td>
                    <td className="p-3">{formatDate(coupon.validUntil)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[coupon.status]}`}>
                        {coupon.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(coupon)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                          className={`px-2 py-1 rounded text-xs ${
                            coupon.isActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                          }`}
                          title={coupon.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setShowDeleteDialog(coupon)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900">
              {showCreateModal ? 'Create New Coupon' : 'Edit Coupon'}
            </h3>
            <form onSubmit={showCreateModal ? handleCreateCoupon : handleEditCoupon}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="e.g., SAVE20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="e.g., 20% Off Sale"
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    rows="2"
                    placeholder="Brief description of the coupon..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  >
                    {COUPON_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'percentage' ? 'Percentage' : 'Amount (KWD)'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Value (KWD)</label>
                  <input
                    type="number"
                    value={formData.minimumOrderValue}
                    onChange={(e) => setFormData({...formData, minimumOrderValue: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    min="0"
                    step="0.01"
                    placeholder="0 for no minimum"
                  />
                </div>
                {formData.type === 'percentage' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount (KWD)</label>
                    <input
                      type="number"
                      value={formData.maximumDiscount}
                      onChange={(e) => setFormData({...formData, maximumDiscount: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      min="0"
                      step="0.01"
                      placeholder="Leave empty for no limit"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                  <select
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  >
                    {USAGE_LIMITS.map(limit => (
                      <option key={limit.value} value={limit.value}>{limit.label}</option>
                    ))}
                  </select>
                </div>
                {formData.usageLimit === 'limited_total' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Usage Limit</label>
                    <input
                      type="number"
                      value={formData.totalUsageLimit}
                      onChange={(e) => setFormData({...formData, totalUsageLimit: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      min="1"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({...formData, validUntil: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
                    resetForm();
                    setSelectedCoupon(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  {showCreateModal ? 'Create Coupon' : 'Update Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Delete Coupon</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete the coupon "{showDeleteDialog.code}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCoupon}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}