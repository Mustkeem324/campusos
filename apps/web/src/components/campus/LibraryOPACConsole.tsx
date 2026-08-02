'use client';

import React, { useState } from 'react';
import { Library, Search, BookOpen, CheckCircle2, DollarSign } from 'lucide-react';
import { LibraryItem, calculateLibraryFine } from '../../lib/campus-life-service';

export function LibraryOPACConsole() {
  const [books] = useState<LibraryItem[]>([
    { id: 'b1', isbn: '978-0262033848', title: 'Introduction to Algorithms (CLRS)', author: 'Cormen, Leiserson, Rivest', category: 'Computer Science', copiesAvailable: 4, totalCopies: 10 },
    { id: 'b2', isbn: '978-0134685991', title: 'Effective Java (3rd Edition)', author: 'Joshua Bloch', category: 'Software Engineering', copiesAvailable: 2, totalCopies: 5 },
  ]);

  const [overdueFine] = useState(() => calculateLibraryFine('2026-01-25', new Date('2026-02-01'), 1.0));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Library size={20} className="text-amber-500" />
            <span>Library OPAC Catalogue & Barcode Circulation Engine</span>
          </h2>
          <p className="text-xs text-gray-500">
            MARC-lite catalog search, barcode/RFID scanning, auto-calculated late fines
          </p>
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-3">ISBN</th>
              <th className="p-3">Title & Author</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">Availability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {books.map((b) => (
              <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3 font-mono font-bold text-gray-500">{b.isbn}</td>
                <td className="p-3 font-bold text-gray-900 dark:text-white">{b.title} <span className="text-gray-400 font-normal">by {b.author}</span></td>
                <td className="p-3">{b.category}</td>
                <td className="p-3 text-right font-mono font-bold text-emerald-500">
                  {b.copiesAvailable} / {b.totalCopies} Available
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between">
        <span>Overdue Late Fine Calculation Demo (7 Days Overdue @ $1/day):</span>
        <span className="font-mono text-sm font-extrabold text-rose-500">${overdueFine}.00</span>
      </div>
    </div>
  );
}
