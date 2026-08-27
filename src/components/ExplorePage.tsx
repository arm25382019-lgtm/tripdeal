import { ChevronRight, Compass, Flame, MapPin, Plane, Search, Sparkles, Utensils } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AirlinePromotions from './AirlinePromotions';
import FlightSearchEngine from './FlightSearchEngine';
import TripiAssistant from './TripiAssistant';
import { SiteBottomNav, SiteHeader } from './SiteChrome';
import { useLanguage } from '../lib/i18n';
import { COUNTRY_ARTICLE_SLUG, TRAVEL_ARTICLES, type TravelCountry } from '../lib/travelContent';

type FeaturedDeal = { city:string; destination_code:string; origin_airport:string; destination_airport:string; departure_at:string; return_at:string; price:number; airline:string; transfers:number; return_transfers:number; deal_score:number };
type FeaturedResponse = { deals?:FeaturedDeal[]; error?:string };

const COUNTRIES: { key: TravelCountry; flag: string }[] = [
  { key:'ไทย', flag:'🇹🇭' }, { key:'ญี่ปุ่น', flag:'🇯🇵' }, { key:'เกาหลี', flag:'🇰🇷' }, { key:'ไต้หวัน', flag:'🇹🇼' }, { key:'จีน', flag:'🇨🇳' },
];

const COUNTRY_LABELS: Record<string, Record<TravelCountry,string>> = {
  th:{ไทย:'ไทย',ญี่ปุ่น:'ญี่ปุ่น',เกาหลี:'เกาหลี',ไต้หวัน:'ไต้หวัน',จีน:'จีน'},
  en:{ไทย:'Thailand',ญี่ปุ่น:'Japan',เกาหลี:'Korea',ไต้หวัน:'Taiwan',จีน:'China'},
  ja:{ไทย:'タイ',ญี่ปุ่น:'日本',เกาหลี:'韓国',ไต้หวัน:'台湾',จีน:'中国'},
  ko:{ไทย:'태국',ญี่ปุ่น:'일본',เกาหลี:'한국',ไต้หวัน:'대만',จีน:'중국'},
  zh:{ไทย:'泰国',ญี่ปุ่น:'日本',เกาหลี:'韩国',ไต้หวัน:'台湾',จีน:'中国'},
};

const CITY_LABELS: Record<string, Record<string,string>> = {
  th:{'เชียงใหม่':'เชียงใหม่','โตเกียว':'โตเกียว','โซล':'โซล','ไทเป':'ไทเป','เซี่ยงไฮ้':'เซี่ยงไฮ้'},
  en:{'เชียงใหม่':'Chiang Mai','โตเกียว':'Tokyo','โซล':'Seoul','ไทเป':'Taipei','เซี่ยงไฮ้':'Shanghai'},
  ja:{'เชียงใหม่':'チェンマイ','โตเกียว':'東京','โซล':'ソウル','ไทเป':'台北','เซี่ยงไฮ้':'上海'},
  ko:{'เชียงใหม่':'치앙마이','โตเกียว':'도쿄','โซล':'서울','ไทเป':'타이베이','เซี่ยงไฮ้':'상하이'},
  zh:{'เชียงใหม่':'清迈','โตเกียว':'东京','โซล':'首尔','ไทเป':'台北','เซี่ยงไฮ้':'上海'},
};

const TRENDING_COPY: Record<string, Record<TravelCountry,{title:string;sub:string}>> = {
  th:{ไทย:{title:'เชียงใหม่ 3 วัน 2 คืน',sub:'เมืองเก่า · คาเฟ่ · ดอย · อาหารเหนือ'},ญี่ปุ่น:{title:'โตเกียว 4 วัน 3 คืน',sub:'กิน · ช้อป · ย่านฮิต · มือใหม่ก็เที่ยวได้'},เกาหลี:{title:'โซล 4 วัน 3 คืน',sub:'คาเฟ่ · ช้อป · BBQ · พระราชวัง'},ไต้หวัน:{title:'ไทเป 4 วัน 3 คืน',sub:'ตลาดกลางคืน · MRT · เที่ยวเองง่าย'},จีน:{title:'เซี่ยงไฮ้ 4 วัน 3 คืน',sub:'The Bund · เสี่ยวหลงเปา · เมืองทันสมัย'}},
  en:{ไทย:{title:'Chiang Mai 3D2N',sub:'Old city · cafés · mountains · northern food'},ญี่ปุ่น:{title:'Tokyo 4D3N',sub:'Food · shopping · iconic districts · first-timer friendly'},เกาหลี:{title:'Seoul 4D3N',sub:'Cafés · shopping · BBQ · palaces'},ไต้หวัน:{title:'Taipei 4D3N',sub:'Night markets · MRT · easy independent travel'},จีน:{title:'Shanghai 4D3N',sub:'The Bund · xiaolongbao · modern city vibes'}},
  ja:{ไทย:{title:'チェンマイ 3日2泊',sub:'旧市街・カフェ・山・北部料理'},ญี่ปุ่น:{title:'東京 4日3泊',sub:'グルメ・買い物・人気エリア・初心者向け'},เกาหลี:{title:'ソウル 4日3泊',sub:'カフェ・買い物・BBQ・王宮'},ไต้หวัน:{title:'台北 4日3泊',sub:'夜市・MRT・自由旅行しやすい'},จีน:{title:'上海 4日3泊',sub:'外灘・小籠包・モダンシティ'}},
  ko:{ไทย:{title:'치앙마이 3일 2박',sub:'올드타운 · 카페 · 산 · 북부 음식'},ญี่ปุ่น:{title:'도쿄 4일 3박',sub:'맛집 · 쇼핑 · 인기 지역 · 첫 여행 추천'},เกาหลี:{title:'서울 4일 3박',sub:'카페 · 쇼핑 · BBQ · 궁궐'},ไต้หวัน:{title:'타이베이 4일 3박',sub:'야시장 · MRT · 자유여행'},จีน:{title:'상하이 4일 3박',sub:'와이탄 · 샤오롱바오 · 현대적인 도시'}},
  zh:{ไทย:{title:'清迈 3天2晚',sub:'古城 · 咖啡馆 · 山景 · 泰北美食'},ญี่ปุ่น:{title:'东京 4天3晚',sub:'美食 · 购物 · 热门街区 · 新手友好'},เกาหลี:{title:'首尔 4天3晚',sub:'咖啡馆 · 购物 · 烤肉 · 宫殿'},ไต้หวัน:{title:'台北 4天3晚',sub:'夜市 · MRT · 自由行方便'},จีน:{title:'上海 4天3晚',sub:'外滩 · 小笼包 · 都市旅行'}},
};

const money = (n:number) => new Intl.NumberFormat('th-TH').format(n);
const cityEmoji: Record<TravelCountry,string> = {ไทย:'⛰️',ญี่ปุ่น:'🗼',เกาหลี:'🏙️',ไต้หวัน:'🏮',จีน:'🌆'};

export default function ExplorePage(){
  const { language, t } = useLanguage();
  const [country,setCountry]=useState<TravelCountry>('ญี่ปุ่น');
  const [deals,setDeals]=useState<FeaturedDeal[]>([]);
  const [loading,setLoading]=useState(true);
  const navigate=useNavigate();
  const lang = TRENDING_COPY[language] ? language : 'en';
  const countryName = COUNTRY_LABELS[lang][country];

  useEffect(()=>{let active=true;setLoading(true);fetch(`/api/featured-deals?country=${encodeURIComponent(country)}`).then(r=>r.json()).then((data:FeaturedResponse)=>{if(active)setDeals(data.deals||[])}).catch(()=>active&&setDeals([])).finally(()=>active&&setLoading(false));return()=>{active=false}},[country]);

  const articles=useMemo(()=>TRAVEL_ARTICLES.slice(0,5),[]);
  const goSearch=(destination:string)=>navigate(`/find-deal?destination=${encodeURIComponent(destination)}`);

  return <div className="app-shell explore-page">
    <SiteHeader/>
    <main>
      <section className="explore-hero">
        <div className="container explore-hero-inner">
          <div><span className="explore-kicker"><Sparkles size={15}/>{t('explore.kicker')}</span><h1>{t('explore.title')}</h1><p>{t('explore.subtitle')}</p><div className="explore-hero-actions"><a href="#trending"><Compass size={17}/>{t('explore.trending')}</a><Link to="/find-deal"><Search size={17}/>{t('explore.search')}</Link></div></div>
          <div className="explore-hero-art"><span>🗺️</span><b>ASIA</b></div>
        </div>
      </section>

      <section className="container explore-section" id="trending">
        <div className="explore-section-head"><div><span>01 · TRENDING</span><h2>{t('explore.trending')}</h2><p>{t('explore.trendingSub')}</p></div></div>
        <div className="explore-trending-grid">{articles.map((article)=>{const copy=TRENDING_COPY[lang][article.country];return <Link to={`/blog/${article.slug}`} className="explore-trending-card" key={article.slug}><div className="explore-card-visual">{cityEmoji[article.country]}</div><div><span>{article.flag} {COUNTRY_LABELS[lang][article.country]}</span><h3>{copy.title}</h3><p>{copy.sub}</p><b>{t('explore.read')} <ChevronRight size={15}/></b></div></Link>})}</div>
      </section>

      <section className="container explore-section">
        <div className="explore-section-head country-head"><div><span>02 · VALUE DEALS</span><h2>{t('explore.deals')} · {COUNTRIES.find(c=>c.key===country)?.flag} {countryName}</h2><p>{t('explore.dealsSub')}</p></div></div>
        <div className="country-grid deals-country-grid explore-country-grid">{COUNTRIES.map(c=><button key={c.key} className={country===c.key?'country active':'country'} onClick={()=>setCountry(c.key)}>{c.flag} {COUNTRY_LABELS[lang][c.key]}</button>)}</div>
        {loading?<div className="promo-empty">{t('common.loading')}</div>:deals.length===0?<div className="promo-empty">No current reference fares for this selection.</div>:<div className="explore-deal-grid">{deals.slice(0,4).map((deal,i)=><article className={i===0?'explore-deal-card best':'explore-deal-card'} key={`${deal.city}-${deal.departure_at}-${i}`}><div className="explore-deal-tags">{i===0&&<span><Flame size={13}/>BEST VALUE</span>}<small>{deal.origin_airport} → {deal.destination_airport}</small></div><h3>{deal.city}</h3><strong>฿{money(deal.price)}</strong><p>{deal.airline || 'Airline'} · {deal.transfers===0&&deal.return_transfers===0?'Direct':'Connections'} · ⭐ {deal.deal_score}/100</p><button onClick={()=>goSearch(deal.destination_airport||deal.destination_code)}>{t('explore.search')} <ChevronRight size={15}/></button></article>)}</div>}
      </section>

      <section className="container explore-section">
        <div className="explore-section-head"><div><span>03 · PICK YOUR VIBE</span><h2>{t('explore.moods')}</h2><p>{t('explore.moodsSub')}</p></div></div>
        <div className="explore-mood-grid">
          <Link to={`/blog/${COUNTRY_ARTICLE_SLUG['ญี่ปุ่น']}#plan`}><MapPin/><span>{t('explore.plan')}</span><h3>Tokyo / Seoul / Taipei</h3><p>3–4 day city plans with routes grouped by area.</p></Link>
          <Link to={`/blog/${COUNTRY_ARTICLE_SLUG['ไต้หวัน']}#food`}><Utensils/><span>{t('explore.food')}</span><h3>Taipei / Tokyo / Seoul</h3><p>Night markets, local dishes, cafés and neighborhoods worth eating through.</p></Link>
          <Link to={`/blog/${COUNTRY_ARTICLE_SLUG['เกาหลี']}#checkin`}><Plane/><span>{t('explore.checkin')}</span><h3>Photo + city vibes</h3><p>Iconic places without packing ten locations into one day.</p></Link>
          <Link to={`/blog/${COUNTRY_ARTICLE_SLUG['ไทย']}#plan`}><Compass/><span>{t('explore.weekend')}</span><h3>Chiang Mai / Phuket</h3><p>Short trips that work well with one or two days off.</p></Link>
        </div>
      </section>

      <section className="container explore-section explore-promotions">
        <div className="explore-section-head"><div><span>04 · AIRLINE OFFERS</span><h2>{t('explore.promos')}</h2></div></div>
        <AirlinePromotions country={country}/>
      </section>

      <section className="explore-search-cta">
        <div className="container narrow"><div className="explore-final-copy"><span>05 · SEARCH</span><h2>{t('explore.finalTitle')}</h2><p>{t('explore.finalSub')}</p></div><FlightSearchEngine/></div>
      </section>
    </main>
    <SiteBottomNav/>
    <TripiAssistant/>
  </div>;
}
