import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, Home, Plane, Search, ShieldCheck, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';
import { airlineDisplayName, getAirline, supportedAirlineCount } from '../lib/airlines';

type TravelPrice = {
  origin: string;
  destination: string;
  origin_airport: string;
  destination_airport: string;
  price: number;
  currency: string;
  airline: string;
  flight_number: string;
  departure_at: string;
  return_at: string;
  transfers: number;
  return_transfers: number;
  duration_minutes: number;
  aviasales_url: string | null;
};

type ApiResponse = {
  configured: boolean;
  provider: string;
  data_type?: string;
  freshness_note?: string;
  prices?: TravelPrice[];
  error?: string;
};

const monthMap: Record<string, number> = { 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };
const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const tripDays = (a: string, b: string) => Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000) + 1;
const dayRange = (label: string) => {
  const m = label.match(/(\d+)\D+(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] as const : [5, 7] as const;
};
const monthForApi = (label: string) => {
  const month = monthMap[label] ?? new Date().getMonth() + 1;
  const now = new Date();
  let year = now.getFullYear();
  if (month < now.getMonth() + 1) year += 1;
  return `${year}-${String(month).padStart(2, '0')}`;
};
const routeText = (p: TravelPrice) => `${p.origin_airport || p.origin} → ${p.destination_airport || p.destination}`;
const transferText = (p: TravelPrice) => {
  if (p.transfers === 0 && p.return_transfers === 0) return 'บินตรงทั้งไป–กลับ';
  return `ขาไป ${p.transfers} ต่อ · ขากลับ ${p.return_transfers} ต่อ`;
};
const scoreFor = (p: TravelPrice, index: number, cheapest: number, budget: number) => {
  let score = 94 - Math.min(index * 3, 24);
  if (p.transfers === 0 && p.return_transfers === 0) score += 3;
  if (budget && p.price <= budget) score += 2;
  if (p.price > cheapest * 1.25) score -= 4;
  return Math.max(65, Math.min(99, score));
};

export default function LiveResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const city = params.get('city') || 'Tokyo';
  const month = params.get('month') || 'ต.ค.';
  const days = params.get('days') || '5–7 วัน';
  const budget = Number(params.get('budget') || 0);
  const directOnly = params.get('direct') === '1';
  const fromTripi = params.get('source') === 'tripi';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState<TravelPrice[]>([]);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let active = true;
    const [minDays, maxDays] = dayRange(days);
    setLoading(true);
    setError('');
    fetch('/api/travelpayouts-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city,
        departure_month: monthForApi(month),
        min_days: minDays,
        max_days: maxDays,
        direct_only: directOnly,
        max_budget: 0,
      }),
    })
      .then(async (res) => {
        const data = await res.json() as ApiResponse;
        if (!res.ok) throw new Error(data.error || 'ระบบค้นหาราคาเที่ยวบินไม่พร้อมใช้งานชั่วคราว');
        if (!active) return;
        setConfigured(data.configured !== false);
        setPrices(data.prices ?? []);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการค้นหาราคา');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [city, month, days, directOnly]);

  const inBudget = useMemo(() => budget ? prices.filter(p => p.price <= budget) : prices, [prices, budget]);
  const shown = inBudget.length ? inBudget : prices.slice(0, 8);
  const cheapest = prices[0]?.price || 0;
  const overBudget = Boolean(budget && prices.length && inBudget.length === 0);

  const openDetails = (p: TravelPrice) => {
    const back = `/results?${params.toString()}`;
    const q = new URLSearchParams({
      city,
      origin: p.origin_airport || p.origin || 'BKK',
      destination: p.destination_airport || p.destination,
      departure: p.departure_at,
      return: p.return_at,
      price: String(p.price),
      airline_code: p.airline || '',
      flight: p.flight_number || '',
      transfers: String(p.transfers ?? 0),
      return_transfers: String(p.return_transfers ?? 0),
      back,
    });
    navigate(`/deal?${q.toString()}`);
  };

  return <div className="live-app-shell">
    <header className="live-topbar">
      <Link to="/" className="live-brand"><Plane size={22} fill="currentColor"/>TripDeal</Link>
      <span className="live-source-mini">Airline Direct · รองรับ {supportedAirlineCount}+ สายการบินในเอเชีย</span>
    </header>

    <main>
      <section className="live-head">
        <div className="live-container">
          <span className="live-data-pill"><ShieldCheck size={13}/> AIRLINE DIRECT</span>
          <h1>{city}</h1>
          <p>กรุงเทพ (BKK/DMK) · {days} · {month}{directOnly ? ' · บินตรง' : ''}</p>
          <div className="live-freshness">TripDeal ช่วยค้นหาและเปรียบเทียบดีลให้ก่อน จากนั้นคุณจะจองและชำระเงินกับเว็บไซต์ทางการของสายการบินโดยตรง</div>
        </div>
      </section>

      <section className="live-container live-results-section">
        {fromTripi && <div className="live-tripi-note">✨ Tripi เลือกเงื่อนไขนี้ให้จากบทสนทนาของคุณ</div>}

        {loading && <div className="live-empty"><Search size={22}/><strong>กำลังค้นหาดีล...</strong><span>กำลังเปรียบเทียบช่วงวัน ราคา และจำนวนต่อเครื่อง</span></div>}
        {!loading && !configured && <div className="live-empty"><strong>ระบบค้นหาราคายังไม่พร้อม</strong><span>กรุณาลองใหม่อีกครั้งในภายหลัง</span></div>}
        {!loading && error && <div className="live-empty"><strong>ค้นหาราคาไม่สำเร็จ</strong><span>{error}</span><button onClick={() => window.location.reload()}>ลองอีกครั้ง</button></div>}
        {!loading && !error && configured && prices.length === 0 && <div className="live-empty"><strong>ยังไม่พบราคาสำหรับเงื่อนไขนี้</strong><span>ลองเปลี่ยนเดือน จำนวนวัน หรือเลือกต่อเครื่องได้</span><button onClick={()=>navigate('/find-deal')}>แก้ไขการค้นหา</button></div>}

        {!loading && !error && prices.length > 0 && <>
          {overBudget && <div className="live-budget-warning"><strong>ยังไม่พบดีลในงบ ฿{money(budget)}</strong><span>ราคาต่ำสุดที่พบตอนนี้คือ ฿{money(cheapest)} — แสดงตัวเลือกใกล้งบให้ก่อน</span></div>}
          <div className="live-results-title"><div><h2>{overBudget ? 'ตัวเลือกใกล้งบ' : `พบ ${shown.length} ดีลที่น่าสนใจ`}</h2><p>TripDeal จัดอันดับจากราคา ความสะดวก และจำนวนต่อเครื่อง</p></div><button onClick={()=>navigate('/find-deal')}>แก้ไข</button></div>
          <div className="live-list">
            {shown.map((p, i) => {
              const score = scoreFor(p, i, cheapest, budget);
              const withinBudget = !budget || p.price <= budget;
              const airline = getAirline(p.airline);
              return <article className={i === 0 ? 'live-card best' : 'live-card'} key={`${p.origin_airport}-${p.destination_airport}-${p.departure_at}-${p.return_at}-${p.price}-${i}`}>
                <div className="live-card-main">
                  <div className="live-card-tags">
                    {i === 0 && <span className="live-best">⭐ TripDeal แนะนำ</span>}
                    {withinBudget && budget > 0 && <span className="live-inbudget">อยู่ในงบ</span>}
                    {airline && <span className="live-inbudget">จองตรงสายการบินได้</span>}
                  </div>
                  <h3>{formatDate(p.departure_at)} – {formatDate(p.return_at)}</h3>
                  <p className="live-route">{routeText(p)} · {tripDays(p.departure_at, p.return_at)} วัน</p>
                  <p>{transferText(p)}</p>
                  <div className="live-meta"><span><b>{airlineDisplayName(p.airline)}</b>{p.flight_number ? ` · ${p.flight_number}` : ''}</span></div>
                  <div className="live-score">Deal Score <b>⭐ {score}/100</b><span><i style={{width:`${score}%`}}/></span></div>
                </div>
                <div className="live-price-side">
                  <strong>฿{money(p.price)}</strong>
                  <span>ไป–กลับ / คน</span>
                  <small>ราคาอ้างอิงล่าสุด</small>
                  <button onClick={()=>openDetails(p)}>ดูและเตรียมจอง <ChevronRight size={15}/></button>
                </div>
              </article>;
            })}
          </div>
          <div className="live-disclaimer"><strong>ก่อนชำระเงิน</strong><p>ราคาบน TripDeal ใช้สำหรับช่วยเปรียบเทียบและอาจเปลี่ยนได้ เมื่อเลือกดีลแล้ว TripDeal จะพาไปเว็บไซต์ทางการของสายการบินเพื่อยืนยันเที่ยวบิน ราคา ที่นั่ง สัมภาระ และชำระเงินกับสายการบินโดยตรง</p></div>
        </>}
      </section>
    </main>

    <nav className="live-bottom-nav">
      <Link to="/"><Home size={20}/>หน้าแรก</Link>
      <Link to={`/results?city=${encodeURIComponent(city)}&month=${encodeURIComponent(month)}&days=${encodeURIComponent(days)}${budget ? `&budget=${budget}` : ''}`} className="active"><Plane size={20}/>ดีล</Link>
      <Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link>
      <Link to="/account"><User size={20}/>บัญชี</Link>
    </nav>
    <TripiAssistant/>
  </div>;
}
