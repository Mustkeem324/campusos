import React from 'react';
import './globals.css';

export const metadata = {
  title: 'CampusOS — Enterprise Multi-Tenant University ERP',
  description: 'Production-grade Campus and Student ERP platform for universities.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  );
}
