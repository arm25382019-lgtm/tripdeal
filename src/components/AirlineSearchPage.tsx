import { ArrowLeft, Bell, ChevronRight, Home, Plane, Search, ShieldCheck, User, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import TripiAssistant from './TripiAssistant';
import { airlineDisplayName, buildDirectBookingUrl, getAirline, getRouteFallbackAirlines, supportedAirlineCount } from '../lib/airlines';
import { getAirport } from '../lib/airports';

type SearchPrice = {
  origin: string;
  destination: string;
  origin_airport: string;
  destination_airport: string;
  price: number;
  total_price?: number;
  currency: string;
  airline: string;
  flight_number: string;
  return_flight_number?: string;
  departure_at: string;
  return_at: string | null;
  transfers: number;
  return_transfers: number;
  duration_minutes: number;
  number_of_bookable_seats?: number;
  found_at?: string | null;
  source?: string;
  source_role?: 'live_inventory' | 'test_inventory' | 'price_discovery_only' | string;
  price_basis?: 'live_offer' | 'test_offer' | 'roundtrip_discovery' | 'one_way_discovery' | 'sum_of_exact_one_way_discovery';
};

type ReferencePrice = SearchPrice & {
  requested_departure_date?: string;
  reference_day_distance?: number;
  reference_type?: 'exact_date' | 'nearby_date';
};

type AmadeusResponse = { configured:boolean; provider:'amadeus'; environment?:string; prices?:SearchPrice[]; error?:string };
type ReferenceResponse = { configured:boolean; prices?:SearchPrice[]; reference_prices?:ReferencePrice[]; error?:string };

const money = (n:number) => new Intl.NumberFormat('th-TH').format(n);
const dateTH = (iso?:string|null) => iso ? new Date(iso).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'}) : '—';

function valueScore(row:SearchPrice, cheapest:number, fastest:number){
  const pricePoints=cheapest>0&&row.price>0?Math.min(50,(cheapest/row.price)*50):28;
  const totalStops=Number(row.transfers||0)+Number(row.return_transfers||0);
  const routePoints=totalStops===0?30:Math.max(5,30-totalStops*10);
  const durationPoints=fastest>0&&row.duration_minutes>0?Math.min(15,(fastest/row.duration_minutes)*15):8;
  const airlinePoints=getAirline(row.airline)?5:2;
  return Math.max(0,Math.min(100,Math.round(pricePoints+routePoints+durationPoints+airlinePoints)));
}

function mergeReferences(exactRows:SearchPrice[],nearbyRows:ReferencePrice[]):ReferencePrice[]{
  const rows:ReferencePrice[]=[...exactRows.map(row=>({...row,reference_type:'exact_date' as const,reference_day_distance:0})),...nearbyRows];
  const byAirline=new Map<string,ReferencePrice>();
  for(const row of rows){
    if(!row.airline||!row.price)continue;
    const current=byAirline.get(row.airline);
    const currentDistance=Number(current?.reference_day_distance??Number.MAX_SAFE_INTEGER);
    const nextDistance=Number(row.reference_day_distance??Number.MAX_SAFE_INTEGER);
    if(!current||nextDistance<currentDistance||(nextDistance===currentDistance&&row.price<current.price))byAirline.set(row.airline,row);
  }
  return [...byAirline.values()].sort((a,b)=>Number(a.reference_day_distance??9999)-Number(b.reference_day_distance??9999)||a.price-b.price);
}

async function postSearch<T>(url:string,body:Record<string,unknown>):Promise<T>{
  const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await res.json() as T & {error?:string};
  if(!res.ok)throw new Error(data.error||'Search request failed');
  return data;
}

export default function AirlineSearchPage(){
  const [params]=useSearchParams();
  const navigate=useNavigate();
  const origin=(params.get('origin')||'BKK').toUpperCase();
  const destination=(params.get('destination')||'TYO').toUpperCase();
  const depart=params.get('depart')||'';
  const returnDate=params.get('return')||'';
  const trip=params.get('trip')==='oneway'?'oneway':'roundtrip';
  const adults=Math.max(1,Number(params.get('adults')||1));
  const originInfo=getAirport(origin);
  const destinationInfo=getAirport(destination);

  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [amadeusPrices,setAmadeusPrices]=useState<SearchPrice[]>([]);
  const [referencePrices,setReferencePrices]=useState<ReferencePrice[]>([]);
  const [liveConfigured,setLiveConfigured]=useState(false);
  const [liveEnvironment,setLiveEnvironment]=useState('');
  const [liveWarning,setLiveWarning]=useState('');

  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');setLiveWarning('');
    const requestBody={origin,destination,departure_date:depart,return_date:trip==='roundtrip'?returnDate:undefined,one_way:trip==='oneway',direct_only:false,adults};

    Promise.allSettled([
      postSearch<AmadeusResponse>('/api/amadeus-search',requestBody),
      postSearch<ReferenceResponse>('/api/airline-search',requestBody),
    ]).then(([liveResult,referenceResult])=>{
      if(!active)return;
      if(liveResult.status==='fulfilled'){
        setLiveConfigured(Boolean(liveResult.value.configured));
        setLiveEnvironment(liveResult.value.environment||'');
        setAmadeusPrices(liveResult.value.prices||[]);
        if(liveResult.value.error)setLiveWarning(liveResult.value.error);
      }else{
        setLiveConfigured(true);setAmadeusPrices([]);
        setLiveWarning(liveResult.reason instanceof Error?liveResult.reason.message:'Amadeus Search ใช้งานไม่ได้ชั่วคราว');
      }
      if(referenceResult.status==='fulfilled')setReferencePrices(mergeReferences(referenceResult.value.prices||[],referenceResult.value.reference_prices||[]));
      else setReferencePrices([]);
      if(liveResult.status==='rejected'&&referenceResult.status==='rejected')setError('ระบบค้นหาทั้ง Amadeus และราคาอ้างอิงใช้งานไม่ได้ชั่วคราว');
    }).finally(()=>active&&setLoading(false));
    return()=>{active=false};
  },[origin,destination,depart,returnDate,trip,adults]);

  const sorted=useMemo(()=>[...amadeusPrices].sort((a,b)=>a.price-b.price),[amadeusPrices]);
  const productionLive=liveConfigured&&liveEnvironment==='production';
  const references=useMemo(()=>[...referencePrices],[referencePrices]);
  const routeFallbacks=useMemo(()=>getRouteFallbackAirlines(origin,destination),[origin,destination]);
  const amadeusAirlines=useMemo(()=>new Set(sorted.map(row=>row.airline)),[sorted]);
  const referenceAirlines=useMemo(()=>new Set(references.map(row=>row.airline)),[references]);
  const referenceOnly=useMemo(()=>references.filter(row=>!amadeusAirlines.has(row.airline)),[references,amadeusAirlines]);
  const missingFallbacks=useMemo(()=>routeFallbacks.filter(fallback=>!amadeusAirlines.has(fallback.code)&&!referenceAirlines.has(fallback.code)),[routeFallbacks,amadeusAirlines,referenceAirlines]);

  const cheapest=sorted[0]?.price||0;
  const positiveDurations=sorted.map(row=>row.duration_minutes).filter(n=>n>0);
  const fastest=positiveDurations.length?Math.min(...positiveDurations):0;
  const valueScores=sorted.map(row=>valueScore(row,cheapest,fastest));
  const bestValueIndex=valueScores.length?valueScores.indexOf(Math.max(...valueScores)):-1;

  const openDeal=(row:SearchPrice,index:number)=>{
    const dealOrigin=(row.origin_airport||row.origin||origin).toUpperCase();
    const dealDestination=(row.destination_airport||row.destination||destination).toUpperCase();
    const dealOriginInfo=getAirport(dealOrigin);const dealDestinationInfo=getAirport(dealDestination);
    const q=new URLSearchParams({origin:dealOrigin,destination:dealDestination,origin_name:dealOriginInfo?.city||originInfo?.city||dealOrigin,destination_name:dealDestinationInfo?.city||destinationInfo?.city||dealDestination,depart:row.departure_at||depart,trip,adults:String(adults),price:String(row.price),airline_code:row.airline||'',flight:row.flight_number||'',transfers:String(row.transfers||0),return_transfers:String(row.return_transfers||0),score:String(valueScores[index]??0),source:row.source_role==='live_inventory'?'live':'reference',back:`/search?${params.toString()}`});
    if(row.return_flight_number)q.set('return_flight',row.return_flight_number);
    if(trip==='roundtrip'&&(row.return_at||returnDate))q.set('return',row.return_at||returnDate);
    navigate(`/book?${q.toString()}`);
  };

  const openOfficialSearch=(airlineCode:string,routeBookingUrl?:string|null)=>{
    const url=buildDirectBookingUrl(airlineCode,{origin,destination,depart,returnDate,trip,adults,routeBookingUrl});
    if(url)window.open(url,'_blank','noopener,noreferrer');
  };

  const renderReferenceCard=(reference:ReferencePrice,index:number)=>{
    const airline=getAirline(reference.airline);
    const dayDistance=Number(reference.reference_day_distance??0);
    const exactReference=reference.reference_type==='exact_date'||dayDistance===0;
    const bookingUrl=buildDirectBookingUrl(reference.airline,{origin,destination,depart,returnDate,trip,adults});
    return <article className="air-result-card" key={`reference-${reference.airline}-${reference.departure_at}-${index}`}>
      <div className="air-result-main"><div className="air-result-tags"><span>{exactReference?'ราคาอ้างอิงตรงวัน':`ราคาอ้างอิงใกล้วัน · ${dayDistance} วัน`}</span>{bookingUrl&&<span>Airline Direct</span>}</div><h3>{airlineDisplayName(reference.airline)}</h3><p className="air-result-route">{reference.origin_airport||origin} → {reference.destination_airport||destination}</p><p>รายการนี้ไม่ใช่ Live Inventory ใช้เพื่อช่วยค้นสายการบินและช่วงราคา แล้วให้เว็บไซต์สายการบินตรวจวันที่เลือกอีกครั้ง</p><p className="air-result-flight">ข้อมูลอ้างอิงวันที่ {dateTH(reference.departure_at)}{reference.flight_number?` · ${reference.airline}${reference.flight_number}`:''}</p></div>
      <div className="air-result-price"><strong>฿{money(reference.price)}</strong><span>ราคาอ้างอิง / คน</span><small>{exactReference?'ข้อมูลราคาเคยพบตรงวัน · ไม่ใช่การล็อกที่นั่ง':`ห่างจากวันที่เลือก ${dayDistance} วัน`}</small>{bookingUrl?<button onClick={()=>openOfficialSearch(reference.airline)}>ตรวจตรงกับ {airline?.name||airlineDisplayName(reference.airline)} <ChevronRight size={16}/></button>:<button disabled>ยังไม่มีลิงก์สายการบิน</button>}</div>
    </article>;
  };

  const renderFallbackCard=(fallback:ReturnType<typeof getRouteFallbackAirlines>[number],index:number)=>{
    const airline=getAirline(fallback.code);
    const bookingUrl=buildDirectBookingUrl(fallback.code,{origin,destination,depart,returnDate,trip,adults,routeBookingUrl:fallback.routeBookingUrl});
    return <article className="air-result-card" key={`${origin}-${destination}-${fallback.code}-${index}`}><div className="air-result-main"><div className="air-result-tags"><span>Low-cost / Airline Direct</span><span>ตรวจตรงสายการบิน</span></div><h3>{airlineDisplayName(fallback.code)}</h3><p className="air-result-route">{origin} → {destination}</p><p>{fallback.note||'TripDeal มีข้อมูลว่าสายการบินนี้เกี่ยวข้องกับเส้นทาง แต่ให้เว็บไซต์ทางการยืนยันตารางบินและราคาของวันที่เลือก'}</p></div><div className="air-result-price"><strong>เช็กราคาจริง</strong><span>{airline?.name||airlineDisplayName(fallback.code)}</span><small>ตารางบิน ที่นั่ง และราคายืนยันกับสายการบิน</small>{bookingUrl?<button onClick={()=>openOfficialSearch(fallback.code,fallback.routeBookingUrl)}>เปิดหน้าจองสายการบิน <ChevronRight size={16}/></button>:<button disabled>ยังไม่มีลิงก์จอง</button>}</div></article>;
  };

  const hasAnyResult=sorted.length>0||referenceOnly.length>0||missingFallbacks.length>0;

  return <div className="air-search-page">
    <header className="air-search-topbar"><button onClick={()=>navigate('/')} aria-label="กลับหน้าแรก"><ArrowLeft size={21}/></button><Link to="/" className="air-search-brand"><Plane size={21} fill="currentColor"/>TripDeal</Link><span><ShieldCheck size={14}/> Hybrid Search</span></header>
    <main className="air-search-container">
      <section className="air-search-summary"><div><small>{trip==='roundtrip'?'ไป–กลับ':'เที่ยวเดียว'}</small><h1>{origin} → {destination}</h1><p>{originInfo?.city||origin} → {destinationInfo?.city||destination}</p></div><div className="air-search-summary-meta"><span>{dateTH(depart)}{trip==='roundtrip'?` – ${dateTH(returnDate)}`:''}</span><span><Users size={15}/> {adults} คน</span></div></section>

      <div className="air-search-trust"><ShieldCheck size={17}/><div><strong>TripDeal Hybrid Search = Amadeus + Airline Direct</strong><span>{!liveConfigured?`Amadeus ยังไม่ได้ตั้งค่า · ตอนนี้ใช้ Airline Direct + ราคาอ้างอิงเท่านั้น · Directory รองรับ ${supportedAirlineCount}+ สายการบิน`:productionLive?'Full-service = Amadeus Production Live · Low-cost = Official airline URL/API เท่าที่รองรับ · Travelpayouts = ราคาอ้างอิงเท่านั้น':'กำลังใช้ Amadeus Test Environment ซึ่งเป็นข้อมูลทดสอบจำกัด ไม่ถือเป็น Live Inventory · Production จึงจะเป็น Live Search จริง'}</span></div></div>
      {liveWarning&&<div className="air-search-disclaimer"><strong>Amadeus Search มีข้อขัดข้อง</strong><p>{liveWarning} · ระบบยังแสดงข้อมูลอ้างอิงและลิงก์สายการบินให้ใช้งานต่อได้</p></div>}

      {loading&&<div className="air-search-empty"><Search size={24}/><strong>กำลังค้นหา Amadeus + Airline Direct...</strong><span>Full-service ค้นจาก Amadeus ส่วน Low-cost จะใช้ข้อมูลอ้างอิงและส่งไปตรวจที่สายการบินโดยตรง</span></div>}
      {!loading&&error&&<div className="air-search-empty"><strong>ค้นหาไม่สำเร็จ</strong><span>{error}</span><button onClick={()=>window.location.reload()}>ลองอีกครั้ง</button></div>}

      {!loading&&!error&&sorted.length>0&&<>
        <div className="air-search-title"><div><h2>{productionLive?'Live Offers':'Amadeus Test Offers'} · {sorted.length} ตัวเลือก</h2><p>{productionLive?'ข้อมูลเที่ยวบินและราคาจาก Amadeus Production Live Search · ก่อนชำระเงินจริงให้สายการบินยืนยันอีกครั้ง':'ข้อมูลจาก Amadeus Test ใช้ทดสอบหน้าจอและ integration เท่านั้น ไม่ควรใช้เป็นราคาจริงกับลูกค้า'}</p></div><button onClick={()=>navigate('/')}>ค้นหาใหม่</button></div>
        <div className="air-search-list">{sorted.map((row,index)=>{
          const airline=getAirline(row.airline);const score=valueScores[index]??0;const direct=row.transfers===0&&(trip==='oneway'||row.return_transfers===0);const isBestValue=index===bestValueIndex;const isCheapest=index===0;
          return <article className={isBestValue?'air-result-card best':'air-result-card'} key={`amadeus-${row.airline}-${row.flight_number}-${row.departure_at}-${row.price}-${index}`}>
            <div className="air-result-main"><div className="air-result-tags"><span className="best">{productionLive?'● LIVE':'AMADEUS TEST'}</span>{isBestValue&&<span className="best">⭐ คุ้มที่สุด</span>}{isCheapest&&!isBestValue&&<span className="best">💸 ถูกที่สุด</span>}{airline&&<span>จองตรงสายการบิน</span>}</div><h3>{airlineDisplayName(row.airline)}</h3><p className="air-result-route">{row.origin_airport||origin} → {row.destination_airport||destination}</p><p>{direct?'บินตรง':`ขาไปต่อ ${row.transfers||0} ครั้ง${trip==='roundtrip'?` · ขากลับต่อ ${row.return_transfers||0} ครั้ง`:''}`}</p><p className="air-result-flight">ขาไป {row.flight_number?`${row.airline}${row.flight_number}`:'รอยืนยันเลขเที่ยวบิน'} · {dateTH(row.departure_at)}</p>{trip==='roundtrip'&&<p className="air-result-flight">ขากลับ {row.return_flight_number?`${row.airline}${row.return_flight_number}`:'รอยืนยันเลขเที่ยวบิน'} · {dateTH(row.return_at)}</p>}{productionLive&&Number(row.number_of_bookable_seats||0)>0&&<p className="air-result-flight">Amadeus รายงานที่นั่งที่จองได้อย่างน้อย {row.number_of_bookable_seats} ที่นั่งใน offer นี้</p>}<div className="air-score">Value Score <b>⭐ {score}/100</b><span><i style={{width:`${score}%`}}/></span></div></div>
            <div className="air-result-price"><strong>฿{money(row.price)}</strong><span>{trip==='roundtrip'?'ไป–กลับ':'เที่ยวเดียว'} / คน</span><small>{productionLive?'Live offer · ราคาสุดท้ายยืนยันอีกครั้งก่อนจ่าย':'Test offer · ห้ามถือเป็นราคาจริง'}</small><button onClick={()=>openDeal(row,index)}>{productionLive?'ดูรายละเอียดและจองตรง':'ดูข้อมูลทดสอบ'} <ChevronRight size={16}/></button></div>
          </article>;
        })}</div>
      </>}

      {!loading&&!error&&referenceOnly.length>0&&<><div className="air-search-title"><div><h2>Low-cost / สายการบินอื่นที่ควรตรวจเพิ่ม</h2><p>Travelpayouts ใช้เฉพาะราคาอ้างอิง ไม่เอามาปนกับ {productionLive?'Live Inventory':'Amadeus results'}</p></div></div><div className="air-search-list">{referenceOnly.slice(0,12).map(renderReferenceCard)}</div></>}

      {!loading&&!error&&missingFallbacks.length>0&&<><div className="air-search-title"><div><h2>Airline Direct เพิ่มเติม</h2><p>ไม่มีข้อมูลจาก Amadeus/ราคาอ้างอิงที่พอเชื่อถือได้ จึงให้ตรวจบนเว็บสายการบินโดยตรง</p></div></div><div className="air-search-list">{missingFallbacks.map(renderFallbackCard)}</div></>}

      {!loading&&!error&&!hasAnyResult&&<div className="air-search-empty"><strong>ยังไม่พบเที่ยวบินหรือราคาอ้างอิงของเส้นทางนี้</strong><span>{productionLive?'อาจเป็นเส้นทางนอก coverage ของ Amadeus หรือเป็น Low-cost carrier ที่ต้องตรวจตรงกับสายการบิน':'ถ้ายังไม่ได้เปิด Amadeus Production Live ผลค้นหาจะยังไม่ครอบคลุม Live Inventory จริง'}</span><button onClick={()=>navigate('/')}>เปลี่ยนวันหรือค้นหาใหม่</button></div>}

      {!loading&&!error&&hasAnyResult&&<div className="air-search-disclaimer"><strong>Hybrid Search ของ TripDeal</strong><p>{productionLive?'ป้าย LIVE มาจาก Amadeus Production Flight Offers Search':'Amadeus Test ไม่ถือเป็น Live Inventory'} · รายการราคาอ้างอิงมาจาก Travelpayouts และจะไม่ถูกเรียกว่า Live สาย Low-cost ที่ไม่มี API จะพาไปตรวจและจองที่เว็บไซต์ทางการของสายการบินโดยตรง</p></div>}
    </main>
    <nav className="air-search-bottom-nav"><Link to="/"><Home size={20}/>หน้าแรก</Link><Link to={`/search?${params.toString()}`} className="active"><Plane size={20}/>เที่ยวบิน</Link><Link to="/alerts"><Bell size={20}/>แจ้งเตือน</Link><Link to="/account"><User size={20}/>บัญชี</Link></nav><TripiAssistant/>
  </div>;
}
