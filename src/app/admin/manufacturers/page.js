'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase';
import Link from 'next/link';
import { Plus, Search, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const fetchManufacturers = async () => {
    try {
      const manufacturersRef = collection(db, 'manufacturers');
      const querySnapshot = await getDocs(manufacturersRef);

      const manufacturersData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort by manufacturer code descending (newest first)
      manufacturersData.sort((a, b) => {
        const codeA = a.manufacturerCode || '';
        const codeB = b.manufacturerCode || '';
        return codeB.localeCompare(codeA);
      });

      setManufacturers(manufacturersData);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (manufacturerId, currentStatus) => {
    try {
      const manufacturerRef = doc(db, 'manufacturers', manufacturerId);
      await updateDoc(manufacturerRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });

      // Update local state
      setManufacturers(prev => prev.map(manufacturer =>
        manufacturer.id === manufacturerId
          ? { ...manufacturer, isActive: !currentStatus }
          : manufacturer
      ));
    } catch (error) {
      console.error('Error updating manufacturer status:', error);
      alert('Error updating manufacturer status. Please try again.');
    }
  };

  const filteredManufacturers = manufacturers.filter(manufacturer => {
    const matchesSearch = searchTerm === '' ||
      manufacturer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.phone?.includes(searchTerm) ||
      manufacturer.manufacturerCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      manufacturer.specialization?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && manufacturer.isActive) ||
      (statusFilter === 'inactive' && !manufacturer.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manufacturers</h1>
        <Link
          href="/admin/manufacturers/new"
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Manufacturer
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, phone, code, or specialization..."
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Manufacturers Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Specialization
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Outstanding
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
              {filteredManufacturers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm || statusFilter !== 'all' ? 'No manufacturers found matching your criteria.' : 'No manufacturers found. Add your first manufacturer to get started.'}
                  </td>
                </tr>
              ) : (
                filteredManufacturers.map((manufacturer) => (
                  <tr key={manufacturer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {manufacturer.manufacturerCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {manufacturer.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.specialization || 'General'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{manufacturer.outstandingBalance?.toLocaleString() || '0'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        manufacturer.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {manufacturer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/manufacturers/${manufacturer.id}`}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Details"
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          href={`/admin/manufacturers/${manufacturer.id}/edit`}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => toggleStatus(manufacturer.id, manufacturer.isActive)}
                          className={`${
                            manufacturer.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                          title={manufacturer.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {manufacturer.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
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

      {/* Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Manufacturers</h3>
          <p className="text-3xl font-bold text-yellow-600">{manufacturers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Manufacturers</h3>
          <p className="text-3xl font-bold text-green-600">
            {manufacturers.filter(m => m.isActive).length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Outstanding</h3>
          <p className="text-3xl font-bold text-red-600">
            ₹{manufacturers.reduce((sum, m) => sum + (m.outstandingBalance || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}