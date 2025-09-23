"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AdminLanguageContext = createContext();

export const AdminLanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    const storedLang = typeof window !== "undefined" ? localStorage.getItem("adminLang") : null;
    if (storedLang) setLanguage(storedLang);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("adminLang", language);
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  const changeLanguage = (lang) => setLanguage(lang);

  return (
    <AdminLanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </AdminLanguageContext.Provider>
  );
};

export const useAdminLanguage = () => {
  const ctx = useContext(AdminLanguageContext);
  if (!ctx) throw new Error("useAdminLanguage must be used within an AdminLanguageProvider");
  return ctx;
};