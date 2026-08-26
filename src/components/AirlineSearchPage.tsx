import { ArrowLeft, Bell, ChevronRight, Home, Plane, Search, ShieldCheck, User, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';
import { airlineDisplayName, buildDirectBookingUrl, getAirline, getRouteFallbackAirlines, supportedAirlineCount } from '../lib/airlines';
import { getAirport } from '../lib/airports';

type SearchPrice = {
  origin: string;
  destination: string;
  origin_airport: string;
  destination_airport: string;
  price: number;
  currency: string;
  airline: string;
  flight_number: string;
  departure_at: string;
  return_at: string | null;
  transfers: number;
  return_transfers: number;
  duration_minutes: number;
  found_at?: string | null;
};

type SearchResponse = {
  configured: boolean;
  prices?: SearchPrice[];
  error?: string;
};

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const dateTH = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function scoreFor(row: SearchPrice, index: number) {
  let score = 96 - Math.min(index * 2, 20);
  score -= (row.transfers || 0) * 5;
  score -= (row.return_transfers || 0) * 4;
  if (getAirline(row.airline)) score += 2;
  return Math.max(65, Math.min(99, score));
}

export default function AirlineSearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const origin = (params.get('origin') || 'BKK').toUpperCase();
  const destination = (params.get('destination') || 'TYO').toUpperCase();
  const depart = params.get('depart') || '';
  const returnDate = params.get('return') || '';
  const trip = params.get('trip') === 'oneway' ? 'oneway' : 'roundtrip';
  const adults = Math.max(1, Number(params.get('adults') || 1));
  const originInfo = getAirport(origin);
  const destinationInfo = getAirport(destination);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [prices, setPrices] = useState<SearchPrice[]>([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetch('/api/airline-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin,
        destination,
        departure_date: depart,
        return_date: trip === 'roundtrip' ? returnDate : undefined,
        one_way: trip === 'oneway',
        direct_only: false,
      }),
    })
      .then(async (res) => {
        const data = await res.json() as SearchResponse;
        if (!res.ok) throw new Error(data.error || 'ค้นหาเที่ยวบินไม่สำเร็จ');
        if (!active) return;
        if (data.configured === false) throw new Error('ระบบค้นหาราคายังไม่พร้อมใช้งาน');
        setPrices(data.prices || []);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'ค้นหาเที่ยวบินไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [origin, destination, depart, returnDate, trip]);

  const sorted = useMemo(() => [...prices].sort((a, b) => a.price - b.price), [prices]);
  const routeFallbacks = useMemo(() => getRouteFallbackAirlines(origin, destination), [origin, destination]);

  const openDeal = (row: SearchPrice, index: number) => {
    const q = new URLSearchParams({
      origin,
      destination,
      origin_name: originInfo?.city || origin,
      destination_name: destinationInfo?.city || destination,
      depart: row.departure_at || depart,
      trip,
      adults: String(adults),
      price: String(row.price),
      airline_code: row.airline || '',
      flight: row.flight_number || '',
      transfers: String(row.transfers || 0),
      return_transfers: String(row.return_transfers || 0),
      score: String(scoreFor(row, index)),
      back: `/search?${params.toString()}`,
    });
    if (trip === 'roundtrip' && (row.return_at || returnDate)) q.set('return', row.return_at || returnDate);
    navigate(`/book?${q.toString()}`);
  };

  return <div className="air-search-page">
    <header className="air-search-topbar">
      <button onClick={() => navigate('/')} aria-label="กลับหน้าแรก"><ArrowLeft size={21}/></button>
      <Link to="/" className="air-search-brand"><Plane size={21} fill="currentColor"/>TripDeal</Link>
      <span><ShieldCheck size={14}/> Airline Direct</span>
    </header>

    <main className="air-search-container">
      <section className="air-search-summary">
        <div>
          <small>{trip === 'roundtrip' ? 'ไป–กลับ' : 'เที่ยวเดียว'}</small>
          <h1>{origin} → {destination}</h1>
          <p>{originInfo?.city || origin} → {destinationInfo?.city || destination}</p>
        </div>
        <div className="air-search-summary-meta">
          <span>{dateTH(depart)}{trip === 'roundtrip' ? ` – ${dateTH(returnDate)}` : ''}</span>
          <span><Users size={15}/> {adults} คน</span>
        </div>
      </section>

      <div className="air-search-trust"><ShieldCheck size={17}/><div><strong>TripDeal เปรียบเทียบก่อน คุณจ่ายเงินกับสายการบิน</strong><span>รองรับสายการบินไทยและเอเชียใน Directory แล้ว {supportedAirlineCount}+ สายการบิน</span></div></div>

      {loading && <div className="air-search-empty"><Search size={24}/><strong>กำลังค้นหาดีลที่ตรงวันเดินทาง...</strong><span>กำลังเรียงราคาและความสะดวกให้ครับ</span></div>}
      {!loading && error && <div className="air-search-empty"><strong>ค้นหาไม่สำเร็จ</strong><span>{error}</span><button onClick={() => window.location.reload()}>ลองอีกครั้ง</button></div>}

      {!loading && !error && sorted.length === 0 && routeFallbacks.length === 0 && <div className="air-search-empty"><strong>ยังไม่พบราคาอ้างอิงสำหรับวันนี้</strong><span>ลองเปลี่ยนวันเดินทาง หรือค้นหาเส้นทางใกล้เคียง</span><button onClick={() => navigate('/')}>แก้ไขการค้นหา</button></div>}

      {!loading && !error && sorted.length === 0 && routeFallbacks.length > 0 && <>
        <div className="air-search-title"><div><h2>พบสายการบินที่ให้บริการเส้นทางนี้</h2><p>ยังไม่มีราคา cached ตรงวันเดินทาง จึงให้ตรวจราคาจริงกับสายการบินโดยตรง</p></div><button onClick={() => navigate('/')}>ค้นหาใหม่</button></div>
        <div className="air-search-list">
          {routeFallbacks.map((fallback, index) => {
            const airline = getAirline(fallback.code);
            const bookingUrl = buildDirectBookingUrl(fallback.code, fallback.routeBookingUrl);
            return <article className={index === 0 ? 'air-result-card best' : 'air-result-card'} key={`${origin}-${destination}-${fallback.code}`}>
              <div className="air-result-main">
                <div className="air-result-tags"><span className="best">✈️ มีเที่ยวบินตรง</span><span>จองตรงสายการบิน</span></div>
                <h3>{airlineDisplayName(fallback.code)}</h3>
                <p className="air-result-route">{origin} → {destination}</p>
                <p>{fallback.note || 'ตรวจสอบเที่ยวบินและราคาล่าสุดกับสายการบิน'}</p>
                <p className="air-result-flight">TripDeal ยังไม่แสดงราคาเพื่อหลีกเลี่ยงการบอกราคาที่หมดอายุ</p>
              </div>
              <div className="air-result-price">
                <strong>เช็กราคาจริง</strong><span>กับ {airline?.name || airlineDisplayName(fallback.code)}</span><small>ยืนยันที่นั่งและราคาบนเว็บสายการบิน</small>
                {bookingUrl ? <button onClick={() => window.open(bookingUrl, '_blank', 'noopener,noreferrer')}>ไปที่ {airline?.name || airlineDisplayName(fallback.code)} <ChevronRight size={16}/></button> : <button disabled>ยังไม่มีลิงก์จอง</button>}
              </div>
            </article>;
          })}
        </div>
        <div className="air-search-disclaimer"><strong>ทำไมไม่ขึ้นราคาปลอม?</strong><p>เมื่อระบบไม่มีราคาอ้างอิงตรงวันเดินทาง TripDeal จะไม่เดาราคา แต่จะพาไปสายการบินที่ให้บริการเส้นทางนี้เพื่อดูราคาและที่นั่งจริงแทน</p></div>
      </>}

      {!loading && !error && sorted.length > 0 && <>
        <div className="air-search-title"><div><h2>พบ {sorted.length} ดีล</h2><p>เรียงจากราคาต่ำสุด พร้อม Deal Score</p></div><button onClick={() => navigate('/')}>ค้นหาใหม่</button></div>
        <div className="air-search-list">
          {sorted.map((row, index) => {
            const airline = getAirline(row.airline);
            const score = scoreFor(row, index);
            const direct = row.transfers === 0 && (trip === 'oneway' || row.return_transfers === 0);
            return <article className={index === 0 ? 'air-result-card best' : 'air-result-card'} key={`${row.airline}-${row.flight_number}-${row.departure_at}-${row.price}-${index}`}>
              <div className="air-result-main">
                <div className="air-result-tags">{index === 0 && <span className="best">⭐ ถูกที่สุดที่พบ</span>}{airline && <span>จองตรงสายการบินได้</span>}</div>
                <h3>{airlineDisplayName(row.airline)}</h3>
                <p className="air-result-route">{row.origin_airport || origin} → {row.destination_airport || destination}</p>
                <p>{direct ? 'บินตรง' : `ขาไปต่อ ${row.transfers || 0} ครั้ง${trip === 'roundtrip' ? ` · ขากลับต่อ ${row.return_transfers || 0} ครั้ง` : ''}`}</p>
                <p className="air-result-flight">{row.flight_number ? `เที่ยวบิน ${row.airline}${row.flight_number}` : 'หมายเลขเที่ยวบินยืนยันอีกครั้งก่อนจอง'}</p>
                <div className="air-score">Deal Score <b>⭐ {score}/100</b><span><i style={{ width: `${score}%` }}/></span></div>
              </div>
              <div className="air-result-price">
                <strong>฿{money(row.price)}</strong><span>{trip === 'roundtrip' ? 'ไป–กลับ' : 'เที่ยวเดียว'} / คน</span><small>ราคาอ้างอิงล่าสุด</small>
                <button onClick={() => openDeal(row, index)}>ดูและเตรียมจอง <ChevronRight size={16}/></button>
              </div>
            </article>;
          })}
        </div>
        <div className="air-search-disclaimer"><strong>เรื่องราคาที่ควรรู้</strong><p>ราคาที่แสดงเป็นข้อมูลค้นพบล่าสุดสำหรับช่วยเปรียบเทียบ ไม่ใช่การล็อกราคา เมื่อกดจอง TripDeal จะพาไปเว็บไซต์ทางการของสายการบินเพื่อยืนยันราคา ที่นั่ง สัมภาระ และชำระเงินจริง</p></div>
      </>}
    </main>

    <nav className="air-search-bottom-nav"><Link to="/"><Home size={20}/>หน้าแรก</Link><Link to={`/search?${params.toString()}`} className="active"><Plane size={20}/>เที่ยวบิน</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link></nav>
    <TripiAssistant/>
  </div>;
}
