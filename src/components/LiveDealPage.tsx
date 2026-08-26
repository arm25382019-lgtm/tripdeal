import { ArrowLeft, Bell, CheckCircle2, ChevronRight, Home, Info, Plane, Search, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

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
  const aviasalesUrl = params.get('url') || '';
  const backQuery = params.get('back') || `/results?city=${encodeURIComponent(city)}`;

  if (!departure || !returnAt || !price) {
    return <div className="live-deal-shell">
      <header className="live-deal-topbar"><button onClick={() => navigate(-1)}><ArrowLeft size={22}/></button><strong>รายละเอียดดีล</strong></header>
      <main className="live-deal-container"><div className="live-deal-empty"><strong>ไม่พบข้อมูลดีลนี้</strong><button onClick={() => navigate('/find-deal')}>ค้นหาใหม่</button></div></main>
    </div>;
  }

  const direct = transfers === 0 && returnTransfers === 0;

  return <div className="live-deal-shell">
    <header className="live-deal-topbar">
      <button onClick={() => navigate(backQuery)} aria-label="ย้อนกลับ"><ArrowLeft size={22}/></button>
      <Link to="/" className="live-deal-brand"><Plane size={21} fill="currentColor"/>TripDeal</Link>
      <span className="live-deal-source">Aviasales</span>
    </header>

    <main className="live-deal-container">
      <section className="live-deal-hero">
        <span className="live-deal-pill">ราคาที่พบล่าสุด</span>
        <h1>{origin} → {city}</h1>
        <p>{formatDate(departure)} – {formatDate(returnAt)} · ไป–กลับ</p>
        <div className="live-deal-price"><strong>฿{money(price)}</strong><span>/ คน</span></div>
        <small>ราคานี้มาจาก Aviasales Data API และอาจเปลี่ยนเมื่อเช็กราคาปัจจุบัน</small>
      </section>

      <section className="live-deal-card">
        <div className="live-deal-card-head"><Plane size={19}/><div><h2>สรุปเที่ยวบิน</h2><p>ดูรายละเอียดก่อนออกไปเช็กราคากับพาร์ทเนอร์</p></div></div>
        <div className="live-deal-route-row"><div><span>ขาไป</span><strong>{origin} → {destination}</strong><small>{formatDate(departure)}</small></div><span className="live-deal-transfer">{transfers === 0 ? 'บินตรง' : `ต่อเครื่อง ${transfers} ครั้ง`}</span></div>
        <div className="live-deal-route-row"><div><span>ขากลับ</span><strong>{destination} → {origin}</strong><small>{formatDate(returnAt)}</small></div><span className="live-deal-transfer">{returnTransfers === 0 ? 'บินตรง' : `ต่อเครื่อง ${returnTransfers} ครั้ง`}</span></div>
        <div className="live-deal-info-row"><span>สายการบิน</span><strong>{airline || 'ยืนยันตอนเช็กราคาล่าสุด'}{flightNumber ? ` · ${flightNumber}` : ''}</strong></div>
        <div className="live-deal-info-row"><span>รูปแบบเที่ยวบิน</span><strong>{direct ? 'บินตรงทั้งไป–กลับ' : 'มีเที่ยวบินต่อเครื่อง'}</strong></div>
      </section>

      <section className="live-deal-card tripi-advice">
        <div className="live-deal-card-head"><span className="tripi-mini">🤖</span><div><h2>Tripi สรุปให้</h2><p>{direct ? 'ดีลนี้เด่นเรื่องเดินทางง่าย เพราะบินตรงทั้งไปและกลับ' : 'ดีลนี้อาจคุ้มด้านราคา แต่มีต่อเครื่อง ควรเทียบเวลาเดินทางก่อนตัดสินใจ'}</p></div></div>
        <div className="tripi-check"><CheckCircle2 size={17}/> ราคาไป–กลับที่พบล่าสุด ฿{money(price)} ต่อคน</div>
        <div className="tripi-check"><CheckCircle2 size={17}/> ยังอยู่ใน TripDeal จนกว่าคุณจะพร้อมเช็กราคาจริง</div>
      </section>

      <section className="live-deal-card">
        <div className="live-deal-card-head"><Info size={19}/><div><h2>สิ่งที่ต้องยืนยันก่อนจอง</h2><p>ข้อมูลเหล่านี้อาจเปลี่ยนตามที่นั่งและ Fare ของสายการบิน</p></div></div>
        <div className="live-deal-checklist"><span>• ราคาปัจจุบันและที่นั่งว่าง</span><span>• เวลาเที่ยวบิน / Terminal</span><span>• สัมภาระถือขึ้นเครื่องและโหลดใต้ท้อง</span><span>• เงื่อนไขเปลี่ยนวัน / ยกเลิก / คืนเงิน</span></div>
      </section>

      <div className="live-deal-actions">
        {aviasalesUrl ? <button className="live-deal-primary" onClick={() => window.open(aviasalesUrl, '_blank', 'noopener,noreferrer')}>เช็กราคาล่าสุดกับ Aviasales <ChevronRight size={18}/></button> : <button className="live-deal-primary" disabled>ยังไม่มีลิงก์เช็กราคา</button>}
        <button className="live-deal-secondary" onClick={() => navigate(backQuery)}><Search size={17}/> ดูดีลอื่นใน TripDeal</button>
        <p>จะออกจาก TripDeal เฉพาะเมื่อกดปุ่มสีน้ำเงินด้านบนเท่านั้น</p>
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
