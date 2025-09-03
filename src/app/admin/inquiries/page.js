'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { getCompanyId } from '@/app/utils/firestorePaths';
import AdminHeader from '../Componenets/AdminHeader'; // Adjust the path to match your project structure

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
  const [activeTab, setActiveTab] = useState('inquiries'); // Set default active tab to 'inquiries'
  const companyId = getCompanyId();
  const contactPath = `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/contactUs`;

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
    <div className="min-h-screen bg-white text-gray-800">
      <AdminHeader activeTab={activeTab} setActiveTab={setActiveTab} showTabContent={true} />
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-blue-700">Customer Inquiries</h1>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <thead className="bg-blue-50">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Purpose</th>
                  <th className="p-3 text-left">Message</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">No inquiries found</td></tr>
                ) : (
                  inquiries.map(inq => (
                    <tr key={inq.id} className="border-b">
                      <td className="p-3">{inq.name}</td>
                      <td className="p-3">{inq.email}</td>
                      <td className="p-3">{inq.purpose}</td>
                      <td className="p-3">{inq.message}</td>
                      <td className="p-3">
                        <select
                          className="border rounded px-2 py-1"
                          value={inq.status || 'pending'}
                          onChange={e => handleStatusChange(inq.id, e.target.value)}
                        >
                          {STATUS_OPTIONS.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 text-xs text-gray-500">{inq.timestamp?.toDate ? inq.timestamp.toDate().toLocaleString() : ''}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}