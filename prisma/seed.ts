import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { languages } from '../src/i18n/config';
import { currencies } from '../src/lib/currencies';

// In SQLite schema, ProductType is a plain string union — no enum
const ProductType = {
  TOUR: 'TOUR',
  HOTEL: 'HOTEL',
  CAR: 'CAR',
  FLIGHT: 'FLIGHT',
  INSURANCE: 'INSURANCE',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('🌴 Seeding Bali Best Holiday...');

  // Languages
  for (const [i, lang] of languages.entries()) {
    await prisma.language.upsert({
      where: { code: lang.code },
      create: {
        code: lang.code,
        name: lang.name,
        nativeName: lang.nativeName,
        flag: lang.flag,
        isRtl: lang.isRtl,
        sortOrder: i,
      },
      update: {},
    });
  }
  console.log(`  ✓ ${languages.length} languages`);

  // Currencies
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      create: {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        decimalDigits: c.decimalDigits,
        rateToBase: c.rateToBase,
        sortOrder: c.sortOrder,
      },
      update: { rateToBase: c.rateToBase },
    });
  }
  console.log(`  ✓ ${currencies.length} currencies`);

  // Admin user
  const adminPassword = await bcrypt.hash('admin12345', 12);
  await prisma.user.upsert({
    where: { email: 'admin@balibestholiday.com' },
    update: {},
    create: {
      email: 'admin@balibestholiday.com',
      name: 'Admin BBH',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('  ✓ Admin user (admin@balibestholiday.com / admin12345)');

  // Destinations
  const destinations = [
    { slug: 'ubud', name: 'Ubud', region: 'Bali', desc: 'Cultural heart of Bali, surrounded by rice paddies and ancient temples.', img: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800' },
    { slug: 'kuta', name: 'Kuta', region: 'Bali', desc: 'Iconic surf beach with vibrant nightlife and shopping.', img: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800' },
    { slug: 'seminyak', name: 'Seminyak', region: 'Bali', desc: 'Upscale beach resort with luxury villas and beach clubs.', img: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800' },
    { slug: 'nusa-dua', name: 'Nusa Dua', region: 'Bali', desc: 'Pristine white sand beaches and 5-star resorts.', img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800' },
    { slug: 'canggu', name: 'Canggu', region: 'Bali', desc: 'Hipster surf town with cafes, yoga studios, and rice fields.', img: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800' },
    { slug: 'uluwatu', name: 'Uluwatu', region: 'Bali', desc: 'Cliff-top temples and world-class surf breaks.', img: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800' },
  ];

  const destMap: Record<string, string> = {};
  for (const d of destinations) {
    const created = await prisma.destination.upsert({
      where: { slug: d.slug },
      update: {},
      create: {
        slug: d.slug,
        name: d.name,
        region: d.region,
        description: d.desc,
        imageUrl: d.img,
        isFeatured: true,
      },
    });
    destMap[d.slug] = created.id;
  }
  console.log(`  ✓ ${destinations.length} destinations`);

  // Categories
  const categories = [
    { slug: 'day-tours', name: 'Day Tours', type: ProductType.TOUR },
    { slug: 'water-sports', name: 'Water Sports', type: ProductType.TOUR },
    { slug: 'cultural', name: 'Cultural', type: ProductType.TOUR },
    { slug: 'adventure', name: 'Adventure', type: ProductType.TOUR },
  ];
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
  }
  console.log(`  ✓ ${categories.length} categories`);

  // Tours
  const tours = [
    {
      slug: 'mt-batur-sunrise-trek',
      title: 'Mount Batur Sunrise Trek',
      shortDesc: 'Hike to the summit of an active volcano and watch the sunrise.',
      description: 'Wake up before dawn for an unforgettable trek up Mt. Batur (1,717m). Watch the sun rise over the caldera, enjoy a hot drink prepared on volcanic steam, and explore the lunar-like landscape.',
      destinationSlug: 'ubud',
      basePrice: 45,
      durationHours: 8,
      maxGroupSize: 12,
      img: 'https://images.unsplash.com/photo-1604999333679-b86d54738315?w=800',
      highlights: ['Sunrise summit view', 'Hot springs after trek', 'Hotel pickup', 'Professional guide'],
      included: ['Breakfast', 'Hotel transfer', 'Hiking gear', 'English-speaking guide'],
      excluded: ['Lunch', 'Hot springs entry', 'Tips'],
    },
    {
      slug: 'nusa-penida-island-tour',
      title: 'Nusa Penida Island Day Tour',
      shortDesc: 'Visit the famous Kelingking Beach and Angel\'s Billabong.',
      description: 'Experience the stunning cliffs and turquoise bays of Nusa Penida. Includes fast-boat transfer, air-con car, and lunch at a local warung.',
      destinationSlug: 'nusa-dua',
      basePrice: 75,
      durationHours: 12,
      maxGroupSize: 10,
      img: 'https://images.unsplash.com/photo-1565967511849-76a60a516170?w=800',
      highlights: ['Kelingking T-Rex Beach', 'Angel\'s Billabong', 'Broken Beach', 'Crystal Bay snorkel'],
      included: ['Hotel pickup', 'Fast boat ticket', 'Lunch', 'Snorkel gear'],
      excluded: ['Personal expenses', 'Tips'],
    },
    {
      slug: 'ubud-rice-terrace-temple',
      title: 'Ubud Rice Terrace & Temple Tour',
      shortDesc: 'Explore Tegallalang, Tirta Empul, and Goa Gajah temples.',
      description: 'Full-day tour through the cultural sites of Ubud, including a traditional water purification ceremony at Tirta Empul.',
      destinationSlug: 'ubud',
      basePrice: 35,
      durationHours: 8,
      maxGroupSize: 8,
      img: 'https://images.unsplash.com/photo-1518002171953-a080ee817e1f?w=800',
      highlights: ['Tegallalang rice terrace', 'Tirta Empul water temple', 'Goa Gajah elephant cave', 'Coffee plantation'],
      included: ['Hotel transfer', 'Driver-guide', 'Bottled water'],
      excluded: ['Lunch', 'Entrance fees', 'Tips'],
    },
    {
      slug: 'uluwatu-temple-kecak-dance',
      title: 'Uluwatu Temple & Kecak Fire Dance',
      shortDesc: 'Sunset cliff temple and traditional fire dance.',
      description: 'Visit the breathtaking Uluwatu Temple perched on a 70m cliff, and watch the mesmerizing Kecak Dance at sunset.',
      destinationSlug: 'uluwatu',
      basePrice: 30,
      durationHours: 5,
      maxGroupSize: 15,
      img: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=800',
      highlights: ['Cliff-top temple', 'Sunset view', 'Kecak dance show', 'Jimbaran seafood option'],
      included: ['Transport', 'Driver', 'Show ticket'],
      excluded: ['Dinner', 'Sarong rental'],
    },
    {
      slug: 'snorkeling-blue-lagoon',
      title: 'Blue Lagoon Snorkeling',
      shortDesc: 'Snorkel in the crystal clear waters of Blue Lagoon.',
      description: 'Discover colorful coral reefs and tropical fish in one of Bali\'s most popular snorkel spots.',
      destinationSlug: 'kuta',
      basePrice: 55,
      durationHours: 6,
      maxGroupSize: 10,
      img: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800',
      highlights: ['Two snorkel spots', 'Boat ride', 'Lunch', 'Equipment included'],
      included: ['Snorkel gear', 'Lunch', 'Hotel pickup'],
      excluded: ['Tips', 'Personal items'],
    },
    {
      slug: 'tanah-lot-sunset',
      title: 'Tanah Lot Sunset Tour',
      shortDesc: 'Iconic sea temple at sunset.',
      description: 'Visit the iconic Tanah Lot temple, a sacred Hindu shrine perched on a rock formation just off the coast.',
      destinationSlug: 'canggu',
      basePrice: 25,
      durationHours: 4,
      maxGroupSize: 15,
      img: 'https://images.unsplash.com/photo-1539367628448-4bc5c9d171c8?w=800',
      highlights: ['Sunset views', 'Holy snake cave', 'Beach walk', 'Photo stops'],
      included: ['Transport', 'Driver-guide'],
      excluded: ['Entrance fee', 'Food'],
    },
  ];

  for (const t of tours) {
    await prisma.tour.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        slug: t.slug,
        title: t.title,
        shortDesc: t.shortDesc,
        description: t.description,
        destinationId: destMap[t.destinationSlug],
        basePrice: t.basePrice,
        childPrice: t.basePrice * 0.7,
        durationHours: t.durationHours,
        durationDays: 1,
        maxGroupSize: t.maxGroupSize,
        highlights: JSON.stringify(t.highlights),
        included: JSON.stringify(t.included),
        excluded: JSON.stringify(t.excluded),
        rating: 4.7,
        totalReviews: 100 + Math.floor(Math.random() * 200),
        isFeatured: true,
        images: { create: [{ url: t.img, alt: t.title }] },
      },
    });
  }
  console.log(`  ✓ ${tours.length} tours`);

  // Hotels
  const hotels = [
    {
      slug: 'four-seasons-jimbaran',
      name: 'Four Seasons Resort Jimbaran Bay',
      destinationSlug: 'nusa-dua',
      address: 'Jimbaran, Bali',
      starRating: 5,
      basePrice: 650,
      img: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      desc: 'Iconic 5-star resort with private villas overlooking Jimbaran Bay.',
      amenities: ['pool', 'spa', 'beachfront', 'wifi', 'restaurant', 'gym'],
    },
    {
      slug: 'the-mulia-resort',
      name: 'The Mulia Resort Nusa Dua',
      destinationSlug: 'nusa-dua',
      address: 'Nusa Dua, Bali',
      starRating: 5,
      basePrice: 380,
      img: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      desc: 'Beachfront luxury resort with multiple infinity pools and 9 restaurants.',
      amenities: ['pool', 'spa', 'beachfront', 'wifi', 'kids-club'],
    },
    {
      slug: 'hanging-gardens-ubud',
      name: 'Hanging Gardens of Bali',
      destinationSlug: 'ubud',
      address: 'Payangan, Ubud',
      starRating: 5,
      basePrice: 540,
      img: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800',
      desc: 'Famous for its two-tier infinity pool overlooking a tropical valley.',
      amenities: ['pool', 'spa', 'jungle-view', 'wifi'],
    },
    {
      slug: 'w-bali-seminyak',
      name: 'W Bali Seminyak',
      destinationSlug: 'seminyak',
      address: 'Seminyak Beach, Bali',
      starRating: 5,
      basePrice: 420,
      img: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      desc: 'Trendy beachfront resort with vibrant design.',
      amenities: ['pool', 'beach-club', 'spa', 'wifi'],
    },
    {
      slug: 'kuta-bungalow',
      name: 'Kuta Bungalow Hotel',
      destinationSlug: 'kuta',
      address: 'Kuta Beach Road',
      starRating: 3,
      basePrice: 45,
      img: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      desc: 'Comfortable budget bungalow steps from Kuta Beach.',
      amenities: ['pool', 'wifi', 'breakfast'],
    },
  ];

  for (const h of hotels) {
    const hotel = await prisma.hotel.upsert({
      where: { slug: h.slug },
      update: {},
      create: {
        slug: h.slug,
        name: h.name,
        destinationId: destMap[h.destinationSlug],
        address: h.address,
        starRating: h.starRating,
        basePrice: h.basePrice,
        amenities: JSON.stringify(h.amenities),
        shortDesc: h.desc,
        description: h.desc,
        rating: 4.5 + Math.random() * 0.5,
        totalReviews: 200 + Math.floor(Math.random() * 800),
        isFeatured: true,
        images: { create: [{ url: h.img, alt: h.name }] },
      },
    });
    // Default room
    await prisma.room.create({
      data: {
        hotelId: hotel.id,
        name: 'Deluxe Room',
        bedType: 'King',
        capacity: 2,
        size: '36 m²',
        pricePerNight: h.basePrice,
        totalUnits: 10,
        amenities: JSON.stringify(['wifi', 'ac', 'safe', 'tv']),
      },
    });
  }
  console.log(`  ✓ ${hotels.length} hotels (with rooms)`);

  // Cars
  const cars = [
    { slug: 'toyota-avanza', name: 'Toyota Avanza 2023', brand: 'Toyota', model: 'Avanza', year: 2023, category: 'MPV', transmission: 'Automatic', seats: 7, dailyPrice: 35, img: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600' },
    { slug: 'honda-brio', name: 'Honda Brio 2022', brand: 'Honda', model: 'Brio', year: 2022, category: 'Hatchback', transmission: 'Manual', seats: 4, dailyPrice: 22, img: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600' },
    { slug: 'toyota-fortuner', name: 'Toyota Fortuner 2023', brand: 'Toyota', model: 'Fortuner', year: 2023, category: 'SUV', transmission: 'Automatic', seats: 7, dailyPrice: 75, img: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600' },
    { slug: 'scooter-vario', name: 'Honda Vario 150', brand: 'Honda', model: 'Vario', year: 2023, category: 'Scooter', transmission: 'Automatic', seats: 2, dailyPrice: 8, img: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600' },
    { slug: 'alphard-private', name: 'Toyota Alphard with Driver', brand: 'Toyota', model: 'Alphard', year: 2023, category: 'Luxury', transmission: 'Automatic', seats: 7, dailyPrice: 150, img: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=600' },
  ];

  for (const c of cars) {
    await prisma.car.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        slug: c.slug,
        name: c.name,
        brand: c.brand,
        model: c.model,
        year: c.year,
        category: c.category,
        transmission: c.transmission,
        seats: c.seats,
        dailyPrice: c.dailyPrice,
        withDriver: c.slug === 'alphard-private',
        pickupLocations: JSON.stringify(['Ngurah Rai Airport', 'Kuta', 'Ubud', 'Seminyak']),
        features: JSON.stringify(['AC', 'Bluetooth', 'GPS', 'Insurance']),
        rating: 4.6,
        totalReviews: 50 + Math.floor(Math.random() * 200),
        isFeatured: true,
        images: { create: [{ url: c.img, alt: c.name }] },
      },
    });
  }
  console.log(`  ✓ ${cars.length} cars`);

  // Insurance plans
  const plans = [
    {
      slug: 'basic',
      provider: 'Allianz',
      name: 'Basic Travel Insurance',
      coverageType: 'BASIC',
      pricePerDay: 5,
      medicalCoverage: 50000,
      tripCancellation: 1500,
      baggageCoverage: 500,
      desc: 'Essential coverage for short trips.',
      benefits: ['Medical $50,000', 'Trip cancellation $1,500', 'Baggage $500', '24/7 helpline'],
    },
    {
      slug: 'standard',
      provider: 'AXA',
      name: 'Standard Travel Insurance',
      coverageType: 'STANDARD',
      pricePerDay: 10,
      medicalCoverage: 250000,
      tripCancellation: 5000,
      baggageCoverage: 1500,
      desc: 'Recommended for most travelers.',
      benefits: ['Medical $250,000', 'Trip cancellation $5,000', 'Baggage $1,500', 'Adventure sports', '24/7 helpline'],
    },
    {
      slug: 'premium',
      provider: 'Zurich',
      name: 'Premium Travel Insurance',
      coverageType: 'PREMIUM',
      pricePerDay: 18,
      medicalCoverage: 1000000,
      tripCancellation: 15000,
      baggageCoverage: 3000,
      desc: 'Best-in-class coverage with concierge service.',
      benefits: ['Medical $1,000,000', 'Trip cancellation $15,000', 'Baggage $3,000', 'Adventure sports', 'Concierge', 'Rental car coverage'],
    },
  ];
  for (const p of plans) {
    await prisma.insurancePlan.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        provider: p.provider,
        name: p.name,
        shortDesc: p.desc,
        description: p.desc,
        coverageType: p.coverageType,
        medicalCoverage: p.medicalCoverage,
        tripCancellation: p.tripCancellation,
        baggageCoverage: p.baggageCoverage,
        pricePerDay: p.pricePerDay,
        benefits: JSON.stringify(p.benefits),
      },
    });
  }
  console.log(`  ✓ ${plans.length} insurance plans`);

  // Airlines & airports
  const airlines = [
    { iataCode: 'GA', name: 'Garuda Indonesia', country: 'Indonesia' },
    { iataCode: 'JT', name: 'Lion Air', country: 'Indonesia' },
    { iataCode: 'SQ', name: 'Singapore Airlines', country: 'Singapore' },
    { iataCode: 'QF', name: 'Qantas', country: 'Australia' },
  ];
  for (const a of airlines) {
    await prisma.airline.upsert({ where: { iataCode: a.iataCode }, update: {}, create: a });
  }

  const airports = [
    { iataCode: 'DPS', name: 'Ngurah Rai International', city: 'Denpasar', country: 'Indonesia' },
    { iataCode: 'CGK', name: 'Soekarno-Hatta', city: 'Jakarta', country: 'Indonesia' },
    { iataCode: 'SIN', name: 'Changi Airport', city: 'Singapore', country: 'Singapore' },
    { iataCode: 'SYD', name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia' },
  ];
  for (const a of airports) {
    await prisma.airport.upsert({ where: { iataCode: a.iataCode }, update: {}, create: a });
  }
  console.log(`  ✓ ${airlines.length} airlines, ${airports.length} airports`);

  // Sample flights
  const dps = await prisma.airport.findUnique({ where: { iataCode: 'DPS' } });
  const cgk = await prisma.airport.findUnique({ where: { iataCode: 'CGK' } });
  const sin = await prisma.airport.findUnique({ where: { iataCode: 'SIN' } });
  const ga = await prisma.airline.findUnique({ where: { iataCode: 'GA' } });
  const sq = await prisma.airline.findUnique({ where: { iataCode: 'SQ' } });

  if (dps && cgk && ga && sin && sq) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 3);
    baseDate.setHours(8, 0, 0, 0);

    const flightSamples = [
      { airline: ga, from: cgk, to: dps, num: 'GA404', dep: 8, dur: 130, price: 95 },
      { airline: ga, from: dps, to: cgk, num: 'GA405', dep: 14, dur: 130, price: 105 },
      { airline: sq, from: sin, to: dps, num: 'SQ938', dep: 9, dur: 165, price: 220 },
      { airline: sq, from: dps, to: sin, num: 'SQ939', dep: 16, dur: 165, price: 230 },
    ];

    for (const f of flightSamples) {
      const dep = new Date(baseDate);
      dep.setHours(f.dep, 0, 0, 0);
      const arr = new Date(dep.getTime() + f.dur * 60000);
      await prisma.flight.create({
        data: {
          airlineId: f.airline.id,
          flightNumber: f.num,
          departureAirportId: f.from.id,
          arrivalAirportId: f.to.id,
          departureTime: dep,
          arrivalTime: arr,
          durationMinutes: f.dur,
          basePrice: f.price,
        },
      });
    }
    console.log(`  ✓ ${flightSamples.length} flights`);
  }

  // Banner
  await prisma.banner.upsert({
    where: { id: 'home_hero' },
    update: {},
    create: {
      id: 'home_hero',
      title: 'Welcome to Bali',
      subtitle: 'Discover paradise',
      imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1920',
      position: 'home_hero',
    },
  }).catch(() => null);

  console.log('✅ Seed complete!');
  console.log('');
  console.log('   Admin login:  admin@balibestholiday.com / admin12345');
  console.log('');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
