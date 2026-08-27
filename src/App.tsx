import { useEffect, useState } from 'react';
import { Bell, ChevronRight, Home, Plane, User } from 'lucide-react';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import TripiAssistant from './components/TripiAssistant';
import FlightSearchEngine from './components/FlightSearchEngine';

type CountryOption = {
  key: 'ไทย' | 'ญี่ปุ่น' | 'เกาหลี' | 'ไต้หวัน' | 'จีน';
  label: string;
  flag: string;
};

type FeaturedDeal = {
  city: string;
  country: string;
  flag: string;
  destination_code: string;
  origin_airport: string;
  destination_airport: string;
  departure_at: string;
  return_at: string;
  price: number;
  currency: string;
  airline: string;
  flight_number: string;
  transfers: number;
  return_transfers: number;
  deal_score: number;
  source: string;
};

type FeaturedResponse = {
  configured: boolean;
  country: string;
  deals?: FeaturedDeal[];
  error?: string;
};

type TravelGuide = {
  icon: string;
  title: string;
  summary: string;
  tag: string;
};

const COUNTRY_OPTIONS: CountryOption[] = [
  { key: 'ไทย', label: 'ไทย', flag: '🇹🇭' },
  { key: 'ญี่ปุ่น', label: 'ญี่ปุ่น', flag: '🇯🇵' },
  { key: 'เกาหลี', label: 'เกาหลี', flag: '🇰🇷' },
  { key: 'ไต้หวัน', label: 'ไต้หวัน', flag: '🇹🇼' },
  { key: 'จีน', label: 'จีน', flag: '🇨🇳' },
];

const TRAVEL_GUIDES: Record<CountryOption['key'], TravelGuide[]> = {
  ไทย: [
    { icon: '🗺️', title: 'เมืองน่าเที่ยวในไทย', summary: 'เชียงใหม่ เชียงราย ภูเก็ต กระบี่ และสมุย เหมาะกับทั้งทริปสั้นและวันหยุดยาว เลือกเมืองให้เข้ากับฤดูกาลและสไตล์เที่ยวของคุณ', tag: 'สถานที่แนะนำ' },
    { icon: '☀️', title: 'เลือกช่วงเที่ยวให้คุ้ม', summary: 'ภาคเหนือเด่นช่วงอากาศเย็น ส่วนทะเลควรเช็กฤดูฝนของแต่ละฝั่งก่อนจอง เพื่อให้ได้ทั้งราคาดีและเที่ยวได้เต็มวัน', tag: 'ช่วงน่าเที่ยว' },
    { icon: '🎒', title: 'ทิปเที่ยวในประเทศ', summary: 'เปรียบเทียบทั้ง BKK, DMK, CNX และ HKT เพราะบางเส้นทางราคาต่างกันมาก รวมถึงเช็กสัมภาระและค่าเลือกที่นั่งก่อนชำระเงิน', tag: 'ก่อนเดินทาง' },
  ],
  ญี่ปุ่น: [
    { icon: '🗼', title: 'Tokyo, Osaka หรือ Sapporo?', summary: 'โตเกียวเหมาะกับเที่ยวครั้งแรก โอซาก้าเหมาะกับสายกินและเที่ยวคันไซ ส่วนซัปโปโรเด่นเรื่องธรรมชาติ หิมะ และอากาศเย็น', tag: 'สถานที่แนะนำ' },
    { icon: '🌸', title: 'ฤดูไหนเหมาะกับคุณ', summary: 'ฤดูใบไม้ผลิและใบไม้ร่วงเป็นช่วงยอดนิยม ส่วนฤดูหนาวเหมาะกับหิมะและสกี หากเน้นประหยัดลองเลี่ยงวันหยุดยาวและเทศกาลใหญ่', tag: 'ช่วงน่าเที่ยว' },
    { icon: '🚆', title: 'วางแผนเมืองและสนามบิน', summary: 'โตเกียวมีทั้ง NRT และ HND ส่วนโอซาก้ามี KIX การเลือกสนามบินให้ใกล้ที่พักอาจช่วยลดทั้งเวลาและค่าเดินทางเข้าเมือง', tag: 'ก่อนเดินทาง' },
  ],
  เกาหลี: [
    { icon: '🏙️', title: 'Seoul, Busan และ Jeju', summary: 'โซลเหมาะกับช้อปปิ้งและคาเฟ่ ปูซานเด่นทะเลและอาหาร ส่วนเชจูเหมาะกับธรรมชาติและการขับรถเที่ยวแบบสบาย ๆ', tag: 'สถานที่แนะนำ' },
    { icon: '🍁', title: 'อากาศแต่ละฤดูต่างกันชัด', summary: 'ใบไม้ผลิและใบไม้ร่วงเที่ยวสบาย ฤดูหนาวหนาวจัดและมีหิมะ ส่วนหน้าร้อนอากาศร้อนชื้น ควรเตรียมเสื้อผ้าให้ตรงฤดู', tag: 'ช่วงน่าเที่ยว' },
    { icon: '📱', title: 'เตรียมตัวก่อนเที่ยวเกาหลี', summary: 'เช็กข้อกำหนดการเข้าประเทศล่าสุดก่อนเดินทาง และวางแผนอินเทอร์เน็ต การเดินทางจากสนามบิน และบัตรโดยสารสาธารณะล่วงหน้า', tag: 'ก่อนเดินทาง' },
  ],
  ไต้หวัน: [
    { icon: '🏮', title: 'Taipei และเมืองรอบ ๆ', summary: 'ไทเปเหมาะกับทริป 3–5 วัน และสามารถต่อรถไปจิ่วเฟิ่น เป่ยโถว หรือเมืองใกล้เคียงได้ง่าย เหมาะกับสายกินและเดินเที่ยว', tag: 'สถานที่แนะนำ' },
    { icon: '🌦️', title: 'เที่ยวได้เกือบทั้งปี', summary: 'อากาศช่วงปลายปีถึงต้นปีค่อนข้างสบาย ส่วนฤดูร้อนมีทั้งความชื้นและฝน ควรเช็กพยากรณ์ก่อนจัดทริปกลางแจ้ง', tag: 'ช่วงน่าเที่ยว' },
    { icon: '🚇', title: 'เที่ยวเองง่ายด้วยขนส่งสาธารณะ', summary: 'MRT และรถไฟเชื่อมเมืองหลักได้ดี เลือกที่พักใกล้สถานีช่วยประหยัดเวลา และควรเผื่อเวลาเดินทางไปสนามบินวันกลับ', tag: 'ก่อนเดินทาง' },
  ],
  จีน: [
    { icon: '🏯', title: 'เมืองจีนที่น่าเริ่มต้น', summary: 'เซี่ยงไฮ้เหมาะกับเมืองทันสมัย ปักกิ่งเด่นประวัติศาสตร์ กวางโจวและเซินเจิ้นเหมาะกับธุรกิจและช้อปปิ้ง ส่วนคุนหมิงอากาศสบาย', tag: 'สถานที่แนะนำ' },
    { icon: '🌤️', title: 'เลือกฤดูตามภูมิภาค', summary: 'ประเทศจีนมีพื้นที่กว้างและอากาศต่างกันมาก ควรเช็กสภาพอากาศของเมืองปลายทางโดยตรงก่อนเลือกวันเดินทาง', tag: 'ช่วงน่าเที่ยว' },
    { icon: '💳', title: 'เตรียมแอปและการชำระเงิน', summary: 'ก่อนเดินทางควรเช็กข้อกำหนดการเข้าประเทศล่าสุด รวมถึงแอปแผนที่ อินเทอร์เน็ต และช่องทางชำระเงินที่ใช้ได้ในพื้นที่', tag: 'ก่อนเดินทาง' },
  ],
};

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const dateTH = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
const cityIcon = (city: string) => {
  const icons: Record<string, string> = {
    Tokyo: '🗼', Osaka: '🏯', Fukuoka: '🌊', Sapporo: '❄️',
    Seoul: '🏙️', Busan: '🌉', Jeju: '🌋',
    Taipei: '🏮', Kaohsiung: '🌅',
    Shanghai: '🌆', Beijing: '🏯', Guangzhou: '🌃', Shenzhen: '🏙️', Kunming: '🌸',
    'Chiang Mai': '⛰️', Phuket: '🏝️', Krabi: '🌴', 'Hat Yai': '🌇', 'Chiang Rai': '🛕', 'Koh Samui': '🏖️',
  };
  return icons[city] || '✈️';
};

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
  const [selectedCountry, setSelectedCountry] = useState<CountryOption['key']>('ญี่ปุ่น');
  const [featuredDeals, setFeaturedDeals] = useState<FeaturedDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetch(`/api/featured-deals?country=${encodeURIComponent(selectedCountry)}`)
      .then(async (res) => {
        const data = await res.json() as FeaturedResponse;
        if (!res.ok) throw new Error(data.error || 'โหลดดีลไม่สำเร็จ');
        if (!active) return;
        setFeaturedDeals(data.deals || []);
        if (!data.configured) setError('ระบบราคายังไม่พร้อมใช้งาน');
      })
      .catch((e) => {
        if (!active) return;
        setFeaturedDeals([]);
        setError(e instanceof Error ? e.message : 'โหลดดีลไม่สำเร็จ');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [selectedCountry]);

  const selectedCountryMeta = COUNTRY_OPTIONS.find((item) => item.key === selectedCountry)!;
  const countryGuides = TRAVEL_GUIDES[selectedCountry];

  const openFeatured = (d: FeaturedDeal) => {
    const q = new URLSearchParams({
      origin: d.origin_airport || 'BKK',
      destination: d.destination_airport || d.destination_code,
      origin_name: d.origin_airport || 'กรุงเทพ',
      destination_name: d.city,
      trip: 'roundtrip',
      depart: d.departure_at,
      return: d.return_at,
      adults: '1',
      price: String(d.price),
      airline_code: d.airline || '',
      flight: d.flight_number || '',
      transfers: String(d.transfers || 0),
      return_transfers: String(d.return_transfers || 0),
      score: String(d.deal_score || 0),
      back: '/',
    });
    navigate(`/book?${q.toString()}`);
  };

  return <Shell>
    <section className="hero">
      <div className="hero-art">✈️</div>
      <div className="container hero-inner">
        <span className="eyebrow">TRAVEL DEAL FINDER</span>
        <h1>อยากเที่ยวที่ไหน?</h1>
        <p>ค้นหาเที่ยวบินในไทยและเอเชีย แล้วให้ TripDeal ช่วยเลือกดีลที่คุ้มที่สุด</p>
        <FlightSearchEngine />
      </div>
    </section>

    <section className="container section home-deals" id="featured-deals">
      <div className="section-title"><h2>🔥 ดีลน่าไปตอนนี้ · {selectedCountryMeta.flag} {selectedCountryMeta.label}</h2><Link to="/find-deal">ค้นหาเอง</Link></div>
      <p className="deal-subtitle">คัดจากราคาที่พบล่าสุดเพื่อช่วยเลือกช่วงเดินทาง · ราคาจริงยืนยันอีกครั้งกับสายการบิน</p>

      <div className="country-grid deals-country-grid" aria-label="เลือกประเทศสำหรับดูดีล">
        {COUNTRY_OPTIONS.map((country) => <button
          key={country.key}
          className={selectedCountry === country.key ? 'country active' : 'country'}
          onClick={() => setSelectedCountry(country.key)}
          aria-pressed={selectedCountry === country.key}
        >{country.flag} {country.label}</button>)}
      </div>

      {loading ? <div className="empty-state">กำลังค้นหาดีลล่าสุดของ{selectedCountryMeta.label}...</div> : error ? <div className="empty-state"><strong>โหลดดีลไม่สำเร็จ</strong><span>{error}</span></div> : featuredDeals.length === 0 ? <div className="empty-state"><strong>ยังไม่มีดีลของ{selectedCountryMeta.label}ในตอนนี้</strong><span>ลองค้นหาเที่ยวบินเองด้านบน หรือเลือกประเทศอื่นได้เลย</span></div> :
      <div className="deal-grid">
        {featuredDeals.slice(0, 4).map((d, i) => <button key={`${d.city}-${d.departure_at}-${i}`} className="deal-card compact" onClick={() => openFeatured(d)}>
          <div className="city-visual"><span>{cityIcon(d.city)}</span></div>
          <div className="deal-body">
            <div className="deal-title-row"><div><h3>{d.city} {selectedCountryMeta.flag}</h3><p>{dateTH(d.departure_at)} – {dateTH(d.return_at)}</p></div><ChevronRight size={18}/></div>
            <div className="deal-bottom"><div className="deal-price"><strong>฿{money(Number(d.price))}</strong><small>ราคาที่พบล่าสุด / คน</small></div><span className="good">⭐ {d.deal_score}/100</span></div>
            <small style={{color:'#64748b'}}>{d.airline ? `สายการบิน ${d.airline}` : 'ยืนยันสายการบินก่อนจอง'} · {d.transfers === 0 && d.return_transfers === 0 ? 'บินตรง' : 'มีต่อเครื่อง'}</small>
          </div>
        </button>)}
      </div>}

      <section className="travel-guide-section">
        <div className="travel-guide-head">
          <div><span>TRIPDEAL GUIDE</span><h2>เที่ยว{selectedCountryMeta.label} เริ่มวางแผนตรงนี้</h2><p>ข้อมูลสั้น ๆ ช่วยเลือกเมือง ช่วงเวลา และเตรียมตัวก่อนจอง</p></div>
          <div className="travel-guide-flag">{selectedCountryMeta.flag}</div>
        </div>
        <div className="travel-guide-grid">
          {countryGuides.map((guide) => <article className="travel-guide-card" key={guide.title}>
            <div className="travel-guide-icon">{guide.icon}</div>
            <span>{guide.tag}</span>
            <h3>{guide.title}</h3>
            <p>{guide.summary}</p>
          </article>)}
        </div>
        <p className="travel-guide-note">ข้อมูลส่วนนี้เป็นไกด์ทั่วไปสำหรับวางแผนทริป ควรตรวจข้อกำหนดการเดินทางและข้อมูลล่าสุดจากหน่วยงานทางการก่อนออกเดินทาง</p>
      </section>
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
