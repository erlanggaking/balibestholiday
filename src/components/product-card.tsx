import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { Star, Clock, Users } from 'lucide-react';
import { Price } from './price';
import { useTranslations } from 'next-intl';

export interface ProductCardProps {
  type: 'tour' | 'hotel' | 'car';
  slug: string;
  title: string;
  imageUrl: string;
  rating?: number | string;
  reviews?: number;
  priceUSD: number;
  priceLabel?: 'perPerson' | 'perNight' | 'perDay';
  badge?: string;
  meta?: { icon?: 'clock' | 'users'; text: string }[];
}

export function ProductCard({
  type,
  slug,
  title,
  imageUrl,
  rating,
  reviews,
  priceUSD,
  priceLabel = 'perPerson',
  badge,
  meta = [],
}: ProductCardProps) {
  const t = useTranslations('product');
  const tHome = useTranslations('home');
  const href =
    type === 'tour' ? `/tours/${slug}` : type === 'hotel' ? `/hotels/${slug}` : `/cars/${slug}`;

  return (
    <Link
      href={href as any}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-soft"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          quality={70}
          loading="lazy"
          className="object-cover transition group-hover:scale-105"
        />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className="mb-1 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-brand-600">
          {title}
        </h3>

        <div className="mb-2 flex items-center gap-3 text-xs text-slate-500">
          {rating !== undefined && Number(rating) > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium text-slate-900">{Number(rating).toFixed(1)}</span>
              {reviews !== undefined && <span>({reviews})</span>}
            </span>
          )}
          {meta.map((m, idx) => (
            <span key={idx} className="flex items-center gap-1">
              {m.icon === 'clock' && <Clock className="h-3.5 w-3.5" />}
              {m.icon === 'users' && <Users className="h-3.5 w-3.5" />}
              {m.text}
            </span>
          ))}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-slate-500">{t('from')}</div>
            <div className="font-display text-lg font-bold text-brand-700">
              <Price amountUSD={priceUSD} />
            </div>
            <div className="text-xs text-slate-500">{t(priceLabel)}</div>
          </div>
          <span className="rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 group-hover:bg-brand-600 group-hover:text-white">
            {tHome('viewAll')}
          </span>
        </div>
      </div>
    </Link>
  );
}
