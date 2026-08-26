const TP_API = 'https://api.travelpayouts.com';

const destinationCodes = {
  Tokyo: 'TYO',
  Osaka: 'OSA',
  Fukuoka: 'FUK',
  Sapporo: 'SPK',
};

export function travelpayoutsConfigured() {
  return Boolean(process.env.TRAVELPAYOUTS_TOKEN);
}

export function cityToTravelpayoutsCode(city) {
  return destinationCodes[city] || city;
}

function normalizeDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export async function fetchGroupedPrices({
  origin,
  destination,
  departureMonth,
  minTripDuration,
  maxTripDuration,
  directOnly = false,
  currency = 'thb',
  market = 'th',
}) {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) throw new Error('TRAVELPAYOUTS_NOT_CONFIGURED');

  const params = new URLSearchParams({
    currency,
    origin,
    destination,
    group_by: 'departure_at',
    departure_at: departureMonth,
    market,
    direct: String(Boolean(directOnly)),
  });

  if (Number.isFinite(minTripDuration)) params.set('min_trip_duration', String(minTripDuration));
  if (Number.isFinite(maxTripDuration)) params.set('max_trip_duration', String(maxTripDuration));

  const response = await fetch(`${TP_API}/aviasales/v3/grouped_prices?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'X-Access-Token': token,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload?.success === false) {
    const err = new Error(payload?.error || `Travelpayouts request failed (${response.status})`);
    err.status = response.status;
    err.payload = payload;
    throw err;
  }

  const rows = Object.values(payload?.data || {});
  return rows.map((row) => ({
    origin: row?.origin || origin,
    destination: row?.destination || destination,
    origin_airport: row?.origin_airport || row?.origin || origin,
    destination_airport: row?.destination_airport || row?.destination || destination,
    price: Number(row?.price || 0),
    currency: String(payload?.currency || currency).toUpperCase(),
    airline: row?.airline || '',
    flight_number: row?.flight_number ? String(row.flight_number) : '',
    departure_at: normalizeDate(row?.departure_at),
    return_at: normalizeDate(row?.return_at),
    transfers: Number(row?.transfers ?? 0),
    return_transfers: Number(row?.return_transfers ?? 0),
    duration_minutes: Number(row?.duration ?? 0),
    raw_link: row?.link || null,
    aviasales_url: row?.link ? `https://www.aviasales.com${row.link}` : null,
    source: 'travelpayouts_aviasales_data_api',
  })).filter((row) => row.departure_at && row.return_at && row.price > 0);
}
