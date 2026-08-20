export type MonthName =
  | 'Janeiro'
  | 'Fevereiro'
  | 'Março'
  | 'Abril'
  | 'Maio'
  | 'Junho'
  | 'Julho'
  | 'Agosto'
  | 'Setembro'
  | 'Outubro'
  | 'Novembro'
  | 'Dezembro';

export type FormatType = 'Físico' | 'Kindle' | 'PDF' | 'Audible' | 'Archive.org' | 'Físico/Audible';

export type LanguageType = 'Português' | 'Inglês' | 'Espanhol' | 'Outros' | 'Não informado';

export type ContinentType = 'América do Sul' | 'América do Norte' | 'Europa' | 'Ásia' | 'Oceania' | 'África';

export interface FichamentoItem {
  id: string;
  page: string;  // e.g. "p. 45" or "102-108"
  text: string;  // quote, excerpt, or notes
}

export interface FichamentoData {
  reference?: string; // Cabeçalho simples para a referência bibliográfica
  items: FichamentoItem[];
}

export interface Book {
  id: number;              // Numeric sequential ID (#1, #2...)
  readingYear: number;     // Reading log year (e.g., 2023, 2024, 2025)
  yearBookId?: number;     // Annual counter (#1, #2... per year)
  monthId: number;         // Monthly sequential counter (#1, #2 per month)
  month: MonthName;        // Reading month
  title: string;           // Book title
  author: string;          // Author name
  year: number;            // Publication year
  pages: number;           // Page count
  nationality: string;     // Country of author (e.g. "Rússia", "Argentina")
  continent: ContinentType;// Continent
  format: FormatType;      // Format used
  language: LanguageType;  // Reading language, or explicitly unknown when absent from the source
  rating: number;          // 1 to 6 stars
  coverUrl?: string;       // Cover image URL or null
  notes?: string;          // Optional user notes
  genre?: string;          // Optional literary genre
  status?: 'read' | 'reading' | 'wishlist'; // Status of reading (default: 'read')
  fichamento?: FichamentoData; // Fichamento de leitura
}

export type TabType = 'journal' | 'reading' | 'dashboard' | 'matrix' | 'table' | 'wrapped' | 'wishlist';

export interface CountryStat {
  country: string;
  flag: string;
  continent: ContinentType;
  volume: number;          // Total books read from this country
  uniqueAuthors: number;   // Unique authors from this country
  authorsList: string[];   // List of authors
  booksList: Book[];       // Books from this country
}

export interface DashboardStats {
  totalBooks: number;
  totalPages: number;
  uniqueAuthors: number;
  uniqueCountries: number;
  averagePages: number;
  averageRating: number;
  byFormat: Record<string, number>;
  byLanguage: Record<string, number>;
  byContinent: Record<string, number>;
  byDecade: Record<string, number>;
  byRating: Record<number, number>;
}
