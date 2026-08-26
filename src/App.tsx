import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, Clock3, Home, Plane, Search, User } from 'lucide-react';
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
import FareDetails from './components/FareDetails';
import TripiAssistant from './components/TripiAssistant';

type Destination = {
  id: string;
  city_name: string;
  country_name_th: string;
  airport_code: string;
  is_featured: boolean;
};

type Deal = {
  id: string;
  origin_code: string;
  departure_date: string;
  return_date: string;
  price_thb: number;
  airline_name: string | null;
  flight_number_out: string | null;
  flight_number_return: string | null;
  is_direct: boolean;
  baggage_kg: number | null;
  deal_score: number;
  deal_label: string | null;
  destinations: Destination;
};

type FlightLeg = {
  label: 'ขาไป' | 'ขากลับ';
  date: string;
  departTime: string;
  arriveTime: string;
  origin: string;
  destination: string;
  originTerminal?: string;
  destinationTerminal?: string;
  duration: string;
  flightNumber: string;
  aircraft: string;
  nextDay?: boolean;
  verifiedDemo?: boolean;
};

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const dateTH = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const fullDateTH = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
const cityIcon = (city: string) => city === 'Tokyo' ? '🗼' : city === 'Osaka' ? '🏯' : city === 'Fukuoka' ? '🌊' : city === 'Sapporo' ? '❄️' : '✈️';
const countryFlag = (city: string) => ['Tokyo','Osaka','Fukuoka','Sapporo'].includes(city) ? '🇯🇵' : '✈️';
const monthMap: Record<string, number> = { 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };
const tripLength = (start: string, end: string) => Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1;
const dayRangeFromLabel = (label: string) => {
  const match = label.match(/(\d+)\D+(\d+)/);
  return match ? [Number(match[1]), Number(match[2])] as const : null;
};

function scheduleFor(deal: Deal): { outbound: FlightLeg; inbound: FlightLeg } {
  const exactTokyoExample = deal.destinations.city_name === 'Tokyo' && deal.airline_name === 'Thai AirAsia X' && deal.departure_date === '2026-10-14' && deal.return_date === '2026-10-20';

  if (exactTokyoExample) {
    return {
      outbound: {
        label: 'ขาไป', date: deal.departure_date, departTime: '01:15', arriveTime: '09:45', origin: 'DMK', destination: 'NRT', originTerminal: 'T1', destinationTerminal: 'T2', duration: '6 ชม. 30 นาที', flightNumber: deal.flight_number_out || 'XJ602', aircraft: 'Airbus A330-300', verifiedDemo: true,
      },
      inbound: {
        label: 'ขากลับ', date: deal.return_date, departTime: '21:15', arriveTime: '02:00', origin: 'NRT', destination: 'DMK', originTerminal: 'T2', destinationTerminal: 'T1', duration: '6 ชม. 45 นาที', flightNumber: deal.flight_number_return || 'XJ607', aircraft: 'Airbus A330-300', nextDay: true, verifiedDemo: true,
      },
    };
  }

  return {
    outbound: {
      label: 'ขาไป', date: deal.departure_date, departTime: '—', arriveTime: '—', origin: deal.origin_code || 'BKK', destination: deal.destinations.airport_code, duration: 'รอข้อมูลตารางบิน', flightNumber: deal.flight_number_out || 'รอข้อมูล', aircraft: 'รอข้อมูลจาก Flight API',
    },
    inbound: {
      label: 'ขากลับ', date: deal.return_date, departTime: '—', arriveTime: '—', origin: deal.destinations.airport_code, destination: deal.origin_code || 'BKK', duration: 'รอข้อมูลตารางบิน', flightNumber: deal.flight_number_return || 'รอข้อมูล', aircraft: 'รอข้อมูลจาก Flight API',
    },
  };
}

function FlightLegCard({ leg, airline, direct }: { leg: FlightLeg; airline: string; direct: boolean }) {
  return <section className="flight-leg-card">
    <div className="flight-leg-head">
      <div><span className="flight-direction">{leg.label}</span><strong>{fullDateTH(leg.date)}</strong></div>
      <span className="duration-pill"><Clock3 size={14}/>{leg.duration}</span>
    </div>
    <div className="flight-timeline">
      <div className="timeline-time"><strong>{leg.departTime}</strong><span>{leg.origin}{leg.originTerminal ? ` · ${leg.originTerminal}` : ''}</span></div>
      <div className="timeline-line"><i/><span/><i/></div>
      <div className="timeline-time"><strong>{leg.arriveTime}{leg.nextDay && <sup>+1</sup>}</strong><span>{leg.destination}{leg.destinationTerminal ? ` · ${leg.destinationTerminal}` : ''}</span></div>
    </div>
    <div className="flight-airline-row">
      <Plane size={18}/>
      <div><strong>{airline}</strong><span>{leg.flightNumber} · {leg.aircraft}</span></div>
    </div>
    <div className="flight-tags"><span>{direct ? 'เที่ยวบินตรง' : 'มีต่อเครื่อง'}</span>{leg.verifiedDemo ? <span>รายละเอียดตัวอย่างที่ยืนยันจากข้อมูลอ้างอิง</span> : <span>รายละเอียดเต็มจะมาจาก Flight API</span>}</div>
  </section>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><Plane size={22} fill="currentColor" />TripDeal</Link>
      <nav className="desktop-nav">
        <Link to="/">หน้าแรก</Link><Link to="/results?city=Tokyo">ดีล</Link><Link to="/alerts">แจ้งเตือนราคา</Link><Link to="/account">บัญชี</Link>
      </nav>
    </header>
    <main>{children}</main>
    <nav className="bottom-nav">
      <Link to="/"><Home size={20}/>หน้าแรก</Link><Link to="/results?city=Tokyo"><Plane size={20}/>ดีล</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link>
    </nav>
    <TripiAssistant />
  </div>;
}

function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.from('deals').select('*, destinations(*)').eq('is_active', true).order('deal_score', { ascending: false }).then(({ data }) => {
      setDeals((data as Deal[]) ?? []);
      setLoading(false);
    });
  }, []);

  const featuredDeals = useMemo(() => {
    const seen = new Set<string>();
    return deals.filter((d) => {
      const city = d.destinations?.city_name;
      if (!city || seen.has(city)) return false;
      seen.add(city);
      return true;
    }).slice(0, 4);
  }, [deals]);

  return <Shell>
    <section className="hero">
      <div className="hero-art">✈️</div>
      <div className="container hero-inner">
        <span className="eyebrow">TRAVEL DEAL FINDER</span>
        <h1>อยากเที่ยวที่ไหน?</h1>
        <p>เราช่วยหาช่วงที่ตั๋วคุ้มที่สุดให้</p>
        <div className="search-card">
          <div><span>ออกเดินทางจาก</span><strong>กรุงเทพ (BKK/DMK)</strong></div>
          <button onClick={() => navigate('/find-deal')}>ค้นหาดีล <Search size={18}/></button>
        </div>
        <div className="country-grid">
          {['🇯🇵 ญี่ปุ่น','🇰🇷 เกาหลี','🇹🇼 ไต้หวัน','🇨🇳 จีน'].map((x, i) => <button key={x} className={i===0?'country active':'country'} onClick={() => navigate('/find-deal')}>{x}</button>)}
        </div>
      </div>
    </section>

    <section className="container section home-deals">
      <div className="section-title"><h2>🔥 ดีลน่าไปตอนนี้</h2><Link to="/results?city=Tokyo">ดูทั้งหมด</Link></div>
      {loading ? <div className="empty-state">กำลังโหลดดีล...</div> : featuredDeals.length === 0 ? <div className="empty-state">ยังไม่มีดีลในตอนนี้ ลองกลับมาใหม่อีกครั้ง</div> :
      <div className="deal-grid">
        {featuredDeals.map(d => <button key={d.id} className="deal-card compact" onClick={() => navigate(`/flight?id=${d.id}`)}>
          <div className="city-visual"><span>{cityIcon(d.destinations.city_name)}</span></div>
          <div className="deal-body">
            <div className="deal-title-row"><div><h3>{d.destinations.city_name} {countryFlag(d.destinations.city_name)}</h3><p>{dateTH(d.departure_date)} – {dateTH(d.return_date)}</p></div><ChevronRight size={18}/></div>
            <div className="deal-bottom"><div className="deal-price"><strong>฿{money(Number(d.price_thb))}</strong><small>ไป–กลับ / คน</small></div><span className="good">⭐ {d.deal_score}/100</span></div>
          </div>
        </button>)}
      </div>}
    </section>
  </Shell>;
}

function FindDealPage() {
  const nav = useNavigate();
  const [city, setCity] = useState('Tokyo');
  const [month, setMonth] = useState('ต.ค.');
  const [days, setDays] = useState('5–7 วัน');
  const [budget, setBudget] = useState('10,000');
  const Chip = ({ label, active, onClick }: { label:string; active:boolean; onClick:()=>void }) => <button className={active?'chip active':'chip'} onClick={onClick}>{label}</button>;
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>ญี่ปุ่น 🇯🇵</h1><p>เลือกเงื่อนไขง่าย ๆ แล้วเราจะหาช่วงที่คุ้มให้</p></div></section>
    <div className="container narrow stack">
      <div className="panel"><h3>1. อยากไปเมืองไหน?</h3><div className="chips">{['Tokyo','Osaka','Fukuoka','Sapporo'].map(x=><Chip key={x} label={x} active={city===x} onClick={()=>setCity(x)}/>)}</div></div>
      <div className="panel"><h3>2. ช่วงไหนสะดวก?</h3><div className="chips">{['ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].map(x=><Chip key={x} label={x} active={month===x} onClick={()=>setMonth(x)}/>)}</div></div>
      <div className="panel"><h3>3. เที่ยวกี่วัน?</h3><div className="chips">{['3–4 วัน','5–7 วัน','8–10 วัน'].map(x=><Chip key={x} label={x} active={days===x} onClick={()=>setDays(x)}/>)}</div></div>
      <div className="panel"><h3>4. งบตั๋วไป–กลับต่อคน</h3><div className="chips">{['8,000','10,000','15,000'].map(x=><Chip key={x} label={`ไม่เกิน ${x}`} active={budget===x} onClick={()=>setBudget(x)}/>)}</div></div>
      <button className="primary big" onClick={()=>nav(`/results?city=${encodeURIComponent(city)}&month=${encodeURIComponent(month)}&days=${encodeURIComponent(days)}&budget=${budget.replace(',','')}`)}><Search size={19}/> หาดีล</button>
    </div>
  </Shell>;
}

function ResultsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const nav = useNavigate();
  const city = params.get('city') || 'Tokyo';
  const month = params.get('month') || 'ยืดหยุ่น';
  const days = params.get('days') || '5–7 วัน';
  const budget = Number(params.get('budget') || 0);
  const directOnly = params.get('direct') === '1';
  const fromTripi = params.get('source') === 'tripi';

  useEffect(()=>{
    setLoading(true);
    supabase.from('deals').select('*, destinations(*)').eq('is_active', true).order('deal_score',{ascending:false}).then(({data})=>{
      setDeals((data as Deal[])??[]);
      setLoading(false);
    });
  },[]);

  const cityDeals = useMemo(()=>{
    const targetMonth = monthMap[month];
    const range = dayRangeFromLabel(days);
    return deals.filter((d) => {
      if (d.destinations?.city_name !== city) return false;
      if (budget && Number(d.price_thb) > budget) return false;
      if (targetMonth && new Date(`${d.departure_date}T00:00:00`).getMonth() + 1 !== targetMonth) return false;
      if (range) {
        const length = tripLength(d.departure_date, d.return_date);
        if (length < range[0] || length > range[1]) return false;
      }
      if (directOnly && !d.is_direct) return false;
      return true;
    });
  },[deals, city, budget, month, days, directOnly]);

  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>{city}</h1><p>กรุงเทพ (BKK/DMK) · {days} · {month}{directOnly ? ' · บินตรง' : ''} · เรียงดีลคุ้มที่สุดก่อน</p></div></section>
    <div className="container narrow section results-section">
      {loading ? <div className="empty-state">กำลังค้นหาดีล...</div> : cityDeals.length === 0 ? <div className="empty-state"><strong>ยังไม่พบดีลที่ตรงเงื่อนไข</strong><span>ลองเพิ่มงบประมาณ หรือเปลี่ยนเมือง/ช่วงเวลา</span><button className="primary" onClick={()=>nav('/find-deal')}>แก้ไขการค้นหา</button></div> : <>
        {fromTripi && <div className="tripi-result-note">✨ Tripi เลือกเงื่อนไขนี้ให้จากบทสนทนาของคุณ</div>}
        <div className="results-header"><h2>พบ {cityDeals.length} ช่วงที่น่าสนใจ</h2><button onClick={()=>nav('/find-deal')}>แก้ไข</button></div>
        <div className="result-list">
          {cityDeals.map((d,i)=><button key={d.id} onClick={()=>nav(`/flight?id=${d.id}`)} className={i===0?'result-card best':'result-card'}>
            <div className="result-main">
              {i===0&&<span className="best-tag">🔥 คุ้มที่สุด</span>}
              <h3>{dateTH(d.departure_date)} – {dateTH(d.return_date)}</h3>
              <p>{d.is_direct?'บินตรง':'ต่อเครื่อง'} · กระเป๋า {d.baggage_kg ?? 20} kg</p>
              <div className="score">Deal Score ⭐ {d.deal_score}/100 <span><i style={{width:`${d.deal_score}%`}}/></span></div>
              {i===0 && <span className="value-note">ราคาดีที่สุดในชุดที่พบตอนนี้</span>}
            </div>
            <div className="price"><strong>฿{money(Number(d.price_thb))}</strong><span className="price-caption">ไป–กลับ / คน</span><small>{d.deal_label || 'ดีลคุ้ม'}</small><span className="view-link">ดูเที่ยวบิน <ChevronRight size={15}/></span></div>
          </button>)}
        </div>
      </>}
    </div>
  </Shell>;
}

function FlightPage() {
  const [deal,setDeal]=useState<Deal|null>(null);
  const [loading,setLoading]=useState(true);
  const [open,setOpen]=useState(false);
  const [params] = useSearchParams();
  useEffect(()=>{
    const id=params.get('id');
    if(!id){ setLoading(false); return; }
    supabase.from('deals').select('*, destinations(*)').eq('id',id).single().then(({data})=>{ setDeal(data as Deal); setLoading(false); });
  },[params]);
  if(loading) return <Shell><div className="container section empty-state">กำลังโหลดรายละเอียด...</div></Shell>;
  if(!deal) return <Shell><div className="container section empty-state"><strong>ไม่พบเที่ยวบินนี้</strong><Link to="/">กลับหน้าแรก</Link></div></Shell>;

  const schedule = scheduleFor(deal);
  const airline = deal.airline_name ?? 'สายการบิน';

  return <Shell><div className="container narrow section flight-page">
    <div className="flight-hero"><div><span>{deal.destinations.city_name}</span><strong>{dateTH(deal.departure_date)} – {dateTH(deal.return_date)} · ไป–กลับ</strong></div><b>{cityIcon(deal.destinations.city_name)}</b></div>
    <div className="flight-title-row"><div><h2>รายละเอียดเที่ยวบิน</h2><p>แยกขาไปและขากลับให้ตรวจสอบก่อนจอง</p></div><span className="good">Deal Score {deal.deal_score}</span></div>

    <FlightLegCard leg={schedule.outbound} airline={airline} direct={deal.is_direct}/>
    <FlightLegCard leg={schedule.inbound} airline={airline} direct={deal.is_direct}/>

    <FareDetails
      price={Number(deal.price_thb)}
      baggageKg={deal.baggage_kg}
      airline={airline}
      dealLabel={deal.deal_label}
      isDemo
    />

    <p className="price-disclaimer">ข้อมูลบางส่วนใน TripDeal ตอนนี้ยังเป็นข้อมูลดีลตัวอย่าง ระบบจะตรวจสอบราคา ภาษี ค่าธรรมเนียม สัมภาระ Fare Rules และที่นั่งว่างจาก Flight API อีกครั้งก่อนส่งต่อไปจองจริง</p>
    <button className="primary big" onClick={()=>setOpen(true)}>ตรวจสอบราคาก่อนจอง</button>
    {open&&<div className="modal-backdrop"><div className="modal"><h3>เวอร์ชันทดลอง</h3><p>โครงหน้าค่าโดยสาร สัมภาระ นโยบาย และสรุปราคาพร้อมแล้วครับ เมื่อเชื่อม Flight API ระบบจะเติม Fare Rules และราคาสดจริงก่อนส่งต่อไปพาร์ทเนอร์จองตั๋ว</p><button className="primary" onClick={()=>setOpen(false)}>เข้าใจแล้ว</button></div></div>}
  </div></Shell>;
}

function AlertsPage(){
  const [enabled,setEnabled]=useState(true);
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>🔔 แจ้งเตือนราคา</h1><p>ตั้งงบไว้ แล้วค่อยกลับมาเมื่อเจอดีลที่ใช่</p></div></section><div className="container narrow section alerts-section"><div className="panel form compact-form"><div className="form-grid"><label>ปลายทาง<input defaultValue="Tokyo"/></label><label>งบสูงสุด<input defaultValue="8000" type="number"/></label></div><button className="primary">ตั้งแจ้งเตือน</button></div><div className="results-header"><h2>การแจ้งเตือนของฉัน</h2></div><div className="alert-card"><div><h3>Tokyo, Japan</h3><p>5–7 วัน · งบไป–กลับไม่เกิน ฿8,000/คน</p></div><button className={enabled?'toggle on':'toggle'} onClick={()=>setEnabled(!enabled)} aria-label="เปิดปิดการแจ้งเตือน"><span/></button></div></div></Shell>
}

function AccountPage(){ return <Shell><div className="container narrow section account-section"><div className="profile"><div className="avatar">TD</div><div><h2>ผู้ใช้งาน TripDeal</h2><p>บัญชีทดลอง</p></div></div>{['การจองของฉัน','แจ้งเตือนราคา','รายการที่บันทึก','ข้อมูลผู้โดยสาร','ช่วยเหลือ','ตั้งค่า'].map(x=><div className="menu-row" key={x}>{x}<span>›</span></div>)}</div></Shell> }

export default function App(){ return <Routes><Route path="/" element={<HomePage/>}/><Route path="/find-deal" element={<FindDealPage/>}/><Route path="/results" element={<ResultsPage/>}/><Route path="/flight" element={<FlightPage/>}/><Route path="/alerts" element={<AlertsPage/>}/><Route path="/account" element={<AccountPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>; }
