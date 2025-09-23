'use client';

import { useState, useEffect } from 'react';
import { auth, db, RecaptchaVerifier } from '@/app/firebase';
import { 
  signInWithPhoneNumber, 
  signInWithPopup, 
  GoogleAuthProvider,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/Componenets/Navbar';
import { useTranslation } from '@/app/utils/useTranslation'; // <-- import

export default function UserLogin() {
  const companyId = process.env.NEXT_PUBLIC_COMPANY_ID || '';
  const basePath = 'Easy2Solutions/companyDirectory';
  const tenantCompaniesPath = `${basePath}/tenantCompanies`;
  const userPath = (userId) => `${tenantCompaniesPath}/${companyId}/users/${userId}`;

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [confirmResult, setConfirmResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { t } = useTranslation(); // <-- use translation

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider();

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/');
      }
    });
    return () => unsubscribe();
  }, [router]);

  const setupCaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          window.recaptchaVerifier.clear();
        },
      });
    }
  };

  const sendOTP = async () => {
    const sanitizedPhone = phone.replace(/\D/g, '');

    if (sanitizedPhone.length !== 10) {
      alert(t('enterValidPhone'));
      return;
    }

    setupCaptcha();
    const appVerifier = window.recaptchaVerifier;
    setLoading(true);

    try {
      const result = await signInWithPhoneNumber(auth, `+91${sanitizedPhone}`, appVerifier);
      setConfirmResult(result);
      setStep(2);
    } catch (error) {
      alert(t('otpSendFailed'));
      window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || !confirmResult) return;
    setLoading(true);

    try {
      const res = await confirmResult.confirm(otp);
      const user = res.user;

      await setDoc(doc(db, userPath(user.uid)), {
        uid: user.uid,
        phone: user.phoneNumber,
        userType: 'Customer',
        createdAt: new Date(),
      });

      alert(t('loginSuccess'));
      router.push('/');
    } catch (err) {
      alert(t('invalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  // Google Sign In
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(doc(db, userPath(user.uid)), {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        userType: 'Customer',
        createdAt: new Date(),
      });

      alert(t('googleLoginSuccess'));
      router.push('/');
    } catch (error) {
      alert(t('googleLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-full max-w-md p-6 rounded-lg bg-white border border-blue-600/20">
          <h1 className="text-2xl font-normal mb-6 text-center text-blue-600">{t('userLogin')}</h1>

          <div id="recaptcha-container" />

          {step === 1 && (
            <div className="space-y-4">
              <input
                type="tel"
                placeholder={t('phonePlaceholder')}
                className="w-full px-4 py-2 bg-white border border-blue-600/30 rounded-md text-blue-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50 transition-all duration-300"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
              />

              <button
                onClick={sendOTP}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 group ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? t('sendingOtp') : t('verifyOtp')}
              </button>

              <div className="flex items-center my-4">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="mx-4 text-gray-500">{t('or')}</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md font-medium text-white bg-red-600 hover:bg-red-500 transition-all duration-300 group flex items-center justify-center ${loading ? 'opacity-70' : ''}`}
              >
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                </svg>
                {loading ? t('signingIn') : t('continueWithGoogle')}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder={t('enterOtp')}
                className="w-full px-4 py-2 bg-white border border-blue-600/30 rounded-md text-blue-600 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/50 transition-all duration-300"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />

              <button
                onClick={verifyOTP}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md font-medium text-white bg-blue-600 hover:bg-blue-500 transition-all duration-300 group ${loading ? 'opacity-70' : ''}`}
              >
                {loading ? t('verifying') : t('submit')}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
