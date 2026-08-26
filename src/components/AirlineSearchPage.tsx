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

type ReferencePrice = SearchPrice & {
  requested_departure_date?: string;
  reference_day_distance?: number;
  reference_type?: 'exact_date' | 'nearby_date';
};

type SearchResponse = {
  configured: boolean;
  prices?: SearchPrice[];
  reference_prices?: ReferencePrice[];
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
  const [referencePrices, setReferencePrices] = useState<ReferencePrice[]>([]);

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
        setReferencePrices(data.reference_prices || []);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : 'ค้นหาเที่ยวบินไม่สำเร็จ'))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [origin, destination, depart, returnDate, trip]);

  const sorted = useMemo(() => [...prices].sort((a, b) => a.price - b.price), [prices]);
  const routeFallbacks = useMemo(() => getRouteFallbackAirlines(origin, destination), [origin, destination]);
  const exactAirlines = useMemo(() => new Set(sorted.map((row) => row.airline)), [sorted]);
  const missingFallbacks = useMemo(() => routeFallbacks.filter((fallback) => !exactAirlines.has(fallback.code)), [routeFallbacks, exactAirlines]);

  const referenceFor = (code: string) => referencePrices.find((row) => row.airline === code);

  const openDeal = (row: SearchPrice, index: number) => {
    const dealOrigin = (row.origin_airport || row.origin || origin).toUpperCase();
    const dealDestination = (row.destination_airport || row.destination || destination).toUpperCase();
    const dealOriginInfo = getAirport(dealOrigin);
    const dealDestinationInfo = getAirport(dealDestination);
    const q = new URLSearchParams({
      origin: dealOrigin,
      destination: dealDestination,
      origin_name: dealOriginInfo?.city || originInfo?.city || dealOrigin,
      destination_name: dealDestinationInfo?.city || destinationInfo?.city || dealDestination,
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

  const renderFallbackCard = (fallback: ReturnType<typeof getRouteFallbackAirlines>[number], index: number) => {
    const airline = getAirline(fallback.code);
    const bookingUrl = buildDirectBookingUrl(fallback.code, {
      origin,
      destination,
      depart,
      returnDate,
      trip,
      adults,
      routeBookingUrl: fallback.routeBookingUrl,
    });
    const reference = referenceFor(fallback.code);
    const isExactReference = reference?.reference_type === 'exact_date';
    return <article className={index === 0 && sorted.length === 0 ? 'air-result-card best' : 'air-result-card'} key={`${origin}-${destination}-${fallback.code}`}>
      <div className="air-result-main">
        <div className="air-result-tags"><span className="best">✈️ มีเที่ยวบินตรง</span><span>จองตรงสายการบิน</span></div>
        <h3>{airlineDisplayName(fallback.code)}</h3>
        <p className="air-result-route">{origin} → {destination}</p>
        <p>{fallback.note || 'ตรวจสอบเที่ยวบินและราคาล่าสุดกับสายการบิน'}</p>
        {reference ? <p className="air-result-flight">{reference.flight_number ? `เที่ยวบิน ${reference.airline}${reference.flight_number} · ` : ''}{isExactReference ? `พบราคาตรงวันที่ ${dateTH(reference.departure_at)}` : `ราคาอ้างอิงใกล้วันที่เลือก: ${dateTH(reference.departure_at)}`}</p> : <p className="air-result-flight">ยังไม่มีราคาอ้างอิงที่เชื่อถือได้จากระบบค้นหา</p>}
      </div>
      <div className="air-result-price">
        {reference ? <><strong>฿{money(reference.price)}</strong><span>{trip === 'roundtrip' ? 'ไป–กลับ' : 'เที่ยวเดียว'} / คน</span><small>{isExactReference ? 'ราคาที่พบตรงวัน' : 'ราคาอ้างอิงล่าสุด · ต้องยืนยันอีกครั้ง'}</small></> : <><strong>เช็กราคาจริง</strong><span>กับ {airline?.name || airlineDisplayName(fallback.code)}</span><small>ยืนยันที่นั่งและราคาบนเว็บสายการบิน</small></>}
        {bookingUrl ? <button onClick={() => window.open(bookingUrl, '_blank', 'noopener,noreferrer')}>ไปที่ {airline?.name || airlineDisplayName(fallback.code)} <ChevronRight size={16}/></button> : <button disabled>ยังไม่มีลิงก์จอง</button>}
      </div>
    </article>;
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

      {loading && <div className="air-search-empty"><Search size={24}/><strong>กำลังค้นหาราคาและสายการบิน...</strong><span>เช็กทั้งราคาตรงวันและราคาอ้างอิงของสายการบินในเส้นทางนี้</span></div>}
      {!loading && error && <div className="air-search-empty"><strong>ค้นหาไม่สำเร็จ</strong><span>{error}</span><button onClick={() => window.location.reload()}>ลองอีกครั้ง</button></div>}

      {!loading && !error && sorted.length === 0 && routeFallbacks.length === 0 && <div className="air-search-empty"><strong>ยังไม่พบข้อมูลสำหรับเส้นทางนี้</strong><span>ลองเปลี่ยนวันเดินทาง หรือค้นหาเส้นทางใกล้เคียง</span><button onClick={() => navigate('/')}>แก้ไขการค้นหา</button></div>}

      {!loading && !error && sorted.length === 0 && routeFallbacks.length > 0 && <>
        <div className="air-search-title"><div><h2>สายการบินที่ให้บริการเส้นทางนี้</h2><p>แสดงราคาอ้างอิงรายสายการบินเท่าที่ระบบค้นพบ แล้วให้ยืนยันราคาจริงกับสายการบิน</p></div><button onClick={() => navigate('/')}>ค้นหาใหม่</button></div>
        <div className="air-search-list">
          {[...routeFallbacks].sort((a, b) => (referenceFor(a.code)?.price ?? Number.MAX_SAFE_INTEGER) - (referenceFor(b.code)?.price ?? Number.MAX_SAFE_INTEGER)).map(renderFallbackCard)}
        </div>
        <div className="air-search-disclaimer"><strong>ราคาแบบไหนที่กำลังแสดง?</strong><p>ถ้ามีราคาตรงวันที่เลือก TripDeal จะระบุว่า “ราคาที่พบตรงวัน” หาก cache วันนั้นไม่มี ระบบจะใช้ราคาอ้างอิงใกล้วันที่เลือกเพื่อช่วยเปรียบเทียบเท่านั้น ราคาสุดท้ายต้องยืนยันบนเว็บสายการบินเสมอ</p></div>
      </>}

      {!loading && !error && sorted.length > 0 && <>
        <div className="air-search-title"><div><h2>พบ {sorted.length} ดีลตรงวัน</h2><p>เรียงจากราคาต่ำสุด พร้อม Deal Score</p></div><button onClick={() => navigate('/')}>ค้นหาใหม่</button></div>
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
                <p className="air-result-flight">{row.flight_number ? `เที่ยวบิน ${row.airline}${row.flight_number}` : 'หมายเลขเที่ยวบินยืนยันอีกครั้งก่อนจอง'} · {dateTH(row.departure_at)}</p>
                <div className="air-score">Deal Score <b>⭐ {score}/100</b><span><i style={{ width: `${score}%` }}/></span></div>
              </div>
              <div className="air-result-price">
                <strong>฿{money(row.price)}</strong><span>{trip === 'roundtrip' ? 'ไป–กลับ' : 'เที่ยวเดียว'} / คน</span><small>ราคาที่พบตรงวัน</small>
                <button onClick={() => openDeal(row, index)}>ดูและเตรียมจอง <ChevronRight size={16}/></button>
              </div>
            </article>;
          })}
          {missingFallbacks.map((fallback, index) => renderFallbackCard(fallback, sorted.length + index))}
        </div>
        <div className="air-search-disclaimer"><strong>เรื่องราคาที่ควรรู้</strong><p>ราคาที่แสดงเป็นข้อมูลค้นพบล่าสุดสำหรับช่วยเปรียบเทียบ ไม่ใช่การล็อกราคา เมื่อกดจอง TripDeal จะพาไปเว็บไซต์ทางการของสายการบินเพื่อยืนยันราคา ที่นั่ง สัมภาระ และชำระเงินจริง</p></div>
      </>}
    </main>

    <nav className="air-search-bottom-nav"><Link to="/"><Home size={20}/>หน้าแรก</Link><Link to={`/search?${params.toString()}`} className="active"><Plane size={20}/>เที่ยวบิน</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link></nav>
    <TripiAssistant/>
  </div>;
}
