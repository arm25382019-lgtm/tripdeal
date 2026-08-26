import { cityToDuffelCode, duffelConfigured, searchExactFlights } from '../server/duffel.js';

const allowedCities = new Set(['Tokyo', 'Osaka', 'Fukuoka', 'Sapporo']);
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!duffelConfigured()) {
    return res.status(200).json({ configured: false, provider: 'duffel', offers: [] });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const city = String(body.city || '').trim();
    const departureDate = String(body.departure_date || '').trim();
    const returnDate = String(body.return_date || '').trim();
    const directOnly = Boolean(body.direct_only);

    if (!allowedCities.has(city)) return res.status(400).json({ error: 'Unsupported city' });
    if (!isoDate.test(departureDate) || !isoDate.test(returnDate)) return res.status(400).json({ error: 'Invalid date' });
    if (departureDate >= returnDate) return res.status(400).json({ error: 'Return date must be after departure date' });

    const destination = cityToDuffelCode(city);
    const origins = ['BKK', 'DMK'];
    const settled = await Promise.allSettled(origins.map((origin) =>
      searchExactFlights({ origin, destination, departureDate, returnDate, directOnly })
    ));

    const searches = settled.filter((x) => x.status === 'fulfilled').map((x) => x.value);
    const offers = searches.flatMap((x) => x.offers || []);
    const unique = new Map();
    for (const offer of offers) {
      if (offer?.id && !unique.has(offer.id)) unique.set(offer.id, offer);
    }

    const sorted = [...unique.values()]
      .sort((a, b) => Number(a.total_amount) - Number(b.total_amount))
      .slice(0, 30);

    const failed = settled.filter((x) => x.status === 'rejected').length;
    return res.status(200).json({
      configured: true,
      provider: 'duffel',
      live_mode: searches.some((x) => x.live_mode),
      city,
      departure_date: departureDate,
      return_date: returnDate,
      searched_origins: origins,
      partial_failures: failed,
      offers: sorted,
    });
  } catch (error) {
    console.error('Duffel search endpoint error', error?.payload || error);
    const status = Number(error?.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      configured: true,
      provider: 'duffel',
      error: 'Live flight search is temporarily unavailable',
    });
  }
}
