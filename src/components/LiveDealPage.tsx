import { ArrowLeft, Bell, CheckCircle2, ChevronRight, CreditCard, Home, Info, Plane, Search, ShieldCheck, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';
import { airlineDisplayName, buildDirectBookingUrl, getAirline } from '../lib/airlines';

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
  const airlineCode = params.get('airline_code') || params.get('airline') || '';
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
  const airline = getAirline(airlineCode);
  const airlineName = airlineDisplayName(airlineCode);
  const bookingUrl = buildDirectBookingUrl(airlineCode);

  const goToAirline = () => {
    if (!bookingUrl) return;
    window.open(bookingUrl, '_blank', 'noopener,noreferrer');
  };

  return <div className="live-deal-shell">
    <header className="live-deal-topbar">
      <button onClick={() => navigate(backQuery)} aria-label="ย้อนกลับ"><ArrowLeft size={22}/></button>
      <Link to="/" className="live-deal-brand"><Plane size={21} fill="currentColor"/>TripDeal</Link>
      <span className="live-deal-source">Airline Direct</span>
    </header>

    <main className="live-deal-container">
      <div className="booking-steps" aria-label="ขั้นตอนการจอง">
        <div className="booking-step done"><span>1</span><small>เลือกเที่ยวบิน</small></div>
        <i/>
        <div className="booking-step active"><span>2</span><small>ตรวจสอบ</small></div>
        <i/>
        <div className="booking-step"><span>3</span><small>จองกับสายการบิน</small></div>
      </div>

      <section className="live-deal-hero">
        <span className="live-deal-pill">TripDeal Booking Assistant</span>
        <h1>{origin} → {city}</h1>
        <p>{formatDate(departure)} – {formatDate(returnAt)} · ไป–กลับ</p>
        <div className="live-deal-price"><strong>฿{money(price)}</strong><span>/ คน</span></div>
        <small>ราคาอ้างอิงสำหรับเปรียบเทียบ ระบบจะให้คุณยืนยันราคาปัจจุบันอีกครั้งบนเว็บไซต์ทางการของ {airlineName} ก่อนชำระเงิน</small>
      </section>

      <section className="live-deal-card airline-direct-card">
        <div className="live-deal-card-head"><ShieldCheck size={20}/><div><h2>จองตรงกับ {airlineName}</h2><p>TripDeal ช่วยเลือกและสรุปดีล ส่วนการออกตั๋วและรับชำระเงินทำโดยสายการบินโดยตรง</p></div></div>
        <div className="direct-trust-grid">
          <div><CheckCircle2 size={18}/><span><strong>สายการบินรับเงิน</strong><small>TripDeal ไม่แตะข้อมูลบัตรหรือเงินของคุณ</small></span></div>
          <div><CheckCircle2 size={18}/><span><strong>สายการบินออกตั๋ว</strong><small>Booking confirmation มาจากสายการบิน</small></span></div>
          <div><CheckCircle2 size={18}/><span><strong>เปลี่ยน/ยกเลิกกับสายการบิน</strong><small>เป็นไปตาม Fare Rules ของเที่ยวบินที่ซื้อจริง</small></span></div>
        </div>
      </section>

      <section className="live-deal-card">
        <div className="live-deal-card-head"><Plane size={19}/><div><h2>สรุปเที่ยวบิน</h2><p>ตรวจสอบเส้นทางก่อนส่งต่อไปเว็บไซต์สายการบิน</p></div></div>
        <div className="live-deal-route-row"><div><span>ขาไป</span><strong>{origin} → {destination}</strong><small>{formatDate(departure)}</small></div><span className="live-deal-transfer">{transfers === 0 ? 'บินตรง' : `ต่อเครื่อง ${transfers} ครั้ง`}</span></div>
        <div className="live-deal-route-row"><div><span>ขากลับ</span><strong>{destination} → {origin}</strong><small>{formatDate(returnAt)}</small></div><span className="live-deal-transfer">{returnTransfers === 0 ? 'บินตรง' : `ต่อเครื่อง ${returnTransfers} ครั้ง`}</span></div>
        <div className="live-deal-info-row"><span>สายการบิน</span><strong>{airlineName}{flightNumber ? ` · ${flightNumber}` : ''}</strong></div>
        <div className="live-deal-info-row"><span>รูปแบบเที่ยวบิน</span><strong>{direct ? 'บินตรงทั้งไป–กลับ' : 'มีเที่ยวบินต่อเครื่อง'}</strong></div>
      </section>

      <section className="live-deal-card tripi-advice">
        <div className="live-deal-card-head"><span className="tripi-mini">🤖</span><div><h2>Tripi สรุปให้</h2><p>{direct ? 'ดีลนี้เดินทางง่าย เพราะบินตรงทั้งขาไปและขากลับ' : 'ดีลนี้อาจได้ราคาดี แต่มีต่อเครื่อง ควรเช็กเวลาเดินทางรวมก่อนชำระเงิน'}</p></div></div>
        <div className="tripi-check"><CheckCircle2 size={17}/> ราคาอ้างอิงไป–กลับ ฿{money(price)} ต่อคน</div>
        <div className="tripi-check"><CheckCircle2 size={17}/> คุณยังอยู่ใน TripDeal จนกว่าจะกดไปเว็บไซต์สายการบิน</div>
      </section>

      <section className="live-deal-card">
        <div className="live-deal-card-head"><Info size={19}/><div><h2>ขั้นตอนสุดท้ายบนเว็บสายการบิน</h2><p>เพื่อความปลอดภัย TripDeal จะไม่เก็บข้อมูลบัตรหรือข้อมูลหนังสือเดินทางในขั้นตอนนี้</p></div></div>
        <div className="live-deal-checklist"><span>1. ยืนยันเที่ยวบินและราคาปัจจุบัน</span><span>2. กรอกข้อมูลผู้โดยสารตามที่สายการบินกำหนด</span><span>3. เลือกกระเป๋า / ที่นั่ง / บริการเสริม</span><span>4. ชำระเงินกับสายการบินโดยตรง</span></div>
      </section>

      <section className="payment-handoff">
        <div className="payment-handoff-head"><CreditCard size={21}/><div><strong>พร้อมจองแล้ว</strong><span>ขั้นตอนถัดไปจะเปิดเว็บไซต์ทางการของ {airlineName}</span></div></div>
        {bookingUrl ? <button className="live-deal-primary" onClick={goToAirline}>ไปจองและชำระกับ {airlineName} <ChevronRight size={18}/></button> : <button className="live-deal-primary" disabled>ยังไม่รองรับลิงก์จองตรงของสายการบินนี้</button>}
        {!airline && <p className="airline-unmapped">TripDeal ยังไม่มีเว็บไซต์ทางการของรหัสสายการบิน {airlineCode || 'นี้'} ใน Directory</p>}
        <button className="live-deal-secondary" onClick={() => navigate(backQuery)}><Search size={17}/> กลับไปเทียบดีลอื่น</button>
        <p>TripDeal ไม่รับชำระเงิน ไม่ออกตั๋ว และไม่เป็นผู้ดำเนินการคืนเงิน</p>
      </section>
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
