import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, Home, Plane, Search, User } from 'lucide-react';
import { Link, Navigate, Route, Routes, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './lib/supabase';
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
  is_direct: boolean;
  baggage_kg: number | null;
  deal_score: number;
  deal_label: string | null;
  destinations: Destination;
};

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const dateTH = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const cityIcon = (city: string) => city === 'Tokyo' ? '🗼' : city === 'Osaka' ? '🏯' : city === 'Fukuoka' ? '🌊' : city === 'Sapporo' ? '❄️' : '✈️';
const countryFlag = (city: string) => ['Tokyo','Osaka','Fukuoka','Sapporo'].includes(city) ? '🇯🇵' : '✈️';
const monthMap: Record<string, number> = { 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12 };
const tripLength = (start: string, end: string) => Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1;
const dayRangeFromLabel = (label: string) => {
  const match = label.match(/(\d+)\D+(\d+)/);
  return match ? [Number(match[1]), Number(match[2])] as const : null;
};

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
          <div><span>ออกเดินทางจาก</span><strong>กรุงเทพ (BKK)</strong></div>
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
            <div className="deal-bottom"><strong>฿{money(Number(d.price_thb))}</strong><span className="good">⭐ {d.deal_score}/100</span></div>
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
      <div className="panel"><h3>4. งบตั๋วต่อคน</h3><div className="chips">{['8,000','10,000','15,000'].map(x=><Chip key={x} label={`ไม่เกิน ${x}`} active={budget===x} onClick={()=>setBudget(x)}/>)}</div></div>
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

  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>{city}</h1><p>กรุงเทพ (BKK) · {days} · {month}{directOnly ? ' · บินตรง' : ''} · เรียงดีลคุ้มที่สุดก่อน</p></div></section>
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
            <div className="price"><strong>฿{money(Number(d.price_thb))}</strong><small>{d.deal_label || 'ดีลคุ้ม'}</small><span className="view-link">ดูเที่ยวบิน <ChevronRight size={15}/></span></div>
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
  return <Shell><div className="container narrow section"><div className="flight-hero"><div><span>{deal.destinations.city_name}</span><strong>{dateTH(deal.departure_date)} – {dateTH(deal.return_date)}</strong></div><b>{cityIcon(deal.destinations.city_name)}</b></div>
    <h2>รายละเอียดเที่ยวบิน</h2><div className="flight-card"><p>{deal.airline_name ?? 'Airline'}</p><div className="route"><strong>00:45<small>DMK</small></strong><Plane/><strong>09:10<small>{deal.destinations.airport_code}</small></strong></div><p>บินตรง · 6 ชม. 25 นาที</p></div>
    <div className="flight-card"><p>เที่ยวกลับ</p><div className="route"><strong>10:15<small>{deal.destinations.airport_code}</small></strong><Plane/><strong>15:00<small>DMK</small></strong></div><p>บินตรง · 6 ชม. 45 นาที</p></div>
    <div className="price-box"><div><span>ราคาต่อคน</span><strong>฿{money(Number(deal.price_thb))}</strong></div><span className="good">{deal.deal_label || 'ราคาดี'}</span></div>
    <button className="primary big" onClick={()=>setOpen(true)}>จองเที่ยวบินนี้</button>
    {open&&<div className="modal-backdrop"><div className="modal"><h3>เวอร์ชันทดลอง</h3><p>ขั้นต่อไปจะเชื่อมต่อพาร์ทเนอร์จองตั๋วจริง ตอนนี้ยังไม่มีการชำระเงินหรือออกตั๋ว</p><button className="primary" onClick={()=>setOpen(false)}>เข้าใจแล้ว</button></div></div>}
  </div></Shell>;
}

function AlertsPage(){
  const [enabled,setEnabled]=useState(true);
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>🔔 แจ้งเตือนราคา</h1><p>ตั้งงบไว้ แล้วค่อยกลับมาเมื่อเจอดีลที่ใช่</p></div></section><div className="container narrow section alerts-section"><div className="panel form compact-form"><div className="form-grid"><label>ปลายทาง<input defaultValue="Tokyo"/></label><label>งบสูงสุด<input defaultValue="8000" type="number"/></label></div><button className="primary">ตั้งแจ้งเตือน</button></div><div className="results-header"><h2>การแจ้งเตือนของฉัน</h2></div><div className="alert-card"><div><h3>Tokyo, Japan</h3><p>5–7 วัน · งบไม่เกิน ฿8,000</p></div><button className={enabled?'toggle on':'toggle'} onClick={()=>setEnabled(!enabled)} aria-label="เปิดปิดการแจ้งเตือน"><span/></button></div></div></Shell>
}

function AccountPage(){ return <Shell><div className="container narrow section account-section"><div className="profile"><div className="avatar">TD</div><div><h2>ผู้ใช้งาน TripDeal</h2><p>บัญชีทดลอง</p></div></div>{['การจองของฉัน','แจ้งเตือนราคา','รายการที่บันทึก','ข้อมูลผู้โดยสาร','ช่วยเหลือ','ตั้งค่า'].map(x=><div className="menu-row" key={x}>{x}<span>›</span></div>)}</div></Shell> }

export default function App(){ return <Routes><Route path="/" element={<HomePage/>}/><Route path="/find-deal" element={<FindDealPage/>}/><Route path="/results" element={<ResultsPage/>}/><Route path="/flight" element={<FlightPage/>}/><Route path="/alerts" element={<AlertsPage/>}/><Route path="/account" element={<AccountPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>; }
