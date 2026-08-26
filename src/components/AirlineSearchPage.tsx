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
  outbound_price?: number;
  return_price?: number;
  currency: string;
  airline: string;
  flight_number: string;
  return_flight_number?: string;
  departure_at: string;
  return_at: string | null;
  transfers: number;
  return_transfers: number;
  duration_minutes: number;
  found_at?: string | null;
  price_basis?: 'roundtrip_discovery' | 'one_way_discovery' | 'sum_of_exact_one_way_discovery';
};

type ReferencePrice = SearchPrice & {
  requested_departure_date?: string;
  reference_day_distance?: number;
  reference_type?: 'exact_date' | 'nearby_date';
};

type SearchResponse = {
  configured: boolean;
  strategy?: 'direct_first';
  provider_role?: string;
  prices?: SearchPrice[];
  reference_prices?: ReferencePrice[];
  error?: string;
};

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const dateTH = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

function valueScore(row: SearchPrice, cheapest: number, fastest: number) {
  const pricePoints = cheapest > 0 && row.price > 0 ? Math.min(55, (cheapest / row.price) * 55) : 30;
  const totalStops = Number(row.transfers || 0) + Number(row.return_transfers || 0);
  const routePoints = totalStops === 0 ? 30 : Math.max(5, 30 - totalStops * 10);
  const durationPoints = fastest > 0 && row.duration_minutes > 0
    ? Math.min(15, (fastest / row.duration_minutes) * 15)
    : 8;
  const airlinePoints = getAirline(row.airline) ? 5 : 2;
  return Math.max(0, Math.min(100, Math.round(pricePoints + routePoints + durationPoints + airlinePoints)));
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
        adults,
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
  }, [origin, destination, depart, returnDate, trip, adults]);

  const sorted = useMemo(() => [...prices].sort((a, b) => a.price - b.price), [prices]);
  const references = useMemo(() => [...referencePrices].sort((a, b) => {
    const dayA = Number(a.reference_day_distance ?? Number.MAX_SAFE_INTEGER);
    const dayB = Number(b.reference_day_distance ?? Number.MAX_SAFE_INTEGER);
    return dayA - dayB || a.price - b.price;
  }), [referencePrices]);
  const routeFallbacks = useMemo(() => getRouteFallbackAirlines(origin, destination), [origin, destination]);
  const exactAirlines = useMemo(() => new Set(sorted.map((row) => row.airline)), [sorted]);
  const referenceAirlines = useMemo(() => new Set(references.map((row) => row.airline)), [references]);
  const missingFallbacks = useMemo(() => routeFallbacks.filter((fallback) => !exactAirlines.has(fallback.code) && !referenceAirlines.has(fallback.code)), [routeFallbacks, exactAirlines, referenceAirlines]);
  const referenceFor = (code: string) => references.find((row) => row.airline === code);

  const cheapest = sorted[0]?.price || 0;
  const positiveDurations = sorted.map((row) => row.duration_minutes).filter((n) => n > 0);
  const fastest = positiveDurations.length ? Math.min(...positiveDurations) : 0;
  const valueScores = sorted.map((row) => valueScore(row, cheapest, fastest));
  const bestValueIndex = valueScores.length ? valueScores.indexOf(Math.max(...valueScores)) : -1;

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
      score: String(valueScores[index] ?? 0),
      back: `/search?${params.toString()}`,
    });
    if (row.return_flight_number) q.set('return_flight', row.return_flight_number);
    if (row.price_basis) q.set('price_basis', row.price_basis);
    if (trip === 'roundtrip' && (row.return_at || returnDate)) q.set('return', row.return_at || returnDate);
    navigate(`/book?${q.toString()}`);
  };

  const openOfficialSearch = (airlineCode: string, routeBookingUrl?: string | null) => {
    const url = buildDirectBookingUrl(airlineCode, {
      origin,
      destination,
      depart,
      returnDate,
      trip,
      adults,
      routeBookingUrl,
    });
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const renderReferenceCard = (reference: ReferencePrice, index: number) => {
    const airline = getAirline(reference.airline);
    const dayDistance = Number(reference.reference_day_distance ?? 0);
    const exactReference = reference.reference_type === 'exact_date' || dayDistance === 0;
    const bookingUrl = buildDirectBookingUrl(reference.airline, { origin, destination, depart, returnDate, trip, adults });

    return <article className="air-result-card" key={`reference-${reference.airline}-${reference.departure_at}-${index}`}>
      <div className="air-result-main">
        <div className="air-result-tags">
          <span>{exactReference ? 'ราคาอ้างอิงที่พบตรงวัน' : `ราคาอ้างอิงใกล้วัน · ${dayDistance} วัน`}</span>
          {bookingUrl && <span>ตรวจตรงสายการบิน</span>}
        </div>
        <h3>{airlineDisplayName(reference.airline)}</h3>
        <p className="air-result-route">{origin} → {destination}</p>
        <p>TripDeal พบข้อมูลราคาของสายการบินนี้ แต่จะให้เว็บไซต์สายการบินยืนยันเที่ยวบินและราคาของวันที่คุณเลือกอีกครั้ง</p>
        <p className="air-result-flight">ข้อมูลอ้างอิงวันที่ {dateTH(reference.departure_at)}{reference.flight_number ? ` · เที่ยวบิน ${reference.airline}${reference.flight_number}` : ''}</p>
      </div>
      <div className="air-result-price">
        <strong>฿{money(reference.price)}</strong>
        <span>ราคาอ้างอิง / คน</span>
        <small>{exactReference ? 'พบข้อมูลในวันเดียวกัน · ยังไม่ใช่การล็อกราคา' : `ไม่ใช่ราคาวันที่เลือก · ห่าง ${dayDistance} วัน`}</small>
        {bookingUrl
          ? <button onClick={() => openOfficialSearch(reference.airline)}>ตรวจเที่ยวบินวันที่เลือกกับ {airline?.name || airlineDisplayName(reference.airline)} <ChevronRight size={16}/></button>
          : <button disabled>ยังไม่มีลิงก์สายการบิน</button>}
      </div>
    </article>;
  };

  const renderFallbackCard = (fallback: ReturnType<typeof getRouteFallbackAirlines>[number], index: number) => {
    const airline = getAirline(fallback.code);
    const reference = referenceFor(fallback.code);
    const bookingUrl = buildDirectBookingUrl(fallback.code, {
      origin,
      destination,
      depart,
      returnDate,
      trip,
      adults,
      routeBookingUrl: fallback.routeBookingUrl,
    });

    return <article className="air-result-card" key={`${origin}-${destination}-${fallback.code}-${index}`}>
      <div className="air-result-main">
        <div className="air-result-tags"><span>เส้นทางที่รู้จัก</span><span>ตรวจตรงสายการบิน</span></div>
        <h3>{airlineDisplayName(fallback.code)}</h3>
        <p className="air-result-route">{origin} → {destination}</p>
        <p>TripDeal รู้ว่าสายการบินนี้มีข้อมูลเกี่ยวข้องกับเส้นทาง แต่ยังไม่ยืนยันว่าบินตรงในวันที่คุณเลือก</p>
        {reference
          ? <p className="air-result-flight">ราคาอ้างอิงใกล้วัน: ฿{money(reference.price)} · {dateTH(reference.departure_at)}</p>
          : <p className="air-result-flight">ยังไม่มีราคาอ้างอิงที่เชื่อถือได้</p>}
      </div>
      <div className="air-result-price">
        <strong>เช็กกับสายการบิน</strong>
        <span>{airline?.name || airlineDisplayName(fallback.code)}</span>
        <small>ยืนยันตารางบิน ที่นั่ง และราคาที่เว็บไซต์ทางการ</small>
        {bookingUrl
          ? <button onClick={() => openOfficialSearch(fallback.code, fallback.routeBookingUrl)}>ตรวจเที่ยวบินวันที่เลือก <ChevronRight size={16}/></button>
          : <button disabled>ยังไม่มีลิงก์จอง</button>}
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

      <div className="air-search-trust"><ShieldCheck size={17}/><div><strong>Direct-first: เปรียบเทียบใน TripDeal แล้วให้สายการบินยืนยันและรับชำระเงิน</strong><span>Travelpayouts ใช้เป็นข้อมูลอ้างอิง/ค้นหาเส้นทางเท่านั้น · Directory รองรับ {supportedAirlineCount}+ สายการบิน</span></div></div>

      {loading && <div className="air-search-empty"><Search size={24}/><strong>กำลังค้นหาราคาอ้างอิงและสายการบิน...</strong><span>TripDeal จะพยายามพาคุณไปตรวจวันที่และราคากับสายการบินโดยตรง</span></div>}
      {!loading && error && <div className="air-search-empty"><strong>ค้นหาไม่สำเร็จ</strong><span>{error}</span><button onClick={() => window.location.reload()}>ลองอีกครั้ง</button></div>}

      {!loading && !error && sorted.length === 0 && <>
        <div className="air-search-empty">
          <strong>{references.length > 0 ? 'ยังไม่มีราคาที่สายการบินยืนยันตรงวัน แต่พบข้อมูลอ้างอิงของเส้นทางนี้' : 'ยังไม่มีข้อมูลราคาตรงวันที่เลือกจากแหล่งอ้างอิง'}</strong>
          <span>{references.length > 0 ? 'เลือกสายการบินด้านล่างเพื่อไปตรวจเที่ยวบินและราคาของวันที่เลือกบนเว็บไซต์ทางการได้เลย' : 'TripDeal จะไม่แต่งราคาเอง หากไม่มีข้อมูลจะให้ตรวจตรงกับสายการบินแทน'}</span>
          <button onClick={() => navigate('/')}>เปลี่ยนวันหรือค้นหาใหม่</button>
        </div>

        {references.length > 0 && <>
          <div className="air-search-title"><div><h2>ราคาอ้างอิงใกล้วันที่เลือก</h2><p>ใช้ช่วยเทียบสายการบิน แล้วกดตรวจเที่ยวบินจริงกับสายการบินโดยตรง</p></div></div>
          <div className="air-search-list">{references.slice(0, 12).map(renderReferenceCard)}</div>
        </>}

        {missingFallbacks.length > 0 && <>
          <div className="air-search-title"><div><h2>สายการบินอื่นที่ควรตรวจเพิ่ม</h2><p>ไม่มีราคาอ้างอิงเพียงพอ จึงไม่เอามาปนกับผลราคา</p></div></div>
          <div className="air-search-list">{missingFallbacks.map(renderFallbackCard)}</div>
        </>}
      </>}

      {!loading && !error && sorted.length > 0 && <>
        <div className="air-search-title"><div><h2>พบ {sorted.length} ราคาอ้างอิงตรงวันที่เลือก</h2><p>TripDeal จัดอันดับทั้งราคา การต่อเครื่อง และเวลา เพื่อหาดีลที่คุ้มที่สุด</p></div><button onClick={() => navigate('/')}>ค้นหาใหม่</button></div>
        <div className="air-search-list">
          {sorted.map((row, index) => {
            const airline = getAirline(row.airline);
            const score = valueScores[index] ?? 0;
            const direct = row.transfers === 0 && (trip === 'oneway' || row.return_transfers === 0);
            const paired = row.price_basis === 'sum_of_exact_one_way_discovery';
            const isBestValue = index === bestValueIndex;
            const isCheapest = index === 0;
            return <article className={isBestValue ? 'air-result-card best' : 'air-result-card'} key={`${row.airline}-${row.flight_number}-${row.departure_at}-${row.price}-${index}`}>
              <div className="air-result-main">
                <div className="air-result-tags">
                  {isBestValue && <span className="best">⭐ คุ้มที่สุด</span>}
                  {isCheapest && !isBestValue && <span className="best">💸 ถูกที่สุด</span>}
                  {paired && <span>จับคู่ขาไป + ขากลับ</span>}
                  {airline && <span>จองตรงสายการบิน</span>}
                </div>
                <h3>{airlineDisplayName(row.airline)}</h3>
                <p className="air-result-route">{row.origin_airport || origin} → {row.destination_airport || destination}</p>
                <p>{direct ? 'บินตรง' : `ขาไปต่อ ${row.transfers || 0} ครั้ง${trip === 'roundtrip' ? ` · ขากลับต่อ ${row.return_transfers || 0} ครั้ง` : ''}`}</p>
                <p className="air-result-flight">ขาไป {row.flight_number ? `${row.airline}${row.flight_number}` : 'รอยืนยันเลขเที่ยวบิน'} · {dateTH(row.departure_at)}</p>
                {trip === 'roundtrip' && <p className="air-result-flight">ขากลับ {row.return_flight_number ? `${row.airline}${row.return_flight_number}` : 'รอยืนยันเลขเที่ยวบิน'} · {dateTH(row.return_at)}</p>}
                <div className="air-score">Value Score <b>⭐ {score}/100</b><span><i style={{ width: `${score}%` }}/></span></div>
              </div>
              <div className="air-result-price">
                <strong>฿{money(row.price)}</strong><span>{trip === 'roundtrip' ? 'ไป–กลับ' : 'เที่ยวเดียว'} / คน</span>
                <small>{paired ? 'ราคาอ้างอิงรวมขาไป + ขากลับที่พบตรงวัน' : 'ราคาอ้างอิงที่พบตรงวัน · ต้องยืนยันกับสายการบิน'}</small>
                <button onClick={() => openDeal(row, index)}>ดูรายละเอียดและจองตรง <ChevronRight size={16}/></button>
              </div>
            </article>;
          })}
        </div>

        {missingFallbacks.length > 0 && <>
          <div className="air-search-title"><div><h2>สายการบินอื่นที่ควรตรวจเพิ่ม</h2><p>ยังไม่มีราคาอ้างอิงตรงวัน จึงแยกออกจากผลหลัก</p></div></div>
          <div className="air-search-list">{missingFallbacks.map(renderFallbackCard)}</div>
        </>}

        <div className="air-search-disclaimer"><strong>Direct-first หมายความว่าอะไร?</strong><p>ราคาใน TripDeal ใช้เพื่อช่วยเปรียบเทียบและเลือกดีลที่คุ้มที่สุดเท่านั้น ที่นั่ง ตารางบิน ราคาสุดท้าย สัมภาระ และการชำระเงินให้เว็บไซต์สายการบินเป็นผู้ยืนยันเสมอ</p></div>
      </>}
    </main>

    <nav className="air-search-bottom-nav"><Link to="/"><Home size={20}/>หน้าแรก</Link><Link to={`/search?${params.toString()}`} className="active"><Plane size={20}/>เที่ยวบิน</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link></nav>
    <TripiAssistant/>
  </div>;
}
