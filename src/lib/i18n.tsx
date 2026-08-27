import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type AppLanguage = 'th' | 'en' | 'ja' | 'ko' | 'zh';

export const LANGUAGE_OPTIONS: { code: AppLanguage; label: string; short: string }[] = [
  { code: 'th', label: 'ไทย', short: 'TH' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ja', label: '日本語', short: 'JP' },
  { code: 'ko', label: '한국어', short: 'KR' },
  { code: 'zh', label: '中文', short: '中文' },
];

type Dictionary = Record<string, string>;

const DICTIONARIES: Record<AppLanguage, Dictionary> = {
  th: {
    'nav.home': 'หน้าแรก', 'nav.explore': 'Explore', 'nav.flights': 'เที่ยวบิน', 'nav.alerts': 'แจ้งเตือน', 'nav.account': 'บัญชี',
    'home.eyebrow': 'TRAVEL DEAL FINDER', 'home.title': 'อยากเที่ยวที่ไหน?', 'home.subtitle': 'ค้นหาเที่ยวบินในไทยและเอเชีย แล้วให้ TripDeal ช่วยเลือกดีลที่คุ้มที่สุด',
    'home.deals': 'ดีลน่าไปตอนนี้', 'home.searchSelf': 'ค้นหาเอง', 'home.dealNote': 'คัดจากราคาที่พบล่าสุดเพื่อช่วยเลือกช่วงเดินทาง · ราคาจริงยืนยันอีกครั้งกับสายการบิน',
    'home.exploreCta': 'ยังไม่รู้จะไปไหน? เข้า TripDeal Explore',
    'explore.kicker': 'TRIPDEAL EXPLORE', 'explore.title': 'หาไอเดียทริปก่อน แล้วค่อยหาตั๋วที่คุ้ม', 'explore.subtitle': 'รวมประเทศกำลังฮิต ดีลน่าไป แพลนเที่ยว ร้านอาหาร จุดเช็กอิน และโปรโมชั่นสายการบินไว้หน้าเดียว',
    'explore.trending': 'กำลังฮิตตอนนี้', 'explore.trendingSub': 'เลือกจากทริปยอดนิยมในไทยและเอเชีย แล้วกดอ่านแพลนเต็มได้เลย',
    'explore.deals': 'ดีลคุ้มที่น่าจับตา', 'explore.dealsSub': 'ราคาอ้างอิงล่าสุดเพื่อช่วยหาไอเดีย ชำระเงินจริงกับสายการบิน',
    'explore.moods': 'เลือกทริปตามสไตล์', 'explore.moodsSub': 'ไม่ต้องรู้ชื่อเมืองก่อนก็เริ่มหาไอเดียได้',
    'explore.promos': 'โปรโมชั่นสายการบิน', 'explore.plan': 'แพลนเที่ยว', 'explore.food': 'สายกิน', 'explore.checkin': 'จุดเช็กอิน', 'explore.weekend': 'ทริปสั้น',
    'explore.read': 'อ่านแพลน', 'explore.search': 'ค้นหาตั๋ว', 'explore.finalTitle': 'ได้ไอเดียแล้ว? เช็กราคาตั๋วกับ TripDeal เลย', 'explore.finalSub': 'เลือกต้นทาง ปลายทาง วันเดินทาง แล้วเปรียบเทียบก่อนจองตรงกับสายการบิน',
    'blog.back': 'กลับหน้าแรก', 'blog.plan': 'แพลนเที่ยว', 'blog.food': 'กินอะไรดี', 'blog.checkin': 'จุดเช็กอิน', 'blog.tips': 'ทิปก่อนเดินทาง', 'blog.ready': 'พร้อมเริ่มทริปแล้ว?', 'blog.search': 'ค้นหาตั๋ว',
    'common.loading': 'กำลังโหลด...', 'common.readMore': 'อ่านต่อ', 'common.direct': 'จองตรงสายการบิน',
  },
  en: {
    'nav.home': 'Home', 'nav.explore': 'Explore', 'nav.flights': 'Flights', 'nav.alerts': 'Alerts', 'nav.account': 'Account',
    'home.eyebrow': 'TRAVEL DEAL FINDER', 'home.title': 'Where do you want to go?', 'home.subtitle': 'Search Thailand and Asia flights, then let TripDeal help you spot the best-value option.',
    'home.deals': 'Deals worth a look', 'home.searchSelf': 'Search flights', 'home.dealNote': 'Recent reference fares for trip inspiration · final price is confirmed by the airline.',
    'home.exploreCta': 'Not sure where to go? Open TripDeal Explore',
    'explore.kicker': 'TRIPDEAL EXPLORE', 'explore.title': 'Find the trip idea first. Then find the flight deal.', 'explore.subtitle': 'Trending destinations, value fares, itineraries, food, check-in spots and airline promotions in one place.',
    'explore.trending': 'Trending now', 'explore.trendingSub': 'Popular Thailand and Asia trip ideas with full itineraries ready to read.',
    'explore.deals': 'Value deals to watch', 'explore.dealsSub': 'Recent reference fares for inspiration. Payment and final fare stay with the airline.',
    'explore.moods': 'Explore by travel style', 'explore.moodsSub': 'Start with the kind of trip you want, even if you do not know the city yet.',
    'explore.promos': 'Airline promotions', 'explore.plan': 'Itineraries', 'explore.food': 'Food trips', 'explore.checkin': 'Check-in spots', 'explore.weekend': 'Short trips',
    'explore.read': 'Read itinerary', 'explore.search': 'Search flights', 'explore.finalTitle': 'Found an idea? Check flights with TripDeal.', 'explore.finalSub': 'Choose route and dates, compare first, then book direct with the airline.',
    'blog.back': 'Back home', 'blog.plan': 'Itinerary', 'blog.food': 'What to eat', 'blog.checkin': 'Check-in spots', 'blog.tips': 'Before you go', 'blog.ready': 'Ready to start the trip?', 'blog.search': 'Search flights',
    'common.loading': 'Loading...', 'common.readMore': 'Read more', 'common.direct': 'Book direct with airline',
  },
  ja: {
    'nav.home': 'ホーム', 'nav.explore': '旅を探す', 'nav.flights': '航空券', 'nav.alerts': '通知', 'nav.account': 'アカウント',
    'home.eyebrow': 'TRAVEL DEAL FINDER', 'home.title': 'どこへ行きたいですか？', 'home.subtitle': 'タイ・アジアの航空券を検索し、TripDeal がコスパの良い選択肢を見つけます。',
    'home.deals': '今おすすめの旅', 'home.searchSelf': '航空券を検索', 'home.dealNote': '最近見つかった参考運賃です。最終価格は航空会社で確認してください。',
    'home.exploreCta': '行き先に迷ったら TripDeal Explore へ',
    'explore.kicker': 'TRIPDEAL EXPLORE', 'explore.title': '旅のアイデアを見つけてから、お得な航空券を探そう', 'explore.subtitle': '人気の国、お得な運賃、旅程、グルメ、写真スポット、航空会社プロモーションをまとめて紹介。',
    'explore.trending': '今人気の旅', 'explore.trendingSub': 'タイとアジアの人気プランから選び、詳しい旅程を読めます。',
    'explore.deals': '注目のお得な運賃', 'explore.dealsSub': '旅の参考になる最近の運賃。最終価格と支払いは航空会社で確認します。',
    'explore.moods': '旅のスタイルから探す', 'explore.moodsSub': '都市が決まっていなくても、したい旅から探せます。',
    'explore.promos': '航空会社キャンペーン', 'explore.plan': 'モデルプラン', 'explore.food': 'グルメ旅', 'explore.checkin': '写真スポット', 'explore.weekend': '短期旅行',
    'explore.read': '旅程を見る', 'explore.search': '航空券を検索', 'explore.finalTitle': '行き先が決まったら TripDeal で航空券を確認', 'explore.finalSub': '出発地・目的地・日付を選び、比較してから航空会社で直接予約します。',
    'blog.back': 'ホームへ戻る', 'blog.plan': '旅程', 'blog.food': 'グルメ', 'blog.checkin': '写真スポット', 'blog.tips': '旅行前のヒント', 'blog.ready': '旅を始める準備はできましたか？', 'blog.search': '航空券を検索',
    'common.loading': '読み込み中...', 'common.readMore': '続きを読む', 'common.direct': '航空会社で直接予約',
  },
  ko: {
    'nav.home': '홈', 'nav.explore': '여행 찾기', 'nav.flights': '항공권', 'nav.alerts': '알림', 'nav.account': '계정',
    'home.eyebrow': 'TRAVEL DEAL FINDER', 'home.title': '어디로 떠나고 싶으세요?', 'home.subtitle': '태국과 아시아 항공편을 검색하고 TripDeal이 가성비 좋은 선택을 찾아드립니다.',
    'home.deals': '지금 가기 좋은 딜', 'home.searchSelf': '항공권 검색', 'home.dealNote': '최근 확인된 참고 운임이며 최종 가격은 항공사에서 확인됩니다.',
    'home.exploreCta': '어디로 갈지 고민된다면 TripDeal Explore',
    'explore.kicker': 'TRIPDEAL EXPLORE', 'explore.title': '여행 아이디어를 먼저 찾고, 좋은 항공권을 비교하세요', 'explore.subtitle': '인기 국가, 가성비 운임, 일정, 맛집, 포토 스팟, 항공사 프로모션을 한곳에서 확인하세요.',
    'explore.trending': '지금 인기 여행', 'explore.trendingSub': '태국과 아시아 인기 여행을 고르고 자세한 일정을 확인할 수 있어요.',
    'explore.deals': '주목할 가성비 항공권', 'explore.dealsSub': '여행 아이디어를 위한 최근 참고 운임입니다. 최종 결제와 가격은 항공사에서 확인합니다.',
    'explore.moods': '여행 스타일로 찾기', 'explore.moodsSub': '도시를 정하지 않아도 원하는 여행 스타일에서 시작할 수 있어요.',
    'explore.promos': '항공사 프로모션', 'explore.plan': '여행 일정', 'explore.food': '맛집 여행', 'explore.checkin': '포토 스팟', 'explore.weekend': '짧은 여행',
    'explore.read': '일정 보기', 'explore.search': '항공권 검색', 'explore.finalTitle': '여행 아이디어를 찾았다면 TripDeal에서 항공권을 확인하세요', 'explore.finalSub': '출발지, 목적지, 날짜를 선택해 비교한 뒤 항공사에서 직접 예약하세요.',
    'blog.back': '홈으로', 'blog.plan': '여행 일정', 'blog.food': '먹거리', 'blog.checkin': '포토 스팟', 'blog.tips': '여행 전 팁', 'blog.ready': '여행을 시작할 준비가 되셨나요?', 'blog.search': '항공권 검색',
    'common.loading': '불러오는 중...', 'common.readMore': '더 보기', 'common.direct': '항공사에서 직접 예약',
  },
  zh: {
    'nav.home': '首页', 'nav.explore': '探索旅行', 'nav.flights': '机票', 'nav.alerts': '提醒', 'nav.account': '账户',
    'home.eyebrow': 'TRAVEL DEAL FINDER', 'home.title': '想去哪里旅行？', 'home.subtitle': '搜索泰国及亚洲航班，让 TripDeal 帮你找到更划算的选择。',
    'home.deals': '现在值得去的优惠', 'home.searchSelf': '搜索航班', 'home.dealNote': '显示近期参考票价，最终价格请以航空公司确认结果为准。',
    'home.exploreCta': '还没决定去哪？打开 TripDeal Explore',
    'explore.kicker': 'TRIPDEAL EXPLORE', 'explore.title': '先找到旅行灵感，再找更划算的机票', 'explore.subtitle': '热门目的地、参考低价、旅行计划、美食、打卡点和航空公司促销，一页看完。',
    'explore.trending': '近期热门', 'explore.trendingSub': '从泰国和亚洲热门行程中挑选，并可查看完整旅行计划。',
    'explore.deals': '值得关注的划算机票', 'explore.dealsSub': '近期参考票价用于旅行灵感，最终价格与付款由航空公司确认。',
    'explore.moods': '按旅行风格探索', 'explore.moodsSub': '即使还没决定城市，也可以从想要的旅行方式开始。',
    'explore.promos': '航空公司促销', 'explore.plan': '旅行计划', 'explore.food': '美食之旅', 'explore.checkin': '打卡景点', 'explore.weekend': '短途旅行',
    'explore.read': '查看行程', 'explore.search': '搜索航班', 'explore.finalTitle': '有旅行灵感了？马上用 TripDeal 查机票', 'explore.finalSub': '选择出发地、目的地和日期，先比较，再到航空公司官网直接预订。',
    'blog.back': '返回首页', 'blog.plan': '旅行计划', 'blog.food': '吃什么', 'blog.checkin': '打卡点', 'blog.tips': '出发前提示', 'blog.ready': '准备开始旅行了吗？', 'blog.search': '搜索航班',
    'common.loading': '加载中...', 'common.readMore': '继续阅读', 'common.direct': '航空公司官网直订',
  },
};

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function initialLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'th';
  const saved = window.localStorage.getItem('tripdeal-language') as AppLanguage | null;
  if (saved && LANGUAGE_OPTIONS.some((x) => x.code === saved)) return saved;
  const browser = window.navigator.language.toLowerCase();
  if (browser.startsWith('ja')) return 'ja';
  if (browser.startsWith('ko')) return 'ko';
  if (browser.startsWith('zh')) return 'zh';
  if (browser.startsWith('en')) return 'en';
  return 'th';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(initialLanguage);
  const setLanguage = (next: AppLanguage) => setLanguageState(next);

  useEffect(() => {
    window.localStorage.setItem('tripdeal-language', language);
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage,
    t: (key: string) => DICTIONARIES[language][key] || DICTIONARIES.th[key] || key,
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider');
  return context;
}
