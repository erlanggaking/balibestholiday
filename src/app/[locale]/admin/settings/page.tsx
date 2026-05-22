import { prisma } from '@/lib/prisma';

export default async function AdminSettingsPage() {
  const [langCount, currCount, settingCount] = await Promise.all([
    prisma.language.count().catch(() => 0),
    prisma.currency.count().catch(() => 0),
    prisma.setting.count().catch(() => 0),
  ]);

  return (
    <div className="px-4 py-8 md:px-8">
      <h1 className="mb-6 font-display text-2xl font-bold">Settings</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card label="Languages active" value={langCount} />
        <Card label="Currencies active" value={currCount} />
        <Card label="Custom settings" value={settingCount} />
      </div>

      <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-10 text-center">
        <p className="text-sm text-slate-600">
          Site-wide settings (logo, contact info, social links, exchange rates, SMTP, etc.)
          will appear here. For now, modify via DB or env vars.
        </p>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
