'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const ROLES = ['ADMIN', 'STAFF', 'VENDOR', 'CUSTOMER'] as const;

export function UserRoleForm({ id, role }: { id: string; role: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [r, setR] = useState(role);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function save() {
    setMsg(null);
    if (r === 'ADMIN' && !confirm('Make this user an ADMIN? They will have full system access.')) {
      return;
    }
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: r }),
    });
    if (res.ok) {
      setMsg({ type: 'ok', text: 'Role updated' });
      startTransition(() => router.refresh());
    } else {
      const j = await res.json().catch(() => ({}));
      setMsg({ type: 'err', text: j.error ?? 'Failed' });
      setR(role);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3 className="mb-3 text-sm font-semibold">Role</h3>
      <select
        value={r}
        onChange={(e) => setR(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
      >
        {ROLES.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={r === role || pending}
        onClick={save}
        className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {pending ? 'Saving…' : 'Update role'}
      </button>
      {msg && (
        <p
          className={`mt-2 text-xs font-semibold ${
            msg.type === 'ok' ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {msg.text}
        </p>
      )}
    </div>
  );
}
