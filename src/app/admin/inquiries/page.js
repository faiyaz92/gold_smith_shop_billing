'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import AdminLayout from '../AdminLayout';

const STATUS_OPTIONS = [
  'pending',
  'working',
  'processing',
  'solved',
  'cancelled',
  'close with fail',
  'close with success',
];

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const contactPath = `${tenantCompaniesPath}/${companyId}/contactUs`;

  useEffect(() => {
    const fetchInquiries = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(collection(db, contactPath));
        setInquiries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Error fetching inquiries:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, [contactPath]);

  const handleStatusChange = async (id, status) => {
    try {
      await updateDoc(doc(db, contactPath, id), { status });
      setInquiries(inquiries => inquiries.map(i => i.id === id ? { ...i, status } : i));
    } catch (error) {
      console.error('Error updating inquiry status:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-blue-700">Customer Inquiries</h1>
        {loading ? (
          <div className="text-center text-gray-500 p-6">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-blue-50 text-blue-800 text-xs sm:text-sm">
                <tr>
                  <th className="p-3 text-left border-b border-gray-200">Name</th>
                  <th className="p-3 text-left border-b border-gray-200">Email</th>
                  <th className="p-3 text-left border-b border-gray-200 hidden sm:table-cell">Purpose</th>
                  <th className="p-3 text-left border-b border-gray-200 hidden md:table-cell">Message</th>
                  <th className="p-3 text-left border-b border-gray-200">Status</th>
                  <th className="p-3 text-left border-b border-gray-200 hidden lg:table-cell">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                  <tr><td colSpan={6} className="p-4 text-center text-gray-500 text-sm sm:text-base">No inquiries found</td></tr>
                ) : (
                  inquiries.map(inq => (
                    <tr key={inq.id} className="border-b hover:bg-blue-50 text-xs sm:text-sm">
                      <td className="p-3">{inq.name}</td>
                      <td className="p-3">{inq.email}</td>
                      <td className="p-3 hidden sm:table-cell">{inq.purpose}</td>
                      <td className="p-3 hidden md:table-cell">{inq.message}</td>
                      <td className="p-3">
                        <select
                          className="border border-gray-200 rounded px-2 py-1 text-xs sm:text-sm focus:ring-1 focus:ring-blue-200"
                          value={inq.status || 'pending'}
                          onChange={e => handleStatusChange(inq.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 hidden lg:table-cell text-xs">{inq.timestamp?.toDate ? inq.timestamp.toDate().toLocaleString() : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}