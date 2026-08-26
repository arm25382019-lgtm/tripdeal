import { fetchGroupedPrices, travelpayoutsConfigured } from '../server/travelpayouts.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!travelpayoutsConfigured()) {
    return res.status(200).json({ ok: false, configured: false, provider: 'travelpayouts' });
  }

  try {
    const rows = await fetchGroupedPrices({
      origin: 'BKK',
      destination: 'TYO',
      departureMonth: '2026-10',
      minTripDuration: 5,
      maxTripDuration: 7,
      directOnly: false,
    });

    const cheapest = [...rows].sort((a, b) => a.price - b.price)[0] || null;
    return res.status(200).json({
      ok: true,
      configured: true,
      provider: 'travelpayouts',
      test_route: 'BKK-TYO',
      test_month: '2026-10',
      sample_count: rows.length,
      cheapest: cheapest ? {
        price: cheapest.price,
        currency: cheapest.currency,
        departure_at: cheapest.departure_at,
        return_at: cheapest.return_at,
        airline: cheapest.airline,
        transfers: cheapest.transfers,
        return_transfers: cheapest.return_transfers,
      } : null,
      note: 'Cached fare data from Aviasales Data API; not guaranteed live inventory.',
    });
  } catch (error) {
    console.error('Travelpayouts health check error', error?.payload || error);
    return res.status(200).json({
      ok: false,
      configured: true,
      provider: 'travelpayouts',
      status: Number(error?.status) || null,
      error: error?.message || 'Travelpayouts request failed',
    });
  }
}
