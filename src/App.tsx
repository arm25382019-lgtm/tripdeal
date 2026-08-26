import { useEffect, useMemo, useState } from 'react';
import { Bell, Bookmark, Home, Plane, Search, User } from 'lucide-react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

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

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><Plane size={22} fill="currentColor" />TripDeal</Link>
      <nav className="desktop-nav">
        <Link to="/">หน้าแรก</Link><Link to="/results">ดีล</Link><Link to="/alerts">แจ้งเตือนราคา</Link><Link to="/account">บัญชี</Link>
      </nav>
    </header>
    <main>{children}</main>
    <nav className="bottom-nav">
      <Link to="/"><Home size={20}/>หน้าแรก</Link><Link to="/results"><Plane size={20}/>ดีล</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link>
    </nav>
  </div>;
}

function HomePage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    supabase.from('deals').select('*, destinations(*)').order('deal_score', { ascending: false }).limit(4).then(({ data }) => setDeals((data as Deal[]) ?? []));
  }, []);
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
    <section className="container section">
      <div className="section-title"><h2>🔥 ดีลน่าไปตอนนี้</h2><Link to="/results">ดูทั้งหมด</Link></div>
      <div className="deal-grid">
        {deals.map(d => <button key={d.id} className="deal-card" onClick={() => navigate(`/flight?id=${d.id}`)}>
          <div className="city-visual"><span>{d.destinations.city_name === 'Tokyo' ? '🗼' : d.destinations.city_name === 'Osaka' ? '🏯' : '✈️'}</span></div>
          <div className="deal-body"><div><h3>{d.destinations.city_name}</h3><p>{dateTH(d.departure_date)} – {dateTH(d.return_date)}</p></div><strong>฿{money(Number(d.price_thb))}</strong><span className="good">Deal Score {d.deal_score}</span></div>
        </button>)}
      </div>
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
  return <Shell><section className="soft-head"><div className="container narrow"><h1>ญี่ปุ่น 🇯🇵</h1><p>เลือกเงื่อนไขง่าย ๆ แล้วเราจะหาช่วงที่คุ้มให้</p></div></section>
    <div className="container narrow stack">
      <div className="panel"><h3>1. อยากไปเมืองไหน?</h3><div className="chips">{['Tokyo','Osaka','Fukuoka','Sapporo'].map(x=><Chip key={x} label={x} active={city===x} onClick={()=>setCity(x)}/>)}</div></div>
      <div className="panel"><h3>2. ช่วงไหนสะดวก?</h3><div className="chips">{['ก.ย.','ต.ค.','พ.ย.','ธ.ค.'].map(x=><Chip key={x} label={x} active={month===x} onClick={()=>setMonth(x)}/>)}</div></div>
      <div className="panel"><h3>3. เที่ยวกี่วัน?</h3><div className="chips">{['3–4 วัน','5–7 วัน','8–10 วัน'].map(x=><Chip key={x} label={x} active={days===x} onClick={()=>setDays(x)}/>)}</div></div>
      <div className="panel"><h3>4. งบตั๋วต่อคน</h3><div className="chips">{['8,000','10,000','15,000'].map(x=><Chip key={x} label={`ไม่เกิน ${x}`} active={budget===x} onClick={()=>setBudget(x)}/>)}</div></div>
      <button className="primary big" onClick={()=>nav(`/results?city=${city}`)}><Search size={19}/> หาดีล</button>
    </div>
  </Shell>;
}

function ResultsPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const nav = useNavigate();
  useEffect(()=>{ supabase.from('deals').select('*, destinations(*)').eq('is_active', true).order('deal_score',{ascending:false}).then(({data})=>setDeals((data as Deal[])??[])); },[]);
  const cityDeals = useMemo(()=>deals.filter(d=>d.destinations?.city_name==='Tokyo'),[deals]);
  return <Shell><section className="soft-head"><div className="container narrow"><h1>Tokyo</h1><p>กรุงเทพ (BKK) · 5–7 วัน · ดีลที่คุ้มที่สุดก่อน</p></div></section>
    <div className="container narrow section"><h2>พบ {cityDeals.length || 4} ช่วงที่น่าสนใจ</h2><div className="result-list">
      {cityDeals.map((d,i)=><button key={d.id} onClick={()=>nav(`/flight?id=${d.id}`)} className={i===0?'result-card best':'result-card'}>
        <div>{i===0&&<span className="best-tag">🔥 คุ้มที่สุด</span>}<h3>{dateTH(d.departure_date)} – {dateTH(d.return_date)}</h3><p>{d.is_direct?'บินตรง':'ต่อเครื่อง'} · กระเป๋า {d.baggage_kg ?? 20} kg</p><div className="score">Deal Score ⭐ {d.deal_score}/100 <span><i style={{width:`${d.deal_score}%`}}/></span></div></div>
        <div className="price"><strong>฿{money(Number(d.price_thb))}</strong><small>{d.deal_label}</small></div>
      </button>)}
    </div></div>
  </Shell>;
}

function FlightPage() {
  const [deal,setDeal]=useState<Deal|null>(null);
  const [open,setOpen]=useState(false);
  useEffect(()=>{ const id=new URLSearchParams(location.search).get('id'); if(id) supabase.from('deals').select('*, destinations(*)').eq('id',id).single().then(({data})=>setDeal(data as Deal)); },[]);
  if(!deal) return <Shell><div className="container section">กำลังโหลด...</div></Shell>;
  return <Shell><div className="container narrow section"><div className="flight-hero"><div><span>Tokyo</span><strong>{dateTH(deal.departure_date)} – {dateTH(deal.return_date)}</strong></div></div>
    <h2>รายละเอียดเที่ยวบิน</h2><div className="flight-card"><p>{deal.airline_name ?? 'Airline'}</p><div className="route"><strong>00:45<small>DMK</small></strong><Plane/><strong>09:10<small>NRT</small></strong></div><p>บินตรง · 6 ชม. 25 นาที</p></div>
    <div className="flight-card"><p>เที่ยวกลับ</p><div className="route"><strong>10:15<small>NRT</small></strong><Plane/><strong>15:00<small>DMK</small></strong></div><p>บินตรง · 6 ชม. 45 นาที</p></div>
    <div className="price-box"><div><span>ราคาต่อคน</span><strong>฿{money(Number(deal.price_thb))}</strong></div><span className="good">{deal.deal_label}</span></div>
    <button className="primary big" onClick={()=>setOpen(true)}>จองเที่ยวบินนี้</button>
    {open&&<div className="modal-backdrop"><div className="modal"><h3>เวอร์ชันทดลอง</h3><p>ขั้นต่อไปจะเชื่อมต่อพาร์ทเนอร์จองตั๋วจริง ตอนนี้ยังไม่มีการชำระเงินหรือออกตั๋ว</p><button className="primary" onClick={()=>setOpen(false)}>เข้าใจแล้ว</button></div></div>}
  </div></Shell>;
}

function AlertsPage(){ return <Shell><section className="soft-head"><div className="container narrow"><h1>🔔 แจ้งเตือนราคา</h1><p>ตั้งงบไว้ แล้วค่อยกลับมาเมื่อเจอดีลที่ใช่</p></div></section><div className="container narrow section"><div className="panel form"><label>ปลายทาง<input defaultValue="Tokyo"/></label><label>งบสูงสุด<input defaultValue="8000" type="number"/></label><button className="primary">ตั้งแจ้งเตือน</button></div><h2>การแจ้งเตือนของฉัน</h2><div className="result-card"><div><h3>Tokyo, Japan</h3><p>5–7 วัน · งบไม่เกิน ฿8,000</p></div><Bell/></div></div></Shell> }
function AccountPage(){ return <Shell><div className="container narrow section"><div className="profile"><div className="avatar">TD</div><div><h2>ผู้ใช้งาน TripDeal</h2><p>บัญชีทดลอง</p></div></div>{['การจองของฉัน','แจ้งเตือนราคา','รายการที่บันทึก','ข้อมูลผู้โดยสาร','วิธีการชำระเงิน','ช่วยเหลือ','ตั้งค่า'].map(x=><div className="menu-row" key={x}>{x}<span>›</span></div>)}</div></Shell> }

export default function App(){ return <Routes><Route path="/" element={<HomePage/>}/><Route path="/find-deal" element={<FindDealPage/>}/><Route path="/results" element={<ResultsPage/>}/><Route path="/flight" element={<FlightPage/>}/><Route path="/alerts" element={<AlertsPage/>}/><Route path="/account" element={<AccountPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>; }
