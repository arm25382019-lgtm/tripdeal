// Duffel integration was removed (server/duffel.js deleted). Local stubs keep this
// endpoint importable so it never crashes at module load. Restore in V2.
const duffelConfigured = () => false;
const searchExactFlights = async () => ({ offers: [], live_mode: false });

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

function durationMinutes(value) {
  if (!value) return 0;
  const match = String(value).match(/^PT(?:(\d+)H)?(?:(\d+)M)?$/i);
  if (!match) return 0;
  return Number(match[1] || 0) * 60 + Number(match[2] || 0);
}

function mapDuffelOffers(offers, { oneWay, adults }) {
  const safeAdults = Math.max(1, Number(adults || 1));
  return (offers || []).map((offer) => {
    const outbound = offer?.slices?.[0];
    const inbound = oneWay ? null : offer?.slices?.[1];
    const allSegments = [...(outbound?.segments || []), ...(inbound?.segments || [])];
    const carrierCodes = [...new Set(allSegments
      .map((segment) => segment?.marketing_carrier_iata || segment?.operating_carrier_iata || '')
      .filter(Boolean))];

    // TripDeal hands customers off to the airline directly, so for now only show
    // itineraries that can be represented by one airline brand end-to-end.
    if (carrierCodes.length !== 1) return null;

    const airline = carrierCodes[0];
    const first = outbound?.segments?.[0] || {};
    const returnFirst = inbound?.segments?.[0] || {};
    const total = Number(offer?.total_amount || 0);
    const pricePerPerson = total > 0 ? total / safeAdults : 0;

    return {
      origin: outbound?.origin || first?.origin || '',
      destination: outbound?.destination || first?.destination || '',
      origin_airport: outbound?.origin || first?.origin || '',
      destination_airport: outbound?.destination || first?.destination || '',
      price: Math.round(pricePerPerson * 100) / 100,
      total_price: Math.round(total * 100) / 100,
      currency: String(offer?.total_currency || 'THB').toUpperCase(),
      airline,
      flight_number: String(first?.marketing_carrier_flight_number || first?.operating_carrier_flight_number || ''),
      return_flight_number: oneWay ? '' : String(returnFirst?.marketing_carrier_flight_number || returnFirst?.operating_carrier_flight_number || ''),
      departure_at: normalizeDate(outbound?.departing_at),
      return_at: oneWay ? null : normalizeDate(inbound?.departing_at),
      transfers: Math.max(0, Number(outbound?.segments?.length || 1) - 1),
      return_transfers: oneWay ? 0 : Math.max(0, Number(inbound?.segments?.length || 1) - 1),
      duration_minutes: durationMinutes(outbound?.duration) + (oneWay ? 0 : durationMinutes(inbound?.duration)),
      found_at: normalizeDate(offer?.created_at),
      source: 'duffel_live_search',
      price_basis: 'live_offer_per_person',
      offer_id: offer?.id || '',
      offer_expires_at: normalizeDate(offer?.expires_at),
      live_mode: Boolean(offer?.live_mode),
    };
  }).filter((row) => row && row.departure_at && row.price > 0 && row.airline && (oneWay || row.return_at));
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
    price_basis: oneWay ? 'one_way_discovery' : 'roundtrip_discovery',
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

function cheapestByAirline(rows) {
  const byAirline = new Map();
  for (const row of rows) {
    const current = byAirline.get(row.airline);
    if (!current || row.price < current.price) byAirline.set(row.airline, row);
  }
  return byAirline;
}

function pairExactOneWays(outboundRows, inboundRows) {
  const outbound = cheapestByAirline(outboundRows);
  const inbound = cheapestByAirline(inboundRows);
  const result = [];

  for (const [airline, out] of outbound.entries()) {
    const back = inbound.get(airline);
    if (!back) continue;
    result.push({
      origin: out.origin,
      destination: out.destination,
      origin_airport: out.origin_airport,
      destination_airport: out.destination_airport,
      price: Number(out.price) + Number(back.price),
      outbound_price: Number(out.price),
      return_price: Number(back.price),
      currency: out.currency || back.currency || 'THB',
      airline,
      flight_number: out.flight_number || '',
      return_flight_number: back.flight_number || '',
      departure_at: out.departure_at,
      return_at: back.departure_at,
      transfers: Number(out.transfers ?? 0),
      return_transfers: Number(back.transfers ?? 0),
      duration_minutes: Number(out.duration_minutes ?? 0) + Number(back.duration_minutes ?? 0),
      found_at: out.found_at || back.found_at || null,
      source: 'paired_one_way_discovery',
      price_basis: 'sum_of_exact_one_way_discovery',
    });
  }

  return result.sort((a, b) => a.price - b.price);
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

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const origin = String(body.origin || '').trim().toUpperCase();
    const destination = String(body.destination || '').trim().toUpperCase();
    const departureDate = String(body.departure_date || '').trim();
    const returnDate = String(body.return_date || '').trim();
    const oneWay = Boolean(body.one_way);
    const directOnly = Boolean(body.direct_only);
    const adults = Math.min(9, Math.max(1, Math.round(Number(body.adults || 1))));

    if (!iataPattern.test(origin) || !iataPattern.test(destination)) return res.status(400).json({ error: 'Invalid airport code' });
    if (origin === destination) return res.status(400).json({ error: 'Origin and destination must be different' });
    if (!datePattern.test(departureDate)) return res.status(400).json({ error: 'Invalid departure date' });
    if (!oneWay && !datePattern.test(returnDate)) return res.status(400).json({ error: 'Invalid return date' });

    if (duffelConfigured()) {
      try {
        const live = await searchExactFlights({
          origin,
          destination,
          departureDate,
          returnDate: oneWay ? undefined : returnDate,
          directOnly,
          adults,
        });
        const livePrices = mapDuffelOffers(live?.offers || [], { oneWay, adults })
          .sort((a, b) => a.price - b.price)
          .slice(0, 40);

        if (livePrices.length > 0) {
          return res.status(200).json({
            configured: true,
            provider: 'duffel',
            data_type: 'live_flight_offers',
            live_mode: Boolean(live?.live_mode),
            note: 'Live flight offers. Prices and availability can change until confirmed on the airline website.',
            search: { origin, destination, departure_date: departureDate, return_date: oneWay ? null : returnDate, one_way: oneWay, adults },
            prices: livePrices,
            reference_prices: [],
          });
        }
      } catch (error) {
        console.error('Duffel live search unavailable, falling back to discovery', error?.payload || error);
      }
    }

    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) {
      return res.status(200).json({
        configured: false,
        provider: duffelConfigured() ? 'duffel' : 'none',
        prices: [],
        reference_prices: [],
        error: duffelConfigured() ? 'Live search returned no airline-direct offers' : 'No flight search provider configured',
      });
    }

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

    let exactRows = uniqueRows(exactSettled
      .filter((x) => x.status === 'fulfilled')
      .flatMap((x) => x.value || []));

    let splitSettled = [];
    if (!oneWay) {
      const outboundTasks = MARKETS.map((market) => fetchPrices({
        token,
        origin,
        destination,
        departureAt: departureDate,
        oneWay: true,
        directOnly,
        market,
      }));
      const inboundTasks = MARKETS.map((market) => fetchPrices({
        token,
        origin: destination,
        destination: origin,
        departureAt: returnDate,
        oneWay: true,
        directOnly,
        market,
      }));
      splitSettled = await Promise.allSettled([...outboundTasks, ...inboundTasks]);
      const outboundRows = uniqueRows(splitSettled.slice(0, MARKETS.length)
        .filter((x) => x.status === 'fulfilled')
        .flatMap((x) => x.value || []));
      const inboundRows = uniqueRows(splitSettled.slice(MARKETS.length)
        .filter((x) => x.status === 'fulfilled')
        .flatMap((x) => x.value || []));
      const paired = pairExactOneWays(outboundRows, inboundRows);

      const exactAirlines = new Set(exactRows.map((row) => row.airline));
      exactRows = [...exactRows, ...paired.filter((row) => !exactAirlines.has(row.airline))];
    }

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

    const everyRequest = [...exactSettled, ...splitSettled, ...monthSettled];
    const allFailures = everyRequest.length > 0 && everyRequest.every((x) => x.status === 'rejected');
    if (allFailures) {
      console.error('Airline search provider unavailable', exactSettled.map((x) => x.reason?.payload || x.reason));
      return res.status(502).json({ configured: true, error: 'Flight price search is temporarily unavailable' });
    }

    const prices = exactRows.sort((a, b) => a.price - b.price).slice(0, 40);
    const referencePrices = buildReferencePrices(uniqueRows([...exactRows, ...monthRows]), departureDate).slice(0, 30);

    return res.status(200).json({
      configured: true,
      provider: 'travelpayouts',
      data_type: prices.length ? (prices.some((row) => row.price_basis === 'sum_of_exact_one_way_discovery') ? 'exact_dates_with_paired_one_way_fallback' : 'recent_exact_date_fares') : 'route_reference_fares',
      note: 'Discovery prices only. Final availability, fare and payment are confirmed on the airline website.',
      search: { origin, destination, departure_date: departureDate, return_date: oneWay ? null : returnDate, one_way: oneWay, adults },
      markets_checked: MARKETS,
      prices,
      reference_prices: referencePrices,
    });
  } catch (error) {
    console.error('Airline search endpoint error', error);
    return res.status(500).json({ configured: true, error: 'Flight search is temporarily unavailable' });
  }
}
