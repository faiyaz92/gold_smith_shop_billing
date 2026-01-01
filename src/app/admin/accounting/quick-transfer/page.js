"use client";
import { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, serverTimestamp, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { useAccounting } from '@/app/context/AccountingContext';
import { subscribeToAccounts, createJournalEntry } from '@/utils/accountingEngineUtils';
import { ArrowRightLeft, ArrowLeft, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickTransferPage() {
  const router = useRouter();
  const { companyId, userRole } = useAccounting();
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch accounts using centralized utility
  useEffect(() => {
    if (!companyId) return;

    const unsubscribe = subscribeToAccounts(companyId, (accountsData) => {
      setAccounts(accountsData);
    });

    return () => unsubscribe();
  }, [companyId]);

  // Helper function to check if account has children
  const hasChildren = (accountId) => {
    return accounts.some(acc => 
      acc.parentAccount === accountId || 
      acc.parentAccount === accounts.find(a => a.id === accountId)?.accountCode ||
      acc.parentAccount === accounts.find(a => a.id === accountId)?.id
    );
  };

  // Validate transfer
  const validateTransfer = () => {
    const newErrors = {};

    if (!fromAccount) {
      newErrors.fromAccount = 'Please select source account';
    }

    if (!toAccount) {
      newErrors.toAccount = 'Please select destination account';
    }

    if (fromAccount === toAccount) {
      newErrors.toAccount = 'Source and destination accounts must be different';
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    if (!description.trim()) {
      newErrors.description = 'Please enter a description';
    }

    // Check if FROM account has children (parent account)
    if (fromAccount) {
      const fromAcc = accounts.find(a => a.id === fromAccount);
      if (fromAcc && hasChildren(fromAccount)) {
        newErrors.fromAccount = `❌ Cannot transfer from parent account "${fromAcc.accountCode} - ${fromAcc.accountName}". Use sub-accounts instead.`;
      }
    }

    // Check if TO account has children (parent account)
    if (toAccount) {
      const toAcc = accounts.find(a => a.id === toAccount);
      if (toAcc && hasChildren(toAccount)) {
        newErrors.toAccount = `❌ Cannot transfer to parent account "${toAcc.accountCode} - ${toAcc.accountName}". Use sub-accounts instead.`;
      }
    }

    // Check for parent-child relationship
    if (fromAccount && toAccount && !newErrors.fromAccount && !newErrors.toAccount) {
      const fromAcc = accounts.find(a => a.id === fromAccount);
      const toAcc = accounts.find(a => a.id === toAccount);

      if (fromAcc && toAcc) {
        // Check if one is parent of the other
        const isParentChild = 
          fromAcc.parentAccount === toAccount || 
          fromAcc.parentAccount === toAcc.accountCode ||
          toAcc.parentAccount === fromAccount ||
          toAcc.parentAccount === fromAcc.accountCode;

        if (isParentChild) {
          newErrors.toAccount = '❌ Cannot transfer between parent and sub-accounts (Accounting Standard)';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Execute transfer (creates journal entry with engine validation)
  const executeTransfer = async () => {
    if (!validateTransfer()) return;

    setSaving(true);

    try {
      const fromAcc = accounts.find(a => a.id === fromAccount);
      const toAcc = accounts.find(a => a.id === toAccount);
      const transferAmount = parseFloat(amount);

      // ✅ Use centralized function with engine-level validation
      await createJournalEntry(companyId, {
        date: new Date().toISOString().split('T')[0],
        description: description || `Transfer from ${fromAcc.accountName} to ${toAcc.accountName}`,
        reference: `TRANSFER-${Date.now()}`,
        createdBy: userRole,
        entries: [
          {
            accountId: toAccount,
            accountCode: toAcc.accountCode,
            accountName: toAcc.accountName,
            debit: transferAmount,
            credit: 0
          },
          {
            accountId: fromAccount,
            accountCode: fromAcc.accountCode,
            accountName: fromAcc.accountName,
            debit: 0,
            credit: transferAmount
          }
        ],
        totalDebit: transferAmount,
        totalCredit: transferAmount,
        status: 'posted',
        entryType: 'quick-transfer'
      });

      console.log('✅ Transfer completed with engine validation');

      alert(`✅ Transfer successful!\n\nTransferred ${transferAmount} from ${fromAcc.accountName} to ${toAcc.accountName}\n\nJournal entry created with validation.`);
      
      // Reset form
      setFromAccount('');
      setToAccount('');
      setAmount('');
      setDescription('');
      setErrors({});
      
    } catch (error) {
      console.error('❌ Transfer failed:', error);
      alert(`❌ Transfer failed:\n\n${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!companyId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          Please select a company first.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/accounting')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Accounting
        </button>
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-8 h-8 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quick Transfer</h1>
            <p className="text-gray-600 mt-1">Transfer funds between accounts (Auto-creates journal entry)</p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">How it works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Select source account (money going out)</li>
              <li>Select destination account (money coming in)</li>
              <li>Enter amount once</li>
              <li>System automatically creates balanced journal entry</li>
              <li>Account balances update automatically</li>
              <li>Entry appears in Journal Entries & General Ledger</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Transfer Form */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="space-y-6">
          {/* From Account */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From Account (Source) <span className="text-red-500">*</span>
            </label>
            <select
              value={fromAccount}
              onChange={(e) => {
                setFromAccount(e.target.value);
                setErrors({ ...errors, fromAccount: '' });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.fromAccount ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select Source Account --</option>
              {accounts
                .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
                .map(acc => {
                  const isSubAccount = acc.level === 2 || acc.parentAccount;
                  const prefix = isSubAccount ? '\u00A0\u00A0\u00A0\u00A0↳ ' : '';
                  const balanceText = acc.currentBalance !== undefined ? ` (Balance: ${acc.currentBalance.toFixed(2)})` : '';
                  return (
                    <option 
                      key={acc.id} 
                      value={acc.id}
                      className={isSubAccount ? 'text-gray-600' : 'font-semibold'}
                    >
                      {prefix}{acc.accountCode} - {acc.accountName}{balanceText}
                    </option>
                  );
                })}
            </select>
            {errors.fromAccount && (
              <p className="text-red-500 text-sm mt-1">{errors.fromAccount}</p>
            )}
          </div>

          {/* Transfer Arrow */}
          <div className="flex justify-center">
            <div className="bg-purple-100 rounded-full p-3">
              <ArrowRightLeft className="w-6 h-6 text-purple-600" />
            </div>
          </div>

          {/* To Account */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To Account (Destination) <span className="text-red-500">*</span>
            </label>
            <select
              value={toAccount}
              onChange={(e) => {
                setToAccount(e.target.value);
                setErrors({ ...errors, toAccount: '' });
              }}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.toAccount ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select Destination Account --</option>
              {accounts
                .sort((a, b) => a.accountCode.localeCompare(b.accountCode))
                .map(acc => {
                  const isSubAccount = acc.level === 2 || acc.parentAccount;
                  const prefix = isSubAccount ? '\u00A0\u00A0\u00A0\u00A0↳ ' : '';
                  const balanceText = acc.currentBalance !== undefined ? ` (Balance: ${acc.currentBalance.toFixed(2)})` : '';
                  return (
                    <option 
                      key={acc.id} 
                      value={acc.id}
                      className={isSubAccount ? 'text-gray-600' : 'font-semibold'}
                    >
                      {prefix}{acc.accountCode} - {acc.accountName}{balanceText}
                    </option>
                  );
                })}
            </select>
            {errors.toAccount && (
              <p className="text-red-500 text-sm mt-1">{errors.toAccount}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrors({ ...errors, amount: '' });
              }}
              placeholder="Enter amount"
              step="any"
              min="0"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.amount ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description/Narration <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setErrors({ ...errors, description: '' });
              }}
              placeholder="e.g., Transfer to savings account, Cash deposit to bank, etc."
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          {/* Preview */}
          {fromAccount && toAccount && amount && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Journal Entry Preview:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Debit:</span>
                  <span className="font-medium">
                    {accounts.find(a => a.id === toAccount)?.accountName} - {parseFloat(amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit:</span>
                  <span className="font-medium">
                    {accounts.find(a => a.id === fromAccount)?.accountName} - {parseFloat(amount || 0).toFixed(2)}
                  </span>
                </div>
                <div className="border-t border-gray-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>
                      Debit: {parseFloat(amount || 0).toFixed(2)} | Credit: {parseFloat(amount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={executeTransfer}
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Processing Transfer...' : '✅ Execute Transfer'}
            </button>
            <button
              onClick={() => router.push('/admin/accounting')}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Recent Transfers */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> All transfers are recorded as standard journal entries. 
          You can view them in <button onClick={() => router.push('/admin/accounting/journal-entries')} className="text-blue-600 hover:underline">Journal Entries</button> and 
          account details in <button onClick={() => router.push('/admin/accounting/general-ledger')} className="text-blue-600 hover:underline">General Ledger</button>.
        </p>
      </div>
    </div>
  );
}
