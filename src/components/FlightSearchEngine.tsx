import { ArrowLeftRight, CalendarDays, Minus, Plus, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AIRPORTS, getAirport } from '../lib/airports';
import { useLanguage } from '../lib/i18n';

type TripType = 'roundtrip' | 'oneway';

const UI = {
  th:{round:'ไป–กลับ',one:'เที่ยวเดียว',origin:'ต้นทาง',destination:'ปลายทาง',thailand:'ประเทศไทย',asia:'เอเชีย',depart:'วันเดินทาง',back:'วันกลับ',passengers:'ผู้โดยสาร',person:'คน',search:'ค้นหาเที่ยวบิน',note:'TripDeal จะช่วยเทียบดีลก่อน แล้วค่อยพาไปจองและชำระเงินกับสายการบินโดยตรง',routeError:'กรุณาเลือกต้นทางและปลายทาง',sameError:'ต้นทางและปลายทางต้องไม่เหมือนกัน',dateError:'กรุณาเลือกวันเดินทาง',returnError:'วันกลับต้องอยู่หลังวันเดินทาง'},
  en:{round:'Round trip',one:'One way',origin:'From',destination:'To',thailand:'Thailand',asia:'Asia',depart:'Departure',back:'Return',passengers:'Passengers',person:'person',search:'Search flights',note:'TripDeal compares options first, then sends you to the airline for final booking and payment.',routeError:'Please choose origin and destination',sameError:'Origin and destination must be different',dateError:'Please choose a departure date',returnError:'Return date must be after departure'},
  ja:{round:'往復',one:'片道',origin:'出発地',destination:'目的地',thailand:'タイ',asia:'アジア',depart:'出発日',back:'帰国日',passengers:'人数',person:'名',search:'航空券を検索',note:'TripDealで比較した後、航空会社の公式サイトで予約・支払いを行います。',routeError:'出発地と目的地を選択してください',sameError:'出発地と目的地は別にしてください',dateError:'出発日を選択してください',returnError:'帰国日は出発日より後にしてください'},
  ko:{round:'왕복',one:'편도',origin:'출발지',destination:'도착지',thailand:'태국',asia:'아시아',depart:'출발일',back:'귀국일',passengers:'승객',person:'명',search:'항공권 검색',note:'TripDeal에서 먼저 비교한 뒤 항공사 공식 사이트에서 예약과 결제를 진행합니다.',routeError:'출발지와 도착지를 선택하세요',sameError:'출발지와 도착지는 달라야 합니다',dateError:'출발일을 선택하세요',returnError:'귀국일은 출발일 이후여야 합니다'},
  zh:{round:'往返',one:'单程',origin:'出发地',destination:'目的地',thailand:'泰国',asia:'亚洲',depart:'出发日期',back:'返回日期',passengers:'乘客',person:'人',search:'搜索航班',note:'TripDeal 先帮你比较，再前往航空公司官网完成预订和付款。',routeError:'请选择出发地和目的地',sameError:'出发地和目的地不能相同',dateError:'请选择出发日期',returnError:'返回日期必须晚于出发日期'},
};

function toInputDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function FlightSearchEngine() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { language } = useLanguage();
  const text = UI[language] || UI.en;
  const today = useMemo(() => new Date(), []);
  const departDefault = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 14); return toInputDate(d); }, [today]);
  const returnDefault = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 20); return toInputDate(d); }, [today]);
  const initialOrigin = getAirport(params.get('origin'))?.code || 'BKK';
  const initialDestination = getAirport(params.get('destination'))?.code || 'TYO';

  const [tripType, setTripType] = useState<TripType>(params.get('trip') === 'oneway' ? 'oneway' : 'roundtrip');
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [depart, setDepart] = useState(params.get('depart') || departDefault);
  const [returnDate, setReturnDate] = useState(params.get('return') || returnDefault);
  const [adults, setAdults] = useState(Math.min(9, Math.max(1, Number(params.get('adults') || 1))));
  const [error, setError] = useState('');

  const swap = () => { setOrigin(destination); setDestination(origin); };
  const submit = () => {
    setError('');
    if (!origin || !destination) return setError(text.routeError);
    if (origin === destination) return setError(text.sameError);
    if (!depart) return setError(text.dateError);
    if (tripType === 'roundtrip' && (!returnDate || returnDate < depart)) return setError(text.returnError);
    const originInfo = getAirport(origin);
    const destinationInfo = getAirport(destination);
    const q = new URLSearchParams({ origin, destination, origin_name: originInfo?.city || origin, destination_name: destinationInfo?.city || destination, trip: tripType, depart, adults: String(adults) });
    if (tripType === 'roundtrip') q.set('return', returnDate);
    navigate(`/search?${q.toString()}`);
  };

  return <div className="flight-search-engine">
    <div className="flight-search-tabs" role="tablist" aria-label="Trip type">
      <button className={tripType === 'roundtrip' ? 'active' : ''} onClick={() => setTripType('roundtrip')}>{text.round}</button>
      <button className={tripType === 'oneway' ? 'active' : ''} onClick={() => setTripType('oneway')}>{text.one}</button>
    </div>

    <div className="flight-search-route">
      <label className="flight-search-field"><span>{text.origin}</span><select value={origin} onChange={(e) => setOrigin(e.target.value)}><optgroup label={text.thailand}>{AIRPORTS.filter(a => a.region === 'Thailand').map(a => <option key={`o-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup><optgroup label={text.asia}>{AIRPORTS.filter(a => a.region === 'Asia').map(a => <option key={`o-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup></select></label>
      <button className="flight-swap" onClick={swap} aria-label="Swap"><ArrowLeftRight size={18}/></button>
      <label className="flight-search-field"><span>{text.destination}</span><select value={destination} onChange={(e) => setDestination(e.target.value)}><optgroup label={text.thailand}>{AIRPORTS.filter(a => a.region === 'Thailand').map(a => <option key={`d-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup><optgroup label={text.asia}>{AIRPORTS.filter(a => a.region === 'Asia').map(a => <option key={`d-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup></select></label>
    </div>

    <div className="flight-search-details">
      <label className="flight-search-field compact"><span><CalendarDays size={15}/> {text.depart}</span><input type="date" min={toInputDate(today)} value={depart} onChange={(e) => { setDepart(e.target.value); if (returnDate < e.target.value) setReturnDate(e.target.value); }}/></label>
      {tripType === 'roundtrip' && <label className="flight-search-field compact"><span><CalendarDays size={15}/> {text.back}</span><input type="date" min={depart || toInputDate(today)} value={returnDate} onChange={(e) => setReturnDate(e.target.value)}/></label>}
      <div className="flight-search-field compact passenger-field"><span><Users size={15}/> {text.passengers}</span><div className="passenger-stepper"><button onClick={() => setAdults(Math.max(1, adults - 1))} aria-label="minus"><Minus size={16}/></button><strong>{adults} {text.person}</strong><button onClick={() => setAdults(Math.min(9, adults + 1))} aria-label="plus"><Plus size={16}/></button></div></div>
    </div>

    {error && <div className="flight-search-error">{error}</div>}
    <button className="flight-search-submit" onClick={submit}><Search size={19}/> {text.search}</button>
    <p className="flight-search-note">{text.note}</p>
  </div>;
}
