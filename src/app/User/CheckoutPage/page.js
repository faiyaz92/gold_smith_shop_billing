'use client';
import { Suspense } from 'react';
import CheckoutPageInner from './CheckoutPageInner';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div>Loading checkout...</div>}>
      <CheckoutPageInner />
    </Suspense>
  );
}
