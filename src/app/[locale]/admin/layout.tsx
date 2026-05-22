import { ReactNode } from 'react';
import { requireAdminSession } from '@/lib/admin-auth';
import { AdminSidebar } from '@/components/admin-sidebar';

export const metadata = {
  title: 'Admin · Bali Best Holiday',
};

// All admin pages render fresh — never cache.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await requireAdminSession();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 min-w-0">
          <div className="border-b border-slate-200 bg-white px-4 py-3 md:px-8">
            <p className="text-xs text-slate-500">
              Signed in as <span className="font-semibold text-slate-700">{session.user.email}</span>
              {' '}<span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono">{session.user.role}</span>
            </p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
