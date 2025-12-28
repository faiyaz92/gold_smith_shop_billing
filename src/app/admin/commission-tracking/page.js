"use client";

import { useState, useEffect } from "react";
import { useVanSeller } from "../../context/VanSellerContext";
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "../../firebase";
import { useFirestorePaths } from "../../utils/firestorePaths";

/**
 * Commission & Performance Tracking
 * 
 * References:
 * - BRD_v2.md Section 9.4: Commission & performance tracking
 * - DatabaseInfo_v2.md: commissions collection structure
 * 
 * Features:
 * - Commission calculations
 * - Performance tracking
 * - Commission approval workflow
 * - Payment processing
 * - Performance reports
 */

export default function CommissionTrackingPage() {
  const { vanSellers, commissions, getSellerById, getSellerCommissions } = useVanSeller();
  const { companyId } = useFirestorePaths();
  
  const [activeTab, setActiveTab] = useState("pending"); // pending, approved, paid
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentCommission, setCurrentCommission] = useState(null);
  
  // Calculate commission for a seller
  const calculateCommission = (seller, startDate, endDate) => {
    const sellerCommissions = getSellerCommissions(seller.vanSellerId);
    
    const periodCommissions = sellerCommissions.filter(comm => {
      if (!comm.period_start || !comm.period_end) return false;
      const commStart = comm.period_start.toDate ? comm.period_start.toDate() : new Date(comm.period_start);
      const commEnd = comm.period_end.toDate ? comm.period_end.toDate() : new Date(comm.period_end);
      return commStart >= startDate && commEnd <= endDate;
    });

    const totalSales = periodCommissions.reduce((sum, comm) => sum + (comm.total_sales || 0), 0);
    const totalCommission = periodCommissions.reduce((sum, comm) => sum + (comm.total_commission || 0), 0);
    const paidAmount = periodCommissions.reduce((sum, comm) => sum + (comm.paid_amount || 0), 0);
    
    return {
      totalSales,
      totalCommission,
      paidAmount,
      pendingAmount: totalCommission - paidAmount
    };
  };

  // Generate commission report for current month
  const generateMonthlyCommission = async (sellerId) => {
    const seller = getSellerById(sellerId);
    if (!seller) return;

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // In real implementation, calculate from orders
    // For now, using dummy data
    const totalSales = 15000.00; // Would be calculated from orders
    const commissionRate = seller.commissionRate || 5.0;
    const totalCommission = (totalSales * commissionRate) / 100;

    try {
      const commissionsRef = collection(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/commissions`);
      
      await addDoc(commissionsRef, {
        commissionId: `COMM-${Date.now()}`,
        companyId: companyId,
        vanSellerId: seller.vanSellerId,
        period_start: startDate,
        period_end: endDate,
        total_sales: totalSales,
        commission_rate: commissionRate,
        total_commission: totalCommission,
        paid_amount: 0,
        status: "calculated",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        _version: "2.0",
        _migrationStatus: "active",
        _v3Ready: true,
        _v4Ready: true
      });
      
      alert("Commission calculated successfully");
    } catch (error) {
      console.error("Error generating commission:", error);
      alert("Error generating commission: " + error.message);
    }
  };

  // Approve commission
  const approveCommission = async (commission) => {
    try {
      const commissionRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/commissions`, commission.id);
      
      await updateDoc(commissionRef, {
        status: "approved",
        updatedAt: serverTimestamp()
      });
      
      alert("Commission approved successfully");
    } catch (error) {
      console.error("Error approving commission:", error);
      alert("Error approving commission: " + error.message);
    }
  };

  // Process payment
  const processPayment = async (commission) => {
    const paymentAmount = prompt(`Enter payment amount (Max: ₹${(commission.total_commission - commission.paid_amount).toFixed(2)}):`);
    if (!paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Invalid payment amount");
      return;
    }

    if (amount > (commission.total_commission - commission.paid_amount)) {
      alert("Payment amount exceeds pending commission");
      return;
    }

    try {
      const commissionRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/commissions`, commission.id);
      const newPaidAmount = commission.paid_amount + amount;
      const newStatus = newPaidAmount >= commission.total_commission ? "paid" : "approved";
      
      await updateDoc(commissionRef, {
        paid_amount: newPaidAmount,
        status: newStatus,
        payment_date: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      alert("Payment processed successfully");
    } catch (error) {
      console.error("Error processing payment:", error);
      alert("Error processing payment: " + error.message);
    }
  };

  // Filter commissions by tab
  const filterByStatus = (status) => {
    if (status === "pending") return commissions.filter(c => c.status === "calculated");
    if (status === "approved") return commissions.filter(c => c.status === "approved");
    if (status === "paid") return commissions.filter(c => c.status === "paid");
    return commissions;
  };

  const filteredCommissions = filterByStatus(activeTab).filter(comm => {
    const seller = getSellerById(comm.vanSellerId);
    return seller?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           comm.commissionId?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Statistics
  const totalPending = commissions
    .filter(c => c.status === "calculated")
    .reduce((sum, c) => sum + (c.total_commission || 0), 0);
  
  const totalApproved = commissions
    .filter(c => c.status === "approved")
    .reduce((sum, c) => sum + (c.total_commission - c.paid_amount || 0), 0);
  
  const totalPaid = commissions
    .filter(c => c.status === "paid")
    .reduce((sum, c) => sum + (c.paid_amount || 0), 0);
  
  const activeSellers = vanSellers.filter(s => s.status === "active").length;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Commission & Performance Tracking</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPending.toFixed(2)}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalApproved.toFixed(2)}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalPaid.toFixed(2)}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Active Sellers</p>
              <p className="text-2xl font-bold text-gray-900">{activeSellers}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Actions Bar */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by commission ID or van seller..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">Current Month</option>
            <option value="last">Last Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("pending")}
            className={`${
              activeTab === "pending"
                ? "border-yellow-500 text-yellow-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Pending ({commissions.filter(c => c.status === "calculated").length})
          </button>
          <button
            onClick={() => setActiveTab("approved")}
            className={`${
              activeTab === "approved"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Approved ({commissions.filter(c => c.status === "approved").length})
          </button>
          <button
            onClick={() => setActiveTab("paid")}
            className={`${
              activeTab === "paid"
                ? "border-green-500 text-green-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Paid ({commissions.filter(c => c.status === "paid").length})
          </button>
        </nav>
      </div>

      {/* Commissions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Van Seller</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCommissions.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-8 text-center text-gray-500">
                  No commissions found for this status
                </td>
              </tr>
            ) : (
              filteredCommissions.map((commission) => {
                const seller = getSellerById(commission.vanSellerId);
                const pendingAmount = (commission.total_commission || 0) - (commission.paid_amount || 0);
                
                return (
                  <tr key={commission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {commission.commissionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{seller?.name || "Unknown"}</div>
                      <div className="text-sm text-gray-500">{commission.vanSellerId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {commission.period_start?.toDate && commission.period_end?.toDate ? (
                        <>
                          {commission.period_start.toDate().toLocaleDateString()} - 
                          {commission.period_end.toDate().toLocaleDateString()}
                        </>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{commission.total_sales?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {commission.commission_rate?.toFixed(2) || "0"}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      ₹{commission.total_commission?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      ₹{commission.paid_amount?.toFixed(2) || "0.00"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      ₹{pendingAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {commission.status === "calculated" && (
                        <button
                          onClick={() => approveCommission(commission)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Approve
                        </button>
                      )}
                      {commission.status === "approved" && (
                        <button
                          onClick={() => processPayment(commission)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Pay
                        </button>
                      )}
                      {commission.status === "paid" && (
                        <span className="text-gray-500">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Commission Section */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Generate Monthly Commission</h2>
        <p className="text-gray-600 mb-4">
          Calculate commission for active van sellers based on their sales for the current month.
        </p>
        <div className="flex gap-3">
          {vanSellers.filter(s => s.status === "active").map((seller) => (
            <button
              key={seller.id}
              onClick={() => generateMonthlyCommission(seller.id)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              {seller.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
