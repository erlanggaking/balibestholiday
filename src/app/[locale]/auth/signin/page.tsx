'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/routing';

export default function SignInPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError(t('errorInvalid'));
    } else {
      router.push('/account' as any);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-6 font-display text-3xl font-bold">{t('signin')}</h1>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('password')}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? '...' : t('signin')}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
        <span className="flex-1 border-t border-slate-200" />
        {t('or')}
        <span className="flex-1 border-t border-slate-200" />
      </div>

      <div className="space-y-2">
        <button
          onClick={() => signIn('google')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          {t('continueWithGoogle')}
        </button>
        <button
          onClick={() => signIn('facebook')}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2.5 text-sm font-medium hover:bg-slate-50"
        >
          {t('continueWithFacebook')}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t('noAccount')}{' '}
        <Link href="/auth/signup" className="font-semibold text-brand-700 hover:underline">
          {t('signup')}
        </Link>
      </p>
    </div>
  );
}
