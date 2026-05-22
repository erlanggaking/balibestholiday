import { Duffel } from '@duffel/api';

const token = process.env.DUFFEL_ACCESS_TOKEN;

if (!token && process.env.NODE_ENV !== 'test') {
  console.warn('[duffel] DUFFEL_ACCESS_TOKEN not set — Duffel API calls will fail');
}

export const duffel = new Duffel({
  token: token ?? 'duffel_test_dummy',
});
