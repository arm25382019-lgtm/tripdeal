const PROMOTIONS = [
  {
    id: 'jal-autumn-2026',
    airline_code: 'JL',
    airline: 'Japan Airlines (JAL)',
    badge: 'LIMITED TIME',
    title: 'เที่ยวญี่ปุ่นช่วงใบไม้ร่วง ค่าโดยสารพิเศษ',
    summary: 'ค่าโดยสารไป-กลับชั้นประหยัดจากกรุงเทพฯ ไปโตเกียว เริ่มต้นประมาณ THB 25,780 ตามหน้าโปรโมชันทางการ',
    booking_period: '14–27 ส.ค. 2569',
    travel_period: '14 ส.ค.–30 พ.ย. 2569',
    ends_at: '2026-08-27',
    url: 'https://www.jal.co.jp/flights/th-th/flights-from-bangkok-to-tokyo',
    source: 'JAL Official',
    countries: ['ญี่ปุ่น'],
  },
  {
    id: 'ana-uob-2026',
    airline_code: 'NH',
    airline: 'ANA',
    badge: 'PROMO CODE',
    title: 'ANA x UOB ลดเที่ยวบินกรุงเทพฯ–ญี่ปุ่น',
    summary: 'ผู้ถือบัตร UOB รับส่วนลด 8% สำหรับเส้นทางกรุงเทพฯ–ญี่ปุ่น และ 5% สำหรับสหรัฐฯ/แคนาดา ตามเงื่อนไขของ ANA',
    booking_period: '1 ส.ค.–31 ต.ค. 2569',
    travel_period: '7 ส.ค. 2569–31 ม.ค. 2570',
    ends_at: '2026-10-31',
    url: 'https://www.ana.co.jp/th/th/plan-book/promotions/ana-uob/',
    source: 'ANA Official',
    countries: ['ญี่ปุ่น'],
  },
  {
    id: 'bangkokair-morning-nightowl-2026',
    airline_code: 'PG',
    airline: 'Bangkok Airways',
    badge: 'ลด 400 บาท',
    title: 'Morning Saver & Night Owl',
    summary: 'เที่ยวบินช่วงเช้าและช่วงค่ำที่ร่วมรายการ รับส่วนลด 400 บาทต่อท่าน สำหรับเส้นทางและเที่ยวบินตามเงื่อนไข',
    booking_period: '17–31 ส.ค. 2569',
    travel_period: '1 ก.ย.–30 พ.ย. 2569',
    ends_at: '2026-08-31',
    url: 'https://www.bangkokair.com/tha/morningsaver-nightowl',
    source: 'Bangkok Airways Official',
    countries: ['ไทย'],
  },
  {
    id: 'airasia-mk-japan-2026',
    airline_code: 'FD',
    airline: 'Thai AirAsia',
    badge: 'กิจกรรมพิเศษ',
    title: 'MK พาแม่กิน ลุ้นบินญี่ปุ่นกับ AirAsia',
    summary: 'กิจกรรมตลอดเดือนสิงหาคม ลุ้นตั๋วไป-กลับญี่ปุ่น 5 เมืองยอดนิยม ตรวจรายละเอียดและเงื่อนไขจาก AirAsia โดยตรง',
    booking_period: 'ร่วมกิจกรรม 1–31 ส.ค. 2569',
    travel_period: 'ตามเงื่อนไขรางวัล',
    ends_at: '2026-08-31',
    url: 'https://newsroom.airasia.com/news/category/%E0%B8%A0%E0%B8%B2%E0%B8%A9%E0%B8%B2%E0%B9%84%E0%B8%97%E0%B8%A2',
    source: 'AirAsia Newsroom',
    countries: ['ไทย', 'ญี่ปุ่น'],
  },
  {
    id: 'thai-current-offers',
    airline_code: 'TG',
    airline: 'Thai Airways',
    badge: 'OFFICIAL FARES',
    title: 'ข้อเสนอพิเศษและค่าโดยสารล่าสุดจากการบินไทย',
    summary: 'ดูข้อเสนอเที่ยวบินจากกรุงเทพฯ ไปเอเชีย-แปซิฟิกและจุดหมายอื่น ๆ พร้อมราคาที่อัปเดตบนเว็บไซต์การบินไทย',
    booking_period: 'อัปเดตตามเว็บไซต์สายการบิน',
    travel_period: 'เลือกวันเดินทางบนเว็บไซต์',
    ends_at: null,
    url: 'https://www.thaiairways.com/flights/th-th/',
    source: 'Thai Airways Official',
    countries: ['ไทย', 'ญี่ปุ่น', 'เกาหลี', 'ไต้หวัน', 'จีน'],
  },
  {
    id: 'singaporeair-current-promos',
    airline_code: 'SQ',
    airline: 'Singapore Airlines',
    badge: 'OFFICIAL PROMOS',
    title: 'รวมโปรโมชั่นล่าสุดของ Singapore Airlines',
    summary: 'รวมข้อเสนอและสิทธิพิเศษจากเว็บไซต์ Singapore Airlines ประเทศไทย ตรวจราคาและเงื่อนไขล่าสุดก่อนจอง',
    booking_period: 'อัปเดตตามเว็บไซต์สายการบิน',
    travel_period: 'ขึ้นอยู่กับแต่ละโปรโมชั่น',
    ends_at: null,
    url: 'https://www.singaporeair.com/th_TH/th/plan-travel/promotions/',
    source: 'Singapore Airlines Official',
    countries: ['ไทย', 'ญี่ปุ่น', 'เกาหลี', 'ไต้หวัน', 'จีน'],
  },
  {
    id: 'koreanair-bkk-seoul-fares',
    airline_code: 'KE',
    airline: 'Korean Air',
    badge: 'FARE DEALS',
    title: 'ดีลค่าโดยสารกรุงเทพฯ–โซลจาก Korean Air',
    summary: 'หน้า Official Fare Deals แสดงค่าโดยสารไป-กลับกรุงเทพฯ–โซลและวันที่ที่มีราคาน่าสนใจ อัปเดตตามที่นั่งคงเหลือ',
    booking_period: 'อัปเดตตามเว็บไซต์สายการบิน',
    travel_period: 'เลือกวันเดินทางบนเว็บไซต์',
    ends_at: null,
    url: 'https://www.koreanair.com/flights/th-th/flights-from-bangkok-to-seoul',
    source: 'Korean Air Official',
    countries: ['เกาหลี'],
  },
];

function isActive(item, today) {
  if (!item.ends_at) return true;
  return item.ends_at >= today;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const country = String(req.query?.country || '').trim();
  const today = new Date().toISOString().slice(0, 10);
  const active = PROMOTIONS
    .filter((item) => isActive(item, today))
    .filter((item) => !country || item.countries.includes(country))
    .sort((a, b) => {
      const aSpecific = a.countries.length === 1 ? 1 : 0;
      const bSpecific = b.countries.length === 1 ? 1 : 0;
      return bSpecific - aSpecific;
    });

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=21600');
  return res.status(200).json({
    source: 'official_airline_promotion_pages',
    verified_at: '2026-08-27',
    country: country || null,
    promotions: active,
    note: 'TripDeal links to official airline promotion/fare pages. Final eligibility, price and availability are confirmed by the airline.',
  });
}
