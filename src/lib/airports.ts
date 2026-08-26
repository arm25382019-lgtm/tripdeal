export type AirportOption = {
  code: string;
  city: string;
  country: string;
  label: string;
  region: 'Thailand' | 'Asia';
};

export const AIRPORTS: AirportOption[] = [
  // Thailand — CAAT passenger airport codes
  { code: 'BKK', city: 'กรุงเทพ', country: 'ไทย', label: 'สุวรรณภูมิ · BKK', region: 'Thailand' },
  { code: 'DMK', city: 'กรุงเทพ', country: 'ไทย', label: 'ดอนเมือง · DMK', region: 'Thailand' },
  { code: 'CNX', city: 'เชียงใหม่', country: 'ไทย', label: 'เชียงใหม่ · CNX', region: 'Thailand' },
  { code: 'CEI', city: 'เชียงราย', country: 'ไทย', label: 'แม่ฟ้าหลวง เชียงราย · CEI', region: 'Thailand' },
  { code: 'HKT', city: 'ภูเก็ต', country: 'ไทย', label: 'ภูเก็ต · HKT', region: 'Thailand' },
  { code: 'KBV', city: 'กระบี่', country: 'ไทย', label: 'กระบี่ · KBV', region: 'Thailand' },
  { code: 'HDY', city: 'หาดใหญ่', country: 'ไทย', label: 'หาดใหญ่ · HDY', region: 'Thailand' },
  { code: 'USM', city: 'เกาะสมุย', country: 'ไทย', label: 'สมุย · USM', region: 'Thailand' },
  { code: 'UTP', city: 'พัทยา / ระยอง', country: 'ไทย', label: 'อู่ตะเภา ระยอง–พัทยา · UTP', region: 'Thailand' },
  { code: 'UTH', city: 'อุดรธานี', country: 'ไทย', label: 'อุดรธานี · UTH', region: 'Thailand' },
  { code: 'UBP', city: 'อุบลราชธานี', country: 'ไทย', label: 'อุบลราชธานี · UBP', region: 'Thailand' },
  { code: 'KKC', city: 'ขอนแก่น', country: 'ไทย', label: 'ขอนแก่น · KKC', region: 'Thailand' },
  { code: 'URT', city: 'สุราษฎร์ธานี', country: 'ไทย', label: 'สุราษฎร์ธานี · URT', region: 'Thailand' },
  { code: 'NST', city: 'นครศรีธรรมราช', country: 'ไทย', label: 'นครศรีธรรมราช · NST', region: 'Thailand' },
  { code: 'BFV', city: 'บุรีรัมย์', country: 'ไทย', label: 'บุรีรัมย์ · BFV', region: 'Thailand' },
  { code: 'BTZ', city: 'เบตง', country: 'ไทย', label: 'เบตง · BTZ', region: 'Thailand' },
  { code: 'CJM', city: 'ชุมพร', country: 'ไทย', label: 'ชุมพร · CJM', region: 'Thailand' },
  { code: 'HGN', city: 'แม่ฮ่องสอน', country: 'ไทย', label: 'แม่ฮ่องสอน · HGN', region: 'Thailand' },
  { code: 'HHQ', city: 'หัวหิน', country: 'ไทย', label: 'หัวหิน · HHQ', region: 'Thailand' },
  { code: 'KOP', city: 'นครพนม', country: 'ไทย', label: 'นครพนม · KOP', region: 'Thailand' },
  { code: 'LOE', city: 'เลย', country: 'ไทย', label: 'เลย · LOE', region: 'Thailand' },
  { code: 'LPT', city: 'ลำปาง', country: 'ไทย', label: 'ลำปาง · LPT', region: 'Thailand' },
  { code: 'MAQ', city: 'แม่สอด', country: 'ไทย', label: 'แม่สอด · MAQ', region: 'Thailand' },
  { code: 'NAK', city: 'นครราชสีมา', country: 'ไทย', label: 'นครราชสีมา · NAK', region: 'Thailand' },
  { code: 'NAW', city: 'นราธิวาส', country: 'ไทย', label: 'นราธิวาส · NAW', region: 'Thailand' },
  { code: 'NNT', city: 'น่าน', country: 'ไทย', label: 'น่านนคร · NNT', region: 'Thailand' },
  { code: 'PHS', city: 'พิษณุโลก', country: 'ไทย', label: 'พิษณุโลก · PHS', region: 'Thailand' },
  { code: 'PRH', city: 'แพร่', country: 'ไทย', label: 'แพร่ · PRH', region: 'Thailand' },
  { code: 'PYY', city: 'ปาย', country: 'ไทย', label: 'ปาย · PYY', region: 'Thailand' },
  { code: 'ROI', city: 'ร้อยเอ็ด', country: 'ไทย', label: 'ร้อยเอ็ด · ROI', region: 'Thailand' },
  { code: 'SNO', city: 'สกลนคร', country: 'ไทย', label: 'สกลนคร · SNO', region: 'Thailand' },
  { code: 'TDX', city: 'ตราด', country: 'ไทย', label: 'ตราด · TDX', region: 'Thailand' },
  { code: 'THS', city: 'สุโขทัย', country: 'ไทย', label: 'สุโขทัย · THS', region: 'Thailand' },
  { code: 'TST', city: 'ตรัง', country: 'ไทย', label: 'ตรัง · TST', region: 'Thailand' },
  { code: 'UNN', city: 'ระนอง', country: 'ไทย', label: 'ระนอง · UNN', region: 'Thailand' },

  // Southeast Asia
  { code: 'SIN', city: 'สิงคโปร์', country: 'สิงคโปร์', label: 'สิงคโปร์ · SIN', region: 'Asia' },
  { code: 'KUL', city: 'กัวลาลัมเปอร์', country: 'มาเลเซีย', label: 'กัวลาลัมเปอร์ · KUL', region: 'Asia' },
  { code: 'PEN', city: 'ปีนัง', country: 'มาเลเซีย', label: 'ปีนัง · PEN', region: 'Asia' },
  { code: 'SGN', city: 'โฮจิมินห์', country: 'เวียดนาม', label: 'โฮจิมินห์ · SGN', region: 'Asia' },
  { code: 'HAN', city: 'ฮานอย', country: 'เวียดนาม', label: 'ฮานอย · HAN', region: 'Asia' },
  { code: 'DAD', city: 'ดานัง', country: 'เวียดนาม', label: 'ดานัง · DAD', region: 'Asia' },
  { code: 'PNH', city: 'พนมเปญ', country: 'กัมพูชา', label: 'พนมเปญ · PNH', region: 'Asia' },
  { code: 'SAI', city: 'เสียมราฐ', country: 'กัมพูชา', label: 'เสียมราฐ · SAI', region: 'Asia' },
  { code: 'VTE', city: 'เวียงจันทน์', country: 'ลาว', label: 'เวียงจันทน์ · VTE', region: 'Asia' },
  { code: 'LPQ', city: 'หลวงพระบาง', country: 'ลาว', label: 'หลวงพระบาง · LPQ', region: 'Asia' },
  { code: 'RGN', city: 'ย่างกุ้ง', country: 'เมียนมา', label: 'ย่างกุ้ง · RGN', region: 'Asia' },
  { code: 'CGK', city: 'จาการ์ตา', country: 'อินโดนีเซีย', label: 'จาการ์ตา · CGK', region: 'Asia' },
  { code: 'DPS', city: 'บาหลี', country: 'อินโดนีเซีย', label: 'บาหลี · DPS', region: 'Asia' },
  { code: 'MNL', city: 'มะนิลา', country: 'ฟิลิปปินส์', label: 'มะนิลา · MNL', region: 'Asia' },
  { code: 'CEB', city: 'เซบู', country: 'ฟิลิปปินส์', label: 'เซบู · CEB', region: 'Asia' },

  // East Asia
  { code: 'TYO', city: 'โตเกียว', country: 'ญี่ปุ่น', label: 'โตเกียว (ทุกสนามบิน) · TYO', region: 'Asia' },
  { code: 'NRT', city: 'โตเกียว', country: 'ญี่ปุ่น', label: 'โตเกียว นาริตะ · NRT', region: 'Asia' },
  { code: 'HND', city: 'โตเกียว', country: 'ญี่ปุ่น', label: 'โตเกียว ฮาเนดะ · HND', region: 'Asia' },
  { code: 'OSA', city: 'โอซาก้า', country: 'ญี่ปุ่น', label: 'โอซาก้า (ทุกสนามบิน) · OSA', region: 'Asia' },
  { code: 'KIX', city: 'โอซาก้า', country: 'ญี่ปุ่น', label: 'โอซาก้า คันไซ · KIX', region: 'Asia' },
  { code: 'FUK', city: 'ฟุกุโอกะ', country: 'ญี่ปุ่น', label: 'ฟุกุโอกะ · FUK', region: 'Asia' },
  { code: 'CTS', city: 'ซัปโปโร', country: 'ญี่ปุ่น', label: 'ซัปโปโร · CTS', region: 'Asia' },
  { code: 'SEL', city: 'โซล', country: 'เกาหลีใต้', label: 'โซล (ทุกสนามบิน) · SEL', region: 'Asia' },
  { code: 'ICN', city: 'โซล', country: 'เกาหลีใต้', label: 'โซล อินชอน · ICN', region: 'Asia' },
  { code: 'PUS', city: 'ปูซาน', country: 'เกาหลีใต้', label: 'ปูซาน · PUS', region: 'Asia' },
  { code: 'TPE', city: 'ไทเป', country: 'ไต้หวัน', label: 'ไทเป · TPE', region: 'Asia' },
  { code: 'KHH', city: 'เกาสง', country: 'ไต้หวัน', label: 'เกาสง · KHH', region: 'Asia' },
  { code: 'HKG', city: 'ฮ่องกง', country: 'ฮ่องกง', label: 'ฮ่องกง · HKG', region: 'Asia' },
  { code: 'MFM', city: 'มาเก๊า', country: 'มาเก๊า', label: 'มาเก๊า · MFM', region: 'Asia' },
  { code: 'PVG', city: 'เซี่ยงไฮ้', country: 'จีน', label: 'เซี่ยงไฮ้ · PVG', region: 'Asia' },
  { code: 'PEK', city: 'ปักกิ่ง', country: 'จีน', label: 'ปักกิ่ง · PEK', region: 'Asia' },
  { code: 'CAN', city: 'กวางโจว', country: 'จีน', label: 'กวางโจว · CAN', region: 'Asia' },
  { code: 'SZX', city: 'เซินเจิ้น', country: 'จีน', label: 'เซินเจิ้น · SZX', region: 'Asia' },
  { code: 'KMG', city: 'คุนหมิง', country: 'จีน', label: 'คุนหมิง · KMG', region: 'Asia' },

  // South Asia
  { code: 'DEL', city: 'นิวเดลี', country: 'อินเดีย', label: 'นิวเดลี · DEL', region: 'Asia' },
  { code: 'BOM', city: 'มุมไบ', country: 'อินเดีย', label: 'มุมไบ · BOM', region: 'Asia' },
  { code: 'CCU', city: 'โกลกาตา', country: 'อินเดีย', label: 'โกลกาตา · CCU', region: 'Asia' },
  { code: 'CMB', city: 'โคลัมโบ', country: 'ศรีลังกา', label: 'โคลัมโบ · CMB', region: 'Asia' },
];

export function getAirport(code?: string | null): AirportOption | undefined {
  if (!code) return undefined;
  return AIRPORTS.find((airport) => airport.code === String(code).toUpperCase());
}
