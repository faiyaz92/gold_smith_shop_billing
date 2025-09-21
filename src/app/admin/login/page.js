'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/app/firebase';

export default function AdminLogin() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        
        try {
            // Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Get companyId from env
            const companyId = process.env.NEXT_PUBLIC_COMPANY_ID;
            
            // Get user doc from Firestore using Firebase Auth UID
            const userDocRef = doc(db, `Easy2Solutions/companyDirectory/tenantCompanies/${companyId}/users/${user.uid}`);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Store all user information in localStorage
                localStorage.setItem('adminAuth', 'true');
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('userEmail', userData.email || user.email);
                localStorage.setItem('userName', userData.name || '');
                localStorage.setItem('userRole', userData.role || '');
                localStorage.setItem('userStatus', userData.status || '');
                localStorage.setItem('userPhone', userData.phone || '');
                localStorage.setItem('userBranchId', userData.branchId || '');
                localStorage.setItem('userNotes', userData.notes || '');
                localStorage.setItem('firebaseUid', user.uid);
                
                // Update last login time in Firestore
                try {
                    await updateDoc(userDocRef, {
                        lastLogin: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                } catch (updateError) {
                    console.log('Could not update last login time:', updateError);
                }
                
                console.log('User logged in successfully:', userData);
                
                const roleDefaults = {
                    company_admin: '/admin/dashboard',
                    general_manager: '/admin/dashboard',
                    branch_manager: '/admin/dashboard', 
                    cashier: '/admin/billing',
                    delivery_man: '/admin/orders',
                    pickup_man: '/admin/orders',
                };

                const defaultPage = roleDefaults[userData.role] || '/admin/dashboard';
                router.push(defaultPage);
                
            } else {
                setError('User not found in company records.');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Invalid credentials or login failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100"
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white border border-gray-200 rounded-lg p-6 sm:p-8 space-y-6 shadow-lg"
            >
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                >
                    <motion.h2
                        whileHover={{ scale: 1.02 }}
                        className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent"
                    >
                        Admin Login
                    </motion.h2>
                    <p className="mt-2 text-sm text-gray-600">Enter your credentials to access the dashboard</p>
                </motion.div>

                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="p-3 bg-red-100 text-red-700 rounded text-sm border border-red-200">
                                {error}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleLogin} className="space-y-4">
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-2"
                    >
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@example.com"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-2"
                    >
                        <label className="text-sm font-medium text-gray-700">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-600" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                                required
                            />
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            className={`w-full py-2 rounded font-medium flex items-center justify-center ${
                                isLoading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                            } transition-all`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Authenticating...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </motion.button>
                    </motion.div>
                </form>
            </motion.div>
        </motion.div>
    );
}