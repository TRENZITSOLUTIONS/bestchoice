'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaffLogin } from '@/hooks/useAuth';

export default function StaffLoginPage() {
  const router = useRouter();
  const staffLogin = useStaffLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    staffLogin.mutate(
      { email, password },
      {
        onSuccess: () => router.push('/staff'),
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } })?.response?.status;
          setError(
            status === 403
              ? 'That account is not a staff account.'
              : 'Invalid email or password.'
          );
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-16">
      <p className="eyebrow text-center">Staff access</p>
      <h1 className="text-2xl font-bold tracking-tight mt-2 mb-2 text-center">Sign in to manage the store</h1>
      <p className="text-sm text-ink-soft text-center mb-8">
        Customers sign in with Google. This page is for Best Choice staff accounts.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Staff email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-line px-3.5 py-2.5 bg-card text-sm"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-line px-3.5 py-2.5 bg-card text-sm"
        />
        {error && <p className="text-kumkum text-sm">{error}</p>}
        <button
          type="submit"
          disabled={staffLogin.isPending}
          className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm py-3 disabled:opacity-50"
        >
          {staffLogin.isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
