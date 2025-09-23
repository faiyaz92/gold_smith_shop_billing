import en from '../../../locales/en.json';
import ar from '../../../locales/ar.json';
import { useAdminLanguage } from '../context/AdminLanguageContext';

export function useAdminTranslation() {
  const { language } = useAdminLanguage();
  const messages = language === 'ar' ? ar : en;
  const t = (key) => messages[key] || key;
  return { t, language };
}