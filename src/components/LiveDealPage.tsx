import { ArrowLeft, Bell, CheckCircle2, ChevronRight, Home, Info, Plane, Search, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
const dateOnly = (iso: string) => new Date(iso).toISOString().slice(0, 10);
const cityIata: Record<string, string> = {
  Tokyo: 'TYO',
  Osaka: 'OSA',
  Fukuoka: 'FUK',
  Sapporo: 'SPK',
};

export default function LiveDealPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const city = params.get('city') || 'Tokyo';
  const origin = params.get('origin') || 'BKK';
  const destination = params.get('destination') || 'TYO';
  const departure = params.get('departure') || '';
  const returnAt = params.get('return') || '';
  const price = Number(params.get('price') || 0);
  const airline = params.get('airline') || '';
  const flightNumber = params.get('flight') || '';
  const transfers = Number(params.get('transfers') || 0);
  const returnTransfers = Number(params.get('return_transfers') || 0);
  const backQuery = params.get('back') || `/results?city=${encodeURIComponent(city)}`;

  if (!departure || !returnAt || !price) {
    return <div className="live-deal-shell">
      <header className="live-deal-topbar"><button onClick={() => navigate(-1)}><ArrowLeft size={22}/></button><strong>รายละเอียดดีล</strong></header>
      <main className="live-deal-container"><div className="live-deal-empty"><strong>ไม่พบข้อมูลดีลนี้</strong><button onClick={() => navigate('/find-deal')}>ค้นหาใหม่</button></div></main>
    </div>;
  }

  const direct = transfers === 0 && returnTransfers === 0;
  const liveDestination = cityIata[city] || destination || 'TYO';
  const liveSearchUrl = `https://search.aviasales.com/flights/?origin_iata=BKK&destination_iata=${encodeURIComponent(liveDestination)}&depart_date=${dateOnly(departure)}&return_date=${dateOnly(returnAt)}&adults=1&children=0&infants=0&trip_class=0&currency=THB&locale=th&oneway=0`;

  return <div className="live-deal-shell">
    <header className="live-deal-topbar">
      <button onClick={() => navigate(backQuery)} aria-label="ย้อนกลับ"><ArrowLeft size={22}/></button>
      <Link to="/" className="live-deal-brand"><Plane size={21} fill="currentColor"/>TripDeal</Link>
      <span className="live-deal-source">Aviasales</span>
    </header>

    <main className="live-deal-container">
      <section className="live-deal-hero">
        <span className="live-deal-pill">ราคาที่เคยพบล่าสุด</span>
        <h1>{origin} → {city}</h1>
        <p>{formatDate(departure)} – {formatDate(returnAt)} · ไป–กลับ</p>
        <div className="live-deal-price"><strong>฿{money(price)}</strong><span>/ คน</span></div>
        <small>ใช้ราคานี้เป็นตัวช่วยเลือกช่วงเดินทาง ไม่ถือว่าเป็นการล็อกราคาหรือที่นั่งไว้</small>
      </section>

      <section className="live-deal-card">
        <div className="live-deal-card-head"><Plane size={19}/><div><h2>สรุปเที่ยวบินที่เคยพบ</h2><p>ดูข้อมูลอ้างอิงก่อนค้นหาตั๋วที่ยังมีขายจริง</p></div></div>
        <div className="live-deal-route-row"><div><span>ขาไป</span><strong>{origin} → {destination}</strong><small>{formatDate(departure)}</small></div><span className="live-deal-transfer">{transfers === 0 ? 'บินตรง' : `ต่อเครื่อง ${transfers} ครั้ง`}</span></div>
        <div className="live-deal-route-row"><div><span>ขากลับ</span><strong>{destination} → {origin}</strong><small>{formatDate(returnAt)}</small></div><span className="live-deal-transfer">{returnTransfers === 0 ? 'บินตรง' : `ต่อเครื่อง ${returnTransfers} ครั้ง`}</span></div>
        <div className="live-deal-info-row"><span>สายการบินที่เคยพบ</span><strong>{airline || 'ยืนยันตอนค้นหาราคาปัจจุบัน'}{flightNumber ? ` · ${flightNumber}` : ''}</strong></div>
        <div className="live-deal-info-row"><span>รูปแบบเที่ยวบิน</span><strong>{direct ? 'บินตรงทั้งไป–กลับ' : 'มีเที่ยวบินต่อเครื่อง'}</strong></div>
      </section>

      <section className="live-deal-card tripi-advice">
        <div className="live-deal-card-head"><span className="tripi-mini">🤖</span><div><h2>Tripi สรุปให้</h2><p>{direct ? 'ช่วงนี้เคยมีดีลบินตรงที่น่าสนใจ แต่ต้องค้นหาราคาปัจจุบันอีกครั้งก่อนจอง' : 'ช่วงนี้เคยมีราคาน่าสนใจ แต่มีต่อเครื่อง ควรเทียบทั้งราคาและเวลาเดินทางจากผลค้นหาปัจจุบัน'}</p></div></div>
        <div className="tripi-check"><CheckCircle2 size={17}/> ราคาอ้างอิงที่เคยพบ ฿{money(price)} ต่อคน</div>
        <div className="tripi-check"><CheckCircle2 size={17}/> ปุ่มด้านล่างจะค้นหาเที่ยวบินทั้งหมดในวันเดียวกัน ไม่ล็อกไปที่ตั๋วเก่าหนึ่งใบ</div>
      </section>

      <section className="live-deal-card">
        <div className="live-deal-card-head"><Info size={19}/><div><h2>ทำไมต้องค้นหาใหม่ก่อนจอง?</h2><p>Aviasales Data API เป็นข้อมูลราคาจาก cache ตั๋วเดิมอาจขายหมดหรือราคาเปลี่ยนแล้ว</p></div></div>
        <div className="live-deal-checklist"><span>• ระบบจะเปิดผลค้นหาทั้งเส้นทาง กรุงเทพ ↔ {city}</span><span>• ใช้วันเดินทางเดียวกับดีลที่เลือก</span><span>• ถ้าตั๋วเดิมหมด ยังสามารถเลือกเที่ยวบินอื่นที่มีขายได้</span><span>• ตรวจราคา สัมภาระ เวลา และเงื่อนไขอีกครั้งก่อนชำระเงิน</span></div>
      </section>

      <div className="live-deal-actions">
        <button className="live-deal-primary" onClick={() => window.open(liveSearchUrl, '_blank', 'noopener,noreferrer')}>ค้นหาตั๋วที่ยังมีขายในวันเดียวกัน <ChevronRight size={18}/></button>
        <button className="live-deal-secondary" onClick={() => navigate(backQuery)}><Search size={17}/> ดูดีลอื่นใน TripDeal</button>
        <p>ปุ่มสีน้ำเงินจะเปิดหน้าค้นหาปัจจุบันของ Aviasales สำหรับเส้นทางและวันเดียวกัน ไม่เปิด cached ticket ใบเดิม</p>
      </div>
    </main>

    <nav className="live-deal-bottom-nav">
      <Link to="/"><Home size={20}/>หน้าแรก</Link>
      <Link to={backQuery} className="active"><Plane size={20}/>ดีล</Link>
      <Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link>
      <Link to="/account"><User size={20}/>บัญชี</Link>
    </nav>
    <TripiAssistant />
  </div>;
}
