'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@shinebuild/ui';
import { destroySession } from '@/app/(public)/login/actions';

export function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await destroySession();
    router.push('/');
  };

  return (
    <Button variant="outline" size="full" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
}
