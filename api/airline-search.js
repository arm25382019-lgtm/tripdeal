const TP_API = 'https://api.travelpayouts.com';
const iataPattern = /^[A-Z0-9]{3}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return res.status(200).json({ configured: false, provider: 'travelpayouts', prices: [] });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const origin = String(body.origin || '').trim().toUpperCase();
    const destination = String(body.destination || '').trim().toUpperCase();
    const departureDate = String(body.departure_date || '').trim();
    const returnDate = String(body.return_date || '').trim();
    const oneWay = Boolean(body.one_way);
    const directOnly = Boolean(body.direct_only);

    if (!iataPattern.test(origin) || !iataPattern.test(destination)) return res.status(400).json({ error: 'Invalid airport code' });
    if (origin === destination) return res.status(400).json({ error: 'Origin and destination must be different' });
    if (!datePattern.test(departureDate)) return res.status(400).json({ error: 'Invalid departure date' });
    if (!oneWay && !datePattern.test(returnDate)) return res.status(400).json({ error: 'Invalid return date' });

    const params = new URLSearchParams({
      currency: 'thb',
      origin,
      destination,
      departure_at: departureDate,
      one_way: String(oneWay),
      direct: String(directOnly),
      market: 'th',
      sorting: 'price',
      unique: 'false',
      limit: '100',
      page: '1',
    });
    if (!oneWay) params.set('return_at', returnDate);

    const response = await fetch(`${TP_API}/aviasales/v3/prices_for_dates?${params.toString()}`, {
      headers: { Accept: 'application/json', 'X-Access-Token': token },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      console.error('Airline search provider error', payload);
      return res.status(response.status || 502).json({ configured: true, error: 'Flight price search is temporarily unavailable' });
    }

    const rows = Array.isArray(payload?.data) ? payload.data : Object.values(payload?.data || {});
    const prices = rows.map((row) => ({
      origin: row?.origin || origin,
      destination: row?.destination || destination,
      origin_airport: row?.origin_airport || row?.origin || origin,
      destination_airport: row?.destination_airport || row?.destination || destination,
      price: Number(row?.price || 0),
      currency: String(payload?.currency || 'thb').toUpperCase(),
      airline: String(row?.airline || ''),
      flight_number: row?.flight_number ? String(row.flight_number) : '',
      departure_at: normalizeDate(row?.departure_at),
      return_at: oneWay ? null : normalizeDate(row?.return_at),
      transfers: Number(row?.transfers ?? 0),
      return_transfers: oneWay ? 0 : Number(row?.return_transfers ?? 0),
      duration_minutes: Number(row?.duration ?? 0),
      found_at: normalizeDate(row?.found_at),
      source: 'flight_price_discovery',
    })).filter((row) => row.departure_at && row.price > 0 && (oneWay || row.return_at));

    const unique = new Map();
    for (const row of prices) {
      const key = [row.airline, row.flight_number, row.origin_airport, row.destination_airport, row.departure_at, row.return_at, row.price].join('|');
      if (!unique.has(key)) unique.set(key, row);
    }

    const sorted = [...unique.values()].sort((a, b) => a.price - b.price).slice(0, 40);
    return res.status(200).json({
      configured: true,
      provider: 'flight_price_discovery',
      data_type: 'recent_exact_date_fares',
      note: 'Price discovery data may change. Final availability and payment are confirmed on the airline website.',
      search: { origin, destination, departure_date: departureDate, return_date: oneWay ? null : returnDate, one_way: oneWay },
      prices: sorted,
    });
  } catch (error) {
    console.error('Airline search endpoint error', error);
    return res.status(500).json({ configured: true, error: 'Flight search is temporarily unavailable' });
  }
}
