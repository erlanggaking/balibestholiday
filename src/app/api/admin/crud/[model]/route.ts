// Generic CRUD: POST (create) for whitelisted models.
// Each model has a small schema validating allowed fields.
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';
import { slugify } from '@/lib/utils';

type ModelHandler = {
  delegate: any;
  fields: string[];
  required?: string[];
  // generates slug from `name` or `title` if no slug provided
  slugFrom?: string;
};

const MODELS: Record<string, ModelHandler> = {
  banner: {
    delegate: 'banner',
    fields: ['title', 'subtitle', 'imageUrl', 'linkUrl', 'position', 'sortOrder', 'isActive'],
    required: ['title', 'imageUrl'],
  },
  faq: {
    delegate: 'faq',
    fields: ['question', 'answer', 'category', 'sortOrder', 'isPublished'],
    required: ['question', 'answer'],
  },
  page: {
    delegate: 'page',
    fields: ['slug', 'title', 'content', 'isPublished'],
    required: ['title', 'content'],
    slugFrom: 'title',
  },
  blog: {
    delegate: 'blogPost',
    fields: ['slug', 'title', 'excerpt', 'content', 'coverImage', 'authorName', 'isPublished'],
    required: ['title', 'content'],
    slugFrom: 'title',
  },
  promo: {
    delegate: 'promoCode',
    fields: ['code', 'description', 'discountType', 'discountValue', 'minPurchase', 'maxDiscount', 'usageLimit', 'startsAt', 'endsAt', 'isActive', 'applicableTo'],
    required: ['code', 'discountValue'],
  },
  destination: {
    delegate: 'destination',
    fields: ['slug', 'name', 'country', 'region', 'description', 'imageUrl', 'latitude', 'longitude', 'isFeatured'],
    required: ['name'],
    slugFrom: 'name',
  },
  activity: {
    delegate: 'activity',
    fields: ['slug', 'name', 'shortDesc', 'description', 'type', 'durationHours', 'difficulty', 'minAge', 'maxGroupSize', 'basePrice', 'baseCurrency', 'meetingPoint', 'destinationId', 'included', 'excluded', 'isFeatured', 'isActive'],
    required: ['name', 'basePrice'],
    slugFrom: 'name',
  },
  packageaddon: {
    delegate: 'packageAddon',
    fields: ['tourId', 'name', 'description', 'price', 'baseCurrency', 'unit', 'imageUrl', 'isActive', 'sortOrder'],
    required: ['name', 'price'],
  },
  busoperator: {
    delegate: 'busOperator',
    fields: ['slug', 'name', 'logoUrl', 'description', 'isActive'],
    required: ['name'],
    slugFrom: 'name',
  },
  busroute: {
    delegate: 'busRoute',
    fields: ['operatorId', 'fromCity', 'toCity', 'busType', 'amenities', 'durationMinutes', 'basePrice', 'baseCurrency', 'pickupPoints', 'dropoffPoints', 'isActive'],
    required: ['operatorId', 'fromCity', 'toCity', 'durationMinutes', 'basePrice'],
  },
  busschedule: {
    delegate: 'busSchedule',
    fields: ['routeId', 'dayOfWeek', 'date', 'departureTime', 'arrivalTime', 'totalSeats', 'priceOverride', 'isActive'],
    required: ['routeId', 'departureTime', 'arrivalTime'],
  },
  category: {
    delegate: 'category',
    fields: ['slug', 'type', 'name', 'iconUrl', 'sortOrder', 'isActive'],
    required: ['name', 'type'],
    slugFrom: 'name',
  },
  insurance: {
    delegate: 'insurancePlan',
    fields: ['slug', 'provider', 'name', 'shortDesc', 'description', 'coverageType', 'medicalCoverage', 'tripCancellation', 'baggageCoverage', 'pricePerDay', 'baseCurrency', 'benefits', 'isActive'],
    required: ['name', 'provider', 'pricePerDay'],
    slugFrom: 'name',
  },
  tour: {
    delegate: 'tour',
    fields: [
      'slug', 'title', 'shortDesc', 'description', 'highlights', 'included', 'excluded', 'itinerary',
      'durationHours', 'durationDays', 'meetingPoint', 'difficulty', 'minAge', 'maxGroupSize',
      'basePrice', 'childPrice', 'discountPercent', 'baseCurrency', 'destinationId', 'categoryId',
      'isFeatured', 'isActive',
    ],
    required: ['title', 'basePrice', 'destinationId'],
    slugFrom: 'title',
  },
  car: {
    delegate: 'car',
    fields: [
      'slug', 'name', 'brand', 'model', 'year', 'category', 'transmission', 'fuelType',
      'seats', 'luggage', 'withDriver', 'pickupLocations', 'dailyPrice', 'baseCurrency',
      'description', 'features', 'isFeatured', 'isActive',
    ],
    required: ['name', 'brand', 'model', 'category', 'transmission', 'dailyPrice'],
    slugFrom: 'name',
  },
  hotel: {
    delegate: 'hotel',
    fields: [
      'slug', 'name', 'shortDesc', 'description', 'address', 'latitude', 'longitude',
      'starRating', 'amenities', 'policies', 'checkInTime', 'checkOutTime',
      'basePrice', 'baseCurrency', 'destinationId', 'isFeatured', 'isActive',
    ],
    required: ['name', 'address', 'basePrice', 'destinationId'],
    slugFrom: 'name',
  },
};

function pick(body: Record<string, any>, fields: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

// CREATE
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ model: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });

  const { model } = await params;
  const cfg = MODELS[model];
  if (!cfg) return NextResponse.json({ error: 'Unknown model' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const data = pick(body, cfg.fields);

  // Required check
  for (const f of cfg.required ?? []) {
    if (data[f] === undefined || data[f] === '' || data[f] === null) {
      return NextResponse.json({ error: `Missing required field: ${f}` }, { status: 400 });
    }
  }

  // Auto-generate slug
  if (cfg.slugFrom && !data.slug && data[cfg.slugFrom]) {
    data.slug = slugify(String(data[cfg.slugFrom])) + '-' + Math.random().toString(36).slice(2, 6);
  }

  // Coerce numeric
  for (const k of [
    'price', 'basePrice', 'childPrice', 'dailyPrice', 'discountValue', 'discountPercent',
    'durationMinutes', 'durationHours', 'durationDays', 'maxGroupSize', 'minAge',
    'totalSeats', 'sortOrder', 'pricePerDay', 'medicalCoverage', 'tripCancellation',
    'baggageCoverage', 'priceOverride', 'starRating', 'seats', 'luggage', 'year',
    'latitude', 'longitude',
  ]) {
    if (data[k] !== undefined && data[k] !== null && data[k] !== '') data[k] = Number(data[k]);
  }
  // Coerce dates
  for (const k of ['date', 'startsAt', 'endsAt']) {
    if (data[k] && typeof data[k] === 'string') data[k] = new Date(data[k]);
  }

  try {
    const created = await (prisma as any)[cfg.delegate].create({ data });
    return NextResponse.json({ ok: true, item: created });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Create failed' }, { status: 500 });
  }
}
