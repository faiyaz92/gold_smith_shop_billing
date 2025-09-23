import en from '../../../locales/en.json';
import ar from '../../../locales/ar.json';
import { useLanguage } from '../context/LanguageContext';

export function useTranslation() {
  const { language } = useLanguage();
  const messages = language === 'ar' ? ar : en;
  const t = (key) => messages[key] || key;
  return { t, language };
}