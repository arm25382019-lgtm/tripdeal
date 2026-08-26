const TP_API = 'https://api.travelpayouts.com';
const iataPattern = /^[A-Z0-9]{3}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const MARKETS = ['th', 'sg', 'us'];

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function mapRows(payload, { origin, destination, oneWay }) {
  const rows = Array.isArray(payload?.data) ? payload.data : Object.values(payload?.data || {});
  return rows.map((row) => ({
    origin: row?.origin || origin,
    destination: row?.destination || destination,
    origin_airport: row?.origin_airport || row?.origin || origin,
    destination_airport: row?.destination_airport || row?.destination || destination,
    price: Number(row?.price || 0),
    currency: String(payload?.currency || 'thb').toUpperCase(),
    airline: String(row?.airline || '').toUpperCase(),
    flight_number: row?.flight_number ? String(row.flight_number) : '',
    departure_at: normalizeDate(row?.departure_at),
    return_at: oneWay ? null : normalizeDate(row?.return_at),
    transfers: Number(row?.transfers ?? 0),
    return_transfers: oneWay ? 0 : Number(row?.return_transfers ?? 0),
    duration_minutes: Number(row?.duration ?? 0),
    found_at: normalizeDate(row?.found_at),
    source: 'flight_price_discovery',
  })).filter((row) => row.departure_at && row.price > 0 && row.airline && (oneWay || row.return_at));
}

async function fetchPrices({ token, origin, destination, departureAt, returnAt, oneWay, directOnly, market }) {
  const params = new URLSearchParams({
    currency: 'thb',
    origin,
    destination,
    departure_at: departureAt,
    one_way: String(oneWay),
    direct: String(directOnly),
    market,
    sorting: 'price',
    unique: 'false',
    limit: '1000',
    page: '1',
  });
  if (!oneWay && returnAt) params.set('return_at', returnAt);

  const response = await fetch(`${TP_API}/aviasales/v3/prices_for_dates?${params.toString()}`, {
    headers: { Accept: 'application/json', 'X-Access-Token': token },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.error || `Flight price search failed (${response.status})`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }
  return mapRows(payload, { origin, destination, oneWay });
}

function uniqueRows(rows) {
  const unique = new Map();
  for (const row of rows) {
    const key = [row.airline, row.flight_number, row.origin_airport, row.destination_airport, row.departure_at, row.return_at, row.price].join('|');
    const existing = unique.get(key);
    if (!existing || row.price < existing.price) unique.set(key, row);
  }
  return [...unique.values()];
}

function dayDistance(iso, requestedDate) {
  const a = new Date(iso).getTime();
  const b = new Date(`${requestedDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return Number.MAX_SAFE_INTEGER;
  return Math.abs(Math.round((a - b) / 86400000));
}

function buildReferencePrices(rows, requestedDate) {
  const byAirline = new Map();
  for (const row of rows) {
    const distance = dayDistance(row.departure_at, requestedDate);
    const current = byAirline.get(row.airline);
    if (!current || distance < current.distance || (distance === current.distance && row.price < current.row.price)) {
      byAirline.set(row.airline, { row, distance });
    }
  }
  return [...byAirline.values()]
    .map(({ row, distance }) => ({
      ...row,
      requested_departure_date: requestedDate,
      reference_day_distance: distance,
      reference_type: distance === 0 ? 'exact_date' : 'nearby_date',
    }))
    .sort((a, b) => a.price - b.price);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) return res.status(200).json({ configured: false, provider: 'travelpayouts', prices: [], reference_prices: [] });

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

    const exactSettled = await Promise.allSettled(MARKETS.map((market) => fetchPrices({
      token,
      origin,
      destination,
      departureAt: departureDate,
      returnAt: oneWay ? undefined : returnDate,
      oneWay,
      directOnly,
      market,
    })));

    const exactRows = uniqueRows(exactSettled
      .filter((x) => x.status === 'fulfilled')
      .flatMap((x) => x.value || []));

    // A date-specific cache can contain only the cheapest fare discovered in a market.
    // Querying the month as well gives TripDeal a better chance of identifying other
    // airlines that operate the route, while keeping those values clearly labelled as references.
    const departureMonth = departureDate.slice(0, 7);
    const returnMonth = returnDate ? returnDate.slice(0, 7) : undefined;
    const monthSettled = await Promise.allSettled(MARKETS.map((market) => fetchPrices({
      token,
      origin,
      destination,
      departureAt: departureMonth,
      returnAt: oneWay ? undefined : returnMonth,
      oneWay,
      directOnly,
      market,
    })));

    const monthRows = uniqueRows(monthSettled
      .filter((x) => x.status === 'fulfilled')
      .flatMap((x) => x.value || []));

    const allFailures = [...exactSettled, ...monthSettled].every((x) => x.status === 'rejected');
    if (allFailures) {
      console.error('Airline search provider unavailable', exactSettled.map((x) => x.reason?.payload || x.reason));
      return res.status(502).json({ configured: true, error: 'Flight price search is temporarily unavailable' });
    }

    const prices = exactRows.sort((a, b) => a.price - b.price).slice(0, 40);
    const referencePrices = buildReferencePrices(uniqueRows([...exactRows, ...monthRows]), departureDate).slice(0, 30);

    return res.status(200).json({
      configured: true,
      provider: 'flight_price_discovery',
      data_type: prices.length ? 'recent_exact_date_fares' : 'route_reference_fares',
      note: 'Prices are recent discovery data. Final availability, fare and payment are confirmed on the airline website.',
      search: { origin, destination, departure_date: departureDate, return_date: oneWay ? null : returnDate, one_way: oneWay },
      markets_checked: MARKETS,
      prices,
      reference_prices: referencePrices,
    });
  } catch (error) {
    console.error('Airline search endpoint error', error);
    return res.status(500).json({ configured: true, error: 'Flight search is temporarily unavailable' });
  }
}
