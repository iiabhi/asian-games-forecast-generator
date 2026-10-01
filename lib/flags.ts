// IOC/NOC code -> display name + flag emoji. IOC codes often differ from ISO codes, so this is explicit.
// `page` is the Wikipedia article name used for "<page> at the 2026 Asian Games".
interface Noc { name: string; flag: string; page?: string }

export const NOCS: Record<string, Noc> = {
  AFG: { name: "Afghanistan", flag: "🇦🇫" },
  BAN: { name: "Bangladesh", flag: "🇧🇩" },
  BHR: { name: "Bahrain", flag: "🇧🇭" },
  BRU: { name: "Brunei", flag: "🇧🇳" },
  CAM: { name: "Cambodia", flag: "🇰🇭" },
  CHN: { name: "China", flag: "🇨🇳" },
  HKG: { name: "Hong Kong, China", flag: "🇭🇰", page: "Hong Kong" },
  INA: { name: "Indonesia", flag: "🇮🇩" },
  IND: { name: "India", flag: "🇮🇳" },
  IRI: { name: "Iran", flag: "🇮🇷" },
  IRQ: { name: "Iraq", flag: "🇮🇶" },
  JOR: { name: "Jordan", flag: "🇯🇴" },
  JPN: { name: "Japan", flag: "🇯🇵" },
  KAZ: { name: "Kazakhstan", flag: "🇰🇿" },
  KGZ: { name: "Kyrgyzstan", flag: "🇰🇬" },
  KOR: { name: "South Korea", flag: "🇰🇷" },
  KSA: { name: "Saudi Arabia", flag: "🇸🇦" },
  KUW: { name: "Kuwait", flag: "🇰🇼" },
  LAO: { name: "Laos", flag: "🇱🇦" },
  LBN: { name: "Lebanon", flag: "🇱🇧" },
  MAC: { name: "Macau, China", flag: "🇲🇴", page: "Macau" },
  MAS: { name: "Malaysia", flag: "🇲🇾" },
  MDV: { name: "Maldives", flag: "🇲🇻" },
  MGL: { name: "Mongolia", flag: "🇲🇳" },
  MYA: { name: "Myanmar", flag: "🇲🇲" },
  NEP: { name: "Nepal", flag: "🇳🇵" },
  OMN: { name: "Oman", flag: "🇴🇲" },
  PAK: { name: "Pakistan", flag: "🇵🇰" },
  PHI: { name: "Philippines", flag: "🇵🇭" },
  PRK: { name: "North Korea", flag: "🇰🇵" },
  QAT: { name: "Qatar", flag: "🇶🇦" },
  SGP: { name: "Singapore", flag: "🇸🇬" },
  SRI: { name: "Sri Lanka", flag: "🇱🇰" },
  SYR: { name: "Syria", flag: "🇸🇾" },
  THA: { name: "Thailand", flag: "🇹🇭" },
  TJK: { name: "Tajikistan", flag: "🇹🇯" },
  TKM: { name: "Turkmenistan", flag: "🇹🇲" },
  TPE: { name: "Chinese Taipei", flag: "🇹🇼" },
  UAE: { name: "United Arab Emirates", flag: "🇦🇪" },
  UZB: { name: "Uzbekistan", flag: "🇺🇿" },
  VIE: { name: "Vietnam", flag: "🇻🇳" },
  YEM: { name: "Yemen", flag: "🇾🇪" },
  PLE: { name: "Palestine", flag: "🇵🇸" },
  BHU: { name: "Bhutan", flag: "🇧🇹" },
  TLS: { name: "Timor-Leste", flag: "🇹🇱" },
  ART: { name: "Refugee Team", flag: "🏳️", page: "Refugee Team" },
};

export function nocInfo(code: string): { name: string; flag: string; page: string } {
  const n = NOCS[code];
  if (!n) {
    console.warn(`[flags] unknown NOC code ${code}: using fallback flag`);
    return { name: code, flag: "🏳️", page: code };
  }
  return { name: n.name, flag: n.flag, page: n.page ?? n.name };
}
