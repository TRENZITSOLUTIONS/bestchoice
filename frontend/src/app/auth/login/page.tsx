'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';

function LoginPanel() {
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') ?? '');

  return (
    <div className="mx-auto max-w-[420px] px-4 py-16 text-center">
      <h1 className="display text-2xl mb-2">Sign in to Best Choice</h1>
      <p className="text-sm text-ink-soft mb-8">
        Continue with Google — no password to remember. New customers get a welcome bonus in Best
        Choice Rewards.
      </p>

      <GoogleSignInButton referralCode={referralCode} />

      <div className="mt-8 text-left">
        <label htmlFor="referral" className="eyebrow block mb-1.5">
          Referral code (optional)
        </label>
        <input
          id="referral"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          placeholder="Enter a friend's code"
          className="w-full border border-line rounded px-3.5 py-2.5 bg-card text-sm"
        />
        <p className="text-xs text-ink-soft mt-1.5">
          Enter this before signing in and you both earn bonus points.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPanel />
    </Suspense>
  );
}
