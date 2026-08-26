import { useEffect, useMemo, useState } from 'react';
import { Bell, ChevronRight, Home, Plane, User } from 'lucide-react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import TripiAssistant from './components/TripiAssistant';
import FlightSearchEngine from './components/FlightSearchEngine';

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

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link to="/" className="brand"><Plane size={22} fill="currentColor" />TripDeal</Link>
      <nav className="desktop-nav">
        <Link to="/">หน้าแรก</Link><Link to="/find-deal">ค้นหาเที่ยวบิน</Link><Link to="/alerts">แจ้งเตือนราคา</Link><Link to="/account">บัญชี</Link>
      </nav>
    </header>
    <main>{children}</main>
    <nav className="bottom-nav">
      <Link to="/"><Home size={20}/>หน้าแรก</Link><Link to="/find-deal"><Plane size={20}/>เที่ยวบิน</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link>
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
        <p>ค้นหาเที่ยวบินในไทยและเอเชีย แล้วให้ TripDeal ช่วยเลือกดีลที่คุ้มที่สุด</p>
        <FlightSearchEngine />
        <div className="country-grid">
          {['🇹🇭 ไทย','🇯🇵 ญี่ปุ่น','🇰🇷 เกาหลี','🇹🇼 ไต้หวัน'].map((x, i) => <button key={x} className={i===0?'country active':'country'} onClick={() => navigate('/find-deal')}>{x}</button>)}
        </div>
      </div>
    </section>

    <section className="container section home-deals">
      <div className="section-title"><h2>🔥 ดีลน่าไปตอนนี้</h2><Link to="/find-deal">ค้นหาเอง</Link></div>
      {loading ? <div className="empty-state">กำลังโหลดดีล...</div> : featuredDeals.length === 0 ? <div className="empty-state">ยังไม่มีดีลในตอนนี้ ลองค้นหาเที่ยวบินด้านบนได้เลย</div> :
      <div className="deal-grid">
        {featuredDeals.map(d => <button key={d.id} className="deal-card compact" onClick={() => navigate(`/flight?id=${d.id}`)}>
          <div className="city-visual"><span>{cityIcon(d.destinations.city_name)}</span></div>
          <div className="deal-body">
            <div className="deal-title-row"><div><h3>{d.destinations.city_name} {countryFlag(d.destinations.city_name)}</h3><p>{dateTH(d.departure_date)} – {dateTH(d.return_date)}</p></div><ChevronRight size={18}/></div>
            <div className="deal-bottom"><div className="deal-price"><strong>฿{money(Number(d.price_thb))}</strong><small>ราคาอ้างอิง / คน</small></div><span className="good">⭐ {d.deal_score}/100</span></div>
          </div>
        </button>)}
      </div>}
    </section>
  </Shell>;
}

function FindDealPage() {
  return <Shell>
    <section className="soft-head compact-head"><div className="container narrow"><h1>ค้นหาเที่ยวบิน ✈️</h1><p>เลือกต้นทาง ปลายทาง วันเดินทาง และจำนวนผู้โดยสาร</p></div></section>
    <div className="container narrow section"><FlightSearchEngine /></div>
  </Shell>;
}

function AlertsPage(){
  const [enabled,setEnabled]=useState(true);
  return <Shell><section className="soft-head compact-head"><div className="container narrow"><h1>🔔 แจ้งเตือนราคา</h1><p>ตั้งงบไว้ แล้วค่อยกลับมาเมื่อเจอดีลที่ใช่</p></div></section><div className="container narrow section alerts-section"><div className="panel form compact-form"><div className="form-grid"><label>ปลายทาง<input defaultValue="Tokyo"/></label><label>งบสูงสุด<input defaultValue="8000" type="number"/></label></div><button className="primary">ตั้งแจ้งเตือน</button></div><div className="results-header"><h2>การแจ้งเตือนของฉัน</h2></div><div className="alert-card"><div><h3>Tokyo, Japan</h3><p>งบไป–กลับไม่เกิน ฿8,000/คน</p></div><button className={enabled?'toggle on':'toggle'} onClick={()=>setEnabled(!enabled)} aria-label="เปิดปิดการแจ้งเตือน"><span/></button></div></div></Shell>
}

function AccountPage(){ return <Shell><div className="container narrow section account-section"><div className="profile"><div className="avatar">TD</div><div><h2>ผู้ใช้งาน TripDeal</h2><p>บัญชีทดลอง</p></div></div>{['การจองของฉัน','แจ้งเตือนราคา','รายการที่บันทึก','ข้อมูลผู้โดยสาร','ช่วยเหลือ','ตั้งค่า'].map(x=><div className="menu-row" key={x}>{x}<span>›</span></div>)}</div></Shell> }

export default function App(){ return <Routes><Route path="/" element={<HomePage/>}/><Route path="/find-deal" element={<FindDealPage/>}/><Route path="/alerts" element={<AlertsPage/>}/><Route path="/account" element={<AccountPage/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>; }
