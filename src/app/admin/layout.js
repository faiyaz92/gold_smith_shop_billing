import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata = {
  title: 'Admin Panel | SAF PERFUMES',
  description: 'Admin dashboard for managing SAF PERFUMES.',
};

export default function AdminLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Prevent Search Engines from Indexing Admin Panel */}
        <meta name="robots" content="noindex, nofollow" />
        <meta name="description" content="Admin dashboard for managing SAF PERFUMES." />
        <title>Admin Panel | SAF PERFUMES</title>
      </head>
  <body className={`${inter.className} min-h-screen flex flex-col bg-black text-yellow-400`}>

        {children}
      </body>
    </html>
  );
}