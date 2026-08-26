import {
  cityToTravelpayoutsCode,
  fetchGroupedPrices,
  travelpayoutsConfigured,
} from '../server/travelpayouts.js';

const allowedCities = new Set(['Tokyo', 'Osaka', 'Fukuoka', 'Sapporo']);
const monthPattern = /^\d{4}-\d{2}$/;

function clampInt(value, fallback, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!travelpayoutsConfigured()) {
    return res.status(200).json({ configured: false, provider: 'travelpayouts', prices: [] });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const city = String(body.city || '').trim();
    const departureMonth = String(body.departure_month || '').trim();
    const directOnly = Boolean(body.direct_only);
    const minDays = clampInt(body.min_days, 5, 1, 30);
    const maxDays = clampInt(body.max_days, 7, minDays, 60);
    const maxBudget = Number(body.max_budget || 0);

    if (!allowedCities.has(city)) return res.status(400).json({ error: 'Unsupported city' });
    if (!monthPattern.test(departureMonth)) return res.status(400).json({ error: 'Invalid departure month' });

    const destination = cityToTravelpayoutsCode(city);
    const origins = ['BKK', 'DMK'];
    const settled = await Promise.allSettled(origins.map((origin) =>
      fetchGroupedPrices({
        origin,
        destination,
        departureMonth,
        minTripDuration: minDays,
        maxTripDuration: maxDays,
        directOnly,
      })
    ));

    const merged = settled
      .filter((x) => x.status === 'fulfilled')
      .flatMap((x) => x.value || []);

    const unique = new Map();
    for (const row of merged) {
      const key = [row.origin_airport, row.destination_airport, row.departure_at, row.return_at, row.airline, row.flight_number].join('|');
      const existing = unique.get(key);
      if (!existing || row.price < existing.price) unique.set(key, row);
    }

    const prices = [...unique.values()]
      .filter((row) => !maxBudget || row.price <= maxBudget)
      .sort((a, b) => a.price - b.price)
      .slice(0, 30);

    return res.status(200).json({
      configured: true,
      provider: 'travelpayouts',
      data_type: 'cached_prices_found_by_aviasales_users',
      freshness_note: 'These are cached fares found by Aviasales users, not guaranteed live inventory.',
      city,
      departure_month: departureMonth,
      min_days: minDays,
      max_days: maxDays,
      direct_only: directOnly,
      partial_failures: settled.filter((x) => x.status === 'rejected').length,
      prices,
    });
  } catch (error) {
    console.error('Travelpayouts prices endpoint error', error?.payload || error);
    const status = Number(error?.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      configured: true,
      provider: 'travelpayouts',
      error: 'Travelpayouts price lookup is temporarily unavailable',
    });
  }
}
