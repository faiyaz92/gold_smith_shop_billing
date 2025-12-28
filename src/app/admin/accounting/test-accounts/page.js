// src/app/admin/accounting/test-accounts/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { runAccountCreationTests } from '../../../../utils/testAccountCreation';

export default function TestAccountsPage() {
  const [testResults, setTestResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [companyId, setCompanyId] = useState('');

  // Get company ID from environment or localStorage
  useEffect(() => {
    const envCompanyId = process.env.NEXT_PUBLIC_COMPANY_ID || 'laundry_q8';
    setCompanyId(envCompanyId);

    // Also check localStorage for any override
    const storedCompanyId = localStorage.getItem('selectedCompanyId');
    if (storedCompanyId) {
      setCompanyId(storedCompanyId);
    }
  }, []);

  const runTests = async () => {
    if (!companyId) {
      alert('Please enter a company ID to test');
      return;
    }

    setIsRunning(true);
    setTestResults(null);

    try {
      const results = await runAccountCreationTests(companyId);
      setTestResults(results);
    } catch (error) {
      setTestResults({
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        errors: [`Test execution failed: ${error.message}`]
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          🧪 Account Creation & Hierarchy Tests
        </h1>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            This test validates the CompanyInitializationEngine functionality by checking:
          </p>
          <ul className="list-disc list-inside text-gray-600 space-y-1">
            <li>All 39 core accounts exist with correct account IDs</li>
            <li>Account hierarchy structure is properly maintained</li>
            <li>Account codes and names match BRD specifications</li>
            <li>Account types and classifications are correct</li>
            <li>Normal balance settings follow accounting principles</li>
            <li>Company initialization status is properly set</li>
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company ID to Test
          </label>
          <input
            type="text"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            placeholder="Enter company ID (e.g., COMPANY_TEST_001)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={runTests}
          disabled={isRunning || !companyId}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isRunning ? '🧪 Running Tests...' : '▶️ Run Account Creation Tests'}
        </button>

        {testResults && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Test Results</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{testResults.totalTests}</div>
                <div className="text-sm text-blue-800">Total Tests</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{testResults.passedTests}</div>
                <div className="text-sm text-green-800">Passed</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{testResults.failedTests}</div>
                <div className="text-sm text-red-800">Failed</div>
              </div>
            </div>

            {testResults.failedTests > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">❌ Test Failures</h3>
                <ul className="list-disc list-inside text-red-700 space-y-1">
                  {testResults.errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {testResults.failedTests === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">✅ All Tests Passed!</h3>
                <p className="text-green-700">
                  The CompanyInitializationEngine is working correctly. All 39 core accounts have been created with proper hierarchy, codes, types, and classifications as specified in BRD_v2.md Section 6.1.
                </p>
              </div>
            )}

            <div className="mt-6 text-sm text-gray-500">
              <p>
                <strong>Test Reference:</strong> BRD_v2.md Section 6.1 (Account Hierarchy & Structure), TechnicalDoc_v2.md Section 7 (Accounting Engine)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}