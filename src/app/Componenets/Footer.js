'use client';

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 grid sm:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 className="font-semibold tracking-tight mb-2">Contact</h3>
          <p>Email: support@easy2laundry.com</p>
          <p>Phone: +91 90000 00000</p>
        </div>
        <div>
          <h3 className="font-semibold tracking-tight mb-2">Address</h3>
          <p>123 Clean Street, Mumbai</p>
          <p>India 400001</p>
        </div>
        <div>
          <h3 className="font-semibold tracking-tight mb-2">Support</h3>
          <p>FAQs</p>
          <p>Privacy Policy</p>
        </div>
      </div>
      <div className="text-center py-4 bg-gray-50 text-xs text-gray-600">
        © 2025 Easy2 Laundry. All rights reserved.
      </div>
    </footer>
  );
}