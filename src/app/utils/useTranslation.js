"use client";

import { useLanguage } from '@/app/context/LanguageContext';
import en from '../../../locales/en.json';
import ar from '../../../locales/ar.json';

const translations = { en, ar };

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  return { t };
};