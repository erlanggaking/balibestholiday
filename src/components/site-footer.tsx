import { Link } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

export function SiteFooter() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const tSite = useTranslations('site');
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2">
            <div className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
              <span className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-ocean-500" />
              {tSite('name')}
            </div>
            <p className="mb-6 max-w-sm text-sm text-slate-400">{tSite('tagline')}</p>
            <div className="flex gap-3">
              <a aria-label="Facebook" href="#" className="rounded-full bg-slate-800 p-2 hover:bg-slate-700">
                <Facebook className="h-4 w-4" />
              </a>
              <a aria-label="Instagram" href="#" className="rounded-full bg-slate-800 p-2 hover:bg-slate-700">
                <Instagram className="h-4 w-4" />
              </a>
              <a aria-label="Twitter" href="#" className="rounded-full bg-slate-800 p-2 hover:bg-slate-700">
                <Twitter className="h-4 w-4" />
              </a>
              <a aria-label="Youtube" href="#" className="rounded-full bg-slate-800 p-2 hover:bg-slate-700">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <FooterCol title={t('company')}>
            <FooterLink href="/about">{t('about')}</FooterLink>
            <FooterLink href="/careers">{t('careers')}</FooterLink>
            <FooterLink href="/press">{t('press')}</FooterLink>
            <FooterLink href="/blog">{tNav('blog')}</FooterLink>
          </FooterCol>

          <FooterCol title={t('support')}>
            <FooterLink href="/help">{t('help')}</FooterLink>
            <FooterLink href="/contact">{t('contact')}</FooterLink>
            <FooterLink href="/faq">{t('faq')}</FooterLink>
          </FooterCol>

          <FooterCol title={t('legal')}>
            <FooterLink href="/legal/terms">{t('terms')}</FooterLink>
            <FooterLink href="/legal/privacy">{t('privacy')}</FooterLink>
            <FooterLink href="/legal/cookies">{t('cookies')}</FooterLink>
          </FooterCol>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-800 pt-6 text-sm text-slate-400 md:flex-row">
          <p>© {year} {tSite('name')}. {t('rights')}</p>
          <p>Made with ❤ in Bali</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">{title}</h3>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-white">
        {children}
      </Link>
    </li>
  );
}
