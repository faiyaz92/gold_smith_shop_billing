"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useVanSeller } from '@/app/context/VanSellerContext';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';

export default function VanSellerManagement() {
  const { companyId, userRole, vanSellers, territories, dashboardStats, loading, getVanSellerAlerts } = useVanSeller();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    territoryId: '',
    branchId: '',
    commissionRate: 5.0,
    dailyTarget: 500.00,
    monthlyTarget: 15000.00,
    vehicleType: 'motorcycle',
    licensePlate: '',
    status: 'active',
    gpsEnabled: true
  });
  const [alerts, setAlerts] = useState({ lowStockAlerts: [], inactiveSellers: [], commissionDue: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    setAlerts(getVanSellerAlerts());
  }, [vanSellers]);

  // Filter van sellers
  const filteredSellers = vanSellers.filter(seller => {
    const matchesSearch = seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         seller.vanSellerId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || seller.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const vanSellersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/vanSellers`;

      if (editingId) {
        // Update existing seller
        const sellerRef = doc(db, vanSellersPath, editingId);
        await updateDoc(sellerRef, {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert('Van seller updated successfully!');
      } else {
        // Generate unique seller ID
        const sellerCount = vanSellers.length + 1;
        const vanSellerId = `VS${String(sellerCount).padStart(3, '0')}`;

        // Create new seller
        await addDoc(collection(db, vanSellersPath), {
          vanSellerId,
          companyId,
          ...formData,
          currentLocation: {
            latitude: 29.3759,
            longitude: 47.9774,
            accuracy: 0,
            timestamp: serverTimestamp()
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          _version: '2.0',
          _migrationStatus: 'active',
          _v3Ready: true,
          _v4Ready: true
        });

        // Create accounting accounts for the van seller
        try {
          const accountManager = new HierarchicalAccountManager(companyId);
          const accountResult = await accountManager.createVanSellerAccount({
            vanSellerId,
            name: formData.name,
            branchId: formData.branchId
          });

          if (accountResult.success) {
            console.log(`Created ${accountResult.createdCount} accounts for van seller ${vanSellerId}`);
          } else {
            console.warn(`Account creation partially failed for van seller ${vanSellerId}:`, accountResult.results);
          }
        } catch (accountError) {
          console.error('Error creating accounts for van seller:', accountError);
          // Don't fail the entire operation if account creation fails
        }

        alert('Van seller created successfully!');
      }

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        territoryId: '',
        branchId: '',
        commissionRate: 5.0,
        dailyTarget: 500.00,
        monthlyTarget: 15000.00,
        vehicleType: 'motorcycle',
        licensePlate: '',
        status: 'active',
        gpsEnabled: true
      });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving van seller:', error);
      alert('Failed to save van seller. Please try again.');
    }
  };

  // Handle edit
  const handleEdit = (seller) => {
    setFormData({
      name: seller.name || '',
      phone: seller.phone || '',
      email: seller.email || '',
      territoryId: seller.territoryId || '',
      branchId: seller.branchId || '',
      commissionRate: seller.commissionRate || 5.0,
      dailyTarget: seller.dailyTarget || 500.00,
      monthlyTarget: seller.monthlyTarget || 15000.00,
      vehicleType: seller.vehicleType || 'motorcycle',
      licensePlate: seller.licensePlate || '',
      status: seller.status || 'active',
      gpsEnabled: seller.gpsEnabled !== false
    });
    setEditingId(seller.id);
    setShowForm(true);
  };

  // Handle delete
  const handleDelete = async (sellerId, sellerName) => {
    if (!confirm(`Are you sure you want to delete van seller "${sellerName}"?`)) return;

    try {
      const vanSellersPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/vanSellers`;
      await deleteDoc(doc(db, vanSellersPath, sellerId));
      alert('Van seller deleted successfully!');
    } catch (error) {
      console.error('Error deleting van seller:', error);
      alert('Failed to delete van seller. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="van-seller-management p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🚚 Van Seller Management</h1>
        <p className="text-gray-600">
          Manage mobile sales force and territory assignments
        </p>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sellers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.totalSellers}</p>
            </div>
            <div className="text-blue-500 text-2xl">👥</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sellers</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.activeSellers}</p>
            </div>
            <div className="text-green-500 text-2xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(dashboardStats.totalSales)}
              </p>
            </div>
            <div className="text-purple-500 text-2xl">💰</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Commission</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(dashboardStats.averageCommission)}
              </p>
            </div>
            <div className="text-yellow-500 text-2xl">📊</div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(alerts.lowStockAlerts.length > 0 || alerts.inactiveSellers.length > 0 || alerts.commissionDue.length > 0) && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Van Seller Alerts</h3>
              <div className="mt-2 text-sm text-yellow-700">
                {alerts.lowStockAlerts.length > 0 && (
                  <p>⚠️ {alerts.lowStockAlerts.length} sellers with low stock</p>
                )}
                {alerts.inactiveSellers.length > 0 && (
                  <p>🔴 {alerts.inactiveSellers.length} inactive sellers</p>
                )}
                {alerts.commissionDue.length > 0 && (
                  <p>💰 {alerts.commissionDue.length} pending commission payments</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md w-64"
          />
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setFormData({
              name: '',
              phone: '',
              email: '',
              territoryId: '',
              branchId: '',
              commissionRate: 5.0,
              dailyTarget: 500.00,
              monthlyTarget: 15000.00,
              vehicleType: 'motorcycle',
              licensePlate: '',
              status: 'active',
              gpsEnabled: true
            });
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + Add Van Seller
        </button>
      </div>

      {/* Van Seller Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Edit Van Seller' : 'Add New Van Seller'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Personal Information */}
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="+965-XXX-XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* Territory & Branch */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Territory & Branch</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Territory
                  </label>
                  <select
                    value={formData.territoryId}
                    onChange={(e) => setFormData({ ...formData, territoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Territory</option>
                    {territories.map(territory => (
                      <option key={territory.id} value={territory.territoryId}>
                        {territory.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch ID
                  </label>
                  <input
                    type="text"
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="BR001"
                  />
                </div>

                {/* Commission & Targets */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Commission & Targets</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commission Rate (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Daily Target (KWD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.dailyTarget}
                    onChange={(e) => setFormData({ ...formData, dailyTarget: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Target (KWD) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.monthlyTarget}
                    onChange={(e) => setFormData({ ...formData, monthlyTarget: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                {/* Vehicle Information */}
                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold mb-3">Vehicle Information</h3>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Type *
                  </label>
                  <select
                    required
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="motorcycle">Motorcycle</option>
                    <option value="car">Car</option>
                    <option value="van">Van</option>
                    <option value="truck">Truck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="ABC-123"
                  />
                </div>

                {/* GPS Tracking */}
                <div className="col-span-2 mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.gpsEnabled}
                      onChange={(e) => setFormData({ ...formData, gpsEnabled: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable GPS Tracking
                    </span>
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  {editingId ? 'Update Seller' : 'Create Seller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Van Sellers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Seller Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Territory
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Commission
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
            {filteredSellers.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No van sellers found. Click &quot;Add Van Seller&quot; to create one.
                </td>
              </tr>
            ) : (
              filteredSellers.map((seller) => (
                <tr key={seller.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{seller.name}</div>
                      <div className="text-sm text-gray-500">{seller.vanSellerId}</div>
                      <div className="text-xs text-gray-400">{seller.vehicleType} - {seller.licensePlate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{seller.phone}</div>
                    <div className="text-sm text-gray-500">{seller.email || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{seller.territoryId || 'Unassigned'}</div>
                    <div className="text-sm text-gray-500">{seller.branchId || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{seller.commissionRate}%</div>
                    <div className="text-xs text-gray-500">Target: {seller.dailyTarget}/day</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      seller.status === 'active' ? 'bg-green-100 text-green-800' :
                      seller.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {seller.status}
                    </span>
                    {seller.gpsEnabled && (
                      <div className="text-xs text-green-600 mt-1">📍 GPS Active</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(seller)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(seller.id, seller.name)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
