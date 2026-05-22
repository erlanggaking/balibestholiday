// 20 bahasa internasional yang paling banyak digunakan
export const locales = [
  'en', // English
  'id', // Indonesian (Bahasa Indonesia)
  'zh', // Chinese (Simplified)
  'ja', // Japanese
  'ko', // Korean
  'ar', // Arabic (RTL)
  'ru', // Russian
  'fr', // French
  'de', // German
  'es', // Spanish
  'pt', // Portuguese
  'it', // Italian
  'nl', // Dutch
  'tr', // Turkish
  'hi', // Hindi
  'th', // Thai
  'vi', // Vietnamese
  'ms', // Malay
  'pl', // Polish
  'fa', // Persian/Farsi (RTL)
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const rtlLocales: Locale[] = ['ar', 'fa'];

export interface LanguageMeta {
  code: Locale;
  name: string;       // English name
  nativeName: string; // Native name
  flag: string;       // emoji flag
  isRtl: boolean;
}

export const languages: LanguageMeta[] = [
  { code: 'en', name: 'English',    nativeName: 'English',    flag: '🇬🇧', isRtl: false },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', isRtl: false },
  { code: 'zh', name: 'Chinese',    nativeName: '中文',        flag: '🇨🇳', isRtl: false },
  { code: 'ja', name: 'Japanese',   nativeName: '日本語',      flag: '🇯🇵', isRtl: false },
  { code: 'ko', name: 'Korean',     nativeName: '한국어',      flag: '🇰🇷', isRtl: false },
  { code: 'ar', name: 'Arabic',     nativeName: 'العربية',     flag: '🇸🇦', isRtl: true  },
  { code: 'ru', name: 'Russian',    nativeName: 'Русский',     flag: '🇷🇺', isRtl: false },
  { code: 'fr', name: 'French',     nativeName: 'Français',    flag: '🇫🇷', isRtl: false },
  { code: 'de', name: 'German',     nativeName: 'Deutsch',     flag: '🇩🇪', isRtl: false },
  { code: 'es', name: 'Spanish',    nativeName: 'Español',     flag: '🇪🇸', isRtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português',   flag: '🇵🇹', isRtl: false },
  { code: 'it', name: 'Italian',    nativeName: 'Italiano',    flag: '🇮🇹', isRtl: false },
  { code: 'nl', name: 'Dutch',      nativeName: 'Nederlands',  flag: '🇳🇱', isRtl: false },
  { code: 'tr', name: 'Turkish',    nativeName: 'Türkçe',      flag: '🇹🇷', isRtl: false },
  { code: 'hi', name: 'Hindi',      nativeName: 'हिन्दी',        flag: '🇮🇳', isRtl: false },
  { code: 'th', name: 'Thai',       nativeName: 'ไทย',          flag: '🇹🇭', isRtl: false },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt',  flag: '🇻🇳', isRtl: false },
  { code: 'ms', name: 'Malay',      nativeName: 'Bahasa Melayu', flag: '🇲🇾', isRtl: false },
  { code: 'pl', name: 'Polish',     nativeName: 'Polski',      flag: '🇵🇱', isRtl: false },
  { code: 'fa', name: 'Persian',    nativeName: 'فارسی',        flag: '🇮🇷', isRtl: true  },
];
