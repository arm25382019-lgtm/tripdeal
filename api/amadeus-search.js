const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const IATA_PATTERN = /^[A-Z0-9]{3}$/;

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function amadeusBaseUrl() {
  return String(process.env.AMADEUS_ENV || '').toLowerCase() === 'production'
    ? 'https://api.amadeus.com'
    : 'https://test.api.amadeus.com';
}

async function getAccessToken() {
  const apiKey = process.env.AMADEUS_API_KEY;
  const apiSecret = process.env.AMADEUS_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const now = Date.now();
  if (cachedToken && cachedTokenExpiresAt > now + 60_000) return cachedToken;

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: apiKey,
    client_secret: apiSecret,
  });

  const response = await fetch(`${amadeusBaseUrl()}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload?.access_token) {
    const error = new Error(payload?.error_description || payload?.error || `Amadeus auth failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  cachedToken = payload.access_token;
  cachedTokenExpiresAt = now + Math.max(60, Number(payload.expires_in || 1800)) * 1000;
  return cachedToken;
}

function durationToMinutes(value) {
  const match = String(value || '').match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?$/);
  if (!match) return 0;
  return Number(match[1] || 0) * 1440 + Number(match[2] || 0) * 60 + Number(match[3] || 0);
}

function itineraryInfo(itinerary) {
  const segments = Array.isArray(itinerary?.segments) ? itinerary.segments : [];
  if (!segments.length) return null;
  const first = segments[0];
  const last = segments[segments.length - 1];
  return {
    origin_airport: String(first?.departure?.iataCode || '').toUpperCase(),
    destination_airport: String(last?.arrival?.iataCode || '').toUpperCase(),
    departure_at: first?.departure?.at || null,
    arrival_at: last?.arrival?.at || null,
    flight_number: first?.number ? String(first.number) : '',
    carrier: String(first?.carrierCode || '').toUpperCase(),
    transfers: Math.max(0, segments.length - 1),
    duration_minutes: durationToMinutes(itinerary?.duration),
    segments: segments.map((segment) => ({
      carrier: String(segment?.carrierCode || '').toUpperCase(),
      flight_number: segment?.number ? String(segment.number) : '',
      origin: String(segment?.departure?.iataCode || '').toUpperCase(),
      destination: String(segment?.arrival?.iataCode || '').toUpperCase(),
      departure_at: segment?.departure?.at || null,
      arrival_at: segment?.arrival?.at || null,
    })),
  };
}

function mapOffer(offer, adults) {
  const itineraries = Array.isArray(offer?.itineraries) ? offer.itineraries : [];
  const outbound = itineraryInfo(itineraries[0]);
  if (!outbound) return null;
  const inbound = itineraryInfo(itineraries[1]);
  const validatingCarrier = String(offer?.validatingAirlineCodes?.[0] || outbound.carrier || '').toUpperCase();
  const total = Number(offer?.price?.grandTotal || offer?.price?.total || 0);
  if (!validatingCarrier || !Number.isFinite(total) || total <= 0) return null;

  return {
    origin: outbound.origin_airport,
    destination: outbound.destination_airport,
    origin_airport: outbound.origin_airport,
    destination_airport: outbound.destination_airport,
    price: Number((total / Math.max(1, adults)).toFixed(2)),
    total_price: total,
    currency: String(offer?.price?.currency || 'THB').toUpperCase(),
    airline: validatingCarrier,
    flight_number: outbound.flight_number,
    return_flight_number: inbound?.flight_number || '',
    departure_at: outbound.departure_at,
    arrival_at: outbound.arrival_at,
    return_at: inbound?.departure_at || null,
    transfers: outbound.transfers,
    return_transfers: inbound?.transfers || 0,
    duration_minutes: outbound.duration_minutes + (inbound?.duration_minutes || 0),
    outbound_duration_minutes: outbound.duration_minutes,
    return_duration_minutes: inbound?.duration_minutes || 0,
    number_of_bookable_seats: Number(offer?.numberOfBookableSeats || 0),
    last_ticketing_date: offer?.lastTicketingDate || null,
    instant_ticketing_required: Boolean(offer?.instantTicketingRequired),
    outbound_segments: outbound.segments,
    return_segments: inbound?.segments || [],
    source: 'amadeus_live',
    source_role: 'live_inventory',
    price_basis: 'live_offer',
    availability_status: 'live_offer_confirm_before_payment',
    provider: 'amadeus',
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const configured = Boolean(process.env.AMADEUS_API_KEY && process.env.AMADEUS_API_SECRET);
  if (!configured) {
    return res.status(200).json({
      configured: false,
      provider: 'amadeus',
      environment: String(process.env.AMADEUS_ENV || 'test').toLowerCase(),
      prices: [],
      note: 'Add AMADEUS_API_KEY and AMADEUS_API_SECRET as server-only environment variables to enable live search.',
    });
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

    if (!IATA_PATTERN.test(origin) || !IATA_PATTERN.test(destination)) return res.status(400).json({ error: 'Invalid airport or city code' });
    if (origin === destination) return res.status(400).json({ error: 'Origin and destination must be different' });
    if (!DATE_PATTERN.test(departureDate)) return res.status(400).json({ error: 'Invalid departure date' });
    if (!oneWay && !DATE_PATTERN.test(returnDate)) return res.status(400).json({ error: 'Invalid return date' });

    const accessToken = await getAccessToken();
    const query = new URLSearchParams({
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate,
      adults: String(adults),
      currencyCode: 'THB',
      travelClass: 'ECONOMY',
      nonStop: String(directOnly),
      max: '80',
    });
    if (!oneWay) query.set('returnDate', returnDate);

    const response = await fetch(`${amadeusBaseUrl()}/v2/shopping/flight-offers?${query.toString()}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.amadeus+json',
      },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload?.errors?.[0]?.detail || payload?.errors?.[0]?.title || `Amadeus flight search failed (${response.status})`;
      const error = new Error(detail);
      error.status = response.status;
      throw error;
    }

    const prices = (Array.isArray(payload?.data) ? payload.data : [])
      .map((offer) => mapOffer(offer, adults))
      .filter(Boolean)
      .sort((a, b) => a.price - b.price);

    return res.status(200).json({
      configured: true,
      provider: 'amadeus',
      environment: String(process.env.AMADEUS_ENV || 'test').toLowerCase(),
      data_type: 'live_flight_offers',
      search: { origin, destination, departure_date: departureDate, return_date: oneWay ? null : returnDate, one_way: oneWay, adults },
      prices,
      meta: payload?.meta || null,
      note: 'Live offers are used for comparison. Final fare, seats and payment are confirmed again by the airline during handoff.',
    });
  } catch (error) {
    console.error('Amadeus search endpoint error', error);
    return res.status(502).json({
      configured: true,
      provider: 'amadeus',
      prices: [],
      error: error instanceof Error ? error.message : 'Amadeus live search is temporarily unavailable',
    });
  }
}
