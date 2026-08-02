'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useRegister } from '@/hooks/useAuth';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const register = useRegister();
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '',
    referral_code: searchParams.get('ref') ?? '',
  });
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    register.mutate(
      { ...form, referral_code: form.referral_code || undefined },
      {
        onSuccess: () => router.push('/account'),
        onError: (err: unknown) => {
          const message = (err as { response?: { data?: Record<string, string[]> } })?.response?.data;
          setError(message ? Object.values(message).flat().join(' ') : 'Registration failed.');
        },
      }
    );
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-16">
      <h1 className="display text-2xl mb-6 text-center">Create your account</h1>
      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <div className="grid grid-cols-2 gap-3.5">
          <input required placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="border border-line rounded px-3.5 py-2.5 bg-card text-sm" />
          <input placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="border border-line rounded px-3.5 py-2.5 bg-card text-sm" />
        </div>
        <input type="email" required placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="border border-line rounded px-3.5 py-2.5 bg-card text-sm" />
        <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border border-line rounded px-3.5 py-2.5 bg-card text-sm" />
        <input type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="border border-line rounded px-3.5 py-2.5 bg-card text-sm" />
        <input placeholder="Referral code (optional)" value={form.referral_code} onChange={(e) => setForm({ ...form, referral_code: e.target.value })} className="border border-line rounded px-3.5 py-2.5 bg-card text-sm" />
        {error && <p className="text-kumkum text-sm">{error}</p>}
        <button type="submit" disabled={register.isPending} className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm rounded py-3 disabled:opacity-50">
          {register.isPending ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
      <p className="text-sm text-ink-soft text-center mt-5">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-kumkum-deep font-semibold">
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
