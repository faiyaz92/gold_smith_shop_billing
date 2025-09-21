'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Globe, MapPin, Users, Building, AlertTriangle } from 'lucide-react';
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
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';
import { db } from '@/app/firebase';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
};

export default function AdminAreas() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [states, setStates] = useState([]);
  const [areas, setAreas] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeTab, setActiveTab] = useState('states');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [showStateModal, setShowStateModal] = useState(false);
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(null);

  // Form states
  const [stateForm, setStateForm] = useState({ name: '', isActive: true });
  const [areaForm, setAreaForm] = useState({ name: '', stateId: '', isActive: true });
  const [clusterForm, setClusterForm] = useState({ 
    name: '', 
    description: '', 
    areaIds: [], 
    branchId: '', 
    isActive: true 
  });

  // Helper state selection for cluster modal
  const [selectedStateForAreas, setSelectedStateForAreas] = useState('');

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory/tenantCompanies';
  const statesPath = `${basePath}/${companyId}/states`;
  const areasPath = `${basePath}/${companyId}/areas`;
  const clustersPath = `${basePath}/${companyId}/clusters`;
  const branchesPath = `${basePath}/${companyId}/branches`;

  useEffect(() => {
    setIsClient(true);
    const authStatus = localStorage.getItem('adminAuth');
    if (authStatus !== 'true') {
      router.push('/admin/login');
    } else {
      // Fetch all data
      fetchData();
    }
  }, [router]);

  const fetchData = () => {
    // Fetch States
    const statesQuery = query(collection(db, statesPath), orderBy('createdAt', 'desc'));
    const unsubStates = onSnapshot(statesQuery, (snapshot) => {
      const fetchedStates = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
      }));
      setStates(fetchedStates);
    });

    // Fetch Areas
    const areasQuery = query(collection(db, areasPath), orderBy('createdAt', 'desc'));
    const unsubAreas = onSnapshot(areasQuery, (snapshot) => {
      const fetchedAreas = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
      }));
      setAreas(fetchedAreas);
    });

    // Fetch Clusters (only area clusters now)
    const clustersQuery = query(collection(db, clustersPath), orderBy('createdAt', 'desc'));
    const unsubClusters = onSnapshot(clustersQuery, (snapshot) => {
      const fetchedClusters = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
      }));
      setClusters(fetchedClusters);
    });

    // Fetch Branches
    const branchesQuery = query(collection(db, branchesPath), orderBy('createdAt', 'desc'));
    const unsubBranches = onSnapshot(branchesQuery, (snapshot) => {
      const fetchedBranches = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate(),
      }));
      setBranches(fetchedBranches);
      setIsLoading(false);
    });

    return () => {
      unsubStates();
      unsubAreas();
      unsubClusters();
      unsubBranches();
    };
  };

  // State Management
  const handleCreateState = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, statesPath), {
        ...stateForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowStateModal(false);
      setStateForm({ name: '', isActive: true });
    } catch (err) {
      console.error('Error creating state:', err);
      alert('Failed to create state');
    }
  };

  const handleEditState = async (e) => {
    e.preventDefault();
    try {
      const stateRef = doc(db, `${statesPath}/${editingItem.id}`);
      await updateDoc(stateRef, {
        ...stateForm,
        updatedAt: serverTimestamp(),
      });
      setShowStateModal(false);
      setEditingItem(null);
      setStateForm({ name: '', isActive: true });
    } catch (err) {
      console.error('Error updating state:', err);
      alert('Failed to update state');
    }
  };

  // Area Management
  const handleCreateArea = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, areasPath), {
        ...areaForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowAreaModal(false);
      setAreaForm({ name: '', stateId: '', isActive: true });
    } catch (err) {
      console.error('Error creating area:', err);
      alert('Failed to create area');
    }
  };

  const handleEditArea = async (e) => {
    e.preventDefault();
    try {
      const areaRef = doc(db, `${areasPath}/${editingItem.id}`);
      await updateDoc(areaRef, {
        ...areaForm,
        updatedAt: serverTimestamp(),
      });
      setShowAreaModal(false);
      setEditingItem(null);
      setAreaForm({ name: '', stateId: '', isActive: true });
    } catch (err) {
      console.error('Error updating area:', err);
      alert('Failed to update area');
    }
  };

  // Cluster Management (Area-based only)
  const handleCreateCluster = async (e) => {
    e.preventDefault();
    
    // Check if branch is already assigned
    if (isBranchAssigned(clusterForm.branchId)) {
      alert('This branch is already assigned to another cluster.');
      return;
    }
    
    // Check if any selected area is already in another cluster
    const conflictingAreas = clusters
      .filter(cluster => cluster.id !== editingItem?.id)
      .reduce((acc, cluster) => {
        const conflicting = cluster.areaIds?.filter(areaId =>
          clusterForm.areaIds.includes(areaId)
        ) || [];
        return [...acc, ...conflicting];
      }, []);

    if (conflictingAreas.length > 0) {
      const conflictingAreaNames = conflictingAreas.map(areaId =>
        areas.find(a => a.id === areaId)?.name
      ).join(', ');
      alert(`Error: The following areas are already assigned to another cluster: ${conflictingAreaNames}`);
      return;
    }

    try {
      await addDoc(collection(db, clustersPath), {
        ...clusterForm,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setShowClusterModal(false);
      setClusterForm({ name: '', description: '', areaIds: [], branchId: '', isActive: true });
      setSelectedStateForAreas('');
    } catch (err) {
      console.error('Error creating cluster:', err);
      alert('Failed to create cluster');
    }
  };

  const handleEditCluster = async (e) => {
    e.preventDefault();
    
    // Check if branch is already assigned (excluding current cluster)
    if (isBranchAssigned(clusterForm.branchId) && editingItem?.branchId !== clusterForm.branchId) {
      alert('This branch is already assigned to another cluster.');
      return;
    }
    
    // Check if any selected area is already in another cluster (excluding current cluster)
    const conflictingAreas = clusters
      .filter(cluster => cluster.id !== editingItem?.id)
      .reduce((acc, cluster) => {
        const conflicting = cluster.areaIds?.filter(areaId =>
          clusterForm.areaIds.includes(areaId)
        ) || [];
        return [...acc, ...conflicting];
      }, []);

    if (conflictingAreas.length > 0) {
      const conflictingAreaNames = conflictingAreas.map(areaId =>
        areas.find(a => a.id === areaId)?.name
      ).join(', ');
      alert(`Error: The following areas are already assigned to another cluster: ${conflictingAreaNames}`);
      return;
    }

    try {
      const clusterRef = doc(db, `${clustersPath}/${editingItem.id}`);
      await updateDoc(clusterRef, {
        ...clusterForm,
        updatedAt: serverTimestamp(),
      });
      setShowClusterModal(false);
      setEditingItem(null);
      setClusterForm({ name: '', description: '', areaIds: [], branchId: '', isActive: true });
      setSelectedStateForAreas('');
    } catch (err) {
      console.error('Error updating cluster:', err);
      alert('Failed to update cluster');
    }
  };

  // Delete handlers
  const handleDelete = async () => {
    try {
      let path = '';
      if (showDeleteDialog.type === 'state') path = `${statesPath}/${showDeleteDialog.id}`;
      else if (showDeleteDialog.type === 'area') path = `${areasPath}/${showDeleteDialog.id}`;
      else if (showDeleteDialog.type === 'cluster') path = `${clustersPath}/${showDeleteDialog.id}`;
      
      const docRef = doc(db, path);
      await deleteDoc(docRef);
      setShowDeleteDialog(null);
    } catch (err) {
      console.error('Error deleting:', err);
      alert('Failed to delete item');
    }
  };

  // Edit handlers
  const handleEditClick = (item, type) => {
    setEditingItem(item);
    if (type === 'state') {
      setStateForm({ name: item.name, isActive: item.isActive });
      setShowStateModal(true);
    } else if (type === 'area') {
      setAreaForm({ name: item.name, stateId: item.stateId, isActive: item.isActive });
      setShowAreaModal(true);
    } else if (type === 'cluster') {
      setClusterForm({
        name: item.name,
        description: item.description || '',
        areaIds: item.areaIds || [],
        branchId: item.branchId || '',
        isActive: item.isActive
      });
      setShowClusterModal(true);
    }
  };

  // Helper functions
  const getStateName = (stateId) => {
    return states.find(s => s.id === stateId)?.name || 'Unknown State';
  };

  const getBranchName = (branchId) => {
    return branches.find(b => b.id === branchId)?.name || 'No Branch Assigned';
  };

  const getAreasForState = (stateId) => {
    return areas.filter(area => area.stateId === stateId);
  };

  const isAreaInCluster = (areaId) => {
    return clusters.some(cluster => cluster.areaIds?.includes(areaId));
  };

  const isBranchAssigned = (branchId) => {
    return clusters.some(c => c.branchId === branchId);
  };

  // New helper functions
  const getAvailableAreasForState = (stateId) => {
    return areas.filter(area => 
      area.stateId === stateId && 
      area.isActive && 
      !isAreaInCluster(area.id)
    );
  };

  const getAllAreasForState = (stateId) => {
    return areas.filter(area => area.stateId === stateId && area.isActive);
  };

  const isStateFullySelected = (stateId) => {
    const availableAreas = getAvailableAreasForState(stateId);
    return availableAreas.length > 0 && availableAreas.every(area => 
      clusterForm.areaIds?.includes(area.id)
    );
  };

  const isStatePartiallySelected = (stateId) => {
    const availableAreas = getAvailableAreasForState(stateId);
    return availableAreas.some(area => clusterForm.areaIds?.includes(area.id)) && 
         !isStateFullySelected(stateId);
  };

  const handleStateToggle = (stateId, select) => {
    const availableAreas = getAvailableAreasForState(stateId);
    const availableAreaIds = availableAreas.map(area => area.id);
    
    if (select) {
      // Add all available areas of this state
      const newAreaIds = [...(clusterForm.areaIds || []), ...availableAreaIds];
      setClusterForm({
        ...clusterForm,
        areaIds: [...new Set(newAreaIds)] // Remove duplicates
      });
    } else {
      // Remove all areas of this state
      setClusterForm({
        ...clusterForm,
        areaIds: (clusterForm.areaIds || []).filter(areaId => !availableAreaIds.includes(areaId))
      });
    }
  };

  if (!isClient) return null;

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent">
            Area Management
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          {[
            { id: 'states', label: 'States', icon: <Globe size={16} /> },
            { id: 'areas', label: 'Areas', icon: <MapPin size={16} /> },
            { id: 'clusters', label: 'Clusters', icon: <Building size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* States Tab */}
        {activeTab === 'states' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search states..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 rounded bg-gray-50 border border-gray-200 focus:border-blue-300 text-sm"
                />
              </div>
              <button
                onClick={() => setShowStateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add State
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {states.filter(state => 
                state.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(state => (
                <div key={state.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{state.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[state.isActive ? 'active' : 'inactive']}`}>
                      {state.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>Areas: {getAreasForState(state.id).length}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(state, 'state')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog({ id: state.id, name: state.name, type: 'state' })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Areas Tab */}
        {activeTab === 'areas' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 rounded bg-gray-50 border border-gray-200 focus:border-blue-300 text-sm"
                />
              </div>
              <button
                onClick={() => setShowAreaModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add Area
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {areas.filter(area => 
                area.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(area => (
                <div key={area.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{area.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[area.isActive ? 'active' : 'inactive']}`}>
                      {area.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    <p>State: {getStateName(area.stateId)}</p>
                    {isAreaInCluster(area.id) && (
                      <div className="flex items-center gap-1 text-green-600 mt-1">
                        <Building size={12} />
                        <span>Assigned to Cluster</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(area, 'area')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog({ id: area.id, name: area.name, type: 'area' })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Clusters Tab */}
        {activeTab === 'clusters' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search clusters..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="p-2 rounded bg-gray-50 border border-gray-200 focus:border-blue-300 text-sm"
                />
              </div>
              <button
                onClick={() => setShowClusterModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                Add Cluster
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {clusters.filter(cluster =>
                cluster.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(cluster => (
                <div key={cluster.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900">{cluster.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[cluster.isActive ? 'active' : 'inactive']}`}>
                      {cluster.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {cluster.description && (
                    <p className="text-sm text-gray-600 mb-2">{cluster.description}</p>
                  )}
                  <div className="text-sm text-gray-600 mb-3">
                    <p className="font-medium">Areas ({cluster.areaIds?.length || 0}):</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {cluster.areaIds?.map(areaId => (
                        <span key={areaId} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {areas.find(a => a.id === areaId)?.name || 'Unknown Area'}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2">
                      <span className="font-medium">Branch:</span> {getBranchName(cluster.branchId)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditClick(cluster, 'cluster')}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog({ id: cluster.id, name: cluster.name, type: 'cluster' })}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* State Modal */}
        {showStateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium mb-4">
                {editingItem ? 'Edit State' : 'Add New State'}
              </h3>
              <form onSubmit={editingItem ? handleEditState : handleCreateState}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State Name</label>
                    <input
                      type="text"
                      value={stateForm.name}
                      onChange={(e) => setStateForm({...stateForm, name: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      placeholder="e.g., Al Jahra"
                      required
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={stateForm.isActive}
                        onChange={(e) => setStateForm({...stateForm, isActive: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStateModal(false);
                      setEditingItem(null);
                      setStateForm({ name: '', isActive: true });
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Area Modal */}
        {showAreaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-medium mb-4">
                {editingItem ? 'Edit Area' : 'Add New Area'}
              </h3>
              <form onSubmit={editingItem ? handleEditArea : handleCreateArea}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
                    <input
                      type="text"
                      value={areaForm.name}
                      onChange={(e) => setAreaForm({...areaForm, name: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      placeholder="e.g., Sulaibiya"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select
                      value={areaForm.stateId}
                      onChange={(e) => setAreaForm({...areaForm, stateId: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      required
                    >
                      <option value="">Select State</option>
                      {states.filter(s => s.isActive).map(state => (
                        <option key={state.id} value={state.id}>{state.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={areaForm.isActive}
                        onChange={(e) => setAreaForm({...areaForm, isActive: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAreaModal(false);
                      setEditingItem(null);
                      setAreaForm({ name: '', stateId: '', isActive: true });
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Cluster Modal (Area-based only) */}
        {showClusterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium mb-4">
                {editingItem ? 'Edit Cluster' : 'Add New Cluster'}
              </h3>
              <form onSubmit={editingItem ? handleEditCluster : handleCreateCluster}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cluster Name</label>
                    <input
                      type="text"
                      value={clusterForm.name}
                      onChange={(e) => setClusterForm({...clusterForm, name: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      placeholder="e.g., Central Area Cluster"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={clusterForm.description}
                      onChange={(e) => setClusterForm({...clusterForm, description: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      rows="2"
                      placeholder="Brief description of this cluster"
                    />
                  </div>
                  
                  {/* Improved Areas Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Areas by State
                      <span className="text-red-500 text-xs ml-1">*Areas can only be in one cluster</span>
                    </label>
                    <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-gray-50">
                      {states.filter(s => s.isActive).map(state => {
                        const stateAreas = getAllAreasForState(state.id);
                        const availableAreas = getAvailableAreasForState(state.id);
                        const occupiedAreas = stateAreas.filter(area => 
                          isAreaInCluster(area.id) && !clusterForm.areaIds?.includes(area.id)
                        );
                        
                        if (stateAreas.length === 0) return null;
                        
                        const isFullySelected = isStateFullySelected(state.id);
                        const isPartiallySelected = isStatePartiallySelected(state.id);
                        const hasAvailableAreas = availableAreas.length > 0;
                        
                        return (
                          <div key={state.id} className="mb-4 p-3 bg-white rounded-lg border">
                            {/* State Header with Checkbox */}
                            <div className="flex items-center gap-3 mb-3 pb-2 border-b">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={isFullySelected}
                                  ref={checkbox => {
                                    if (checkbox) checkbox.indeterminate = isPartiallySelected;
                                  }}
                                  onChange={(e) => handleStateToggle(state.id, e.target.checked)}
                                  disabled={!hasAvailableAreas}
                                  className="w-4 h-4"
                                />
                                <Globe size={16} className="text-blue-600" />
                                <span className="font-medium text-gray-900 text-base">{state.name}</span>
                              </div>
                              <div className="flex gap-2 text-xs">
                                {availableAreas.length > 0 && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                    {availableAreas.length} available
                                  </span>
                                )}
                                {occupiedAreas.length > 0 && (
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                    {occupiedAreas.length} occupied
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Areas List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pl-6">
                              {stateAreas.map(area => {
                                const isInOtherCluster = isAreaInCluster(area.id) && !clusterForm.areaIds?.includes(area.id);
                                const isSelected = clusterForm.areaIds?.includes(area.id);
                                
                                return (
                                  <label 
                                    key={area.id} 
                                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                                      isInOtherCluster 
                                        ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                                        : isSelected
                                          ? 'bg-blue-50 border border-blue-200'
                                          : 'hover:bg-gray-50'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      disabled={isInOtherCluster}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setClusterForm({
                                            ...clusterForm,
                                            areaIds: [...(clusterForm.areaIds || []), area.id]
                                          });
                                        } else {
                                          setClusterForm({
                                            ...clusterForm,
                                            areaIds: (clusterForm.areaIds || []).filter(id => id !== area.id)
                                          });
                                        }
                                      }}
                                      className="w-3 h-3"
                                    />
                                    <MapPin size={12} className={isInOtherCluster ? 'text-gray-400' : 'text-gray-600'} />
                                    <span className={`text-sm ${
                                      isInOtherCluster 
                                        ? 'line-through text-gray-400' 
                                        : isSelected
                                          ? 'text-blue-700 font-medium'
                                          : 'text-gray-700'
                                    }`}>
                                      {area.name}
                                    </span>
                                    {isInOtherCluster && (
                                      <span className="text-xs text-red-500 ml-auto">(In use)</span>
                                    )}
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Selection Summary */}
                    {clusterForm.areaIds?.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          Selected Areas ({clusterForm.areaIds.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {clusterForm.areaIds.map(areaId => {
                            const area = areas.find(a => a.id === areaId);
                            const state = states.find(s => s.id === area?.stateId);
                            return (
                              <span 
                                key={areaId} 
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                              >
                                <MapPin size={10} />
                                {area?.name}
                                <span className="text-blue-600">({state?.name})</span>
                                <button
                                  type="button"
                                  onClick={() => setClusterForm({
                                    ...clusterForm,
                                    areaIds: clusterForm.areaIds.filter(id => id !== areaId)
                                  })}
                                  className="ml-1 text-blue-600 hover:text-blue-800"
                                >
                                  ×
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Branch</label>
                    <select
                      value={clusterForm.branchId}
                      onChange={(e) => setClusterForm({...clusterForm, branchId: e.target.value})}
                      className="w-full p-2 border rounded focus:ring-1 focus:ring-blue-200"
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.filter(b => b.isActive && (!isBranchAssigned(b.id) || (editingItem && editingItem.branchId === b.id))).map(branch => (
                        <option key={branch.id} value={branch.id}>{branch.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={clusterForm.isActive}
                        onChange={(e) => setClusterForm({...clusterForm, isActive: e.target.checked})}
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowClusterModal(false);
                      setEditingItem(null);
                      setClusterForm({ name: '', description: '', areaIds: [], branchId: '', isActive: true });
                      setSelectedStateForAreas('');
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                  >
                    {editingItem ? 'Update' : 'Create'}
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
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-red-500" size={20} />
                <h3 className="text-lg font-medium text-gray-900">Delete {showDeleteDialog.type}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete &quot;{showDeleteDialog.name}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteDialog(null)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}