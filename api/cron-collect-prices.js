// TripDeal :: /api/cron-collect-prices
//
// เก็บราคาถูกสุดของแต่ละวันออกเดินทาง ลง Supabase ทุกวัน
// เพื่อสร้าง "ราคาปกติ" ของเราเอง -> Deal Score ถึงจะพูดได้ว่า "ถูกกว่าปกติ 23%"
//
// ตอนนี้ Deal Score ในหน้า Results คิดจากลำดับ + จำนวนต่อเครื่อง (scoreFor)
// ซึ่งบอกได้แค่ "ถูกที่สุดในผลลัพธ์ชุดนี้" ไม่ใช่ "ถูกกว่าปกติ"
// ตารางนี้คือของที่ทำให้พูดประโยคหลังได้ และเป็นสิ่งที่คู่แข่งลอกไม่ได้
//
// ยิงเองด้วยมือ:  curl -X POST https://tripdeal-ebon.vercel.app/api/cron-collect-prices \
//                   -H "x-cron-secret: <CRON_SECRET>"

const TP_API = 'https://api.travelpayouts.com';
const MARKET = 'th';

// ญี่ปุ่นก่อนตามแผน MVP — เพิ่มเส้นทางได้ที่นี่
const ROUTES = [
  { origin: 'BKK', destination: 'NRT' },
  { origin: 'BKK', destination: 'KIX' },
  { origin: 'BKK', destination: 'FUK' },
  { origin: 'BKK', destination: 'CTS' },
  { origin: 'DMK', destination: 'NRT' },
  { origin: 'DMK', destination: 'KIX' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ทุกวัน = 3 เดือนหน้า / วันจันทร์ = ยิงยาว 8 เดือน
function monthsToFetch() {
  const deep = new Date().getDay() === 1;
  const count = deep ? 8 : 3;
  const months = [];
  for (let i = 0; i < count; i += 1) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

async function fetchMonth({ token, origin, destination, month }) {
  const params = new URLSearchParams({
    currency: 'thb',
    origin,
    destination,
    departure_at: month,
    one_way: 'true',       // เก็บขาเดียวเพื่อให้ baseline สะอาด ไม่ปนความยาวทริป
    market: MARKET,
    sorting: 'price',
    unique: 'true',        // 1 แถวต่อ 1 วันออกเดินทาง
    limit: '1000',
    page: '1',
  });

  const res = await fetch(`${TP_API}/aviasales/v3/prices_for_dates?${params}`, {
    headers: { Accept: 'application/json', 'X-Access-Token': token },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.error || `Travelpayouts ${res.status}`);
  }

  const rows = Array.isArray(payload?.data) ? payload.data : Object.values(payload?.data || {});
  const today = new Date().toISOString().slice(0, 10);

  return rows
    .filter((r) => r?.departure_at && Number(r?.price) > 0)
    .map((r) => ({
      origin,
      destination,
      depart_date: String(r.departure_at).slice(0, 10),
      price: Number(r.price),
      currency: 'THB',
      airline: String(r.airline || '').toUpperCase() || null,
      flight_number: r.flight_number ? String(r.flight_number) : null,
      transfers: Number(r.transfers ?? 0),
      // found_at = เวลาที่ "มีคนเจอราคานี้" ไม่ใช่เวลาที่เราเก็บ
      // ข้อมูล Travelpayouts เป็น cache ไม่ใช่ราคา live เก็บไว้เพื่อบอกอายุราคาได้
      found_at: r.found_at || null,
      collected_on: today,
      source: 'travelpayouts_prices_for_dates',
    }));
}

// เหลือแถวถูกสุดของแต่ละวัน
function cheapestPerDate(rows) {
  const best = new Map();
  for (const row of rows) {
    const current = best.get(row.depart_date);
    if (!current || row.price < current.price) best.set(row.depart_date, row);
  }
  return [...best.values()];
}

export default async function handler(req, res) {
  // กันคนอื่นยิงเล่นจนโควตา API หมด
  const secret = process.env.CRON_SECRET;
  const provided = req.headers['x-cron-secret'] || (req.headers.authorization || '').replace('Bearer ', '');
  const fromVercelCron = Boolean(req.headers['x-vercel-cron']);
  if (secret && !fromVercelCron && provided !== secret) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const missing = [];
  if (!token) missing.push('TRAVELPAYOUTS_TOKEN');
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!serviceKey) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    return res.status(503).json({ ok: false, error: 'Missing env', missing });
  }

  const months = monthsToFetch();
  const summary = [];
  let totalRows = 0;
  let inserted = 0;

  for (const route of ROUTES) {
    const collected = [];
    for (const month of months) {
      try {
        collected.push(...await fetchMonth({ token, ...route, month }));
      } catch (error) {
        console.error(`[cron] ${route.origin}->${route.destination} ${month}:`, error.message);
      }
      await sleep(400); // กันโดน rate limit
    }

    const rows = cheapestPerDate(collected);
    totalRows += rows.length;

    if (rows.length) {
      // upsert กับ unique(origin,destination,depart_date,collected_on)
      // -> ยิงซ้ำในวันเดียวกันไม่พัง ไม่เกิดข้อมูลซ้ำ
      const r = await fetch(
        `${supabaseUrl}/rest/v1/price_snapshots?on_conflict=origin,destination,depart_date,collected_on`,
        {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify(rows),
        },
      );
      if (!r.ok) {
        const text = await r.text().catch(() => '');
        console.error(`[cron] supabase insert ${route.origin}->${route.destination}:`, r.status, text.slice(0, 200));
      } else {
        inserted += rows.length;
      }
    }

    summary.push({ route: `${route.origin}-${route.destination}`, dates: rows.length });
  }

  return res.status(200).json({
    ok: true,
    months,
    routes: ROUTES.length,
    rows_found: totalRows,
    rows_saved: inserted,
    summary,
    ranAt: new Date().toISOString(),
  });
}
