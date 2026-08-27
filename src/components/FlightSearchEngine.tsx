import { ArrowLeftRight, CalendarDays, Minus, Plus, Search, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AIRPORTS, getAirport } from '../lib/airports';

type TripType = 'roundtrip' | 'oneway';

function toInputDate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function FlightSearchEngine() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const today = useMemo(() => new Date(), []);
  const departDefault = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 14); return toInputDate(d); }, [today]);
  const returnDefault = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 20); return toInputDate(d); }, [today]);
  const initialOrigin = getAirport(params.get('origin'))?.code || 'BKK';
  const initialDestination = getAirport(params.get('destination'))?.code || 'TYO';

  const [tripType, setTripType] = useState<TripType>('roundtrip');
  const [origin, setOrigin] = useState(initialOrigin);
  const [destination, setDestination] = useState(initialDestination);
  const [depart, setDepart] = useState(departDefault);
  const [returnDate, setReturnDate] = useState(returnDefault);
  const [adults, setAdults] = useState(1);
  const [error, setError] = useState('');

  const swap = () => { setOrigin(destination); setDestination(origin); };
  const submit = () => {
    setError('');
    if (!origin || !destination) return setError('กรุณาเลือกต้นทางและปลายทาง');
    if (origin === destination) return setError('ต้นทางและปลายทางต้องไม่เหมือนกัน');
    if (!depart) return setError('กรุณาเลือกวันเดินทาง');
    if (tripType === 'roundtrip' && (!returnDate || returnDate < depart)) return setError('วันกลับต้องอยู่หลังวันเดินทาง');
    const originInfo = getAirport(origin);
    const destinationInfo = getAirport(destination);
    const q = new URLSearchParams({ origin, destination, origin_name: originInfo?.city || origin, destination_name: destinationInfo?.city || destination, trip: tripType, depart, adults: String(adults) });
    if (tripType === 'roundtrip') q.set('return', returnDate);
    navigate(`/search?${q.toString()}`);
  };

  return <div className="flight-search-engine">
    <div className="flight-search-tabs" role="tablist" aria-label="ประเภทการเดินทาง">
      <button className={tripType === 'roundtrip' ? 'active' : ''} onClick={() => setTripType('roundtrip')}>ไป–กลับ</button>
      <button className={tripType === 'oneway' ? 'active' : ''} onClick={() => setTripType('oneway')}>เที่ยวเดียว</button>
    </div>

    <div className="flight-search-route">
      <label className="flight-search-field"><span>ต้นทาง</span><select value={origin} onChange={(e) => setOrigin(e.target.value)}><optgroup label="ประเทศไทย">{AIRPORTS.filter(a => a.region === 'Thailand').map(a => <option key={`o-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup><optgroup label="เอเชีย">{AIRPORTS.filter(a => a.region === 'Asia').map(a => <option key={`o-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup></select></label>
      <button className="flight-swap" onClick={swap} aria-label="สลับต้นทางและปลายทาง"><ArrowLeftRight size={18}/></button>
      <label className="flight-search-field"><span>ปลายทาง</span><select value={destination} onChange={(e) => setDestination(e.target.value)}><optgroup label="ประเทศไทย">{AIRPORTS.filter(a => a.region === 'Thailand').map(a => <option key={`d-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup><optgroup label="เอเชีย">{AIRPORTS.filter(a => a.region === 'Asia').map(a => <option key={`d-${a.code}`} value={a.code}>{a.label}</option>)}</optgroup></select></label>
    </div>

    <div className="flight-search-details">
      <label className="flight-search-field compact"><span><CalendarDays size={15}/> วันเดินทาง</span><input type="date" min={toInputDate(today)} value={depart} onChange={(e) => { setDepart(e.target.value); if (returnDate < e.target.value) setReturnDate(e.target.value); }}/></label>
      {tripType === 'roundtrip' && <label className="flight-search-field compact"><span><CalendarDays size={15}/> วันกลับ</span><input type="date" min={depart || toInputDate(today)} value={returnDate} onChange={(e) => setReturnDate(e.target.value)}/></label>}
      <div className="flight-search-field compact passenger-field"><span><Users size={15}/> ผู้โดยสาร</span><div className="passenger-stepper"><button onClick={() => setAdults(Math.max(1, adults - 1))} aria-label="ลดจำนวนผู้โดยสาร"><Minus size={16}/></button><strong>{adults} คน</strong><button onClick={() => setAdults(Math.min(9, adults + 1))} aria-label="เพิ่มจำนวนผู้โดยสาร"><Plus size={16}/></button></div></div>
    </div>

    {error && <div className="flight-search-error">{error}</div>}
    <button className="flight-search-submit" onClick={submit}><Search size={19}/> ค้นหาเที่ยวบิน</button>
    <p className="flight-search-note">TripDeal จะช่วยเทียบดีลก่อน แล้วค่อยพาไปจองและชำระเงินกับสายการบินโดยตรง</p>
  </div>;
}
