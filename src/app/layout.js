import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import { LanguageProvider } from "./context/LanguageContext";
import { AdminLanguageProvider } from "./context/AdminLanguageContext";
import { AccountingProvider } from "./context/AccountingContext";
import { VanSellerProvider } from "./context/VanSellerContext";
import { UserManagementProvider } from "./context/UserManagementContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Perfume Seller - Premium Fragrances",
  description: "Discover the finest collection of premium perfumes and fragrances",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LanguageProvider>
          <CartProvider>
            <AdminLanguageProvider>
              <AccountingProvider>
                <UserManagementProvider>
                  <VanSellerProvider>
                    {children}
                  </VanSellerProvider>
                </UserManagementProvider>
              </AccountingProvider>
            </AdminLanguageProvider>
            
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
