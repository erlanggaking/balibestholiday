// Generic CRUD: PATCH (update) + DELETE (hard delete)
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApi } from '@/lib/admin-auth';

const MODELS: Record<string, { delegate: any; fields: string[] }> = {
  banner: {
    delegate: 'banner',
    fields: ['title', 'subtitle', 'imageUrl', 'linkUrl', 'position', 'sortOrder', 'isActive', 'startsAt', 'endsAt'],
  },
  faq: { delegate: 'faq', fields: ['question', 'answer', 'category', 'sortOrder', 'isPublished'] },
  page: { delegate: 'page', fields: ['slug', 'title', 'content', 'isPublished'] },
  blog: { delegate: 'blogPost', fields: ['slug', 'title', 'excerpt', 'content', 'coverImage', 'authorName', 'isPublished'] },
  promo: {
    delegate: 'promoCode',
    fields: ['code', 'description', 'discountType', 'discountValue', 'minPurchase', 'maxDiscount', 'usageLimit', 'startsAt', 'endsAt', 'isActive', 'applicableTo'],
  },
  destination: {
    delegate: 'destination',
    fields: ['slug', 'name', 'country', 'region', 'description', 'imageUrl', 'latitude', 'longitude', 'isFeatured'],
  },
  activity: {
    delegate: 'activity',
    fields: ['slug', 'name', 'shortDesc', 'description', 'type', 'durationHours', 'difficulty', 'minAge', 'maxGroupSize', 'basePrice', 'baseCurrency', 'meetingPoint', 'destinationId', 'included', 'excluded', 'isFeatured', 'isActive'],
  },
  packageaddon: { delegate: 'packageAddon', fields: ['tourId', 'name', 'description', 'price', 'baseCurrency', 'unit', 'imageUrl', 'isActive', 'sortOrder'] },
  busoperator: { delegate: 'busOperator', fields: ['slug', 'name', 'logoUrl', 'description', 'isActive'] },
  busroute: {
    delegate: 'busRoute',
    fields: ['operatorId', 'fromCity', 'toCity', 'busType', 'amenities', 'durationMinutes', 'basePrice', 'baseCurrency', 'pickupPoints', 'dropoffPoints', 'isActive'],
  },
  busschedule: { delegate: 'busSchedule', fields: ['routeId', 'dayOfWeek', 'date', 'departureTime', 'arrivalTime', 'totalSeats', 'priceOverride', 'isActive'] },
  category: { delegate: 'category', fields: ['slug', 'type', 'name', 'iconUrl', 'sortOrder', 'isActive'] },
  insurance: {
    delegate: 'insurancePlan',
    fields: ['slug', 'provider', 'name', 'shortDesc', 'description', 'coverageType', 'medicalCoverage', 'tripCancellation', 'baggageCoverage', 'pricePerDay', 'baseCurrency', 'benefits', 'isActive'],
  },
  tour: {
    delegate: 'tour',
    fields: ['slug', 'title', 'shortDesc', 'description', 'highlights', 'included', 'excluded', 'itinerary', 'durationHours', 'durationDays', 'meetingPoint', 'difficulty', 'minAge', 'maxGroupSize', 'basePrice', 'childPrice', 'discountPercent', 'baseCurrency', 'destinationId', 'categoryId', 'isFeatured', 'isActive'],
  },
  hotel: {
    delegate: 'hotel',
    fields: ['slug', 'name', 'shortDesc', 'description', 'address', 'latitude', 'longitude', 'starRating', 'amenities', 'policies', 'checkInTime', 'checkOutTime', 'basePrice', 'baseCurrency', 'destinationId', 'isFeatured', 'isActive'],
  },
  car: {
    delegate: 'car',
    fields: ['slug', 'name', 'brand', 'model', 'year', 'category', 'transmission', 'fuelType', 'seats', 'luggage', 'withDriver', 'pickupLocations', 'dailyPrice', 'baseCurrency', 'description', 'features', 'isFeatured', 'isActive'],
  },
};

function pick(body: Record<string, any>, fields: string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  // Coerce
  for (const k of ['price', 'basePrice', 'childPrice', 'dailyPrice', 'discountValue', 'durationMinutes', 'durationHours', 'durationDays', 'maxGroupSize', 'minAge', 'totalSeats', 'sortOrder', 'pricePerDay', 'medicalCoverage', 'tripCancellation', 'baggageCoverage', 'priceOverride', 'starRating', 'seats', 'luggage', 'year', 'discountPercent', 'latitude', 'longitude']) {
    if (out[k] !== undefined && out[k] !== null && out[k] !== '') out[k] = Number(out[k]);
  }
  for (const k of ['date', 'startsAt', 'endsAt']) {
    if (out[k] && typeof out[k] === 'string') out[k] = new Date(out[k]);
  }
  return out;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ model: string; id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { model, id } = await params;
  const cfg = MODELS[model];
  if (!cfg) return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const data = pick(body, cfg.fields);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }
  try {
    const updated = await (prisma as any)[cfg.delegate].update({ where: { id }, data });
    return NextResponse.json({ ok: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Update failed' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ model: string; id: string }> },
) {
  const auth = await requireAdminApi();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { model, id } = await params;
  const cfg = MODELS[model];
  if (!cfg) return NextResponse.json({ error: 'Unknown model' }, { status: 400 });
  try {
    await (prisma as any)[cfg.delegate].delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Delete failed' }, { status: 500 });
  }
}
