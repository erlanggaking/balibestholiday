'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export function CatalogToggle({
  type,
  id,
  field,
  value,
  labelOn = 'On',
  labelOff = 'Off',
}: {
  type: 'tour' | 'hotel' | 'car' | 'destination' | 'insurance' | 'flight' | 'review';
  id: string;
  field: 'isActive' | 'isFeatured' | 'isVerified';
  value: boolean;
  labelOn?: string;
  labelOff?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [v, setV] = useState(value);

  async function toggle() {
    const next = !v;
    setV(next); // optimistic
    const res = await fetch(`/api/admin/catalog/${type}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: next }),
    });
    if (!res.ok) {
      setV(!next);
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? 'Failed');
    } else {
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={toggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        v ? 'bg-emerald-500' : 'bg-slate-300'
      }`}
      title={v ? labelOn : labelOff}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          v ? 'translate-x-4' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

export function CatalogDeleteButton({
  type,
  id,
  label = 'Delete',
  confirmText = 'Delete this item?',
}: {
  type: 'tour' | 'hotel' | 'car' | 'destination' | 'insurance' | 'flight' | 'review';
  id: string;
  label?: string;
  confirmText?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  async function del() {
    if (!confirm(confirmText)) return;
    const res = await fetch(`/api/admin/catalog/${type}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? 'Failed');
    } else {
      startTransition(() => router.refresh());
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={del}
      className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
    >
      {label}
    </button>
  );
}
