import { useMemo, useState } from 'react';
import { Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../tripi.css';

type Step = 'country' | 'city' | 'month' | 'days' | 'budget' | 'direct' | 'summary';
type Message = { from: 'tripi' | 'user'; text: string };
type Prefs = {
  country?: 'Japan';
  city?: 'Tokyo' | 'Osaka' | 'Fukuoka' | 'Sapporo';
  month?: string;
  days?: string;
  budget?: number;
  direct?: 'direct' | 'any' | 'best';
};

const welcome: Message = {
  from: 'tripi',
  text: 'สวัสดีครับ ผม Tripi ✈️ ถ้าไม่อยากกดค้นหาเอง เดี๋ยวผมช่วยหาดีลให้ครับ อยากไปประเทศไหนครับ?',
};

const directLabel = (value?: Prefs['direct']) => value === 'direct' ? 'บินตรง' : value === 'any' ? 'ต่อเครื่องได้' : 'เน้นความคุ้ม';

function TripiFace({ small = false }: { small?: boolean }) {
  return <span className={small ? 'tripi-face small' : 'tripi-face'} aria-hidden="true">
    <span className="tripi-antenna" />
    <span className="tripi-eye left" />
    <span className="tripi-eye right" />
    <span className="tripi-smile" />
    <span className="tripi-wing left" />
    <span className="tripi-wing right" />
  </span>;
}

function extractPrefs(text: string): Partial<Prefs> {
  const t = text.toLowerCase().replace(/\s+/g, ' ');
  const out: Partial<Prefs> = {};

  if (/ญี่ปุ่น|japan|โตเกียว|tokyo|โอซาก|osaka|ฟุกุโอก|fukuoka|ซัปโปโร|sapporo/.test(t)) out.country = 'Japan';
  if (/โตเกียว|tokyo/.test(t)) out.city = 'Tokyo';
  else if (/โอซาก|osaka/.test(t)) out.city = 'Osaka';
  else if (/ฟุกุโอก|fukuoka/.test(t)) out.city = 'Fukuoka';
  else if (/ซัปโปโร|sapporo/.test(t)) out.city = 'Sapporo';

  if (/ก\.ย\.?|กันยา/.test(t)) out.month = 'ก.ย.';
  else if (/ต\.ค\.?|ตุลา/.test(t)) out.month = 'ต.ค.';
  else if (/พ\.ย\.?|พฤศจิ/.test(t)) out.month = 'พ.ย.';
  else if (/ธ\.ค\.?|ธันวา/.test(t)) out.month = 'ธ.ค.';
  else if (/เดือนไหนก็ได้|ยืดหยุ่น/.test(t)) out.month = 'ยืดหยุ่น';

  const dayRange = t.match(/(\d+)\s*[-–]\s*(\d+)\s*วัน/);
  const singleDay = t.match(/(\d+)\s*วัน/);
  if (dayRange) {
    const n = Number(dayRange[1]);
    out.days = n <= 4 ? '3–4 วัน' : n <= 7 ? '5–7 วัน' : '8–10 วัน';
  } else if (singleDay) {
    const n = Number(singleDay[1]);
    out.days = n <= 4 ? '3–4 วัน' : n <= 7 ? '5–7 วัน' : '8–10 วัน';
  }

  if (/หมื่นห้า|15,?000/.test(t)) out.budget = 15000;
  else if (/หนึ่งหมื่น|หมื่นนึง|หมื่นหนึ่ง|10,?000/.test(t)) out.budget = 10000;
  else if (/แปดพัน|8,?000/.test(t)) out.budget = 8000;
  else if (/ไม่จำกัด/.test(t)) out.budget = 0;
  else {
    const amount = t.match(/(?:งบ|ไม่เกิน|ประมาณ)?\s*(\d{4,5})/);
    if (amount) out.budget = Number(amount[1]);
  }

  if (/บินตรง/.test(t)) out.direct = 'direct';
  else if (/ต่อเครื่อง/.test(t)) out.direct = 'any';
  else if (/คุ้มที่สุด|เน้นคุ้ม|ราคาดี/.test(t)) out.direct = 'best';

  return out;
}

export default function TripiAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('country');
  const [prefs, setPrefs] = useState<Prefs>({});
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');

  const quickReplies = useMemo(() => {
    if (step === 'country') return ['🇯🇵 ญี่ปุ่น'];
    if (step === 'city') return ['Tokyo', 'Osaka', 'Fukuoka', 'Sapporo'];
    if (step === 'month') return ['ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.', 'เดือนไหนก็ได้'];
    if (step === 'days') return ['3–4 วัน', '5–7 วัน', '8–10 วัน'];
    if (step === 'budget') return ['ไม่เกิน 8,000', 'ไม่เกิน 10,000', 'ไม่เกิน 15,000', 'ไม่จำกัด'];
    if (step === 'direct') return ['บินตรง', 'ต่อเครื่องได้', 'เน้นคุ้มที่สุด'];
    return ['ค้นหาดีล', 'เริ่มใหม่'];
  }, [step]);

  const addTripi = (text: string) => setMessages((m) => [...m, { from: 'tripi', text }]);
  const addUser = (text: string) => setMessages((m) => [...m, { from: 'user', text }]);

  const reset = () => {
    setPrefs({});
    setStep('country');
    setMessages([welcome]);
    setInput('');
  };

  const askNext = (next: Prefs) => {
    if (!next.country) {
      setStep('country');
      addTripi('ตอนนี้ TripDeal รุ่นทดลองเปิดค้นหาญี่ปุ่นก่อนครับ 🇯🇵 ลองเริ่มจากญี่ปุ่นได้เลย');
      return;
    }
    if (!next.city) {
      setStep('city');
      addTripi('ได้เลยครับ 🇯🇵 อยากไปเมืองไหนครับ?');
      return;
    }
    if (!next.month) {
      setStep('month');
      addTripi(`โอเค ${next.city} ครับ ช่วงเดือนไหนสะดวกที่สุด?`);
      return;
    }
    if (!next.days) {
      setStep('days');
      addTripi('อยากเที่ยวประมาณกี่วันครับ?');
      return;
    }
    if (next.budget === undefined) {
      setStep('budget');
      addTripi('ตั้งงบตั๋วต่อคนไว้ประมาณเท่าไหร่ครับ?');
      return;
    }
    if (!next.direct) {
      setStep('direct');
      addTripi('สุดท้าย อยากได้บินตรง หรือเน้นความคุ้มเป็นหลักครับ?');
      return;
    }

    setStep('summary');
    const budgetText = next.budget ? `ไม่เกิน ฿${next.budget.toLocaleString('th-TH')}` : 'ไม่จำกัดงบ';
    addTripi(`สรุปให้ครับ ✨ ${next.city}, ญี่ปุ่น · ${next.month} · ${next.days} · ${budgetText} · ${directLabel(next.direct)} ถ้าถูกต้อง ผมหาดีลให้ได้เลยครับ`);
  };

  const applyChoice = (choice: string) => {
    if (step === 'summary') {
      addUser(choice);
      if (choice === 'เริ่มใหม่') {
        reset();
        return;
      }
      const query = new URLSearchParams({
        city: prefs.city || 'Tokyo',
        month: prefs.month || 'ยืดหยุ่น',
        days: prefs.days || '5–7 วัน',
        budget: String(prefs.budget || 0),
        direct: prefs.direct === 'direct' ? '1' : '0',
        source: 'tripi',
      });
      setOpen(false);
      navigate(`/results?${query.toString()}`);
      return;
    }

    addUser(choice);
    const next = { ...prefs };
    if (step === 'country') next.country = 'Japan';
    if (step === 'city') next.city = choice as Prefs['city'];
    if (step === 'month') next.month = choice === 'เดือนไหนก็ได้' ? 'ยืดหยุ่น' : choice;
    if (step === 'days') next.days = choice;
    if (step === 'budget') next.budget = choice === 'ไม่จำกัด' ? 0 : Number(choice.replace(/\D/g, ''));
    if (step === 'direct') next.direct = choice === 'บินตรง' ? 'direct' : choice === 'ต่อเครื่องได้' ? 'any' : 'best';
    setPrefs(next);
    askNext(next);
  };

  const sendText = (text: string) => {
    const clean = text.trim();
    if (!clean) return;
    addUser(clean);
    setInput('');

    const extracted = extractPrefs(clean);
    const next = { ...prefs, ...extracted };

    if (step === 'country' && !next.country) {
      addTripi('ตอนนี้ผมช่วยค้นหาญี่ปุ่นได้ก่อนครับ 🇯🇵 พิมพ์ “ญี่ปุ่น” หรือกดปุ่มด้านล่างได้เลย');
      return;
    }
    if (step === 'city' && !next.city) {
      addTripi('ผมยังจับชื่อเมืองไม่ได้ครับ ลองเลือก Tokyo, Osaka, Fukuoka หรือ Sapporo ด้านล่างได้เลย');
      return;
    }
    if (step === 'month' && !next.month) {
      addTripi('ลองบอกเดือน เช่น “ตุลาคม” หรือกดเดือนด้านล่างได้เลยครับ');
      return;
    }
    if (step === 'days' && !next.days) {
      addTripi('ลองบอกประมาณกี่วัน เช่น “5 วัน” หรือเลือกช่วงด้านล่างได้ครับ');
      return;
    }
    if (step === 'budget' && next.budget === undefined) {
      addTripi('ลองพิมพ์งบ เช่น “10000” หรือกดตัวเลือกด้านล่างได้เลยครับ');
      return;
    }
    if (step === 'direct' && !next.direct) {
      addTripi('เลือกได้เลยครับว่าจะ “บินตรง”, “ต่อเครื่องได้” หรือ “เน้นคุ้มที่สุด”');
      return;
    }

    setPrefs(next);
    askNext(next);
  };

  return <>
    {!open && <button className="tripi-launcher" onClick={() => setOpen(true)} aria-label="เปิด Tripi ผู้ช่วยค้นหาดีล">
      <TripiFace />
      <span><strong>Tripi</strong><small>ไม่อยากกดเอง? ให้ผมช่วยหา</small></span>
    </button>}

    {open && <div className="tripi-sheet" role="dialog" aria-label="Tripi ผู้ช่วยค้นหาดีล">
      <div className="tripi-header">
        <div className="tripi-profile"><TripiFace small/><div><strong>Tripi</strong><span><i/> พร้อมช่วยหาดีล</span></div></div>
        <button onClick={() => setOpen(false)} aria-label="ปิด"><X size={20}/></button>
      </div>

      <div className="tripi-messages">
        {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`tripi-message ${message.from}`}>
          {message.from === 'tripi' && <TripiFace small/>}
          <p>{message.text}</p>
        </div>)}
      </div>

      <div className="tripi-replies">
        {quickReplies.map((reply) => <button key={reply} onClick={() => applyChoice(reply)}>{reply}</button>)}
      </div>

      {step !== 'summary' && <form className="tripi-input" onSubmit={(e) => { e.preventDefault(); sendText(input); }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="พิมพ์บอก Tripi ได้เลย..." />
        <button type="submit" aria-label="ส่งข้อความ"><Send size={18}/></button>
      </form>}
      <div className="tripi-footnote">Tripi v1 · ราคาจริงจะตรวจสอบอีกครั้งก่อนจอง</div>
    </div>}
  </>;
}
