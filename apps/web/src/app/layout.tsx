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
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}
