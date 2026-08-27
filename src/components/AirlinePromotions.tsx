import { BadgePercent, CalendarDays, ExternalLink, Plane } from 'lucide-react';
import { useEffect, useState } from 'react';

type Promotion = {
  id: string;
  airline_code: string;
  airline: string;
  badge: string;
  title: string;
  summary: string;
  booking_period: string;
  travel_period: string;
  url: string;
  source: string;
};

type PromotionResponse = {
  promotions?: Promotion[];
  verified_at?: string;
  error?: string;
};

export default function AirlinePromotions({ country }: { country: string }) {
  const [items, setItems] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    fetch(`/api/airline-promotions?country=${encodeURIComponent(country)}`)
      .then(async (res) => {
        const data = await res.json() as PromotionResponse;
        if (!res.ok) throw new Error(data.error || 'โหลดโปรโมชั่นไม่สำเร็จ');
        if (!active) return;
        setItems(data.promotions || []);
      })
      .catch((e) => {
        if (!active) return;
        setItems([]);
        setError(e instanceof Error ? e.message : 'โหลดโปรโมชั่นไม่สำเร็จ');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [country]);

  return <section className="airline-promotions-section">
    <div className="promo-section-head">
      <div><span>AIRLINE PROMOTIONS</span><h2>✈️ โปรสายการบินที่น่าสนใจ</h2><p>รวมโปรและข้อเสนอจากหน้าเว็บไซต์ทางการของสายการบินที่เกี่ยวกับ{country}</p></div>
      <div className="promo-official-badge"><BadgePercent size={18}/> Official sources</div>
    </div>

    {loading ? <div className="promo-empty">กำลังเช็กโปรโมชั่นสายการบิน...</div> : error ? <div className="promo-empty">{error}</div> : items.length === 0 ? <div className="promo-empty">ตอนนี้ยังไม่มีโปรโมชั่นที่ยืนยันจากหน้า Official สำหรับหมวดนี้</div> :
      <div className="airline-promo-grid">
        {items.slice(0, 6).map((promo) => <article className="airline-promo-card" key={promo.id}>
          <div className="airline-promo-top"><div className="airline-logo-pill"><Plane size={16}/>{promo.airline_code}</div><span>{promo.badge}</span></div>
          <h3>{promo.title}</h3>
          <strong>{promo.airline}</strong>
          <p>{promo.summary}</p>
          <div className="airline-promo-meta"><span><CalendarDays size={14}/> จอง: {promo.booking_period}</span><span><CalendarDays size={14}/> เดินทาง: {promo.travel_period}</span></div>
          <a href={promo.url} target="_blank" rel="noreferrer">ดูโปรโมชั่นบนเว็บสายการบิน <ExternalLink size={15}/></a>
          <small>{promo.source} · ราคา/สิทธิ์สุดท้ายยืนยันกับสายการบิน</small>
        </article>)}
      </div>}
  </section>;
}
