import { Book, CountryStat, ContinentType, DashboardStats, FormatType, LanguageType } from '../types';

export const MONTHS_LIST = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
] as const;

export const COUNTRY_FLAG_MAP: Record<string, { flag: string; code: string; continent: ContinentType }> = {
  // América do Sul
  'Brasil': { flag: '🇧🇷', code: 'br', continent: 'América do Sul' },
  'Argentina': { flag: '🇦🇷', code: 'ar', continent: 'América do Sul' },
  'Uruguai': { flag: '🇺🇾', code: 'uy', continent: 'América do Sul' },
  'Colômbia': { flag: '🇨🇴', code: 'co', continent: 'América do Sul' },
  'Chile': { flag: '🇨🇱', code: 'cl', continent: 'América do Sul' },
  'Peru': { flag: '🇵🇪', code: 'pe', continent: 'América do Sul' },
  'Equador': { flag: '🇪🇨', code: 'ec', continent: 'América do Sul' },
  'Venezuela': { flag: '🇻🇪', code: 've', continent: 'América do Sul' },
  'Paraguai': { flag: '🇵🇾', code: 'py', continent: 'América do Sul' },
  'Bolívia': { flag: '🇧🇴', code: 'bo', continent: 'América do Sul' },

  // América do Norte & Caribe
  'Estados Unidos': { flag: '🇺🇸', code: 'us', continent: 'América do Norte' },
  'EUA': { flag: '🇺🇸', code: 'us', continent: 'América do Norte' },
  'Canadá': { flag: '🇨🇦', code: 'ca', continent: 'América do Norte' },
  'México': { flag: '🇲🇽', code: 'mx', continent: 'América do Norte' },
  'Cuba': { flag: '🇨🇺', code: 'cu', continent: 'América do Norte' },
  'Porto Rico': { flag: '🇵🇷', code: 'pr', continent: 'América do Norte' },
  'Guatemala': { flag: '🇬🇹', code: 'gt', continent: 'América do Norte' },
  'Costa Rica': { flag: '🇨🇷', code: 'cr', continent: 'América do Norte' },

  // Europa
  'Rússia': { flag: '🇷🇺', code: 'ru', continent: 'Europa' },
  'Noruega': { flag: '🇳🇴', code: 'no', continent: 'Europa' },
  'França': { flag: '🇫🇷', code: 'fr', continent: 'Europa' },
  'Espanha': { flag: '🇪🇸', code: 'es', continent: 'Europa' },
  'Reino Unido': { flag: '🇬🇧', code: 'gb', continent: 'Europa' },
  'Inglaterra': { flag: '🇬🇧', code: 'gb', continent: 'Europa' },
  'Escócia': { flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', code: 'gb-sct', continent: 'Europa' },
  'Grécia': { flag: '🇬🇷', code: 'gr', continent: 'Europa' },
  'Bélgica': { flag: '🇧🇪', code: 'be', continent: 'Europa' },
  'Holanda': { flag: '🇳🇱', code: 'nl', continent: 'Europa' },
  'Países Baixos': { flag: '🇳🇱', code: 'nl', continent: 'Europa' },
  'Hungria': { flag: '🇭🇺', code: 'hu', continent: 'Europa' },
  'Alemanha': { flag: '🇩🇪', code: 'de', continent: 'Europa' },
  'Áustria': { flag: '🇦🇹', code: 'at', continent: 'Europa' },
  'Irlanda': { flag: '🇮🇪', code: 'ie', continent: 'Europa' },
  'Suíça': { flag: '🇨🇭', code: 'ch', continent: 'Europa' },
  'Suiça': { flag: '🇨🇭', code: 'ch', continent: 'Europa' },
  'Itália': { flag: '🇮🇹', code: 'it', continent: 'Europa' },
  'Portugal': { flag: '🇵🇹', code: 'pt', continent: 'Europa' },
  'Suécia': { flag: '🇸🇪', code: 'se', continent: 'Europa' },
  'Finlândia': { flag: '🇫🇮', code: 'fi', continent: 'Europa' },
  'Dinamarca': { flag: '🇩🇰', code: 'dk', continent: 'Europa' },
  'Polônia': { flag: '🇵🇱', code: 'pl', continent: 'Europa' },
  'República Tcheca': { flag: '🇨🇿', code: 'cz', continent: 'Europa' },
  'Tchequia': { flag: '🇨🇿', code: 'cz', continent: 'Europa' },
  'Ucrânia': { flag: '🇺🇦', code: 'ua', continent: 'Europa' },

  // Ásia
  'Japão': { flag: '🇯🇵', code: 'jp', continent: 'Ásia' },
  'China': { flag: '🇨🇳', code: 'cn', continent: 'Ásia' },
  'Coreia do Sul': { flag: '🇰🇷', code: 'kr', continent: 'Ásia' },
  'Índia': { flag: '🇮🇳', code: 'in', continent: 'Ásia' },
  'Israel': { flag: '🇮🇱', code: 'il', continent: 'Ásia' },
  'Turquia': { flag: '🇹🇷', code: 'tr', continent: 'Ásia' },
  'Irã': { flag: '🇮🇷', code: 'ir', continent: 'Ásia' },

  // Oceania
  'Austrália': { flag: '🇦🇺', code: 'au', continent: 'Oceania' },
  'Nova Zelândia': { flag: '🇳🇿', code: 'nz', continent: 'Oceania' },

  // África
  'Nigéria': { flag: '🇳🇬', code: 'ng', continent: 'África' },
  'Egito': { flag: '🇪🇬', code: 'eg', continent: 'África' },
  'África do Sul': { flag: '🇿🇦', code: 'za', continent: 'África' },
  'Quênia': { flag: '🇰🇪', code: 'ke', continent: 'África' },
  'Marrocos': { flag: '🇲🇦', code: 'ma', continent: 'África' },
  'Angola': { flag: '🇦🇴', code: 'ao', continent: 'África' },
  'Moçambique': { flag: '🇲🇿', code: 'mz', continent: 'África' },
};

// Remove accents & lowercase for fuzzy match
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export const COUNTRY_NAMES_LIST = Object.keys(COUNTRY_FLAG_MAP).filter(
  (c) => !['EUA', 'Suiça', 'Inglaterra', 'Países Baixos', 'Tchequia'].includes(c)
).sort((a, b) => a.localeCompare(b, 'pt-BR'));

export function getCountryFlag(countryName: string): string {
  if (!countryName) return '🌐';
  const clean = countryName.trim();
  if (COUNTRY_FLAG_MAP[clean]) {
    return COUNTRY_FLAG_MAP[clean].flag;
  }
  // Try normalized lookup
  const normInput = normalizeString(clean);
  for (const [key, val] of Object.entries(COUNTRY_FLAG_MAP)) {
    if (normalizeString(key) === normInput) {
      return val.flag;
    }
  }
  return '🌐';
}

export function getCountryCode(countryName: string): string {
  if (!countryName) return '';
  const clean = countryName.trim();
  if (COUNTRY_FLAG_MAP[clean]) {
    return COUNTRY_FLAG_MAP[clean].code;
  }
  const normInput = normalizeString(clean);
  for (const [key, val] of Object.entries(COUNTRY_FLAG_MAP)) {
    if (normalizeString(key) === normInput) {
      return val.code;
    }
  }
  return '';
}

export function getCountryContinent(countryName: string): ContinentType {
  if (!countryName) return 'Europa';
  const clean = countryName.trim();
  if (COUNTRY_FLAG_MAP[clean]) {
    return COUNTRY_FLAG_MAP[clean].continent;
  }
  // Try normalized lookup
  const normInput = normalizeString(clean);
  for (const [key, val] of Object.entries(COUNTRY_FLAG_MAP)) {
    if (normalizeString(key) === normInput) {
      return val.continent;
    }
  }
  return 'Europa';
}

export function getDecade(year: number): string {
  if (!year) return 'Desconhecido';
  if (year < 1900) return 'Séc. XIX ou anterior';
  const decadeStart = Math.floor(year / 10) * 10;
  return `Anos ${decadeStart}`;
}

export function calculateCountryStats(books: Book[]): CountryStat[] {
  const map: Record<string, { volume: number; authors: Set<string>; books: Book[] }> = {};

  books.forEach(book => {
    const country = book.nationality.trim() || 'Desconhecido';
    if (!map[country]) {
      map[country] = { volume: 0, authors: new Set(), books: [] };
    }
    map[country].volume += 1;
    map[country].authors.add(book.author.trim());
    map[country].books.push(book);
  });

  return Object.entries(map).map(([country, data]) => ({
    country,
    flag: getCountryFlag(country),
    continent: getCountryContinent(country),
    volume: data.volume,
    uniqueAuthors: data.authors.size,
    authorsList: Array.from(data.authors),
    booksList: data.books,
  })).sort((a, b) => b.volume - a.volume || b.uniqueAuthors - a.uniqueAuthors);
}

export function calculateDashboardStats(books: Book[]): DashboardStats {
  const totalBooks = books.length;
  const totalPages = books.reduce((acc, b) => acc + (b.pages || 0), 0);
  const authorsSet = new Set(books.map(b => b.author.trim()));
  const countriesSet = new Set(books.map(b => b.nationality.trim()).filter(Boolean));

  const averagePages = totalBooks > 0 ? Math.round(totalPages / totalBooks) : 0;
  const averageRating = totalBooks > 0
    ? Number((books.reduce((acc, b) => acc + (b.rating || 0), 0) / totalBooks).toFixed(1))
    : 0;

  const byFormat: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};
  const byContinent: Record<string, number> = {};
  const byDecade: Record<string, number> = {};
  const byRating: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  books.forEach(b => {
    // Format
    byFormat[b.format] = (byFormat[b.format] || 0) + 1;
    // Language
    byLanguage[b.language] = (byLanguage[b.language] || 0) + 1;
    // Continent
    const cont = b.continent || getCountryContinent(b.nationality);
    byContinent[cont] = (byContinent[cont] || 0) + 1;
    // Decade
    const dec = getDecade(b.year);
    byDecade[dec] = (byDecade[dec] || 0) + 1;
    // Rating
    if (b.rating >= 1 && b.rating <= 6) {
      byRating[b.rating] = (byRating[b.rating] || 0) + 1;
    }
  });

  return {
    totalBooks,
    totalPages,
    uniqueAuthors: authorsSet.size,
    uniqueCountries: countriesSet.size,
    averagePages,
    averageRating,
    byFormat,
    byLanguage,
    byContinent,
    byDecade,
    byRating
  };
}

// Generate cover background gradient style based on book id or title
export function getCoverGradient(id: number, title: string): string {
  const gradients = [
    'from-slate-800 via-indigo-950 to-slate-900 text-amber-100',
    'from-amber-900 via-amber-950 to-stone-900 text-amber-50',
    'from-emerald-900 via-teal-950 to-slate-900 text-emerald-100',
    'from-rose-950 via-red-950 to-neutral-900 text-rose-100',
    'from-blue-950 via-slate-900 to-sky-950 text-blue-100',
    'from-purple-950 via-zinc-900 to-indigo-950 text-purple-100',
    'from-stone-800 via-amber-950 to-neutral-900 text-amber-100',
  ];
  const charSum = title.split('').reduce((acc, c) => acc + c.charCodeAt(0), id);
  return gradients[charSum % gradients.length];
}

export interface ContinentColors {
  name: string;
  colorName: string;
  bgTranslucent: string;
  bgHover: string;
  bgActive: string;
  border: string;
  borderActive: string;
  text: string;
  badge: string;
  badgeLight: string;
  solidBg: string;
}

export function getContinentColors(continent: string): ContinentColors {
  const norm = normalizeString(continent || '');
  if (norm.includes('america')) {
    return {
      name: 'América',
      colorName: 'verde',
      bgTranslucent: 'bg-emerald-500/15',
      bgHover: 'hover:bg-emerald-500/25',
      bgActive: 'bg-emerald-500/30',
      border: 'border-emerald-500/30',
      borderActive: 'border-emerald-400',
      text: 'text-emerald-300',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      badgeLight: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      solidBg: 'bg-emerald-500',
    };
  }
  if (norm.includes('europa')) {
    return {
      name: 'Europa',
      colorName: 'azul',
      bgTranslucent: 'bg-blue-500/15',
      bgHover: 'hover:bg-blue-500/25',
      bgActive: 'bg-blue-500/30',
      border: 'border-blue-500/30',
      borderActive: 'border-blue-400',
      text: 'text-blue-300',
      badge: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
      badgeLight: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30',
      solidBg: 'bg-blue-500',
    };
  }
  if (norm.includes('africa')) {
    return {
      name: 'África',
      colorName: 'ocre',
      bgTranslucent: 'bg-amber-600/15',
      bgHover: 'hover:bg-amber-600/25',
      bgActive: 'bg-amber-600/30',
      border: 'border-amber-600/30',
      borderActive: 'border-amber-400',
      text: 'text-amber-300',
      badge: 'bg-amber-600/15 text-amber-300 border-amber-600/30',
      badgeLight: 'bg-amber-600/10 dark:bg-amber-600/20 text-amber-800 dark:text-amber-300 border-amber-600/30',
      solidBg: 'bg-amber-600',
    };
  }
  if (norm.includes('asia')) {
    return {
      name: 'Ásia',
      colorName: 'vermelho',
      bgTranslucent: 'bg-rose-500/15',
      bgHover: 'hover:bg-rose-500/25',
      bgActive: 'bg-rose-500/30',
      border: 'border-rose-500/30',
      borderActive: 'border-rose-400',
      text: 'text-rose-300',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      badgeLight: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
      solidBg: 'bg-rose-500',
    };
  }
  if (norm.includes('oceania')) {
    return {
      name: 'Oceania',
      colorName: 'turquesa',
      bgTranslucent: 'bg-cyan-500/15',
      bgHover: 'hover:bg-cyan-500/25',
      bgActive: 'bg-cyan-500/30',
      border: 'border-cyan-500/30',
      borderActive: 'border-cyan-400',
      text: 'text-cyan-300',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      badgeLight: 'bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      solidBg: 'bg-cyan-500',
    };
  }
  return {
    name: continent || 'Outro',
    colorName: 'neutral',
    bgTranslucent: 'bg-stone-800/40',
    bgHover: 'hover:bg-stone-800/60',
    bgActive: 'bg-stone-700',
    border: 'border-stone-700',
    borderActive: 'border-stone-400',
    text: 'text-stone-300',
    badge: 'bg-stone-800/40 text-stone-300 border-stone-700',
    badgeLight: 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700',
    solidBg: 'bg-stone-600',
  };
}
