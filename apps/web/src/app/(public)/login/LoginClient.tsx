'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { PhoneOtpForm } from '@/components/auth/PhoneOtpForm';
import { createSession } from './actions';

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const handleSuccess = async (uid: string, idToken: string) => {
    const result = await createSession(idToken);
    if (result.error) throw new Error(result.error);

    // Redirect based on role from server response
    const dest = redirectTo ?? getRoleRedirect(result.role ?? '');
    router.push(dest);
  };

  return <PhoneOtpForm onSuccess={handleSuccess} submitLabel="Sign In" />;
}

function getRoleRedirect(role: string): string {
  switch (role) {
    case 'agent': return '/agent/dashboard';
    case 'admin': return '/admin/dashboard';
    case 'superadmin': return '/superadmin/dashboard';
    case 'staff': return '/staff/dashboard';
    default: return '/agent/register';
  }
}
