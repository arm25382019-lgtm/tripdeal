import { fetchGroupedPrices, travelpayoutsConfigured } from '../server/travelpayouts.js';

const COUNTRY_CONFIG = {
  'ไทย': {
    country: 'ไทย',
    flag: '🇹🇭',
    destinations: [
      ['CNX', 'Chiang Mai'],
      ['HKT', 'Phuket'],
      ['KBV', 'Krabi'],
      ['HDY', 'Hat Yai'],
      ['CEI', 'Chiang Rai'],
      ['USM', 'Koh Samui'],
    ],
  },
  'ญี่ปุ่น': {
    country: 'ญี่ปุ่น',
    flag: '🇯🇵',
    destinations: [
      ['TYO', 'Tokyo'],
      ['OSA', 'Osaka'],
      ['FUK', 'Fukuoka'],
      ['CTS', 'Sapporo'],
    ],
  },
  'เกาหลี': {
    country: 'เกาหลี',
    flag: '🇰🇷',
    destinations: [
      ['SEL', 'Seoul'],
      ['PUS', 'Busan'],
      ['CJU', 'Jeju'],
    ],
  },
  'ไต้หวัน': {
    country: 'ไต้หวัน',
    flag: '🇹🇼',
    destinations: [
      ['TPE', 'Taipei'],
      ['KHH', 'Kaohsiung'],
    ],
  },
  'จีน': {
    country: 'จีน',
    flag: '🇨🇳',
    destinations: [
      ['PVG', 'Shanghai'],
      ['PEK', 'Beijing'],
      ['CAN', 'Guangzhou'],
      ['SZX', 'Shenzhen'],
      ['KMG', 'Kunming'],
    ],
  },
};

// Featured deals intentionally start only from Thailand's major gateway airports.
// This keeps the home feed relevant while still allowing domestic and cross-border Asia deals.
const FEATURED_ORIGINS = ['BKK', 'DMK', 'CNX', 'HKT'];

function monthString(date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function nextMonths(count = 2) {
  const now = new Date();
  const result = [];
  for (let i = 1; i <= count; i += 1) {
    result.push(monthString(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + i, 1))));
  }
  return result;
}

function scoreDeal(row, cheapest) {
  let score = 90;
  if ((row.transfers ?? 0) === 0 && (row.return_transfers ?? 0) === 0) score += 5;
  if (row.price <= cheapest * 1.08) score += 4;
  else if (row.price > cheapest * 1.25) score -= 5;
  return Math.max(72, Math.min(99, score));
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const countryKey = String(req.query?.country || 'ญี่ปุ่น').trim();
  const config = COUNTRY_CONFIG[countryKey];
  if (!config) return res.status(400).json({ error: 'Unsupported country' });

  if (!travelpayoutsConfigured()) {
    return res.status(200).json({ configured: false, country: countryKey, deals: [] });
  }

  try {
    const months = nextMonths(2);
    const tasks = [];

    for (const [destination, city] of config.destinations) {
      for (const origin of FEATURED_ORIGINS) {
        if (origin === destination) continue;
        for (const departureMonth of months) {
          tasks.push((async () => {
            const rows = await fetchGroupedPrices({
              origin,
              destination,
              departureMonth,
              minTripDuration: countryKey === 'ไทย' ? 2 : 4,
              maxTripDuration: countryKey === 'ไทย' ? 7 : 10,
              directOnly: false,
            });
            return rows
              .filter((row) => FEATURED_ORIGINS.includes(String(row.origin_airport || row.origin || '').toUpperCase()))
              .map((row) => ({ ...row, city, country: config.country, flag: config.flag, destination_code: destination }));
          })());
        }
      }
    }

    const settled = await Promise.allSettled(tasks);
    const rows = settled.filter((x) => x.status === 'fulfilled').flatMap((x) => x.value || []);

    const bestByCity = new Map();
    for (const row of rows) {
      const existing = bestByCity.get(row.city);
      if (!existing || row.price < existing.price) bestByCity.set(row.city, row);
    }

    const ranked = [...bestByCity.values()].sort((a, b) => a.price - b.price);
    const cheapest = ranked[0]?.price || 0;
    const deals = ranked.slice(0, 6).map((row) => ({
      city: row.city,
      country: row.country,
      flag: row.flag,
      destination_code: row.destination_code,
      origin_airport: row.origin_airport || row.origin,
      destination_airport: row.destination_airport || row.destination_code,
      departure_at: row.departure_at,
      return_at: row.return_at,
      price: row.price,
      currency: row.currency || 'THB',
      airline: row.airline || '',
      flight_number: row.flight_number || '',
      transfers: Number(row.transfers ?? 0),
      return_transfers: Number(row.return_transfers ?? 0),
      deal_score: scoreDeal(row, cheapest || row.price),
      source: 'travelpayouts_cached_discovery',
    }));

    return res.status(200).json({
      configured: true,
      country: countryKey,
      flag: config.flag,
      months,
      featured_origins: FEATURED_ORIGINS,
      data_type: 'cached_prices_found_by_aviasales_users',
      freshness_note: 'Discovery prices only. Final booking and payment happen on the airline website.',
      partial_failures: settled.filter((x) => x.status === 'rejected').length,
      deals,
    });
  } catch (error) {
    console.error('Featured deals error', error?.payload || error);
    return res.status(500).json({ configured: true, country: countryKey, deals: [], error: 'Featured deals are temporarily unavailable' });
  }
}
