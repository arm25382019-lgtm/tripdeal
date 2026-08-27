// TripDeal :: /api/cron-collect-prices
//
// เก็บราคาถูกสุดของแต่ละวันออกเดินทาง ลง price_snapshots ทุกวัน
//
// ใช้สคีมาเดิม: destinations (FK) + price_snapshots
// เก็บ "ขาเดียว" เพื่อให้ baseline สะอาด
//
// ⚡ ยิงขนาน (Promise pool) เพราะมี 26 ปลายทาง x 2 ต้นทาง = ~156 API calls
//    ถ้ายิงทีละอันจะใช้ >4 นาที -> โดน Vercel timeout
//
// ยิงเอง: curl -X POST https://tripdeal-ebon.vercel.app/api/cron-collect-prices \
//           -H "x-cron-secret: <CRON_SECRET>"

export const config = { maxDuration: 300 };

const TP_API = 'https://api.travelpayouts.com';
const ORIGINS = ['BKK', 'DMK'];
const MARKET = 'th';
const CONCURRENCY = 6;   // ยิงพร้อมกันทีละ 6 งาน กันชน rate limit

// ทุกวัน = 3 เดือนหน้า / วันจันทร์ = ยิงยาว 8 เดือน
function monthsToFetch() {
  const count = new Date().getDay() === 1 ? 8 : 3;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

function sb(url, key) {
  return async (path, init = {}) => {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  };
}

async function fetchMonth({ token, origin, airport, month }) {
  const params = new URLSearchParams({
    currency: 'thb',
    origin,
    destination: airport,
    departure_at: month,
    one_way: 'true',
    market: MARKET,
    sorting: 'price',
    limit: '1000',
  });

  const res = await fetch(`${TP_API}/aviasales/v3/prices_for_dates?${params}`, {
    headers: { Accept: 'application/json', 'X-Access-Token': token },
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload?.success === false) {
    throw new Error(payload?.error || `Travelpayouts ${res.status}`);
  }
  const rows = Array.isArray(payload?.data) ? payload.data : Object.values(payload?.data || {});
  return rows.filter((r) => r?.departure_at && Number(r?.price) > 0);
}

// รัน tasks แบบ pool: พร้อมกันไม่เกิน limit งาน
async function runPool(tasks, limit) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]().catch((e) => ({ __error: e.message }));
    }
  });
  await Promise.all(workers);
  return results;
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers['x-cron-secret']
    || (req.headers.authorization || '').replace('Bearer ', '');
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
  if (missing.length) return res.status(503).json({ ok: false, error: 'Missing env', missing });

  const db = sb(supabaseUrl, serviceKey);
  const today = new Date().toISOString().slice(0, 10);
  const months = monthsToFetch();

  try {
    const destinations = await db('destinations?select=id,airport_code,city_name');
    if (!destinations?.length) {
      return res.status(200).json({ ok: true, note: 'destinations ยังว่าง', rows_saved: 0 });
    }

    // 1 งาน = 1 route x 1 month แล้วยิงเป็น pool
    const jobs = [];
    for (const dest of destinations) {
      for (const origin of ORIGINS) {
        for (const month of months) {
          jobs.push({ dest, origin, month });
        }
      }
    }

    const tasks = jobs.map((job) => async () => {
      const rows = await fetchMonth({ token, origin: job.origin, airport: job.dest.airport_code, month: job.month });
      return { job, rows };
    });

    const settled = await runPool(tasks, CONCURRENCY);

    // รวมผลต่อ (destination_id + origin) แล้วเก็บถูกสุดของแต่ละวัน
    const buckets = new Map();
    for (const r of settled) {
      if (!r || r.__error || !r.job) continue;
      const { job, rows } = r;
      const key = `${job.dest.id}|${job.origin}`;
      if (!buckets.has(key)) buckets.set(key, { dest: job.dest, origin: job.origin, best: new Map() });
      const bucket = buckets.get(key);
      for (const row of rows) {
        const date = String(row.departure_at).slice(0, 10);
        const prev = bucket.best.get(date);
        if (!prev || Number(row.price) < Number(prev.price)) bucket.best.set(date, row);
      }
    }

    const summary = [];
    let saved = 0;
    for (const { dest, origin, best } of buckets.values()) {
      const rows = [...best.entries()].map(([date, r]) => ({
        destination_id: dest.id,
        origin_code: origin,
        departure_date: date,
        return_date: null,
        price_thb: Number(r.price),
        airline_name: String(r.airline || '').toUpperCase() || null,
        transfers: Number(r.transfers ?? 0),
        found_at: r.found_at || null,
        collected_on: today,
        source: 'travelpayouts_prices_for_dates',
      }));

      if (rows.length) {
        await db(
          'price_snapshots?on_conflict=destination_id,origin_code,departure_date,collected_on',
          {
            method: 'POST',
            headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
            body: JSON.stringify(rows),
          },
        );
        saved += rows.length;
        summary.push({ route: `${origin}-${dest.airport_code}`, dates: rows.length });
      }
    }

    const errors = settled.filter((r) => r && r.__error).length;
    return res.status(200).json({
      ok: true,
      months,
      destinations: destinations.length,
      api_calls: jobs.length,
      failed_calls: errors,
      rows_saved: saved,
      routes_with_data: summary.length,
      summary: summary.sort((a, b) => b.dates - a.dates).slice(0, 20),
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron] fatal:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
