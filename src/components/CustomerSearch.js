'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../app/firebase';
import { Search, User, Phone, Plus } from 'lucide-react';

export default function CustomerSearch({
  value,
  onChange,
  onCustomerSelect,
  placeholder = "Search customers by name, phone, or code...",
  className = "",
  showAddNew = true,
  onAddNew
}) {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'goldsmith';

  // Search customers
  const searchCustomers = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const customersRef = collection(db, `companies/${companyId}/customers`);
      const searchTermLower = term.toLowerCase();

      // Search by multiple fields
      const queries = [
        // Search by name (starts with)
        query(customersRef, where('name', '>=', term), where('name', '<=', term + '\uf8ff'), limit(10)),
        // Search by phone (exact match first, then contains)
        query(customersRef, where('phone', '==', term), limit(10)),
        // Search by customer code
        query(customersRef, where('customerCode', '>=', searchTermLower), where('customerCode', '<=', searchTermLower + '\uf8ff'), limit(10))
      ];

      const results = new Map(); // Use Map to avoid duplicates

      for (const q of queries) {
        const querySnapshot = await getDocs(q);
        querySnapshot.docs.forEach(doc => {
          const customer = { id: doc.id, ...doc.data() };
          // Create a unique key for deduplication
          const key = customer.id;
          if (!results.has(key)) {
            results.set(key, customer);
          }
        });
      }

      // Convert to array and filter by search term for broader matching
      let filteredResults = Array.from(results.values()).filter(customer =>
        customer.name?.toLowerCase().includes(searchTermLower) ||
        customer.phone?.includes(term) ||
        customer.customerCode?.toLowerCase().includes(searchTermLower)
      );

      // Sort by relevance (exact phone match first, then name match, then code match)
      filteredResults.sort((a, b) => {
        const aPhoneMatch = a.phone === term ? 1 : 0;
        const bPhoneMatch = b.phone === term ? 1 : 0;
        if (aPhoneMatch !== bPhoneMatch) return bPhoneMatch - aPhoneMatch;

        const aNameMatch = a.name?.toLowerCase().startsWith(searchTermLower) ? 1 : 0;
        const bNameMatch = b.name?.toLowerCase().startsWith(searchTermLower) ? 1 : 0;
        return bNameMatch - aNameMatch;
      });

      setSearchResults(filteredResults.slice(0, 8)); // Limit to 8 results
    } catch (error) {
      console.error('Error searching customers:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        searchCustomers(searchTerm);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, searchResults.length));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          handleCustomerSelect(searchResults[selectedIndex]);
        } else if (showAddNew && onAddNew) {
          onAddNew(searchTerm);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle customer selection
  const handleCustomerSelect = (customer) => {
    setSearchTerm(`${customer.name} (${customer.phone})`);
    setShowResults(false);
    setSelectedIndex(-1);
    onCustomerSelect(customer);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setSelectedIndex(-1);
    onChange(value);
  };

  // Handle focus
  const handleFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {isSearching && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {searchResults.length > 0 ? (
            <>
              {searchResults.map((customer, index) => (
                <div
                  key={customer.id}
                  onClick={() => handleCustomerSelect(customer)}
                  className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </span>
                        {customer.customerCode && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {customer.customerCode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        Balance: ₹{customer.balance?.toLocaleString() || '0'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Customer Option */}
              {showAddNew && onAddNew && (
                <div
                  onClick={() => onAddNew(searchTerm)}
                  className={`px-4 py-3 cursor-pointer border-t border-gray-200 hover:bg-gray-50 flex items-center gap-2 ${
                    selectedIndex === searchResults.length ? 'bg-blue-50' : ''
                  }`}
                >
                  <Plus className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">Add New Customer</span>
                  <span className="text-gray-500 text-sm">&ldquo;{searchTerm}&rdquo;</span>
                </div>
              )}
            </>
          ) : searchTerm.trim() && !isSearching ? (
            <div className="px-4 py-3 text-gray-500 text-center">
              {showAddNew && onAddNew ? (
                <div
                  onClick={() => onAddNew(searchTerm)}
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">Add New Customer</span>
                  <span className="text-gray-500 text-sm">&ldquo;{searchTerm}&rdquo;</span>
                </div>
              ) : (
                'No customers found'
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}