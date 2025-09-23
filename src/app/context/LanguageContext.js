"use client";

import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    // On mount, check localStorage
    const storedLang = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (storedLang) setLanguage(storedLang);
  }, []);

  useEffect(() => {
    // Update localStorage and <html dir> when language changes
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", language);
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  const changeLanguage = (lang) => setLanguage(lang);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
};