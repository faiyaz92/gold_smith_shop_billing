import { FiX } from 'react-icons/fi';
import { useRef } from 'react';

export function AboutUsModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <FiX size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">About Easy2 Laundry</h2>
        <p className="text-gray-700 mb-2">Easy2 Laundry is your trusted partner for fast, reliable, and affordable laundry and dry cleaning services. We pick up, clean, and deliver your clothes right to your doorstep, so you can focus on what matters most.</p>
        <ul className="list-disc pl-6 text-gray-600 mb-2">
          <li>Doorstep pickup and delivery</li>
          <li>Professional cleaning for all garments</li>
          <li>Express and eco-friendly options</li>
          <li>Transparent pricing</li>
          <li>Customer support 7 days a week</li>
        </ul>
        <p className="text-gray-700">We are committed to making laundry day hassle-free for families, professionals, and businesses alike.</p>
      </div>
    </div>
  );
}

export function ContactUsModal({
  open,
  onClose,
  contactName,
  contactEmail,
  contactPurpose,
  contactMessage,
  contactLoading,
  contactError,
  contactSuccess,
  handleContactSubmit,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={onClose}>
          <FiX size={24} />
        </button>
        <h2 className="text-2xl font-bold mb-4 text-blue-700">Contact Us</h2>
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input ref={contactName} type="text" className="w-full border border-gray-300 rounded px-3 py-2" required disabled={contactLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input ref={contactEmail} type="email" className="w-full border border-gray-300 rounded px-3 py-2" required disabled={contactLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purpose</label>
            <select ref={contactPurpose} className="w-full border border-gray-300 rounded px-3 py-2" required disabled={contactLoading} defaultValue="">
              <option value="" disabled>Select purpose</option>
              <option value="B2B">B2B Partnership</option>
              <option value="Bulk">Bulk Order</option>
              <option value="Marriage">Marriage Clothes</option>
              <option value="Recurring">Recurring Service</option>
              <option value="Issue">Issue</option>
              <option value="Concern">Concern</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea ref={contactMessage} className="w-full border border-gray-300 rounded px-3 py-2" rows={4} required disabled={contactLoading}></textarea>
          </div>
          {contactError && <p className="text-red-500 text-sm">{contactError}</p>}
          {contactSuccess && <p className="text-green-600 text-sm">{contactSuccess}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded" disabled={contactLoading}>
            {contactLoading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  );
}