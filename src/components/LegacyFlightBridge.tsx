import { useEffect, useState } from 'react';
import { Plane } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const thaiMonth: Record<number, string> = {
  9: 'ก.ย.',
  10: 'ต.ค.',
  11: 'พ.ย.',
  12: 'ธ.ค.',
};

function dayLabel(start: string, end: string) {
  const days = Math.round((new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86400000) + 1;
  if (days <= 4) return '3–4 วัน';
  if (days <= 7) return '5–7 วัน';
  return '8–10 วัน';
}

export default function LegacyFlightBridge() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState('กำลังเปลี่ยนจากข้อมูลตัวอย่างเป็นราคาที่ Aviasales พบล่าสุด...');

  useEffect(() => {
    const id = params.get('id');
    if (!id) {
      navigate('/find-deal', { replace: true });
      return;
    }

    let active = true;
    supabase
      .from('deals')
      .select('departure_date, return_date, destinations(city_name)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setMessage('ไม่พบดีลเดิม กำลังพาไปค้นหาราคาใหม่...');
          setTimeout(() => navigate('/find-deal', { replace: true }), 600);
          return;
        }

        const destinations = Array.isArray(data.destinations) ? data.destinations[0] : data.destinations;
        const city = destinations?.city_name || 'Tokyo';
        const monthNumber = new Date(`${data.departure_date}T00:00:00`).getMonth() + 1;
        const month = thaiMonth[monthNumber] || 'ต.ค.';
        const days = dayLabel(data.departure_date, data.return_date);

        navigate(
          `/results?city=${encodeURIComponent(city)}&month=${encodeURIComponent(month)}&days=${encodeURIComponent(days)}`,
          { replace: true },
        );
      });

    return () => { active = false; };
  }, [navigate, params]);

  return <div style={{minHeight:'70vh',display:'grid',placeItems:'center',padding:'24px'}}>
    <div style={{textAlign:'center',maxWidth:'420px'}}>
      <Plane size={34} style={{color:'#1267e8',marginBottom:'12px'}} />
      <h2 style={{margin:'0 0 8px'}}>กำลังตรวจสอบราคาจริง</h2>
      <p style={{margin:0,color:'#64748b',lineHeight:1.6}}>{message}</p>
    </div>
  </div>;
}
