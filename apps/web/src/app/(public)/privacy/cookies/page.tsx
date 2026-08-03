'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Settings, Check, ShieldAlert } from 'lucide-react';

export default function CookiePreferences() {
  const [preferences, setPreferences] = useState({
    strictlyNecessary: true, // Always true
    analytics: false,
    performance: false,
    marketing: false,
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // In a real implementation, this would save to localStorage and an API endpoint
    localStorage.setItem('campusos_cookie_prefs', JSON.stringify(preferences));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  useEffect(() => {
    const savedPrefs = localStorage.getItem('campusos_cookie_prefs');
    if (savedPrefs) {
      try {
        setPreferences(JSON.parse(savedPrefs));
      } catch (e) {}
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F7FB] py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/privacy" className="text-sm font-medium text-[#1854E8] hover:underline flex items-center gap-2 mb-4">
             ← Back to Privacy Centre
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white rounded-lg shadow-sm border border-[#E2E8F0]">
              <Settings className="w-6 h-6 text-[#1854E8]" />
            </div>
            <h1 className="text-3xl font-bold text-[#101B33]">Cookie Preferences</h1>
          </div>
          <p className="text-[#475467] text-lg mt-4 max-w-3xl">
            Control how CampusOS uses cookies and tracking technologies. We only use cookies that are strictly necessary for the platform to function unless you opt-in to optional categories below.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden mb-8">
          <div className="divide-y divide-[#F1F5F9]">
            
            {/* Strictly Necessary */}
            <div className="p-6 sm:p-8 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-[#101B33]">Strictly Necessary Cookies</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475467] text-xs font-semibold uppercase tracking-wider">Required</span>
                  </div>
                  <p className="text-sm text-[#475467] leading-relaxed">
                    These cookies are essential for you to browse the website and use its features, such as accessing secure areas (e.g., logging in, maintaining session state). The platform cannot function without these cookies.
                  </p>
                </div>
                <div className="mt-1">
                  <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#1854E8]">
                    <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="p-6 sm:p-8 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-[#101B33]">Analytics & Measurement</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475467] text-xs font-semibold uppercase tracking-wider">Optional</span>
                  </div>
                  <p className="text-sm text-[#475467] leading-relaxed">
                    These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our platform. They help us to know which pages are the most and least popular. All information these cookies collect is aggregated and therefore anonymous.
                  </p>
                </div>
                <div className="mt-1">
                  <button 
                    onClick={() => setPreferences({...preferences, analytics: !preferences.analytics})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1854E8] focus:ring-offset-2 \${preferences.analytics ? 'bg-[#1854E8]' : 'bg-[#E2E8F0]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition \${preferences.analytics ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="p-6 sm:p-8 hover:bg-[#F8FAFC] transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-[#101B33]">Functional & Performance</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#475467] text-xs font-semibold uppercase tracking-wider">Optional</span>
                  </div>
                  <p className="text-sm text-[#475467] leading-relaxed">
                    These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages.
                  </p>
                </div>
                <div className="mt-1">
                  <button 
                    onClick={() => setPreferences({...preferences, performance: !preferences.performance})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1854E8] focus:ring-offset-2 \${preferences.performance ? 'bg-[#1854E8]' : 'bg-[#E2E8F0]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition \${preferences.performance ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Marketing */}
            <div className="p-6 sm:p-8 hover:bg-[#F8FAFC] transition-colors bg-[#FEF3F2]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-lg font-bold text-[#101B33]">Targeted Marketing</h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#FEE4E2] text-[#B42318] text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3" />
                      Optional
                    </span>
                  </div>
                  <p className="text-sm text-[#475467] leading-relaxed">
                    CampusOS <strong className="text-[#101B33]">does not</strong> use student or institutional data for targeted advertising by default. If enabled, these cookies may be set through our site by our advertising partners to build a profile of your interests (e.g., for admissions marketing or enterprise software solutions).
                  </p>
                </div>
                <div className="mt-1">
                  <button 
                    onClick={() => setPreferences({...preferences, marketing: !preferences.marketing})}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1854E8] focus:ring-offset-2 \${preferences.marketing ? 'bg-[#1854E8]' : 'bg-[#E2E8F0]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition \${preferences.marketing ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

          </div>
          
          <div className="bg-[#F8FAFC] border-t border-[#E2E8F0] p-6 sm:p-8 flex items-center justify-between">
            <div className="text-sm text-[#475467]">
              View our full <Link href="/legal/cookies" className="text-[#1854E8] hover:underline font-medium">Cookie Notice</Link> for detailed provider lists.
            </div>
            <div className="flex items-center gap-4">
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-[#059669] animate-in fade-in">
                  <Check className="w-4 h-4" /> Preferences Saved
                </span>
              )}
              <button 
                onClick={handleSave}
                className="bg-[#1854E8] hover:bg-[#1546C6] text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
