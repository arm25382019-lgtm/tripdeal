// TripDeal :: /api/cron-collect-prices
//
// เก็บราคาถูกสุดของแต่ละวันออกเดินทาง ลง price_snapshots ทุกวัน
// เพื่อสร้าง "ราคาปกติ" ของเราเอง -> Deal Score ถึงจะพูดได้ว่า "ถูกกว่าปกติ 23%"
// ไม่ใช่แค่ "ถูกสุดในผลลัพธ์ชุดนี้" แบบที่ scoreFor() ทำอยู่ตอนนี้
//
// ใช้สคีมาเดิมของโปรเจกต์: destinations (FK) + price_snapshots
// เก็บ "ขาเดียว" เพื่อให้ baseline สะอาด ไม่ปนตัวแปรความยาวทริป
//
// ยิงเอง: curl -X POST https://tripdeal-ebon.vercel.app/api/cron-collect-prices \
//           -H "x-cron-secret: <CRON_SECRET>"

const TP_API = 'https://api.travelpayouts.com';
const ORIGINS = ['BKK', 'DMK'];
const MARKET = 'th';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return res.status === 204 ? null : res.json();
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
    unique: 'true',
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
    // ปลายทางมาจากตาราง destinations — เพิ่มเมืองใหม่ในตาราง cron จะเก็บให้เอง
    const destinations = await db('destinations?select=id,airport_code,city_name');
    if (!destinations?.length) {
      return res.status(200).json({ ok: true, note: 'destinations ยังว่าง', rows_saved: 0 });
    }

    const summary = [];
    let saved = 0;

    for (const dest of destinations) {
      for (const origin of ORIGINS) {
        const collected = [];
        for (const month of months) {
          try {
            collected.push(...await fetchMonth({ token, origin, airport: dest.airport_code, month }));
          } catch (error) {
            console.error(`[cron] ${origin}->${dest.airport_code} ${month}:`, error.message);
          }
          await sleep(350); // กันโดน rate limit
        }

        // เหลือแถวถูกสุดของแต่ละวัน
        const best = new Map();
        for (const r of collected) {
          const date = String(r.departure_at).slice(0, 10);
          const prev = best.get(date);
          if (!prev || Number(r.price) < Number(prev.price)) best.set(date, r);
        }

        const rows = [...best.entries()].map(([date, r]) => ({
          destination_id: dest.id,
          origin_code: origin,
          departure_date: date,
          return_date: null,
          price_thb: Number(r.price),
          airline_name: String(r.airline || '').toUpperCase() || null,
          transfers: Number(r.transfers ?? 0),
          // found_at = เวลาที่ "มีคนเจอราคานี้" ไม่ใช่เวลาที่เราเก็บ
          // Travelpayouts เป็น cache ไม่ใช่ราคา live เก็บไว้เพื่อบอกอายุราคาได้
          found_at: r.found_at || null,
          collected_on: today,
          source: 'travelpayouts_prices_for_dates',
        }));

        if (rows.length) {
          // uq_snapshot_daily(destination_id, origin_code, departure_date, collected_on)
          // -> ยิงซ้ำในวันเดียวกันไม่เกิดข้อมูลซ้ำ
          await db(
            'price_snapshots?on_conflict=destination_id,origin_code,departure_date,collected_on',
            {
              method: 'POST',
              headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
              body: JSON.stringify(rows),
            },
          );
          saved += rows.length;
        }

        summary.push({ route: `${origin}-${dest.airport_code}`, city: dest.city_name, dates: rows.length });
      }
    }

    return res.status(200).json({
      ok: true,
      months,
      rows_saved: saved,
      summary,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron] fatal:', error);
    return res.status(500).json({ ok: false, error: error.message });
  }
}
