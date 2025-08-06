'use client';

import { useState } from 'react';
import { auth, db, RecaptchaVerifier } from '@/app/firebase';
import { signInWithPhoneNumber } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Navbar from '@/app/components/Navbar';

export default function UserLogin() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [confirmResult, setConfirmResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const setupCaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: (response) => {
          console.log('reCAPTCHA solved');
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
      alert('Enter a valid 10-digit phone number');
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
      console.error('OTP send error:', error);
      alert('Failed to send OTP. Make sure billing is enabled in Firebase.');
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

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        phone: user.phoneNumber,
        createdAt: new Date(),
      });

      alert('✅ Login successful!');
      router.push('/');
    } catch (err) {
      console.error('OTP verification failed:', err);
      alert('❌ Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>

      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-black/80 backdrop-blur-md transition-all duration-500">
        <div className="w-full max-w-md p-6 rounded-lg bg-black/90 backdrop-blur-md border border-yellow-500/20">
          <h1 className="text-2xl font-normal mb-6 text-center text-yellow-500">USER LOGIN</h1>

          <div id="recaptcha-container" />

          {step === 1 && (
            <div className="space-y-4">
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-md text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all duration-300"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
              />

              <button
                onClick={sendOTP}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md font-medium text-black bg-yellow-500 hover:bg-yellow-300 transition-all duration-300 group ${loading ? 'opacity-70' : ''
                  }`}
              >
                {loading ? 'Sending OTP...' : 'VERIFY OTP'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter OTP"
                className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-md text-white focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500/50 transition-all duration-300"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />

              <button
                onClick={verifyOTP}
                disabled={loading}
                className={`w-full py-2 px-4 rounded-md font-medium text-black bg-yellow-500 hover:bg-yellow-300 transition-all duration-300 group ${loading ? 'opacity-70' : ''
                  }`}
              >
                {loading ? 'Verifying...' : 'SUBMIT'}
              </button>
            </div>
          )}
        </div>
      </div>
      </>
      );
}