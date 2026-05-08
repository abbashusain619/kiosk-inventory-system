import en from '../i18n/en.json';
import sw from '../i18n/sw.json';

const translations: Record<string, any> = { en, sw };

export function getTranslation(lang: string, key: string): string {
  const dict = translations[lang] || translations.en;
  return dict[key] || key;
}

export function getAvailableLanguages() {
  return [
    { code: 'en', name: 'English' },
    { code: 'sw', name: 'Kiswahili' },
  ];
}