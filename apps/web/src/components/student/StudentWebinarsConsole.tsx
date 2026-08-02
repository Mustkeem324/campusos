'use client';

import React from 'react';
import { Video, Calendar, Clock, CheckCircle2, UserCheck } from 'lucide-react';

export function StudentWebinarsConsole() {
  const webinars = [
    {
      id: 'web_1',
      title: 'Building Scalable AI Systems on AWS & Next.js 14',
      speaker: 'Dr. Leslie Lamport (Principal Scientist)',
      date: 'Tomorrow, 5:00 PM IST',
      attendees: 142,
      isRegistered: true,
    },
    {
      id: 'web_2',
      title: 'Global Career Opportunities in Distributed Database Systems',
      speaker: 'Prof. Sarah Vance',
      date: 'Aug 10, 2026, 6:30 PM IST',
      attendees: 98,
      isRegistered: false,
    },
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Video size={20} className="text-rose-500" />
            <span>Institutional Live Webinars & Guest Speaker Series</span>
          </h2>
          <p className="text-xs text-gray-500">
            Join live industry workshops, expert sessions, and technical masterclasses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {webinars.map((w) => (
          <div key={w.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 font-bold text-[10px] uppercase">
                LIVE WEBINAR
              </span>
              <span className="text-gray-400 font-mono text-[10px]">{w.attendees} Attending</span>
            </div>

            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">{w.title}</h3>
              <p className="text-[11px] text-indigo-500 font-bold mt-0.5">{w.speaker}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t font-mono">
              <span className="text-gray-500 flex items-center gap-1 text-[10px]">
                <Clock size={12} /> {w.date}
              </span>
              {w.isRegistered ? (
                <span className="text-emerald-500 font-bold flex items-center gap-1 text-[10px]">
                  <CheckCircle2 size={14} /> Registered
                </span>
              ) : (
                <button className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px]">
                  Register Now
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
