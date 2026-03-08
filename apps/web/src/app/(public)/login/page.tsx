import { Suspense } from 'react';
import { LoginClient } from './LoginClient';

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-red-50 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <img
            src="/icons/logo-96.png"
            alt="Shine Build Hub"
            className="mx-auto mb-3 h-16 w-16 rounded-2xl object-cover shadow-md"
          />
          <h1 className="text-xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500">Sign in with your registered mobile</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <Suspense>
            <LoginClient />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
