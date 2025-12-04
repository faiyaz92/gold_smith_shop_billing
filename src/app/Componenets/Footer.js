export default function Footer({ className = "" }) {
  return (
    <footer className={`bg-gray-800 text-white py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Easy2Solutions</h3>
            <p className="text-gray-400 text-sm">
              Comprehensive business management solutions for modern enterprises.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Laundry Management</li>
              <li>Inventory Control</li>
              <li>Order Processing</li>
              <li>Analytics</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Help Center</li>
              <li>Contact Us</li>
              <li>Documentation</li>
              <li>API Reference</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Privacy Policy</li>
              <li>Terms of Service</li>
              <li>Cookie Policy</li>
              <li>Compliance</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; 2024 Easy2Solutions. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}