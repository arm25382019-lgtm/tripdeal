const DUFFEL_API = 'https://api.duffel.com';

const destinationCodes = {
  Tokyo: 'TYO',
  Osaka: 'OSA',
  Fukuoka: 'FUK',
  Sapporo: 'SPK',
};

export function duffelConfigured() {
  return Boolean(process.env.DUFFEL_ACCESS_TOKEN);
}

export function cityToDuffelCode(city) {
  return destinationCodes[city] || city;
}

export async function duffelFetch(path, options = {}) {
  const token = process.env.DUFFEL_ACCESS_TOKEN;
  if (!token) throw new Error('DUFFEL_NOT_CONFIGURED');

  const response = await fetch(`${DUFFEL_API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'Content-Type': 'application/json',
      'Duffel-Version': 'v2',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data?.errors?.[0]?.message || `Duffel request failed (${response.status})`);
    err.status = response.status;
    err.payload = data;
    throw err;
  }
  return data;
}

function baggageForSegment(segment) {
  const baggages = segment?.passengers?.[0]?.baggages || [];
  const checked = baggages.find((b) => b?.type === 'checked');
  const carryOn = baggages.find((b) => b?.type === 'carry_on');
  return {
    checked_quantity: checked?.quantity ?? 0,
    carry_on_quantity: carryOn?.quantity ?? 0,
  };
}

function normalizeSegment(segment) {
  return {
    id: segment?.id || '',
    origin: segment?.origin?.iata_code || '',
    destination: segment?.destination?.iata_code || '',
    origin_name: segment?.origin?.name || '',
    destination_name: segment?.destination?.name || '',
    origin_terminal: segment?.origin_terminal || null,
    destination_terminal: segment?.destination_terminal || null,
    departing_at: segment?.departing_at || '',
    arriving_at: segment?.arriving_at || '',
    duration: segment?.duration || null,
    operating_carrier: segment?.operating_carrier?.name || '',
    operating_carrier_iata: segment?.operating_carrier?.iata_code || '',
    operating_carrier_flight_number: segment?.operating_carrier_flight_number || '',
    marketing_carrier: segment?.marketing_carrier?.name || '',
    marketing_carrier_iata: segment?.marketing_carrier?.iata_code || '',
    marketing_carrier_flight_number: segment?.marketing_carrier_flight_number || '',
    aircraft: segment?.aircraft?.name || null,
    baggage: baggageForSegment(segment),
  };
}

function normalizeSlice(slice) {
  const segments = (slice?.segments || []).map(normalizeSegment);
  const first = segments[0] || {};
  const last = segments[segments.length - 1] || {};
  return {
    id: slice?.id || '',
    origin: slice?.origin?.iata_code || first.origin || '',
    destination: slice?.destination?.iata_code || last.destination || '',
    duration: slice?.duration || null,
    segments,
    direct: segments.length === 1,
    departing_at: first.departing_at || '',
    arriving_at: last.arriving_at || '',
  };
}

function normalizeCondition(condition) {
  if (!condition) return null;
  return {
    allowed: Boolean(condition.allowed),
    penalty_amount: condition.penalty_amount ?? null,
    penalty_currency: condition.penalty_currency ?? null,
  };
}

export function normalizeOffer(offer) {
  const slices = (offer?.slices || []).map(normalizeSlice);
  return {
    id: offer?.id || '',
    live_mode: Boolean(offer?.live_mode),
    expires_at: offer?.expires_at || null,
    created_at: offer?.created_at || null,
    total_amount: offer?.total_amount || '0',
    total_currency: offer?.total_currency || '',
    base_amount: offer?.base_amount || null,
    base_currency: offer?.base_currency || null,
    tax_amount: offer?.tax_amount || null,
    tax_currency: offer?.tax_currency || null,
    total_emissions_kg: offer?.total_emissions_kg || null,
    owner: {
      name: offer?.owner?.name || '',
      iata_code: offer?.owner?.iata_code || '',
      logo_symbol_url: offer?.owner?.logo_symbol_url || null,
      logo_lockup_url: offer?.owner?.logo_lockup_url || null,
    },
    conditions: {
      refund_before_departure: normalizeCondition(offer?.conditions?.refund_before_departure),
      change_before_departure: normalizeCondition(offer?.conditions?.change_before_departure),
    },
    slices,
  };
}

export async function searchExactFlights({ origin, destination, departureDate, returnDate, directOnly = false }) {
  const body = {
    data: {
      slices: [
        { origin, destination, departure_date: departureDate },
        { origin: destination, destination: origin, departure_date: returnDate },
      ],
      passengers: [{ type: 'adult' }],
      cabin_class: 'economy',
      max_connections: directOnly ? 0 : 1,
    },
  };

  const response = await duffelFetch('/air/offer_requests?return_offers=true&supplier_timeout=8000&view=offers', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return {
    request_id: response?.data?.id || null,
    live_mode: Boolean(response?.data?.live_mode),
    offers: (response?.data?.offers || []).map(normalizeOffer),
  };
}

export async function getOffer(offerId) {
  const response = await duffelFetch(`/air/offers/${encodeURIComponent(offerId)}?return_available_services=true`, {
    method: 'GET',
  });
  const offer = normalizeOffer(response?.data || {});
  offer.available_services = (response?.data?.available_services || []).map((service) => ({
    id: service?.id || '',
    type: service?.type || '',
    total_amount: service?.total_amount || null,
    total_currency: service?.total_currency || null,
    maximum_quantity: service?.maximum_quantity ?? null,
    segment_ids: service?.segment_ids || [],
    passenger_ids: service?.passenger_ids || [],
    metadata: service?.metadata || null,
  }));
  return offer;
}
