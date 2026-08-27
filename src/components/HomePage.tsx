import { ChevronRight, Compass, Plane } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FlightSearchEngine from './FlightSearchEngine';
import TripiAssistant from './TripiAssistant';
import AirlinePromotions from './AirlinePromotions';
import { SiteBottomNav, SiteHeader } from './SiteChrome';
import { useLanguage } from '../lib/i18n';
import { COUNTRY_ARTICLE_SLUG, type TravelCountry } from '../lib/travelContent';

type CountryOption = { key: TravelCountry; label: string; flag: string };
type FeaturedDeal = { city:string; country:string; flag:string; destination_code:string; origin_airport:string; destination_airport:string; departure_at:string; return_at:string; price:number; currency:string; airline:string; flight_number:string; transfers:number; return_transfers:number; deal_score:number; source:string };
type FeaturedResponse = { configured:boolean; country:string; deals?:FeaturedDeal[]; error?:string };
type TravelGuide = { icon:string; title:string; summary:string; tag:string; anchor:string };

const COUNTRY_OPTIONS: CountryOption[] = [
  { key:'ไทย', label:'ไทย', flag:'🇹🇭' }, { key:'ญี่ปุ่น', label:'ญี่ปุ่น', flag:'🇯🇵' }, { key:'เกาหลี', label:'เกาหลี', flag:'🇰🇷' }, { key:'ไต้หวัน', label:'ไต้หวัน', flag:'🇹🇼' }, { key:'จีน', label:'จีน', flag:'🇨🇳' },
];

const COUNTRY_LABELS: Record<string, Record<TravelCountry,string>> = {
  th:{ไทย:'ไทย',ญี่ปุ่น:'ญี่ปุ่น',เกาหลี:'เกาหลี',ไต้หวัน:'ไต้หวัน',จีน:'จีน'},
  en:{ไทย:'Thailand',ญี่ปุ่น:'Japan',เกาหลี:'Korea',ไต้หวัน:'Taiwan',จีน:'China'},
  ja:{ไทย:'タイ',ญี่ปุ่น:'日本',เกาหลี:'韓国',ไต้หวัน:'台湾',จีน:'中国'},
  ko:{ไทย:'태국',ญี่ปุ่น:'일본',เกาหลี:'한국',ไต้หวัน:'대만',จีน:'중국'},
  zh:{ไทย:'泰国',ญี่ปุ่น:'日本',เกาหลี:'韩国',ไต้หวัน:'台湾',จีน:'中国'},
};

const TRAVEL_GUIDES: Record<TravelCountry, TravelGuide[]> = {
  ไทย: [
    { icon:'🗺️', title:'เมืองน่าเที่ยวในไทย', summary:'เชียงใหม่ เชียงราย ภูเก็ต กระบี่ และสมุย เหมาะกับทั้งทริปสั้นและวันหยุดยาว เลือกเมืองให้เข้ากับฤดูกาลและสไตล์เที่ยวของคุณ', tag:'สถานที่แนะนำ', anchor:'checkin' },
    { icon:'🍜', title:'กินอะไร + แพลนยังไงให้ไม่เหนื่อย', summary:'จัดร้านอาหาร คาเฟ่ และจุดเที่ยวให้อยู่โซนเดียวกัน จะมีเวลากินจริงและไม่เสียเวลาเดินทางข้ามเมือง', tag:'แพลน + ร้านอาหาร', anchor:'food' },
    { icon:'🎒', title:'ทิปเที่ยวในประเทศ', summary:'เปรียบเทียบทั้ง BKK, DMK, CNX และ HKT รวมถึงเช็กสัมภาระและค่าเลือกที่นั่งก่อนชำระเงิน', tag:'ก่อนเดินทาง', anchor:'tips' },
  ],
  ญี่ปุ่น: [
    { icon:'🗼', title:'Tokyo, Osaka หรือ Sapporo?', summary:'โตเกียวเหมาะกับเที่ยวครั้งแรก โอซาก้าเหมาะกับสายกินและเที่ยวคันไซ ส่วนซัปโปโรเด่นเรื่องธรรมชาติ หิมะ และอากาศเย็น', tag:'สถานที่แนะนำ', anchor:'checkin' },
    { icon:'🍣', title:'แพลนกิน เที่ยว ช้อปแบบไม่ย้อนทาง', summary:'แบ่ง Tokyo เป็นโซน Asakusa/Ueno, Shibuya/Harajuku และ Ginza/Tokyo Station ช่วยลดเวลาเปลี่ยนรถไฟ', tag:'แพลน + ร้านอาหาร', anchor:'food' },
    { icon:'🚆', title:'วางแผนเมืองและสนามบิน', summary:'โตเกียวมีทั้ง NRT และ HND การเลือกสนามบินให้เหมาะกับที่พักช่วยลดทั้งเวลาและค่าเดินทางเข้าเมือง', tag:'ก่อนเดินทาง', anchor:'tips' },
  ],
  เกาหลี: [
    { icon:'🏙️', title:'Seoul, Busan และ Jeju', summary:'โซลเหมาะกับช้อปปิ้งและคาเฟ่ ปูซานเด่นทะเลและอาหาร ส่วนเชจูเหมาะกับธรรมชาติและการขับรถเที่ยว', tag:'สถานที่แนะนำ', anchor:'checkin' },
    { icon:'🥩', title:'สายกิน + คาเฟ่ เที่ยวโซนไหนดี', summary:'Seongsu, Hongdae, Myeongdong และตลาดอาหารให้บรรยากาศต่างกัน จัดวันตามโซนจะสนุกกว่าไล่ร้านไวรัล', tag:'แพลน + ร้านอาหาร', anchor:'food' },
    { icon:'📱', title:'เตรียมตัวก่อนเที่ยวเกาหลี', summary:'เช็กข้อกำหนดเข้าประเทศล่าสุด อินเทอร์เน็ต การเดินทางจากสนามบิน และบัตรโดยสารสาธารณะล่วงหน้า', tag:'ก่อนเดินทาง', anchor:'tips' },
  ],
  ไต้หวัน: [
    { icon:'🏮', title:'Taipei และเมืองรอบ ๆ', summary:'ไทเปเหมาะกับทริป 3–5 วัน และต่อไปจิ่วเฟิ่น เป่ยโถว หรือเมืองใกล้เคียงได้ง่าย', tag:'สถานที่แนะนำ', anchor:'checkin' },
    { icon:'🥟', title:'ตลาดกลางคืน + ร้านเด็ด จัดยังไงดี', summary:'Ximending, Raohe, Dongmen และ Ningxia มีของกินต่างสไตล์ เลือกตลาดหนึ่งแห่งต่อคืนจะเที่ยวสบายกว่า', tag:'แพลน + ร้านอาหาร', anchor:'food' },
    { icon:'🚇', title:'เที่ยวเองง่ายด้วยขนส่งสาธารณะ', summary:'MRT และรถไฟเชื่อมเมืองหลักได้ดี เลือกที่พักใกล้สถานีช่วยประหยัดเวลา และควรเผื่อเวลาไปสนามบินวันกลับ', tag:'ก่อนเดินทาง', anchor:'tips' },
  ],
  จีน: [
    { icon:'🏯', title:'เมืองจีนที่น่าเริ่มต้น', summary:'เซี่ยงไฮ้เหมาะกับมือใหม่ ปักกิ่งเด่นประวัติศาสตร์ กวางโจวและเซินเจิ้นเหมาะกับธุรกิจและช้อปปิ้ง', tag:'สถานที่แนะนำ', anchor:'checkin' },
    { icon:'🥟', title:'กินเที่ยวเซี่ยงไฮ้แบบ 4 วัน', summary:'The Bund, Yu Garden, Nanjing Road และ Xintiandi จัดเป็นโซนได้ พร้อมแทรกเสี่ยวหลงเปาและเซิงเจียนเปาระหว่างวัน', tag:'แพลน + ร้านอาหาร', anchor:'food' },
    { icon:'💳', title:'เตรียมแอปและการชำระเงิน', summary:'ก่อนเดินทางควรเช็กข้อกำหนดล่าสุด รวมถึงแผนที่ อินเทอร์เน็ต และช่องทางชำระเงินที่ใช้ได้ในพื้นที่', tag:'ก่อนเดินทาง', anchor:'tips' },
  ],
};

const money = (n:number) => new Intl.NumberFormat('th-TH').format(n);
const cityIcon = (city:string) => ({Tokyo:'🗼',Osaka:'🏯',Fukuoka:'🌊',Sapporo:'❄️',Seoul:'🏙️',Busan:'🌉',Jeju:'🌋',Taipei:'🏮',Kaohsiung:'🌅',Shanghai:'🌆',Beijing:'🏯',Guangzhou:'🌃',Shenzhen:'🏙️',Kunming:'🌸','Chiang Mai':'⛰️',Phuket:'🏝️',Krabi:'🌴','Hat Yai':'🌇','Chiang Rai':'🛕','Koh Samui':'🏖️'} as Record<string,string>)[city] || '✈️';

export default function HomePage(){
  const { language, t } = useLanguage();
  const [selectedCountry,setSelectedCountry]=useState<TravelCountry>('ญี่ปุ่น');
  const [featuredDeals,setFeaturedDeals]=useState<FeaturedDeal[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const navigate=useNavigate();
  const locale = language === 'th' ? 'th-TH' : language === 'ja' ? 'ja-JP' : language === 'ko' ? 'ko-KR' : language === 'zh' ? 'zh-CN' : 'en-US';
  const dateLabel=(iso:string)=>new Date(iso).toLocaleDateString(locale,{day:'numeric',month:'short'});

  useEffect(()=>{ let active=true; setLoading(true); setError(''); fetch(`/api/featured-deals?country=${encodeURIComponent(selectedCountry)}`).then(async(res)=>{const data=await res.json() as FeaturedResponse;if(!res.ok)throw new Error(data.error||'โหลดดีลไม่สำเร็จ');if(!active)return;setFeaturedDeals(data.deals||[]);if(!data.configured)setError('ระบบราคายังไม่พร้อมใช้งาน')}).catch(e=>{if(!active)return;setFeaturedDeals([]);setError(e instanceof Error?e.message:'โหลดดีลไม่สำเร็จ')}).finally(()=>active&&setLoading(false));return()=>{active=false}},[selectedCountry]);

  const countryMeta=COUNTRY_OPTIONS.find(x=>x.key===selectedCountry)!;
  const countryName=COUNTRY_LABELS[language]?.[selectedCountry] || selectedCountry;
  const articleSlug=COUNTRY_ARTICLE_SLUG[selectedCountry];
  const openFeatured=(d:FeaturedDeal)=>{const q=new URLSearchParams({origin:d.origin_airport||'BKK',destination:d.destination_airport||d.destination_code,origin_name:d.origin_airport||'กรุงเทพ',destination_name:d.city,trip:'roundtrip',depart:d.departure_at,return:d.return_at,adults:'1',price:String(d.price),airline_code:d.airline||'',flight:d.flight_number||'',transfers:String(d.transfers||0),return_transfers:String(d.return_transfers||0),score:String(d.deal_score||0),back:'/'});navigate(`/book?${q.toString()}`)};

  return <div className="app-shell">
    <SiteHeader/>
    <main>
      <section className="hero"><div className="hero-art">✈️</div><div className="container hero-inner"><span className="eyebrow">{t('home.eyebrow')}</span><h1>{t('home.title')}</h1><p>{t('home.subtitle')}</p><FlightSearchEngine/><Link className="home-explore-link" to="/explore"><Compass size={17}/>{t('home.exploreCta')}<ChevronRight size={17}/></Link></div></section>
      <section className="container section home-deals" id="featured-deals">
        <div className="section-title"><h2>🔥 {t('home.deals')} · {countryMeta.flag} {countryName}</h2><Link to="/find-deal">{t('home.searchSelf')}</Link></div>
        <p className="deal-subtitle">{t('home.dealNote')}</p>
        <div className="country-grid deals-country-grid">{COUNTRY_OPTIONS.map(c=><button key={c.key} className={selectedCountry===c.key?'country active':'country'} onClick={()=>setSelectedCountry(c.key)}>{c.flag} {COUNTRY_LABELS[language]?.[c.key] || c.label}</button>)}</div>
        {loading?<div className="empty-state">{t('common.loading')}</div>:error?<div className="empty-state"><strong>{error}</strong></div>:featuredDeals.length===0?<div className="empty-state"><strong>No deals found right now</strong><span>{t('home.searchSelf')}</span></div>:<div className="deal-grid">{featuredDeals.slice(0,4).map((d,i)=><button key={`${d.city}-${d.departure_at}-${i}`} className="deal-card compact" onClick={()=>openFeatured(d)}><div className="city-visual"><span>{cityIcon(d.city)}</span></div><div className="deal-body"><div className="deal-title-row"><div><h3>{d.city} {countryMeta.flag}</h3><p>{dateLabel(d.departure_at)} – {dateLabel(d.return_at)}</p></div><ChevronRight size={18}/></div><div className="deal-bottom"><div className="deal-price"><strong>฿{money(Number(d.price))}</strong><small>reference / person</small></div><span className="good">⭐ {d.deal_score}/100</span></div><small style={{color:'#64748b'}}>{d.airline?`${d.airline}`:'Airline'} · {d.transfers===0&&d.return_transfers===0?'Direct':'Connections'}</small></div></button>)}</div>}

        <section className="travel-guide-section">
          <div className="travel-guide-head"><div><span>TRIPDEAL GUIDE</span><h2>{countryMeta.flag} {countryName} · {t('explore.plan')} + {t('explore.food')} + {t('explore.checkin')}</h2><p>{t('explore.trendingSub')}</p></div><div className="travel-guide-flag">{countryMeta.flag}</div></div>
          <div className="travel-guide-grid">{TRAVEL_GUIDES[selectedCountry].map(g=><Link className="travel-guide-card" to={`/blog/${articleSlug}#${g.anchor}`} key={g.title}><div className="travel-guide-icon">{g.icon}</div><span>{g.tag}</span><h3>{g.title}</h3><p>{g.summary}</p><b className="guide-read-more">{t('common.readMore')} <ChevronRight size={15}/></b></Link>)}</div>
          <Link className="full-guide-link" to={`/blog/${articleSlug}`}>{t('explore.read')} <ChevronRight size={17}/></Link>
          <p className="travel-guide-note">Travel information is for planning guidance. Recheck opening hours, prices and entry requirements before travel.</p>
        </section>

        <AirlinePromotions country={selectedCountry}/>
      </section>
    </main>
    <SiteBottomNav/><TripiAssistant/>
  </div>;
}
