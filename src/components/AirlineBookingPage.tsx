import { ArrowLeft, CheckCircle2, ChevronRight, Info, Plane, ShieldCheck, Users } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';
import { airlineDisplayName, buildDirectBookingUrl, getAirline, isAirAsiaAffiliateReady } from '../lib/airlines';

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);
const dateTH = (iso?: string | null) => iso ? new Date(iso).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function AirlineBookingPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const origin = params.get('origin') || 'BKK';
  const destination = params.get('destination') || '';
  const originName = params.get('origin_name') || origin;
  const destinationName = params.get('destination_name') || destination;
  const depart = params.get('depart') || '';
  const returnDate = params.get('return') || '';
  const trip = params.get('trip') === 'oneway' ? 'oneway' : 'roundtrip';
  const adults = Math.max(1, Number(params.get('adults') || 1));
  const price = Number(params.get('price') || 0);
  const airlineCode = params.get('airline_code') || '';
  const flight = params.get('flight') || '';
  const transfers = Number(params.get('transfers') || 0);
  const returnTransfers = Number(params.get('return_transfers') || 0);
  const score = Number(params.get('score') || 0);
  const back = params.get('back') || '/';
  const airline = getAirline(airlineCode);
  const bookingUrl = buildDirectBookingUrl(airlineCode, {
    origin,
    destination,
    depart,
    returnDate,
    trip,
    adults,
  });
  const affiliateReady = isAirAsiaAffiliateReady(airlineCode);
  const totalReference = price * adults;

  if (!destination || !depart || !price) return <div className="air-book-page"><div className="air-book-empty"><strong>ข้อมูลเที่ยวบินไม่ครบ</strong><button onClick={() => navigate('/')}>กลับไปค้นหา</button></div></div>;

  const direct = transfers === 0 && (trip === 'oneway' || returnTransfers === 0);
  const primaryLabel = airline?.airAsiaGroup
    ? `เลือกเที่ยวบินกับ ${airline.name}`
    : airline?.bookingLanguage === 'th'
      ? `เปิดหน้าจองภาษาไทยของ ${airline.name}`
      : `ไปจองกับ ${airline?.name || airlineDisplayName(airlineCode)}`;

  return <div className="air-book-page">
    <header className="air-book-topbar">
      <button onClick={() => navigate(back)} aria-label="ย้อนกลับ"><ArrowLeft size={21}/></button>
      <Link to="/" className="air-book-brand"><Plane size={21} fill="currentColor"/>TripDeal</Link>
      <span>Booking Assistant</span>
    </header>

    <main className="air-book-container">
      <div className="air-book-steps"><span className="done">1 เลือกเที่ยวบิน ✓</span><span className="active">2 ตรวจสอบ</span><span>3 จองกับสายการบิน</span></div>

      <section className="air-book-hero">
        <div><span className="air-book-pill"><ShieldCheck size={14}/> จองตรงสายการบิน</span><h1>{origin} → {destination}</h1><p>{originName} → {destinationName}</p></div>
        <div className="air-book-score">⭐ {score || '—'}/100</div>
      </section>

      <section className="air-book-card">
        <div className="air-book-card-head"><Plane size={19}/><div><h2>{airlineDisplayName(airlineCode)}</h2><p>{flight ? `เที่ยวบิน ${airlineCode}${flight}` : 'หมายเลขเที่ยวบินยืนยันอีกครั้งก่อนจอง'}</p></div></div>
        <div className="air-book-route"><div><span>ขาไป</span><strong>{origin} → {destination}</strong><small>{dateTH(depart)}</small></div><b>{transfers === 0 ? 'บินตรง' : `ต่อ ${transfers} ครั้ง`}</b></div>
        {trip === 'roundtrip' && <div className="air-book-route"><div><span>ขากลับ</span><strong>{destination} → {origin}</strong><small>{dateTH(returnDate)}</small></div><b>{returnTransfers === 0 ? 'บินตรง' : `ต่อ ${returnTransfers} ครั้ง`}</b></div>}
        <div className="air-book-info"><span>รูปแบบ</span><strong>{trip === 'roundtrip' ? 'ไป–กลับ' : 'เที่ยวเดียว'} · {direct ? 'บินตรง' : 'มีต่อเครื่อง'}</strong></div>
        <div className="air-book-info"><span><Users size={15}/> ผู้โดยสาร</span><strong>{adults} คน</strong></div>
      </section>

      <section className="air-book-card price-card">
        <div className="air-book-card-head"><Info size={19}/><div><h2>สรุปราคาอ้างอิง</h2><p>ราคาจริงจะยืนยันอีกครั้งบนเว็บไซต์สายการบิน</p></div></div>
        <div className="air-book-info"><span>ต่อคน</span><strong>฿{money(price)}</strong></div>
        <div className="air-book-info total"><span>รวม {adults} คน</span><strong>฿{money(totalReference)}</strong></div>
      </section>

      <section className="air-book-card trust-card">
        <div className="air-book-card-head"><ShieldCheck size={20}/><div><h2>TripDeal ไม่รับเงินจากคุณ</h2><p>ขั้นตอนสุดท้ายจะเกิดกับเว็บไซต์ทางการของสายการบิน</p></div></div>
        <div className="air-book-check"><CheckCircle2 size={17}/> สายการบินเป็นผู้รับชำระเงิน</div>
        <div className="air-book-check"><CheckCircle2 size={17}/> สายการบินเป็นผู้ออกตั๋วและ Booking Confirmation</div>
        <div className="air-book-check"><CheckCircle2 size={17}/> การเปลี่ยนเที่ยวบิน ยกเลิก และคืนเงินเป็นไปตามเงื่อนไขของสายการบิน</div>
        <div className="air-book-check"><CheckCircle2 size={17}/> TripDeal ไม่เก็บข้อมูลบัตรเครดิตในขั้นตอนนี้</div>
      </section>

      <section className="air-book-card">
        <div className="air-book-card-head"><Info size={19}/><div><h2>ตรวจสอบก่อนกดจอง</h2><p>รายการเหล่านี้อาจต่างจากราคาอ้างอิง</p></div></div>
        <div className="air-book-checklist"><span>• เวลาเที่ยวบินและ Terminal</span><span>• สัมภาระถือขึ้นเครื่อง / โหลดใต้ท้อง</span><span>• ค่าเลือกที่นั่งและบริการเสริม</span><span>• Fare Rules การเปลี่ยนวัน ยกเลิก และคืนเงิน</span><span>• ราคาสุดท้ายรวมภาษีและค่าธรรมเนียม</span></div>
      </section>

      <div className="air-book-actions">
        {bookingUrl ? <button className="air-book-primary" onClick={() => window.open(bookingUrl, '_blank', 'noopener,noreferrer')}>{primaryLabel} <ChevronRight size={18}/></button> : <button className="air-book-primary" disabled>ยังไม่รองรับลิงก์จองตรงสายการบินนี้</button>}
        {airline?.airAsiaGroup && <p className="airasia-note">ระบบจะส่งเส้นทาง วันที่ และจำนวนผู้โดยสารไปยังหน้าเลือกเที่ยวบินของ AirAsia โดยอัตโนมัติ {affiliateReady ? '· Affiliate Tracking พร้อมใช้งาน' : '· Affiliate Tracking จะเปิดหลัง Partnerize อนุมัติ'}</p>}
        {!airline?.airAsiaGroup && airline?.bookingFlow === 'booking_page' && <p className="airasia-note">สายการบินนี้ยังไม่มี Deep Link ที่ TripDeal ยืนยันได้ว่าส่งวันเดินทางและผู้โดยสารเข้าไปอัตโนมัติ จึงเปิดหน้า Booking {airline.bookingLanguage === 'th' ? 'ภาษาไทย' : 'ภาษาอังกฤษ'} ของสายการบินโดยตรงให้แทน</p>}
        <button className="air-book-secondary" onClick={() => navigate(back)}>กลับไปดูดีลอื่น</button>
        <small>เมื่อกดปุ่มจอง คุณจะออกจาก TripDeal ไปยังเว็บไซต์ทางการของสายการบิน โดย TripDeal จะส่งรายละเอียดเส้นทางให้เมื่อสายการบินรองรับ Deep Link ที่ยืนยันแล้ว</small>
      </div>
    </main>
    <TripiAssistant/>
  </div>;
}
