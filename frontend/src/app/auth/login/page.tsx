'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLogin } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    login.mutate(
      { email, password },
      {
        onSuccess: () => router.push('/account'),
        onError: () => setError('Invalid email or password.'),
      }
    );
  }

  return (
    <div className="mx-auto max-w-[420px] px-4 py-16">
      <h1 className="display text-2xl mb-6 text-center">Sign in to Best Choice</h1>
      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-line rounded px-3.5 py-2.5 bg-card text-sm"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-line rounded px-3.5 py-2.5 bg-card text-sm"
        />
        {error && <p className="text-kumkum text-sm">{error}</p>}
        <button
          type="submit"
          disabled={login.isPending}
          className="bg-kumkum hover:bg-kumkum-deep text-white font-bold text-sm rounded py-3 disabled:opacity-50"
        >
          {login.isPending ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      <p className="text-sm text-ink-soft text-center mt-5">
        New here?{' '}
        <Link href="/auth/register" className="text-kumkum-deep font-semibold">
          Create an account
        </Link>
      </p>
    </div>
  );
}
