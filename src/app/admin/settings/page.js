'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/app/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AdminLayout from '../AdminLayout';
import { uploadToCloudinary, deleteFromCloudinary } from '@/app/cloudinary';
import Image from 'next/image';
import { Upload, Trash2, Save } from 'lucide-react';

const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
const settingsDocRef = doc(
  db,
  `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/settings/general`
);

export default function AdminSettings() {
  const [form, setForm] = useState({
    companyName: '',
    contactNumber: '',
    email: '',
    address: '',
    faqs: '',
    privacyPolicy: '',
    logoUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingLogo, setSavingLogo] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const fileInputRef = useRef();

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      try {
        const snap = await getDoc(settingsDocRef);
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            companyName: data.companyName || '',
            contactNumber: data.contactNumber || '',
            email: data.email || '',
            address: data.address || '',
            faqs: data.faqs || '',
            privacyPolicy: data.privacyPolicy || '',
            logoUrl: data.logoUrl || '',
          });
          setLogoPreview(data.logoUrl || '');
        }
      } catch (error) {
        setUploadError('Failed to load settings');
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Handle logo file selection (preview only)
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setUploadError('');
  };

  // Remove logo (preview only)
  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setForm(prev => ({ ...prev, logoUrl: '' }));
  };

  // Save logo (upload/delete only on click)
  const handleSaveLogo = async () => {
    setSavingLogo(true);
    setUploadError('');
    try {
      let updatedLogoUrl = form.logoUrl;
      // If removing logo
      if (!logoFile && !logoPreview && form.logoUrl) {
        await deleteFromCloudinary(form.logoUrl);
        updatedLogoUrl = '';
      }
      // If uploading new logo
      if (logoFile) {
        if (form.logoUrl) {
          await deleteFromCloudinary(form.logoUrl);
        }
        const imageUrl = await uploadToCloudinary(logoFile);
        updatedLogoUrl = imageUrl;
      }
      await setDoc(settingsDocRef, { ...form, logoUrl: updatedLogoUrl }, { merge: true });
      setForm(prev => ({ ...prev, logoUrl: updatedLogoUrl }));
      setLogoFile(null);
      setLogoPreview(updatedLogoUrl);
      alert('Logo updated!');
    } catch (error) {
      setUploadError('Failed to save logo');
    }
    setSavingLogo(false);
  };

  // Save company info (including company name)
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setUploadError('');
    try {
      await setDoc(settingsDocRef, form, { merge: true });
      alert('Company information updated!');
    } catch (error) {
      setUploadError('Failed to save information');
    }
    setSavingInfo(false);
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8 p-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Company Settings</h1>
          <p className="text-blue-100">Manage your company information, logo, and policies</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-8">
            {/* Logo Section */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Company Logo
              </h2>
              <div className="flex items-start gap-6">
                {/* Logo Preview */}
                <div className="flex-shrink-0">
                  {logoPreview ? (
                    <div className="relative w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <Image
                        src={logoPreview}
                        alt="Company Logo"
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                      <Upload className="w-8 h-8 mb-2" />
                      <span className="text-sm">No Logo</span>
                    </div>
                  )}
                </div>
                {/* Logo Actions */}
                <div className="flex-1 space-y-4">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={savingLogo}
                    >
                      <Upload className="w-4 h-4" />
                      {logoPreview ? 'Replace Logo' : 'Upload Logo'}
                    </button>
                    {(logoPreview || logoFile) && (
                      <button
                        type="button"
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                        onClick={handleRemoveLogo}
                        disabled={savingLogo}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      onClick={handleSaveLogo}
                      disabled={savingLogo || (!logoFile && !(!logoPreview && form.logoUrl))}
                    >
                      <Save className="w-4 h-4" />
                      {savingLogo ? 'Saving...' : 'Save Logo'}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoChange}
                  />
                  {uploadError && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                      {uploadError}
                    </div>
                  )}
                  <p className="text-sm text-gray-600">
                    Upload a high-quality logo (PNG, JPG, or SVG). Recommended size: 200x200px or larger.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Company Information</h2>
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name
                  </label>
                  <input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Company Name"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number
                    </label>
                    <input
                      name="contactNumber"
                      value={form.contactNumber}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your complete address"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingInfo ? 'Saving...' : 'Save Company Info'}
                </button>
              </form>
            </div>

            {/* Policies Section */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* FAQs */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">FAQs Management</h2>
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequently Asked Questions
                    </label>
                    <textarea
                      name="faqs"
                      value={form.faqs}
                      onChange={handleChange}
                      rows={8}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Q: How to place an order?&#10;A: You can place an order through our website...&#10;&#10;Q: What are your delivery timings?&#10;A: We deliver from 9 AM to 9 PM..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full justify-center"
                  >
                    <Save className="w-4 h-4" />
                    {savingInfo ? 'Saving...' : 'Save FAQs'}
                  </button>
                </form>
              </div>

              {/* Privacy Policy */}
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Privacy Policy</h2>
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Privacy Policy Content
                    </label>
                    <textarea
                      name="privacyPolicy"
                      value={form.privacyPolicy}
                      onChange={handleChange}
                      rows={8}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Our Privacy Policy&#10;&#10;1. Information We Collect&#10;We collect information you provide directly to us...&#10;&#10;2. How We Use Your Information&#10;We use the information we collect to..."
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingInfo}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 w-full justify-center"
                  >
                    <Save className="w-4 h-4" />
                    {savingInfo ? 'Saving...' : 'Save Privacy Policy'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}