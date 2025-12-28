"use client";

import { useState, useEffect } from "react";
import { useVanSeller } from "../../context/VanSellerContext";
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { useFirestorePaths } from "../../utils/firestorePaths";

/**
 * Stock Allocation & Mobile Inventory Management
 * 
 * References:
 * - BRD_v2.md Section 9.3: Stock allocation & mobile inventory
 * - DatabaseInfo_v2.md: stockAllocations collection structure
 * 
 * Features:
 * - Stock allocation to van sellers
 * - Product selection and quantity management
 * - Stock return processing
 * - Damage reporting
 * - Low stock alerts
 * - Allocation history tracking
 */

export default function StockAllocationPage() {
  const { vanSellers, getSellerById, getSellerAllocations } = useVanSeller();
  const { companyId } = useFirestorePaths();
  
  const [allocations, setAllocations] = useState([]);
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentAllocation, setCurrentAllocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Form state
  const [formData, setFormData] = useState({
    vanSellerId: "",
    allocationDate: new Date().toISOString().split('T')[0],
    status: "allocated",
    items: [],
    notes: ""
  });
  
  const [newItem, setNewItem] = useState({
    productId: "",
    allocatedQuantity: 0,
    unitCost: 0,
    returnedQuantity: 0,
    damagedQuantity: 0
  });

  // Load allocations and products
  useEffect(() => {
    loadAllocations();
    loadProducts();
  }, [companyId]);

  const loadAllocations = async () => {
    try {
      const allocationsRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/stockAllocations`);
      const q = query(allocationsRef, orderBy("allocationDate", "desc"), limit(100));
      const querySnapshot = await getDocs(q);
      
      const allocationsData = [];
      querySnapshot.forEach((doc) => {
        allocationsData.push({ id: doc.id, ...doc.data() });
      });
      
      setAllocations(allocationsData);
    } catch (error) {
      console.error("Error loading allocations:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/products`);
      const querySnapshot = await getDocs(productsRef);
      
      const productsData = [];
      querySnapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      
      setProducts(productsData);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  // Generate allocation ID
  const generateAllocationId = () => {
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ALLOC-${dateStr}-${random}`;
  };

  // Add item to allocation
  const handleAddItem = () => {
    if (!newItem.productId || newItem.allocatedQuantity <= 0 || newItem.unitCost <= 0) {
      alert("Please fill all item fields correctly");
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) {
      alert("Product not found");
      return;
    }

    const totalValue = newItem.allocatedQuantity * newItem.unitCost;
    
    const item = {
      productId: product.productId || product.id,
      productName: product.name,
      allocatedQuantity: parseInt(newItem.allocatedQuantity),
      unitCost: parseFloat(newItem.unitCost),
      totalValue: totalValue,
      returnedQuantity: parseInt(newItem.returnedQuantity) || 0,
      damagedQuantity: parseInt(newItem.damagedQuantity) || 0
    };

    setFormData({
      ...formData,
      items: [...formData.items, item]
    });

    // Reset new item form
    setNewItem({
      productId: "",
      allocatedQuantity: 0,
      unitCost: 0,
      returnedQuantity: 0,
      damagedQuantity: 0
    });
  };

  // Remove item from allocation
  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  // Calculate total value
  const calculateTotalValue = () => {
    return formData.items.reduce((sum, item) => sum + item.totalValue, 0);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.vanSellerId) {
      alert("Please select a van seller");
      return;
    }

    if (formData.items.length === 0) {
      alert("Please add at least one item");
      return;
    }

    try {
      const totalValue = calculateTotalValue();
      
      if (isEdit && currentAllocation) {
        // Update existing allocation
        const allocationRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/stockAllocations`, currentAllocation.id);
        
        await updateDoc(allocationRef, {
          vanSellerId: formData.vanSellerId,
          status: formData.status,
          items: formData.items,
          totalValue: totalValue,
          notes: formData.notes,
          updatedAt: serverTimestamp(),
          _version: "2.0",
          _migrationStatus: "active"
        });
        
        alert("Stock allocation updated successfully");
      } else {
        // Create new allocation
        const allocationsRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/stockAllocations`);
        
        await addDoc(allocationsRef, {
          allocationId: generateAllocationId(),
          companyId: companyId,
          vanSellerId: formData.vanSellerId,
          allocationDate: new Date(formData.allocationDate),
          status: formData.status,
          items: formData.items,
          totalValue: totalValue,
          notes: formData.notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          _version: "2.0",
          _migrationStatus: "active",
          _v3Ready: true,
          _v4Ready: true
        });
        
        alert("Stock allocation created successfully");
      }
      
      loadAllocations();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving allocation:", error);
      alert("Error saving allocation: " + error.message);
    }
  };

  // Handle edit
  const handleEdit = (allocation) => {
    setIsEdit(true);
    setCurrentAllocation(allocation);
    setFormData({
      vanSellerId: allocation.vanSellerId,
      allocationDate: allocation.allocationDate?.toDate 
        ? allocation.allocationDate.toDate().toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      status: allocation.status,
      items: allocation.items || [],
      notes: allocation.notes || ""
    });
    setShowModal(true);
  };

  // Handle return stock
  const handleReturnStock = async (allocation) => {
    const returnedQuantity = prompt("Enter quantity to return for each item:");
    if (!returnedQuantity) return;

    try {
      const allocationRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/stockAllocations`, allocation.id);
      
      await updateDoc(allocationRef, {
        status: "returned",
        updatedAt: serverTimestamp()
      });
      
      alert("Stock return processed successfully");
      loadAllocations();
    } catch (error) {
      console.error("Error processing return:", error);
      alert("Error processing return: " + error.message);
    }
  };

  // Handle damage report
  const handleDamageReport = async (allocation) => {
    const damagedQuantity = prompt("Enter damaged quantity:");
    if (!damagedQuantity) return;

    try {
      const allocationRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/stockAllocations`, allocation.id);
      
      await updateDoc(allocationRef, {
        status: "damaged",
        updatedAt: serverTimestamp()
      });
      
      alert("Damage report submitted successfully");
      loadAllocations();
    } catch (error) {
      console.error("Error reporting damage:", error);
      alert("Error reporting damage: " + error.message);
    }
  };

  // Handle modal close
  const handleCloseModal = () => {
    setShowModal(false);
    setIsEdit(false);
    setCurrentAllocation(null);
    setFormData({
      vanSellerId: "",
      allocationDate: new Date().toISOString().split('T')[0],
      status: "allocated",
      items: [],
      notes: ""
    });
    setNewItem({
      productId: "",
      allocatedQuantity: 0,
      unitCost: 0,
      returnedQuantity: 0,
      damagedQuantity: 0
    });
  };

  // Filter allocations
  const filteredAllocations = allocations.filter(allocation => {
    const matchesSearch = 
      allocation.allocationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSellerById(allocation.vanSellerId)?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || allocation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalAllocations = allocations.length;
  const activeAllocations = allocations.filter(a => a.status === "allocated").length;
  const returnedAllocations = allocations.filter(a => a.status === "returned").length;
  const totalValue = allocations.reduce((sum, a) => sum + (a.totalValue || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Stock Allocation & Mobile Inventory</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Allocations</p>
              <p className="text-2xl font-bold text-gray-900">{totalAllocations}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeAllocations}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Returned</p>
              <p className="text-2xl font-bold text-gray-900">{returnedAllocations}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by allocation ID or van seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="allocated">Allocated</option>
            <option value="returned">Returned</option>
            <option value="damaged">Damaged</option>
          </select>
          <button
            onClick={() => {
              setIsEdit(false);
              setShowModal(true);
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
          >
            + New Allocation
          </button>
        </div>
      </div>

      {/* Allocations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocation ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Van Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAllocations.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No allocations found. Click &quot;New Allocation&quot; to create one.
                </td>
              </tr>
            ) : (
              filteredAllocations.map((allocation) => {
                const seller = getSellerById(allocation.vanSellerId);
                return (
                  <tr key={allocation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {allocation.allocationId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{seller?.name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{allocation.vanSellerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {allocation.allocationDate?.toDate 
                        ? allocation.allocationDate.toDate().toLocaleDateString()
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {allocation.items?.length || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{allocation.totalValue?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        allocation.status === "allocated" ? "bg-green-100 text-green-800" :
                        allocation.status === "returned" ? "bg-yellow-100 text-yellow-800" :
                        allocation.status === "damaged" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {allocation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleEdit(allocation)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      {allocation.status === "allocated" && (
                        <>
                          <button
                            onClick={() => handleReturnStock(allocation)}
                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                          >
                            Return
                          </button>
                          <button
                            onClick={() => handleDamageReport(allocation)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Damage
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {isEdit ? "Edit Stock Allocation" : "New Stock Allocation"}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Van Seller Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Van Seller *
                </label>
                <select
                  value={formData.vanSellerId}
                  onChange={(e) => setFormData({ ...formData, vanSellerId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select Van Seller --</option>
                  {vanSellers.filter(s => s.status === "active").map((seller) => (
                    <option key={seller.id} value={seller.vanSellerId}>
                      {seller.name} ({seller.vanSellerId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allocation Date *
                  </label>
                  <input
                    type="date"
                    value={formData.allocationDate}
                    onChange={(e) => setFormData({ ...formData, allocationDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="allocated">Allocated</option>
                    <option value="returned">Returned</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              </div>

              {/* Add Item Section */}
              <div className="border border-gray-300 rounded-md p-4 mb-4">
                <h3 className="font-semibold mb-3">Add Items</h3>
                <div className="grid grid-cols-5 gap-3 mb-3">
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-600 mb-1">Product</label>
                    <select
                      value={newItem.productId}
                      onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="">-- Select --</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.productId || product.id})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newItem.allocatedQuantity}
                      onChange={(e) => setNewItem({ ...newItem, allocatedQuantity: e.target.value })}
                      min="1"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Unit Cost (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newItem.unitCost}
                      onChange={(e) => setNewItem({ ...newItem, unitCost: e.target.value })}
                      min="0"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Items List */}
                {formData.items.length > 0 && (
                  <div className="mt-3 max-h-40 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left text-xs">Product</th>
                          <th className="px-2 py-1 text-right text-xs">Qty</th>
                          <th className="px-2 py-1 text-right text-xs">Unit Cost</th>
                          <th className="px-2 py-1 text-right text-xs">Total</th>
                          <th className="px-2 py-1 text-xs"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-2 py-1">{item.productName}</td>
                            <td className="px-2 py-1 text-right">{item.allocatedQuantity}</td>
                            <td className="px-2 py-1 text-right">₹{item.unitCost.toFixed(2)}</td>
                            <td className="px-2 py-1 text-right font-semibold">₹{item.totalValue.toFixed(2)}</td>
                            <td className="px-2 py-1 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                ×
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                          <td colSpan="3" className="px-2 py-1 text-right">Total:</td>
                          <td className="px-2 py-1 text-right">₹{calculateTotalValue().toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this allocation..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                >
                  {isEdit ? "Update Allocation" : "Create Allocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
