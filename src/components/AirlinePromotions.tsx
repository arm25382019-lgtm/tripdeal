import { BadgePercent, CalendarDays, ExternalLink, Plane } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../lib/i18n';

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

const UI = {
  th:{title:'✈️ โปรสายการบินที่น่าสนใจ',sub:'รวมโปรและข้อเสนอจากหน้าเว็บไซต์ทางการของสายการบิน',loading:'กำลังเช็กโปรโมชั่นสายการบิน...',empty:'ตอนนี้ยังไม่มีโปรโมชั่นที่ยืนยันจากหน้า Official สำหรับหมวดนี้',book:'จอง',travel:'เดินทาง',view:'ดูโปรโมชั่นบนเว็บสายการบิน',note:'ราคา/สิทธิ์สุดท้ายยืนยันกับสายการบิน'},
  en:{title:'✈️ Airline promotions worth checking',sub:'Offers collected from official airline promotion pages',loading:'Checking airline promotions...',empty:'No verified official promotions for this selection right now.',book:'Book',travel:'Travel',view:'View on airline website',note:'Final fare and eligibility are confirmed by the airline'},
  ja:{title:'✈️ 注目の航空会社キャンペーン',sub:'航空会社の公式プロモーションページから紹介',loading:'キャンペーンを確認中...',empty:'現在、確認済みの公式キャンペーンはありません。',book:'予約',travel:'搭乗',view:'航空会社サイトで見る',note:'最終運賃・条件は航空会社で確認してください'},
  ko:{title:'✈️ 주목할 항공사 프로모션',sub:'항공사 공식 프로모션 페이지의 혜택을 모았습니다',loading:'항공사 프로모션 확인 중...',empty:'현재 확인된 공식 프로모션이 없습니다.',book:'예약',travel:'여행',view:'항공사 사이트에서 보기',note:'최종 운임과 조건은 항공사에서 확인됩니다'},
  zh:{title:'✈️ 值得关注的航空公司促销',sub:'整理自航空公司官方促销页面',loading:'正在查询航空公司促销...',empty:'当前没有已确认的官方促销。',book:'预订',travel:'出行',view:'前往航空公司官网查看',note:'最终价格与资格以航空公司确认为准'},
};

export default function AirlinePromotions({ country }: { country: string }) {
  const { language } = useLanguage();
  const text = UI[language] || UI.en;
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
        if (!res.ok) throw new Error(data.error || 'Promotion load failed');
        if (!active) return;
        setItems(data.promotions || []);
      })
      .catch((e) => {
        if (!active) return;
        setItems([]);
        setError(e instanceof Error ? e.message : 'Promotion load failed');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [country]);

  return <section className="airline-promotions-section">
    <div className="promo-section-head">
      <div><span>AIRLINE PROMOTIONS</span><h2>{text.title}</h2><p>{text.sub} · {country}</p></div>
      <div className="promo-official-badge"><BadgePercent size={18}/> Official sources</div>
    </div>

    {loading ? <div className="promo-empty">{text.loading}</div> : error ? <div className="promo-empty">{error}</div> : items.length === 0 ? <div className="promo-empty">{text.empty}</div> :
      <div className="airline-promo-grid">
        {items.slice(0, 6).map((promo) => <article className="airline-promo-card" key={promo.id}>
          <div className="airline-promo-top"><div className="airline-logo-pill"><Plane size={16}/>{promo.airline_code}</div><span>{promo.badge}</span></div>
          <h3>{promo.title}</h3>
          <strong>{promo.airline}</strong>
          <p>{promo.summary}</p>
          <div className="airline-promo-meta"><span><CalendarDays size={14}/> {text.book}: {promo.booking_period}</span><span><CalendarDays size={14}/> {text.travel}: {promo.travel_period}</span></div>
          <a href={promo.url} target="_blank" rel="noreferrer">{text.view} <ExternalLink size={15}/></a>
          <small>{promo.source} · {text.note}</small>
        </article>)}
      </div>}
  </section>;
}
