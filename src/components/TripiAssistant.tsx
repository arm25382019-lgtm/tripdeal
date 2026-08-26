import { useMemo, useState } from 'react';
import { Send, Sparkles, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../tripi.css';

type Step = 'country' | 'city' | 'month' | 'days' | 'budget' | 'direct' | 'summary';
type Message = { from: 'tripi' | 'user'; text: string };
type AiMode = 'unknown' | 'ai' | 'guided';
type Prefs = {
  country?: 'Japan';
  city?: 'Tokyo' | 'Osaka' | 'Fukuoka' | 'Sapporo';
  month?: string;
  days?: string;
  budget?: number;
  direct?: 'direct' | 'any' | 'best';
};

type AiPayload = {
  configured?: boolean;
  mode?: 'ai';
  reply?: string;
  country?: '' | 'Japan';
  city?: '' | 'Tokyo' | 'Osaka' | 'Fukuoka' | 'Sapporo';
  month?: string;
  days?: string;
  budget?: number;
  direct?: '' | 'direct' | 'any' | 'best';
  complete?: boolean;
};

const welcome: Message = {
  from: 'tripi',
  text: 'สวัสดีครับ ผม Tripi ✈️ บอกผมได้เลยว่าอยากเที่ยวแบบไหน เดี๋ยวผมช่วยจัดเงื่อนไขและหาดีลให้ครับ',
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

  if (/ไม่.*บินตรง|ไม่ซีเรียส.*บินตรง|ต่อเครื่อง/.test(t)) out.direct = 'any';
  else if (/บินตรง/.test(t)) out.direct = 'direct';
  else if (/คุ้มที่สุด|เน้นคุ้ม|ราคาดี|เอาคุ้ม/.test(t)) out.direct = 'best';

  return out;
}

function nextStep(prefs: Prefs): Step {
  if (!prefs.country) return 'country';
  if (!prefs.city) return 'city';
  if (!prefs.month) return 'month';
  if (!prefs.days) return 'days';
  if (prefs.budget === undefined) return 'budget';
  if (!prefs.direct) return 'direct';
  return 'summary';
}

function defaultPrompt(step: Step, prefs: Prefs) {
  if (step === 'country') return 'ตอนนี้ TripDeal รุ่นทดสอบเปิดค้นหาญี่ปุ่นก่อนครับ 🇯🇵 ลองเริ่มจากญี่ปุ่นได้เลย';
  if (step === 'city') return 'อยากไป Tokyo, Osaka, Fukuoka หรือ Sapporo ครับ? ถ้ายังไม่แน่ใจ บอกผมให้ช่วยเลือกได้';
  if (step === 'month') return `โอเค ${prefs.city ?? ''} ครับ ช่วงเดือนไหนสะดวกที่สุด?`;
  if (step === 'days') return 'อยากเที่ยวประมาณกี่วันครับ?';
  if (step === 'budget') return 'ตั้งงบตั๋วต่อคนไว้ประมาณเท่าไหร่ครับ?';
  if (step === 'direct') return 'อยากได้บินตรง ต่อเครื่องได้ หรือให้ผมเน้นความคุ้มเป็นหลักครับ?';
  return '';
}

function summaryText(prefs: Prefs) {
  const budgetText = prefs.budget ? `ไม่เกิน ฿${prefs.budget.toLocaleString('th-TH')}` : 'ไม่จำกัดงบ';
  return `สรุปให้ครับ ✨ ${prefs.city}, ญี่ปุ่น · ${prefs.month} · ${prefs.days} · ${budgetText} · ${directLabel(prefs.direct)} ถ้าถูกต้อง ผมหาดีลให้ได้เลยครับ`;
}

function mergeAiPrefs(current: Prefs, payload: AiPayload): Prefs {
  const next = { ...current };
  if (payload.country === 'Japan') next.country = 'Japan';
  if (payload.city) next.city = payload.city;
  if (payload.month) next.month = payload.month;
  if (payload.days) next.days = payload.days;
  if (typeof payload.budget === 'number' && payload.budget >= 0) next.budget = payload.budget;
  if (payload.direct) next.direct = payload.direct;
  return next;
}

export default function TripiAssistant() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('country');
  const [prefs, setPrefs] = useState<Prefs>({});
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('unknown');

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

  const advance = (next: Prefs, aiReply?: string) => {
    const target = nextStep(next);
    setStep(target);
    if (target === 'summary') {
      addTripi(summaryText(next));
      return;
    }
    addTripi(aiReply?.trim() || defaultPrompt(target, next));
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
    advance(next);
  };

  const guidedFallback = (clean: string) => {
    const extracted = extractPrefs(clean);
    const next = { ...prefs, ...extracted };
    setPrefs(next);
    setAiMode('guided');
    advance(next);
  };

  const sendText = async (text: string) => {
    const clean = text.trim();
    if (!clean || sending) return;
    const historyForApi = [...messages, { from: 'user' as const, text: clean }].slice(-8);
    addUser(clean);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/tripi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, prefs, history: historyForApi }),
      });

      if (!response.ok) throw new Error('AI unavailable');
      const payload = await response.json() as AiPayload;
      if (payload.mode !== 'ai') throw new Error('AI unavailable');

      const next = mergeAiPrefs(prefs, payload);
      setPrefs(next);
      setAiMode('ai');
      advance(next, payload.reply);
    } catch {
      guidedFallback(clean);
    } finally {
      setSending(false);
    }
  };

  return <>
    {!open && <button className="tripi-launcher" onClick={() => setOpen(true)} aria-label="เปิด Tripi ผู้ช่วยค้นหาดีล">
      <TripiFace />
      <span><strong>Tripi <Sparkles size={13}/></strong><small>บอกผมได้เลย เดี๋ยวช่วยหาให้</small></span>
    </button>}

    {open && <div className="tripi-sheet" role="dialog" aria-label="Tripi ผู้ช่วยค้นหาดีล">
      <div className="tripi-header">
        <div className="tripi-profile"><TripiFace small/><div><strong>Tripi <span className="tripi-ai-badge">AI</span></strong><span><i/> พร้อมช่วยหาดีล</span></div></div>
        <button onClick={() => setOpen(false)} aria-label="ปิด"><X size={20}/></button>
      </div>

      <div className="tripi-messages">
        {messages.map((message, index) => <div key={`${message.from}-${index}`} className={`tripi-message ${message.from}`}>
          {message.from === 'tripi' && <TripiFace small/>}
          <p>{message.text}</p>
        </div>)}
        {sending && <div className="tripi-message tripi"><TripiFace small/><p className="tripi-thinking"><span/><span/><span/></p></div>}
      </div>

      <div className="tripi-replies">
        {quickReplies.map((reply) => <button key={reply} disabled={sending} onClick={() => applyChoice(reply)}>{reply}</button>)}
      </div>

      {step !== 'summary' && <form className="tripi-input" onSubmit={(e) => { e.preventDefault(); void sendText(input); }}>
        <input disabled={sending} value={input} onChange={(e) => setInput(e.target.value)} placeholder="เช่น งบหมื่น อยากไปญี่ปุ่นปลายปี..." maxLength={1200}/>
        <button type="submit" disabled={sending || !input.trim()} aria-label="ส่งข้อความ"><Send size={18}/></button>
      </form>}
      <div className="tripi-footnote">
        {aiMode === 'ai' ? '✨ Tripi AI กำลังช่วยตีความคำขอของคุณ' : aiMode === 'guided' ? 'Smart fallback · ระบบยังช่วยค้นหาได้ตามปกติ' : 'Tripi v2 · AI + Smart fallback'}
        <br/>ราคาจะตรวจสอบอีกครั้งก่อนจอง
      </div>
    </div>}
  </>;
}
