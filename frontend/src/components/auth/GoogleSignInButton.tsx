'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { useGoogleLogin } from '@/hooks/useAuth';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

interface GoogleCredentialResponse {
  credential: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              width?: number;
              text?: string;
              shape?: string;
              logo_alignment?: string;
            }
          ) => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ referralCode }: { referralCode?: string }) {
  const router = useRouter();
  const googleLogin = useGoogleLogin();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [error, setError] = useState('');

  const handleCredential = useCallback(
    (response: GoogleCredentialResponse) => {
      setError('');
      googleLogin.mutate(
        { credential: response.credential, referral_code: referralCode || undefined },
        {
          onSuccess: () => router.push('/account'),
          onError: () => setError('Could not sign in with Google. Please try again.'),
        }
      );
    },
    [googleLogin, referralCode, router]
  );

  useEffect(() => {
    if (!scriptReady || !CLIENT_ID || !buttonRef.current || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: handleCredential,
    });
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: 'outline',
      size: 'large',
      width: 380,
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
    });
  }, [scriptReady, handleCredential]);

  if (!CLIENT_ID) {
    return (
      <p className="border border-line rounded bg-card text-sm text-ink-soft px-4 py-3">
        Google sign-in isn&apos;t configured yet. Set <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to
        enable it.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <Script src="https://accounts.google.com/gsi/client" onReady={() => setScriptReady(true)} />
      <div ref={buttonRef} className="flex justify-center [color-scheme:light]" />
      {googleLogin.isPending && (
        <p className="text-sm text-ink-soft text-center">Signing you in...</p>
      )}
      {error && <p className="text-kumkum text-sm text-center">{error}</p>}
    </div>
  );
}
