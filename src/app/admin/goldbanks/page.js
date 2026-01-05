'use client';

// ✅ TASK 5.1: Gold Bank Management Page (BRD v2 - Pure Gold Tracking)
// Purpose: Manage Gold Bank (Sharaf) locations for gold custody
// Reference: BRD_GoldSmith_v2.md Section 5A, DatabaseInfo_GoldSmith_v2.md Section 5A

import { useState, useEffect } from 'react';
import { db } from '@/app/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Building2, Plus, Edit2, Trash2, MapPin, Scale } from 'lucide-react';
import { toast } from 'react-toastify';
import { HierarchicalAccountManager } from '@/utils/hierarchicalAccountManager';

export default function GoldBanksPage() {
  const [goldBanks, setGoldBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const basePath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}`;
  const [formData, setFormData] = useState({
    bankName: '',
    location: '',
    contactPerson: '',
    phone: '',
    currentGoldBalance: 0,
    accountCode: '',
    isActive: true,
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchGoldBanks();
  }, []);

  const fetchGoldBanks = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'goldBanks'));
      const banks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGoldBanks(banks);
    } catch (error) {
      console.error('Error fetching gold banks:', error);
      toast.error('Failed to load gold banks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateDoc(doc(db, 'goldBanks', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        toast.success('Gold bank updated successfully');
      } else {
        // Create gold bank document first
        const docRef = await addDoc(collection(db, 'goldBanks'), {
          ...formData,
          currentGoldBalance: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        // ✅ Use centralized account creation method
        const accountManager = new HierarchicalAccountManager(companyId);
        const accountResult = await accountManager.createGoldBankAccount({
          goldBankId: docRef.id,
          bankName: formData.bankName,
          location: formData.location
        });

        if (!accountResult.success) {
          throw new Error(`Failed to create account: ${accountResult.message}`);
        }

        // Update gold bank document with account code
        await updateDoc(docRef, {
          accountCode: accountResult.account.accountCode,
          accountId: accountResult.account.id
        });

        toast.success('✅ Gold bank and account created successfully');
      }
      
      resetForm();
      fetchGoldBanks();
    } catch (error) {
      console.error('Error saving gold bank:', error);
      toast.error('Failed to save gold bank');
    }
  };

  const handleEdit = (bank) => {
    setFormData({
      bankName: bank.bankName,
      location: bank.location,
      contactPerson: bank.contactPerson || '',
      phone: bank.phone || '',
      currentGoldBalance: bank.currentGoldBalance || 0,
      accountCode: bank.accountCode,
      isActive: bank.isActive !== false,
    });
    setEditingId(bank.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      location: '',
      contactPerson: '',
      phone: '',
      currentGoldBalance: 0,
      accountCode: '',
      isActive: true,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const totalGold = goldBanks.reduce((sum, bank) => sum + (bank.currentGoldBalance || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading gold banks...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Gold Banks (Sharaf Custody)
          </h1>
          <p className="text-gray-600 mt-1">Manage gold custody locations</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Gold Bank
        </button>
      </div>

      {/* Total Gold Display */}
      <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <Scale className="w-10 h-10 text-yellow-600" />
          <div>
            <p className="text-sm text-yellow-700 font-medium">Total Gold in All Banks</p>
            <p className="text-3xl font-bold text-yellow-900">{totalGold.toFixed(3)}g</p>
            <p className="text-xs text-yellow-600 mt-1">Pure Gold (24k equivalent)</p>
          </div>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border-2 border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Edit Gold Bank' : 'Add New Gold Bank'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Sharaf DG - Downtown Branch"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Downtown, Main Street"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Ahmad Khan"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="+93 xxx xxx xxx"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                {editingId ? 'Update' : 'Add'} Gold Bank
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Banks List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goldBanks.map((bank) => (
          <div
            key={bank.id}
            className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-lg">{bank.bankName}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(bank)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600">
                <span className="font-medium">Location:</span> {bank.location}
              </p>
              {bank.contactPerson && (
                <p className="text-gray-600">
                  <span className="font-medium">Contact:</span> {bank.contactPerson}
                </p>
              )}
              {bank.phone && (
                <p className="text-gray-600">
                  <span className="font-medium">Phone:</span> {bank.phone}
                </p>
              )}
              <p className="text-gray-600">
                <span className="font-medium">Account Code:</span> {bank.accountCode}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-3">
                <p className="text-xs text-yellow-700 font-medium">Gold Balance</p>
                <p className="text-xl font-bold text-yellow-900">
                  {(bank.currentGoldBalance || 0).toFixed(3)}g
                </p>
                <p className="text-xs text-yellow-600">Pure Gold (24k)</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {goldBanks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p>No gold banks added yet</p>
          <p className="text-sm">Click &quot;Add Gold Bank&quot; to start</p>
        </div>
      )}
    </div>
  );
}
