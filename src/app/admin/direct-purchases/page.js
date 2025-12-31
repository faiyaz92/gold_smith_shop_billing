// Gold Smith Wholesaler Direct Purchases Module
// For purchasing metal directly from market (inventory stocking)
'use client';
import React, { useState, useEffect } from 'react';
import AdminLayout from '../AdminLayout';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Package,
  Calendar,
  DollarSign,
  FileText
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { AccountingEngine } from '@/utils/accountingEngine';
import { InventoryService } from '@/utils/inventoryService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function DirectPurchases() {
  const [isClient, setIsClient] = useState(false);
  const [purchases, setPurchases] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPurchaseDialog, setShowNewPurchaseDialog] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState(null);

  const [purchaseForm, setPurchaseForm] = useState({
    categoryId: '',
    categoryName: '',
    pureMetalWeight: '',
    metalRatePerGram: '',
    customRate: '',
    useCustomRate: false,
    totalAmount: 0,
    gstAmount: '',
    totalWithGST: 0,
    supplier: '',
    invoiceNumber: '',
    paymentType: 'cash',
    creditDays: 0,
    notes: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';
  const purchasesPath = `companies/${companyId}/directPurchases`;
  const categoriesPath = `companies/${companyId}/categories`;

  useEffect(() => {
    setIsClient(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch categories
      const categoriesQuery = query(collection(db, categoriesPath), orderBy('categoriesname'));
      const categoriesUnsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      });

      // Fetch purchases
      const purchasesQuery = query(collection(db, purchasesPath), orderBy('purchaseDate', 'desc'));
      const purchasesUnsubscribe = onSnapshot(purchasesQuery, (snapshot) => {
        const purchasesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPurchases(purchasesData);
      });

      return () => {
        categoriesUnsubscribe();
        purchasesUnsubscribe();
      };
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleCategoryChange = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setPurchaseForm({
        ...purchaseForm,
        categoryId,
        categoryName: category.categoriesname,
        metalRatePerGram: category.metalRatePerGram || '',
        customRate: '',
        useCustomRate: false
      });
      calculateTotals({
        ...purchaseForm,
        categoryId,
        metalRatePerGram: category.metalRatePerGram || ''
      });
    }
  };

  const calculateTotals = (form) => {
    const weight = parseFloat(form.pureMetalWeight) || 0;
    const rate = form.useCustomRate 
      ? (parseFloat(form.customRate) || 0)
      : (parseFloat(form.metalRatePerGram) || 0);
    
    const totalAmount = weight * rate;
    const gst = parseFloat(form.gstAmount) || 0;
    const totalWithGST = totalAmount + gst;

    setPurchaseForm({
      ...form,
      totalAmount,
      totalWithGST
    });
  };

  const handleInputChange = (field, value) => {
    const updatedForm = {
      ...purchaseForm,
      [field]: value
    };
    
    // Recalculate when relevant fields change
    if (['pureMetalWeight', 'metalRatePerGram', 'customRate', 'gstAmount', 'useCustomRate'].includes(field)) {
      calculateTotals(updatedForm);
    } else {
      setPurchaseForm(updatedForm);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validation
      if (!purchaseForm.categoryId) {
        alert('Please select a metal category');
        return;
      }
      if (!purchaseForm.pureMetalWeight || parseFloat(purchaseForm.pureMetalWeight) <= 0) {
        alert('Please enter a valid weight');
        return;
      }
      if (!purchaseForm.metalRatePerGram && !purchaseForm.customRate) {
        alert('Please enter a metal rate');
        return;
      }
      if (!purchaseForm.supplier) {
        alert('Please enter supplier name');
        return;
      }

      const purchaseData = {
        ...purchaseForm,
        pureMetalWeight: parseFloat(purchaseForm.pureMetalWeight),
        metalRatePerGram: purchaseForm.useCustomRate 
          ? parseFloat(purchaseForm.customRate) 
          : parseFloat(purchaseForm.metalRatePerGram),
        gstAmount: parseFloat(purchaseForm.gstAmount) || 0,
        creditDays: parseInt(purchaseForm.creditDays) || 0,
        dueDate: purchaseForm.paymentType === 'credit' 
          ? new Date(Date.now() + (parseInt(purchaseForm.creditDays) || 0) * 24 * 60 * 60 * 1000)
          : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        type: 'direct_purchase'
      };

      if (editingPurchase) {
        // Update existing purchase
        await updateDoc(doc(db, purchasesPath, editingPurchase.id), purchaseData);
        alert('Purchase updated successfully!');
      } else {
        // Create new purchase
        const purchaseRef = await addDoc(collection(db, purchasesPath), purchaseData);

        // Update inventory
        const inventoryService = new InventoryService(companyId);
        await inventoryService.addDirectPurchase({
          purchaseId: purchaseRef.id,
          categoryId: purchaseData.categoryId,
          categoryName: purchaseData.categoryName,
          weight: purchaseData.pureMetalWeight,
          rate: purchaseData.metalRatePerGram,
          totalCost: purchaseData.totalWithGST,
          supplier: purchaseData.supplier
        });

        // Create accounting entries
        const accountingEngine = new AccountingEngine(companyId);
        await accountingEngine.recordDirectPurchase({
          purchaseId: purchaseRef.id,
          amount: purchaseData.totalWithGST,
          paymentType: purchaseData.paymentType,
          supplier: purchaseData.supplier,
          description: `Direct purchase: ${purchaseData.pureMetalWeight}g ${purchaseData.categoryName}`,
          date: new Date(purchaseData.purchaseDate)
        });

        alert('Purchase recorded successfully!');
      }

      // Reset form
      resetForm();
      setShowNewPurchaseDialog(false);
      setEditingPurchase(null);
    } catch (error) {
      console.error('Error saving purchase:', error);
      alert('Error saving purchase. Please try again.');
    }
  };

  const handleEdit = (purchase) => {
    setPurchaseForm({
      categoryId: purchase.categoryId,
      categoryName: purchase.categoryName,
      pureMetalWeight: purchase.pureMetalWeight.toString(),
      metalRatePerGram: purchase.metalRatePerGram.toString(),
      customRate: '',
      useCustomRate: false,
      totalAmount: purchase.totalAmount,
      gstAmount: purchase.gstAmount.toString(),
      totalWithGST: purchase.totalWithGST,
      supplier: purchase.supplier,
      invoiceNumber: purchase.invoiceNumber || '',
      paymentType: purchase.paymentType,
      creditDays: purchase.creditDays || 0,
      notes: purchase.notes || '',
      purchaseDate: purchase.purchaseDate || new Date().toISOString().split('T')[0]
    });
    setEditingPurchase(purchase);
    setShowNewPurchaseDialog(true);
  };

  const handleDelete = async (purchaseId) => {
    if (!confirm('Are you sure you want to delete this purchase?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, purchasesPath, purchaseId));
      alert('Purchase deleted successfully!');
    } catch (error) {
      console.error('Error deleting purchase:', error);
      alert('Error deleting purchase. Please try again.');
    }
  };

  const resetForm = () => {
    setPurchaseForm({
      categoryId: '',
      categoryName: '',
      pureMetalWeight: '',
      metalRatePerGram: '',
      customRate: '',
      useCustomRate: false,
      totalAmount: 0,
      gstAmount: '',
      totalWithGST: 0,
      supplier: '',
      invoiceNumber: '',
      paymentType: 'cash',
      creditDays: 0,
      notes: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
  };

  const generatePurchaseNote = (purchase) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('PURCHASE NOTE', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Purchase ID: ${purchase.id}`, 20, 35);
    doc.text(`Date: ${new Date(purchase.purchaseDate).toLocaleDateString()}`, 20, 42);
    doc.text(`Supplier: ${purchase.supplier}`, 20, 49);
    
    // Purchase Details
    doc.setFontSize(12);
    doc.text('Purchase Details:', 20, 65);
    
    const tableData = [
      ['Metal Category', purchase.categoryName],
      ['Pure Metal Weight', `${purchase.pureMetalWeight}g`],
      ['Rate per Gram', `₹${purchase.metalRatePerGram.toFixed(2)}`],
      ['Base Amount', `₹${purchase.totalAmount.toFixed(2)}`],
      ['GST Amount', `₹${purchase.gstAmount.toFixed(2)}`],
      ['Total Amount', `₹${purchase.totalWithGST.toFixed(2)}`],
      ['Payment Type', purchase.paymentType.toUpperCase()],
      ['Invoice Number', purchase.invoiceNumber || 'N/A']
    ];
    
    doc.autoTable({
      startY: 70,
      head: [],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });

    if (purchase.notes) {
      const finalY = doc.lastAutoTable.finalY || 70;
      doc.text('Notes:', 20, finalY + 10);
      doc.setFontSize(9);
      doc.text(purchase.notes, 20, finalY + 17, { maxWidth: 170 });
    }
    
    doc.save(`Purchase_${purchase.id}.pdf`);
  };

  const filteredPurchases = purchases.filter(purchase => {
    const search = searchQuery.toLowerCase();
    return (
      purchase.categoryName?.toLowerCase().includes(search) ||
      purchase.supplier?.toLowerCase().includes(search) ||
      purchase.invoiceNumber?.toLowerCase().includes(search) ||
      purchase.id.toLowerCase().includes(search)
    );
  });

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <AdminLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Direct Purchases</h1>
            <p className="text-gray-600">Purchase metal directly from market for inventory</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingPurchase(null);
              setShowNewPurchaseDialog(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Purchase
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-800">{purchases.length}</div>
            <div className="text-gray-600">Total Purchases</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              ₹{purchases.reduce((sum, p) => sum + (p.totalWithGST || 0), 0).toLocaleString()}
            </div>
            <div className="text-gray-600">Total Value</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {purchases.reduce((sum, p) => sum + (p.pureMetalWeight || 0), 0).toFixed(2)}g
            </div>
            <div className="text-gray-600">Total Weight</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {purchases.filter(p => p.paymentType === 'credit').length}
            </div>
            <div className="text-gray-600">Credit Purchases</div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by category, supplier, invoice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Purchases Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Category</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Weight</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Rate/g</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Total</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Supplier</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Payment</th>
                  <th className="p-3 text-left text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.length > 0 ? (
                  filteredPurchases.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="p-3 text-sm">
                        {new Date(purchase.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-sm font-medium">{purchase.categoryName}</td>
                      <td className="p-3 text-sm">{purchase.pureMetalWeight}g</td>
                      <td className="p-3 text-sm">₹{purchase.metalRatePerGram.toFixed(2)}</td>
                      <td className="p-3 text-sm font-semibold text-green-600">
                        ₹{purchase.totalWithGST.toFixed(2)}
                      </td>
                      <td className="p-3 text-sm">{purchase.supplier}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          purchase.paymentType === 'cash' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {purchase.paymentType.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <motion.button
                            onClick={() => generatePurchaseNote(purchase)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 rounded hover:bg-purple-500/20"
                            title="Download Purchase Note"
                          >
                            <FileText className="w-4 h-4 text-purple-600" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleEdit(purchase)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 rounded hover:bg-blue-500/20"
                          >
                            <Edit className="w-4 h-4 text-blue-600" />
                          </motion.button>
                          <motion.button
                            onClick={() => handleDelete(purchase.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 rounded hover:bg-red-500/20"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>No purchases found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* New/Edit Purchase Dialog */}
        {showNewPurchaseDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4 text-green-800">
                {editingPurchase ? 'Edit Purchase' : 'New Direct Purchase'}
              </h2>

              <div className="space-y-4">
                {/* Purchase Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={purchaseForm.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metal Category *
                    </label>
                    <select
                      value={purchaseForm.categoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="">Select Metal</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>
                          {cat.categoriesname} - ₹{cat.metalRatePerGram}/g
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Pure Metal Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pure Metal Weight (grams) *
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={purchaseForm.pureMetalWeight}
                      onChange={(e) => handleInputChange('pureMetalWeight', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter weight"
                    />
                  </div>
                </div>

                {/* Rate Override */}
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={purchaseForm.useCustomRate}
                      onChange={(e) => handleInputChange('useCustomRate', e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Override Metal Rate</span>
                  </label>
                  
                  {purchaseForm.useCustomRate && (
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseForm.customRate}
                      onChange={(e) => handleInputChange('customRate', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter custom rate per gram"
                    />
                  )}
                  {!purchaseForm.useCustomRate && purchaseForm.metalRatePerGram && (
                    <p className="text-sm text-gray-600">
                      Current rate: ₹{purchaseForm.metalRatePerGram}/g
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* GST Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GST Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={purchaseForm.gstAmount}
                      onChange={(e) => handleInputChange('gstAmount', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="GST amount"
                    />
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      value={purchaseForm.supplier}
                      onChange={(e) => handleInputChange('supplier', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Supplier name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Invoice Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      value={purchaseForm.invoiceNumber}
                      onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Invoice number"
                    />
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Type *
                    </label>
                    <select
                      value={purchaseForm.paymentType}
                      onChange={(e) => handleInputChange('paymentType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="cash">Cash</option>
                      <option value="credit">Credit</option>
                    </select>
                  </div>
                </div>

                {/* Credit Days */}
                {purchaseForm.paymentType === 'credit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Credit Days
                    </label>
                    <input
                      type="number"
                      value={purchaseForm.creditDays}
                      onChange={(e) => handleInputChange('creditDays', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Number of days"
                    />
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={purchaseForm.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>

                {/* Amount Summary */}
                {purchaseForm.pureMetalWeight && purchaseForm.metalRatePerGram && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-semibold text-green-900 mb-2">Amount Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Base Amount:</span>
                        <span className="font-semibold">₹{purchaseForm.totalAmount.toFixed(2)}</span>
                      </div>
                      {purchaseForm.gstAmount && (
                        <div className="flex justify-between">
                          <span>GST Amount:</span>
                          <span className="font-semibold">₹{parseFloat(purchaseForm.gstAmount).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between pt-2 border-t border-green-300">
                        <span className="font-bold">Total Amount:</span>
                        <span className="font-bold text-green-600">₹{purchaseForm.totalWithGST.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewPurchaseDialog(false);
                    setEditingPurchase(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  {editingPurchase ? 'Update Purchase' : 'Record Purchase'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
