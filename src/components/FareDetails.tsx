import { CheckCircle2, Info, Luggage, RefreshCcw, ShieldCheck, Sparkles } from 'lucide-react';

type FareDetailsProps = {
  price: number;
  baggageKg: number | null;
  airline: string;
  dealLabel?: string | null;
  isDemo?: boolean;
};

const money = (n: number) => new Intl.NumberFormat('th-TH').format(n);

export default function FareDetails({ price, baggageKg, airline, dealLabel, isDemo = false }: FareDetailsProps) {
  const checkedBag = baggageKg && baggageKg > 0 ? `${baggageKg} กก.` : 'ตรวจสอบก่อนจอง';

  return <section className="fare-section">
    <div className="fare-section-title">
      <div><span className="fare-kicker">FARE DETAILS</span><h2>ค่าโดยสารและเงื่อนไข</h2><p>สรุปสิ่งที่รวมในดีลก่อนส่งต่อไปจองจริง</p></div>
      <span className="fare-status">{dealLabel || 'ดีลที่เลือก'}</span>
    </div>

    <div className="fare-option-card selected">
      <div className="fare-option-head">
        <div><span>ค่าโดยสารที่เลือก</span><strong>฿{money(price)}</strong><small>ไป–กลับ / คน</small></div>
        <span className="selected-pill"><CheckCircle2 size={16}/> เลือกแล้ว</span>
      </div>
      <div className="fare-includes">
        <div><Luggage size={18}/><span>โหลดใต้ท้อง</span><strong>{checkedBag}</strong></div>
        <div><RefreshCcw size={18}/><span>เปลี่ยนเที่ยวบิน</span><strong>ตรวจสอบ Fare Rules</strong></div>
        <div><ShieldCheck size={18}/><span>คืนเงิน</span><strong>ตรวจสอบ Fare Rules</strong></div>
      </div>
      <p className="fare-note">แพ็กเกจค่าโดยสารอื่น เช่น Basic / Baggage / Flexible จะแสดงเพิ่มเมื่อ Flight API ส่ง fare family และราคาแต่ละแพ็กเกจมาให้</p>
    </div>

    <div className="fare-grid">
      <section className="fare-info-card">
        <div className="fare-card-head"><Luggage size={20}/><div><h3>สัมภาระ</h3><p>ขาไปและขากลับ</p></div></div>
        <div className="fare-row"><span>🎒 ถือขึ้นเครื่อง</span><strong>ตรวจสอบตามเงื่อนไข {airline}</strong></div>
        <div className="fare-row"><span>🧳 โหลดใต้ท้อง</span><strong>{checkedBag}</strong></div>
        <div className="fare-row muted"><span>ขนาดกระเป๋า</span><strong>จะแสดงเมื่อมีข้อมูลจาก Flight API</strong></div>
      </section>

      <section className="fare-info-card">
        <div className="fare-card-head"><ShieldCheck size={20}/><div><h3>นโยบายตั๋ว</h3><p>เปลี่ยน / ยกเลิก / No-show</p></div></div>
        <div className="fare-row"><span>คืนเงิน</span><strong>ตรวจสอบก่อนจอง</strong></div>
        <div className="fare-row"><span>เปลี่ยนวันหรือเวลา</span><strong>ตรวจสอบค่าธรรมเนียม</strong></div>
        <div className="fare-row"><span>ไม่ได้เดินทาง (No-show)</span><strong>ขึ้นอยู่กับกฎค่าโดยสาร</strong></div>
        <details className="fare-details-more"><summary>ดูวิธีที่ TripDeal จะแสดงเงื่อนไข</summary><p>เมื่อเชื่อม Flight API แล้ว TripDeal จะดึง Fare Rules ของเที่ยวบินนั้นมาแสดงเป็นภาษาสั้น ๆ เช่น “คืนเงินไม่ได้”, “เปลี่ยนได้ มีค่าธรรมเนียม” พร้อมลิงก์ดูรายละเอียดฉบับเต็มก่อนจอง</p></details>
      </section>
    </div>

    <section className="price-summary-card">
      <div className="fare-card-head"><Info size={20}/><div><h3>สรุปราคา</h3><p>ต่อผู้โดยสาร 1 คน · ไป–กลับ</p></div></div>
      <div className="price-summary-row"><span>ค่าโดยสารไป–กลับ</span><strong>รวมในยอดด้านล่าง</strong></div>
      <div className="price-summary-row"><span>ภาษีและค่าธรรมเนียม</span><strong>ตรวจสอบก่อนจอง</strong></div>
      <div className="price-summary-row"><span>บริการเสริม</span><strong>ยังไม่เลือก</strong></div>
      <div className="price-summary-total"><div><span>ยอดที่แสดงตอนนี้</span><small>{isDemo ? 'ข้อมูลดีลตัวอย่าง · จะตรวจสอบราคาสดอีกครั้ง' : 'ตรวจสอบราคาล่าสุดก่อนชำระเงิน'}</small></div><strong>฿{money(price)}</strong></div>
    </section>

    <div className="tripi-fare-hint"><Sparkles size={18}/><div><strong>Tripi จะช่วยอธิบายเงื่อนไขให้เข้าใจง่ายได้</strong><span>หลังเชื่อม Fare Rules จริง เราจะให้ Tripi สรุปความต่างของแพ็กเกจและข้อจำกัดก่อนจอง</span></div></div>
  </section>;
}
