import Stripe from 'stripe';

let _stripe: Stripe | null = null;

/**
 * Lazy-init Stripe client. Throws at *call time* (not module load) so the build
 * can collect page data without STRIPE_SECRET_KEY being set.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _stripe = new Stripe(key, {
      apiVersion: '2024-12-18.acacia' as any,
      typescript: true,
    });
  }
  return _stripe;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.length > 10);
}
