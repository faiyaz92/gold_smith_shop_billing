'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, MapPin, Phone, Clock, Users, Eye, ToggleLeft, ToggleRight } from 'lucide-react';
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

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
};

const BRANCH_TYPES = [
  { value: 'main', label: 'Main Branch' },
  { value: 'pickup', label: 'Pickup Center' },
  { value: 'processing', label: 'Processing Center' },
  { value: 'delivery', label: 'Delivery Hub' },
];

const WORKING_HOURS = [
  { value: '24/7', label: '24/7' },
  { value: '6am-10pm', label: '6:00 AM - 10:00 PM' },
  { value: '7am-9pm', label: '7:00 AM - 9:00 PM' },
  { value: '8am-8pm', label: '8:00 AM - 8:00 PM' },
  { value: '9am-6pm', label: '9:00 AM - 6:00 PM' },
  { value: 'custom', label: 'Custom Hours' },
];

export default function AdminBranches() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'main',
    address: '',
    city: '',
    area: '',
    zipCode: '',
    phone: '',
    whatsapp: '',
    email: '',
    workingHours: '8am-8pm',
    customHours: '',
    managerName: '',
    managerPhone: '',
    capacity: '',
    services: [],
    isActive: true,
    hasPickup: true,
    hasDelivery: true,
    latitude: '',
    longitude: '',
    notes: '',
  });

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const branchesPath = `${tenantCompaniesPath}/${companyId}/branches`;

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      // Fetch branches from Firestore
      const q = query(collection(db, branchesPath), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedBranches = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          
          // Determine status
          let status = data.isActive ? 'active' : 'inactive';
          if (data.maintenance) {
            status = 'maintenance';
          }

          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            status,
          };
        });
        setBranches(fetchedBranches);
        setIsLoading(false);
      }, (err) => {
        console.error('Error fetching branches:', err);
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [router]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'main',
      address: '',
      city: '',
      area: '',
      zipCode: '',
      phone: '',
      whatsapp: '',
      email: '',
      workingHours: '8am-8pm',
      customHours: '',
      managerName: '',
      managerPhone: '',
      capacity: '',
      services: [],
      isActive: true,
      hasPickup: true,
      hasDelivery: true,
      latitude: '',
      longitude: '',
      notes: '',
    });
  };

  const handleCreateBranch = async (e) => {
    e.preventDefault();
    try {
      const branchData = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        services: formData.services,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, branchesPath), branchData);
      setShowCreateModal(false);
      resetForm();
    } catch (err) {
      console.error('Error creating branch:', err);
      alert('Failed to create branch');
    }
  };

  const handleEditBranch = async (e) => {
    e.preventDefault();
    try {
      const branchRef = doc(db, `${branchesPath}/${selectedBranch.id}`);
      const updateData = {
        ...formData,
        capacity: formData.capacity ? Number(formData.capacity) : null,
        services: formData.services,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(branchRef, updateData);
      setShowEditModal(false);
      setSelectedBranch(null);
      resetForm();
    } catch (err) {
      console.error('Error updating branch:', err);
      alert('Failed to update branch');
    }
  };

  const handleDeleteBranch = async () => {
    try {
      const branchRef = doc(db, `${branchesPath}/${showDeleteDialog.id}`);
      await deleteDoc(branchRef);
      setShowDeleteDialog(null);
    } catch (err) {
      console.error('Error deleting branch:', err);
      alert('Failed to delete branch');
    }
  };

  const handleToggleStatus = async (branchId, currentStatus) => {
    try {
      const branchRef = doc(db, `${branchesPath}/${branchId}`);
      await updateDoc(branchRef, {
        isActive: !currentStatus,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error toggling branch status:', err);
    }
  };

  const handleEditClick = (branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name || '',
      type: branch.type || 'main',
      address: branch.address || '',
      city: branch.city || '',
      area: branch.area || '',
      zipCode: branch.zipCode || '',
      phone: branch.phone || '',
      whatsapp: branch.whatsapp || '',
      email: branch.email || '',
      workingHours: branch.workingHours || '8am-8pm',
      customHours: branch.customHours || '',
      managerName: branch.managerName || '',
      managerPhone: branch.managerPhone || '',
      capacity: branch.capacity?.toString() || '',
      services: branch.services || [],
      isActive: branch.isActive !== false,
      hasPickup: branch.hasPickup !== false,
      hasDelivery: branch.hasDelivery !== false,
      latitude: branch.latitude || '',
      longitude: branch.longitude || '',
      notes: branch.notes || '',
    });
    setShowEditModal(true);
  };

  const handleViewClick = (branch) => {
    setSelectedBranch(branch);
    setShowViewModal(true);
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = 
      branch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      branch.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? branch.status === statusFilter : true;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date) => {
    return date ? date.toLocaleDateString() : 'N/A';
  };

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            Branch Management
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add Branch
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 flex-1">
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, address, or city..."
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
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
        </div>

        {/* Branch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center text-gray-500 p-6">Loading...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 p-6">No branches found</div>
          ) : (
            filteredBranches.map((branch) => (
              <motion.div
                key={branch.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{branch.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[branch.status]} mt-1`}>
                      {branch.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {BRANCH_TYPES.find(t => t.value === branch.type)?.label}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{branch.address}, {branch.city}</span>
                  </div>
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} />
                      <span>{branch.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>{WORKING_HOURS.find(h => h.value === branch.workingHours)?.label || branch.customHours}</span>
                  </div>
                  {branch.managerName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users size={14} />
                      <span>Manager: {branch.managerName}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    {branch.hasPickup && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Pickup</span>
                    )}
                    {branch.hasDelivery && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Delivery</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewClick(branch)}
                      className="text-blue-600 hover:text-blue-800"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleEditClick(branch)}
                      className="text-green-600 hover:text-green-800"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(branch.id, branch.isActive)}
                      className={`${branch.isActive ? 'text-orange-600' : 'text-green-600'} hover:opacity-80`}
                      title={branch.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {branch.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(branch)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4 text-gray-900">
              {showCreateModal ? 'Add New Branch' : 'Edit Branch'}
            </h3>
            <form onSubmit={showCreateModal ? handleCreateBranch : handleEditBranch}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Information */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-800 mb-3 border-b pb-2">Basic Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="e.g., Downtown Branch"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  >
                    {BRANCH_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Address Information */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-800 mb-3 border-b pb-2 mt-4">Address Information</h4>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Address *</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    rows="2"
                    placeholder="Full street address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="City name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({...formData, area: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="Area/District"
                  />
                </div>

                {/* Contact Information */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-800 mb-3 border-b pb-2 mt-4">Contact Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="+965 XXXX XXXX"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="+965 XXXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="branch@laundry.com"
                  />
                </div>

                {/* Operating Information */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-800 mb-3 border-b pb-2 mt-4">Operating Information</h4>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Working Hours</label>
                  <select
                    value={formData.workingHours}
                    onChange={(e) => setFormData({...formData, workingHours: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                  >
                    {WORKING_HOURS.map(hours => (
                      <option key={hours.value} value={hours.value}>{hours.label}</option>
                    ))}
                  </select>
                </div>
                {formData.workingHours === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Hours</label>
                    <input
                      type="text"
                      value={formData.customHours}
                      onChange={(e) => setFormData({...formData, customHours: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      placeholder="e.g., Mon-Fri: 8AM-6PM, Sat: 9AM-4PM"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Name</label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({...formData, managerName: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="Branch manager name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Manager Phone</label>
                  <input
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => setFormData({...formData, managerPhone: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    placeholder="+965 XXXX XXXX"
                  />
                </div>

                {/* Services & Features */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-medium text-gray-800 mb-3 border-b pb-2 mt-4">Services & Features</h4>
                </div>
                <div className="md:col-span-2">
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.hasPickup}
                        onChange={(e) => setFormData({...formData, hasPickup: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Pickup Service</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.hasDelivery}
                        onChange={(e) => setFormData({...formData, hasDelivery: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Delivery Service</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                    className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                    rows="2"
                    placeholder="Additional notes about this branch..."
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
                    resetForm();
                    setSelectedBranch(null);
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
                >
                  {showCreateModal ? 'Create Branch' : 'Update Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Branch Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg text-blue-600">{selectedBranch.name}</h4>
                <p className="text-sm text-gray-600">{BRANCH_TYPES.find(t => t.value === selectedBranch.type)?.label}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Address</p>
                  <p className="text-gray-800">{selectedBranch.address}, {selectedBranch.city}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="text-gray-800">{selectedBranch.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Working Hours</p>
                  <p className="text-gray-800">
                    {WORKING_HOURS.find(h => h.value === selectedBranch.workingHours)?.label || selectedBranch.customHours}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Manager</p>
                  <p className="text-gray-800">{selectedBranch.managerName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Services</p>
                  <div className="flex gap-2 mt-1">
                    {selectedBranch.hasPickup && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Pickup</span>
                    )}
                    {selectedBranch.hasDelivery && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Delivery</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[selectedBranch.status]} mt-1`}>
                    {selectedBranch.status.toUpperCase()}
                  </span>
                </div>
              </div>
              {selectedBranch.notes && (
                <div>
                  <p className="text-gray-500">Notes</p>
                  <p className="text-gray-800">{selectedBranch.notes}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium mb-4 text-gray-900">Delete Branch</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete "{showDeleteDialog.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBranch}
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