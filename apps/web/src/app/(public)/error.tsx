'use client';
import Link from 'next/link';
import { useEffect } from 'react';

export default function PublicError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error('Public route error:', error); }, [error]);
  return <div className="mx-auto max-w-2xl px-5 py-20 text-center"><p className="text-xs font-bold tracking-[.16em] text-blue-800">CAMPUSOS</p><h1 className="mt-3 text-3xl font-semibold">We couldn’t load this page.</h1><p className="mt-4 text-slate-600">Please try again. If the issue continues, contact CampusOS support with the page address.</p><div className="mt-7 flex justify-center gap-3"><button onClick={reset} className="min-h-11 rounded-md bg-blue-700 px-5 py-3 text-sm font-semibold text-white">Try again</button><Link href="/" className="min-h-11 rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-800">Return home</Link></div></div>;
}
