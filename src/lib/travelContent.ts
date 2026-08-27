export type TravelCountry = 'ไทย' | 'ญี่ปุ่น' | 'เกาหลี' | 'ไต้หวัน' | 'จีน';

export type TravelDay = {
  day: string;
  title: string;
  items: string[];
};

export type TravelFood = {
  name: string;
  area: string;
  note: string;
};

export type TravelArticle = {
  slug: string;
  country: TravelCountry;
  flag: string;
  hero: string;
  city: string;
  destinationCode: string;
  title: string;
  subtitle: string;
  readTime: string;
  duration: string;
  bestFor: string;
  plan: TravelDay[];
  foods: TravelFood[];
  checkins: string[];
  tips: string[];
};

export const COUNTRY_ARTICLE_SLUG: Record<TravelCountry, string> = {
  ไทย: 'chiang-mai-3d2n',
  ญี่ปุ่น: 'tokyo-4d3n-first-trip',
  เกาหลี: 'seoul-4d3n-eat-shop',
  ไต้หวัน: 'taipei-4d3n-food-trip',
  จีน: 'shanghai-4d3n-first-trip',
};

export const TRAVEL_ARTICLES: TravelArticle[] = [
  {
    slug: 'chiang-mai-3d2n', country: 'ไทย', flag: '🇹🇭', hero: '⛰️', city: 'เชียงใหม่', destinationCode: 'CNX',
    title: 'เชียงใหม่ 3 วัน 2 คืน เที่ยวง่าย กินดี คาเฟ่ครบ',
    subtitle: 'แพลนสั้นที่รวมเมืองเก่า ดอย คาเฟ่ อาหารเหนือ และจุดถ่ายรูปยอดนิยม เหมาะกับทริปเสาร์–อาทิตย์ต่อวันลา 1 วัน',
    readTime: 'อ่านประมาณ 6 นาที', duration: '3 วัน 2 คืน', bestFor: 'คู่รัก · เพื่อน · เที่ยวคนเดียว',
    plan: [
      { day: 'DAY 1', title: 'เมืองเก่า + นิมมาน', items: ['วัดพระสิงห์และวัดเจดีย์หลวงช่วงเช้า', 'หาอาหารเหนือมื้อกลางวันแถวเมืองเก่า', 'บ่ายเดินนิมมานและแวะคาเฟ่', 'เย็นเลือกตลาดกลางคืนหรือถนนคนเดินตามวัน'] },
      { day: 'DAY 2', title: 'ดอยสุเทพ + ธรรมชาติ', items: ['ขึ้นดอยสุเทพช่วงเช้าเพื่อเลี่ยงคนเยอะ', 'แวะจุดชมวิวหรือคาเฟ่โซนแม่ริมตามเวลา', 'กลับเข้าเมืองชิมข้าวซอยหรือไส้อั่ว', 'ปิดวันด้วยร้านนั่งชิลหรือไนต์มาร์เก็ต'] },
      { day: 'DAY 3', title: 'คาเฟ่ + ของฝากก่อนบินกลับ', items: ['เช็กเอาต์แล้วหาร้านกาแฟใกล้ที่พัก', 'ซื้อของฝาก เช่น น้ำพริกหนุ่ม แคบหมู ไส้อั่ว', 'เผื่อเวลาเดินทางไปสนามบินอย่างน้อย 1.5–2 ชั่วโมง'] },
    ],
    foods: [
      { name: 'ข้าวซอย', area: 'เมืองเก่า / ช้างม่อย', note: 'เลือกร้านที่ทำเส้นและน้ำแกงสดใหม่ กินช่วงกลางวันกำลังดี' },
      { name: 'ไส้อั่ว + น้ำพริกหนุ่ม', area: 'ตลาดวโรรส / ตลาดท้องถิ่น', note: 'เหมาะทั้งกินที่ร้านและซื้อกลับเป็นของฝาก' },
      { name: 'กาแฟเชียงใหม่', area: 'นิมมาน / แม่ริม', note: 'เชียงใหม่มีคาเฟ่เยอะมาก เลือก 1–2 ร้านต่อวันพอ จะได้ไม่เสียเวลาเดินทาง' },
      { name: 'อาหารพื้นเมือง', area: 'เมืองเก่า', note: 'ลองแกงฮังเล แหนม และผักพื้นบ้านคู่กับเมนูหลัก' },
    ],
    checkins: ['วัดพระสิงห์', 'วัดเจดีย์หลวง', 'ดอยสุเทพ', 'นิมมาน', 'ตลาดวโรรส'],
    tips: ['ฤดูหนาวอากาศดีแต่ที่พักและตั๋วมักแพงขึ้น', 'เช่ารถหรือเรียกรถเป็นเที่ยวเหมาะกับกลุ่ม 2–4 คน', 'สนามบิน CNX อยู่ใกล้เมือง แต่ช่วงเร่งด่วนควรเผื่อเวลา', 'เช็กราคาตั๋วจาก BKK และ DMK เปรียบเทียบกันก่อนจอง'],
  },
  {
    slug: 'tokyo-4d3n-first-trip', country: 'ญี่ปุ่น', flag: '🇯🇵', hero: '🗼', city: 'โตเกียว', destinationCode: 'TYO',
    title: 'โตเกียว 4 วัน 3 คืน สำหรับมือใหม่ กิน เที่ยว ช้อป ครบ',
    subtitle: 'จัดโซนให้เดินทางไม่ย้อนมาก รวม Asakusa, Shibuya, Harajuku, ตลาดอาหาร และจุดชมวิว พร้อมทิปเลือก HND หรือ NRT',
    readTime: 'อ่านประมาณ 8 นาที', duration: '4 วัน 3 คืน', bestFor: 'เที่ยวญี่ปุ่นครั้งแรก · สายกิน · สายช้อป',
    plan: [
      { day: 'DAY 1', title: 'Asakusa + Ueno', items: ['เริ่มที่วัด Sensoji และถนน Nakamise', 'กินมื้อกลางวันย่าน Asakusa หรือ Ueno', 'บ่ายเดิน Ameyoko ซื้อขนมและของฝาก', 'เย็นชมเมืองรอบ Ueno หรือ Akihabara'] },
      { day: 'DAY 2', title: 'Shibuya + Harajuku + Omotesando', items: ['ไป Meiji Jingu ช่วงเช้า', 'เดิน Harajuku และ Omotesando', 'บ่ายเข้าฝั่ง Shibuya Crossing', 'เลือกจุดชมวิวช่วงก่อนพระอาทิตย์ตก'] },
      { day: 'DAY 3', title: 'Tsukiji + Ginza + Tokyo Station', items: ['เช้าเดินตลาด Tsukiji Outer Market', 'เที่ยงต่อ Ginza หรือ Yurakucho', 'บ่าย Tokyo Station และ Marunouchi', 'เย็นเลือกกินยากินิกุ ซูชิ หรือราเมงตามงบ'] },
      { day: 'DAY 4', title: 'ช้อปเบา ๆ แล้วไปสนามบิน', items: ['ซื้อของตกหล่นใกล้ที่พัก', 'เช็กเส้นทางรถไฟหรือ Airport Bus ล่วงหน้า', 'เผื่อสนามบินระหว่างประเทศอย่างน้อย 2.5–3 ชั่วโมง'] },
    ],
    foods: [
      { name: 'ซูชิ / ไคเซ็น', area: 'Tsukiji / Ueno', note: 'ไปเช้าจะมีตัวเลือกเยอะและคิวน้อยกว่าช่วงเที่ยง' },
      { name: 'ราเมง', area: 'Shinjuku / Tokyo Station', note: 'เลือกสไตล์โชยุ มิโสะ ทงคตสึ หรือสึเคเมนตามชอบ' },
      { name: 'ทงคัตสึ', area: 'Shibuya / Ginza', note: 'เป็นมื้อที่กินง่ายและราคาค่อนข้างคาดเดาได้' },
      { name: 'ยากินิกุ', area: 'Shinjuku / Ueno', note: 'ถ้าเป็นร้านยอดนิยมควรจองก่อน โดยเฉพาะช่วงศุกร์–อาทิตย์' },
    ],
    checkins: ['Sensoji', 'Shibuya Crossing', 'Meiji Jingu', 'Tokyo Station', 'Tsukiji Outer Market'],
    tips: ['HND ใกล้ตัวเมืองกว่า ส่วน NRT มักมีตัวเลือกเที่ยวบินและโปรหลายแบบ', 'ใช้บัตร IC ช่วยให้ขึ้นรถไฟและซื้อของสะดวก', 'จัดทริปเป็นโซน จะลดค่าเดินทางและจำนวนครั้งที่เปลี่ยนรถไฟ', 'เลี่ยงวันหยุดยาวญี่ปุ่นถ้าเน้นราคาตั๋วและที่พักคุ้ม'],
  },
  {
    slug: 'seoul-4d3n-eat-shop', country: 'เกาหลี', flag: '🇰🇷', hero: '🏙️', city: 'โซล', destinationCode: 'ICN',
    title: 'โซล 4 วัน 3 คืน สายกิน สายช้อป และคาเฟ่',
    subtitle: 'รวมพระราชวัง ย่านช้อป คาเฟ่ Seongsu, Hongdae และตลาดอาหาร ให้เที่ยวได้หลายอารมณ์ในทริปเดียว',
    readTime: 'อ่านประมาณ 7 นาที', duration: '4 วัน 3 คืน', bestFor: 'เพื่อน · คู่รัก · สายคาเฟ่',
    plan: [
      { day: 'DAY 1', title: 'Gyeongbokgung + Bukchon + Insadong', items: ['เริ่มที่พระราชวัง Gyeongbokgung', 'เดิน Bukchon Hanok Village แบบรักษามารยาทกับชุมชน', 'ต่อ Insadong หาอาหารและของฝาก', 'เย็นเดิน Cheonggyecheon หรือ Myeongdong'] },
      { day: 'DAY 2', title: 'Seongsu + Seoul Forest + Gangnam', items: ['เช้าคาเฟ่และร้านแฟชั่นย่าน Seongsu', 'พักที่ Seoul Forest', 'บ่ายข้ามไป Gangnam หรือ COEX', 'เย็นกิน Korean BBQ'] },
      { day: 'DAY 3', title: 'Hongdae + Yeonnam + ตลาดอาหาร', items: ['เริ่มสาย ๆ ที่ Yeonnam', 'ช้อปและคาเฟ่ Hongdae', 'เย็นลองตลาด Gwangjang หรือร้านไก่ทอด', 'กลับที่พักด้วยรถไฟก่อนเวลาปิด'] },
      { day: 'DAY 4', title: 'ซื้อของรอบสุดท้าย + สนามบิน', items: ['แวะซูเปอร์มาร์เก็ตหรือร้านเครื่องสำอาง', 'เช็ก AREX / Airport Bus ตามตำแหน่งที่พัก', 'เผื่อเวลา ICN อย่างน้อย 3 ชั่วโมง'] },
    ],
    foods: [
      { name: 'Korean BBQ', area: 'Mapo / Hongdae / Gangnam', note: 'ไป 2 คนขึ้นไปเลือกเซ็ตเนื้อได้หลากหลายกว่า' },
      { name: 'Tteokbokki + ของทอด', area: 'Gwangjang / ตลาดท้องถิ่น', note: 'เหมาะเป็นมื้อเบาหรือของกินระหว่างเดิน' },
      { name: 'ไก่ทอดเกาหลี', area: 'Hongdae / Myeongdong', note: 'สั่งแบบครึ่งต่อครึ่งเพื่อชิมหลายรส' },
      { name: 'คาเฟ่', area: 'Seongsu / Yeonnam', note: 'เลือกร้านตามเส้นทาง ไม่จำเป็นต้องไล่ครบทุกไวรัล' },
    ],
    checkins: ['Gyeongbokgung', 'Bukchon Hanok Village', 'Seongsu', 'Hongdae', 'N Seoul Tower'],
    tips: ['เช็กข้อกำหนดเข้าประเทศล่าสุดจากแหล่งทางการก่อนบิน', 'บัตรโดยสารขนส่งสาธารณะช่วยลดการใช้เงินสด', 'ช่วงใบไม้ผลิและใบไม้ร่วงคนเยอะ ควรจองโรงแรมล่วงหน้า', 'เทียบเที่ยวบิน BKK/DMK → ICN และเวลาเครื่องถึงก่อนเลือกดีล'],
  },
  {
    slug: 'taipei-4d3n-food-trip', country: 'ไต้หวัน', flag: '🇹🇼', hero: '🏮', city: 'ไทเป', destinationCode: 'TPE',
    title: 'ไทเป 4 วัน 3 คืน กินตลาดกลางคืน เที่ยวเมือง และออกทริปจิ่วเฟิ่น',
    subtitle: 'ทริปกินง่าย เดินทางสะดวกด้วย MRT พร้อมแพลน Ximending, Taipei 101, Raohe, Jiufen และคาเฟ่',
    readTime: 'อ่านประมาณ 7 นาที', duration: '4 วัน 3 คืน', bestFor: 'มือใหม่ · สายกิน · ครอบครัว',
    plan: [
      { day: 'DAY 1', title: 'Ximending + Longshan', items: ['เข้าที่พักแล้วเริ่ม Ximending', 'ไป Longshan Temple ช่วงเย็น', 'กลับมาหาของกินและช้อปต่อใน Ximending'] },
      { day: 'DAY 2', title: 'Chiang Kai-Shek + Taipei 101 + Raohe', items: ['เช้า Chiang Kai-Shek Memorial Hall', 'กลางวันย่าน Dongmen หรือ Yongkang', 'บ่าย Taipei 101 และ Xinyi', 'ค่ำกินตลาด Raohe Night Market'] },
      { day: 'DAY 3', title: 'Jiufen + Shifen แบบ Day Trip', items: ['ออกเช้าเพื่อให้มีเวลาเต็มวัน', 'เลือก Jiufen และ Shifen ตามสภาพอากาศ', 'กลับเข้าไทเปช่วงเย็น', 'มื้อค่ำง่าย ๆ ใกล้ที่พัก'] },
      { day: 'DAY 4', title: 'ตลาดเช้า + ซื้อของฝาก', items: ['หามื้อเช้าสไตล์ไต้หวัน', 'ซื้อชา ขนม และของฝาก', 'นั่ง Airport MRT ไป TPE โดยเผื่อเวลาเช็กอิน'] },
    ],
    foods: [
      { name: 'เสี่ยวหลงเปา', area: 'Dongmen / Xinyi', note: 'เหมาะเป็นมื้อกลางวันและแชร์กันหลายเมนู' },
      { name: 'บะหมี่เนื้อ', area: 'ทั่วไทเป', note: 'แต่ละร้านรสต่างกัน ลองแบบน้ำแดงหรือใสตามชอบ' },
      { name: 'หลู่โร่วฟ่าน', area: 'ตลาดกลางคืน / ร้านท้องถิ่น', note: 'จานไม่ใหญ่ เหมาะสั่งคู่กับซุปหรือเครื่องเคียง' },
      { name: 'ชานม + ของกินตลาด', area: 'Raohe / Ningxia', note: 'แบ่งซื้อหลายอย่างแล้วแชร์กันจะชิมได้เยอะกว่า' },
    ],
    checkins: ['Ximending', 'Chiang Kai-Shek Memorial Hall', 'Taipei 101', 'Raohe Night Market', 'Jiufen'],
    tips: ['พักใกล้ MRT จะช่วยประหยัดเวลาอย่างมาก', 'หน้าฝนควรพกร่มหรือเสื้อกันฝนบาง', 'Airport MRT เป็นตัวเลือกเดินทางสนามบินที่คาดเวลาได้ง่าย', 'เที่ยว 3–5 วันเหมาะมากสำหรับไทเปและ Day Trip 1 วัน'],
  },
  {
    slug: 'shanghai-4d3n-first-trip', country: 'จีน', flag: '🇨🇳', hero: '🌆', city: 'เซี่ยงไฮ้', destinationCode: 'PVG',
    title: 'เซี่ยงไฮ้ 4 วัน 3 คืน เมืองเก่า วิวตึก คาเฟ่ และย่านช้อป',
    subtitle: 'แพลนสำหรับมือใหม่ ครบ The Bund, Yu Garden, Nanjing Road, Xintiandi และทริปครึ่งวัน พร้อมทิปแอปและการชำระเงิน',
    readTime: 'อ่านประมาณ 8 นาที', duration: '4 วัน 3 คืน', bestFor: 'มือใหม่ · สายเมือง · สายถ่ายรูป',
    plan: [
      { day: 'DAY 1', title: 'The Bund + Nanjing Road', items: ['เข้าที่พักแล้วเริ่มเดิน Nanjing Road', 'ไป The Bund ช่วงเย็นเพื่อดูวิว Pudong', 'มื้อค่ำลองเสี่ยวหลงเปาหรือเซิงเจียนเปา'] },
      { day: 'DAY 2', title: 'Yu Garden + Xintiandi', items: ['เที่ยว Yu Garden และย่านเมืองเก่า', 'กลางวันหาอาหารเซี่ยงไฮ้ดั้งเดิม', 'บ่าย Xintiandi และย่าน French Concession', 'เย็นเลือก rooftop หรือเดินริมน้ำ'] },
      { day: 'DAY 3', title: 'Pudong + จุดชมวิว', items: ['ข้ามไปฝั่ง Lujiazui', 'เลือกขึ้นจุดชมวิวอาคารสูง 1 แห่ง', 'ช้อปหรือคาเฟ่ช่วงบ่าย', 'ค่ำกลับมาเดินริมแม่น้ำอีกฝั่ง'] },
      { day: 'DAY 4', title: 'ซื้อของ + ไปสนามบิน PVG', items: ['เช็กเวลาเดินทางไปสนามบินจากที่พัก', 'ซื้อของฝากและอาหารก่อนออก', 'เผื่อขั้นตอนสนามบินระหว่างประเทศอย่างน้อย 3 ชั่วโมง'] },
    ],
    foods: [
      { name: 'Xiaolongbao', area: 'Yu Garden / ร้านท้องถิ่น', note: 'กินตอนร้อนและระวังน้ำซุปร้อนด้านใน' },
      { name: 'Shengjianbao', area: 'ย่านเมืองเก่า / Nanjing', note: 'ซาลาเปาทอดก้นกรอบ เหมาะเป็นของกินระหว่างทาง' },
      { name: 'บะหมี่ต้นหอม', area: 'ทั่วเซี่ยงไฮ้', note: 'เมนูเรียบง่ายแต่เป็นรสท้องถิ่นที่ลองได้ง่าย' },
      { name: 'หม้อไฟ', area: 'ห้าง / ย่านช้อป', note: 'เหมาะกับกลุ่มเพื่อนและวันอากาศเย็น' },
    ],
    checkins: ['The Bund', 'Yu Garden', 'Nanjing Road', 'Xintiandi', 'Lujiazui'],
    tips: ['เตรียมช่องทางชำระเงินและแอปที่จำเป็นก่อนเดินทาง', 'เก็บชื่อโรงแรมและสถานที่สำคัญเป็นภาษาจีนไว้ในมือถือ', 'เช็กอินเทอร์เน็ตและบริการที่ใช้งานได้ในพื้นที่ก่อนบิน', 'สนามบิน PVG อยู่ห่างตัวเมือง ควรเผื่อเวลาเดินทางมากกว่าสนามบินในเมือง'],
  },
];

export function getTravelArticle(slug?: string | null): TravelArticle | null {
  if (!slug) return null;
  return TRAVEL_ARTICLES.find((article) => article.slug === slug) || null;
}

export function getArticleForCountry(country: TravelCountry): TravelArticle {
  return TRAVEL_ARTICLES.find((article) => article.country === country) || TRAVEL_ARTICLES[0];
}
