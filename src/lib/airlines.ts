export type AirlineInfo = {
  code: string;
  name: string;
  country: string;
  bookingUrl: string;
  airAsiaGroup?: boolean;
};

export type RouteAirlineFallback = {
  code: string;
  routeBookingUrl?: string;
  note?: string;
};

const AIRLINES: Record<string, AirlineInfo> = {
  // Thailand
  TG: { code: 'TG', name: 'Thai Airways', country: 'Thailand', bookingUrl: 'https://www.thaiairways.com/' },
  PG: { code: 'PG', name: 'Bangkok Airways', country: 'Thailand', bookingUrl: 'https://www.bangkokair.com/' },
  FD: { code: 'FD', name: 'Thai AirAsia', country: 'Thailand', bookingUrl: 'https://www.airasia.com/flight/th/th', airAsiaGroup: true },
  XJ: { code: 'XJ', name: 'Thai AirAsia X', country: 'Thailand', bookingUrl: 'https://www.airasia.com/flight/th/th', airAsiaGroup: true },
  VZ: { code: 'VZ', name: 'Thai VietJet Air', country: 'Thailand', bookingUrl: 'https://th.vietjetair.com/' },
  SL: { code: 'SL', name: 'Thai Lion Air', country: 'Thailand', bookingUrl: 'https://www.lionairthai.com/' },
  DD: { code: 'DD', name: 'Nok Air', country: 'Thailand', bookingUrl: 'https://www.nokair.com/' },

  // AirAsia Group / Southeast Asia
  AK: { code: 'AK', name: 'AirAsia Malaysia', country: 'Malaysia', bookingUrl: 'https://www.airasia.com/flight/th/th', airAsiaGroup: true },
  D7: { code: 'D7', name: 'AirAsia X', country: 'Malaysia', bookingUrl: 'https://www.airasia.com/flight/th/th', airAsiaGroup: true },
  QZ: { code: 'QZ', name: 'Indonesia AirAsia', country: 'Indonesia', bookingUrl: 'https://www.airasia.com/flight/th/th', airAsiaGroup: true },
  Z2: { code: 'Z2', name: 'Philippines AirAsia', country: 'Philippines', bookingUrl: 'https://www.airasia.com/flight/th/th', airAsiaGroup: true },
  KT: { code: 'KT', name: 'AirAsia Cambodia', country: 'Cambodia', bookingUrl: 'https://www.airasia.com/flight/th/th', airAsiaGroup: true },

  // Singapore / Malaysia / Brunei / Indonesia
  SQ: { code: 'SQ', name: 'Singapore Airlines', country: 'Singapore', bookingUrl: 'https://www.singaporeair.com/' },
  TR: { code: 'TR', name: 'Scoot', country: 'Singapore', bookingUrl: 'https://www.flyscoot.com/' },
  MH: { code: 'MH', name: 'Malaysia Airlines', country: 'Malaysia', bookingUrl: 'https://www.malaysiaairlines.com/' },
  OD: { code: 'OD', name: 'Batik Air Malaysia', country: 'Malaysia', bookingUrl: 'https://www.batikair.com.my/' },
  GA: { code: 'GA', name: 'Garuda Indonesia', country: 'Indonesia', bookingUrl: 'https://www.garuda-indonesia.com/' },
  ID: { code: 'ID', name: 'Batik Air Indonesia', country: 'Indonesia', bookingUrl: 'https://www.batikair.com/' },
  BI: { code: 'BI', name: 'Royal Brunei Airlines', country: 'Brunei', bookingUrl: 'https://www.flyroyalbrunei.com/' },

  // Vietnam
  VN: { code: 'VN', name: 'Vietnam Airlines', country: 'Vietnam', bookingUrl: 'https://www.vietnamairlines.com/' },
  VJ: { code: 'VJ', name: 'VietJet Air', country: 'Vietnam', bookingUrl: 'https://www.vietjetair.com/' },

  // Japan
  JL: { code: 'JL', name: 'Japan Airlines', country: 'Japan', bookingUrl: 'https://www.jal.co.jp/' },
  NH: { code: 'NH', name: 'ANA', country: 'Japan', bookingUrl: 'https://www.ana.co.jp/' },
  ZG: { code: 'ZG', name: 'ZIPAIR', country: 'Japan', bookingUrl: 'https://www.zipair.net/' },
  MM: { code: 'MM', name: 'Peach Aviation', country: 'Japan', bookingUrl: 'https://www.flypeach.com/' },
  GK: { code: 'GK', name: 'Jetstar Japan', country: 'Japan', bookingUrl: 'https://www.jetstar.com/' },

  // South Korea
  KE: { code: 'KE', name: 'Korean Air', country: 'South Korea', bookingUrl: 'https://www.koreanair.com/' },
  OZ: { code: 'OZ', name: 'Asiana Airlines', country: 'South Korea', bookingUrl: 'https://flyasiana.com/' },
  '7C': { code: '7C', name: 'Jeju Air', country: 'South Korea', bookingUrl: 'https://www.jejuair.net/' },
  LJ: { code: 'LJ', name: 'Jin Air', country: 'South Korea', bookingUrl: 'https://www.jinair.com/' },
  TW: { code: 'TW', name: "T'way Air", country: 'South Korea', bookingUrl: 'https://www.twayair.com/' },
  YP: { code: 'YP', name: 'Air Premia', country: 'South Korea', bookingUrl: 'https://www.airpremia.com/' },

  // Hong Kong / Macau
  CX: { code: 'CX', name: 'Cathay Pacific', country: 'Hong Kong', bookingUrl: 'https://www.cathaypacific.com/' },
  UO: { code: 'UO', name: 'HK Express', country: 'Hong Kong', bookingUrl: 'https://www.hkexpress.com/' },
  HX: { code: 'HX', name: 'Hong Kong Airlines', country: 'Hong Kong', bookingUrl: 'https://www.hongkongairlines.com/' },
  NX: { code: 'NX', name: 'Air Macau', country: 'Macau', bookingUrl: 'https://www.airmacau.com.mo/' },

  // Taiwan
  BR: { code: 'BR', name: 'EVA Air', country: 'Taiwan', bookingUrl: 'https://www.evaair.com/' },
  CI: { code: 'CI', name: 'China Airlines', country: 'Taiwan', bookingUrl: 'https://www.china-airlines.com/' },
  JX: { code: 'JX', name: 'STARLUX Airlines', country: 'Taiwan', bookingUrl: 'https://www.starlux-airlines.com/' },

  // Mainland China
  CA: { code: 'CA', name: 'Air China', country: 'China', bookingUrl: 'https://www.airchina.com.cn/' },
  MU: { code: 'MU', name: 'China Eastern Airlines', country: 'China', bookingUrl: 'https://www.ceair.com/' },
  CZ: { code: 'CZ', name: 'China Southern Airlines', country: 'China', bookingUrl: 'https://www.csair.com/' },
  MF: { code: 'MF', name: 'XiamenAir', country: 'China', bookingUrl: 'https://www.xiamenair.com/' },
  HU: { code: 'HU', name: 'Hainan Airlines', country: 'China', bookingUrl: 'https://www.hainanairlines.com/' },
  HO: { code: 'HO', name: 'Juneyao Air', country: 'China', bookingUrl: 'https://www.juneyaoair.com/' },
  '9C': { code: '9C', name: 'Spring Airlines', country: 'China', bookingUrl: 'https://en.ch.com/' },

  // Philippines
  PR: { code: 'PR', name: 'Philippine Airlines', country: 'Philippines', bookingUrl: 'https://www.philippineairlines.com/' },
  '5J': { code: '5J', name: 'Cebu Pacific', country: 'Philippines', bookingUrl: 'https://www.cebupacificair.com/' },

  // India / South Asia
  AI: { code: 'AI', name: 'Air India', country: 'India', bookingUrl: 'https://www.airindia.com/' },
  IX: { code: 'IX', name: 'Air India Express', country: 'India', bookingUrl: 'https://www.airindiaexpress.com/' },
  '6E': { code: '6E', name: 'IndiGo', country: 'India', bookingUrl: 'https://www.goindigo.in/' },
  UL: { code: 'UL', name: 'SriLankan Airlines', country: 'Sri Lanka', bookingUrl: 'https://www.srilankan.com/' },

  // Cambodia / Laos / Myanmar
  K6: { code: 'K6', name: 'Air Cambodia', country: 'Cambodia', bookingUrl: 'https://www.aircambodia.com/' },
  QV: { code: 'QV', name: 'Lao Airlines', country: 'Laos', bookingUrl: 'https://www.laoairlines.com/' },
  '8M': { code: '8M', name: 'Myanmar Airways International', country: 'Myanmar', bookingUrl: 'https://www.maiair.com/' },
};

const ROUTE_FALLBACKS: Record<string, RouteAirlineFallback[]> = {
  // Verified public direct route pages. These are used only when the price-discovery
  // provider has no cached fare for the exact requested date.
  'DMK-SNO': [{
    code: 'FD',
    routeBookingUrl: 'https://www.airasia.com/flights/th/th/from-bangkok-dmk-to-sakon-nakhon-sno/',
    note: 'มีเที่ยวบินตรงในเส้นทางนี้ ตรวจราคาและที่นั่งล่าสุดกับ AirAsia',
  }],
  'SNO-DMK': [{
    code: 'FD',
    routeBookingUrl: 'https://www.airasia.com/flights/th/th/from-sakon-nakhon-sno-to-bangkok-dmk/',
    note: 'มีเที่ยวบินตรงในเส้นทางนี้ ตรวจราคาและที่นั่งล่าสุดกับ AirAsia',
  }],
};

export function getAirline(code?: string | null): AirlineInfo | null {
  if (!code) return null;
  return AIRLINES[String(code).trim().toUpperCase()] || null;
}

export function airlineDisplayName(code?: string | null): string {
  const airline = getAirline(code);
  return airline?.name || (code ? `สายการบิน ${String(code).toUpperCase()}` : 'สายการบิน');
}

export function getRouteFallbackAirlines(origin?: string | null, destination?: string | null): RouteAirlineFallback[] {
  if (!origin || !destination) return [];
  return ROUTE_FALLBACKS[`${String(origin).toUpperCase()}-${String(destination).toUpperCase()}`] || [];
}

export function buildDirectBookingUrl(code?: string | null, routeBookingUrl?: string | null): string | null {
  const airline = getAirline(code);
  if (!airline) return null;

  if (airline.airAsiaGroup) {
    // Public affiliate links are not secrets. When Partnerize approves TripDeal,
    // put the approved AirAsia tracking/deep-link URL in this Vite variable.
    const affiliateUrl = import.meta.env.VITE_AIRASIA_AFFILIATE_URL as string | undefined;
    if (affiliateUrl?.trim()) return affiliateUrl.trim();
  }

  if (routeBookingUrl?.trim()) return routeBookingUrl.trim();
  return airline.bookingUrl;
}

export function isAirAsiaAffiliateReady(code?: string | null): boolean {
  const airline = getAirline(code);
  const affiliateUrl = import.meta.env.VITE_AIRASIA_AFFILIATE_URL as string | undefined;
  return Boolean(airline?.airAsiaGroup && affiliateUrl?.trim());
}

export const supportedAirlineCount = Object.keys(AIRLINES).length;
