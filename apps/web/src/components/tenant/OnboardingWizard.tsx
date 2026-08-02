'use client';

import React, { useState } from 'react';
import { Building2, Sparkles, Calendar, CheckCircle2, ChevronRight, Upload } from 'lucide-react';

export function OnboardingWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    institutionName: 'Apex Technological University',
    subdomain: 'apex',
    primaryColor: '#4f46e5',
    secondaryColor: '#06b6d4',
    academicYear: '2026-2027',
    termCount: 2,
  });
  const [isCompleted, setIsCompleted] = useState(false);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else setIsCompleted(true);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl max-w-2xl mx-auto">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-indigo-500" />
            <span>Institution Onboarding & Setup Wizard</span>
          </h2>
          <p className="text-xs text-gray-500">Step {step} of 3 • Tenant Configuration</p>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`w-8 h-2 rounded-full transition-all ${
                s <= step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>
      </div>

      {!isCompleted ? (
        <div className="space-y-5">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs uppercase font-bold text-gray-400">Basic Information</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Institution Legal Name
                </label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Subdomain Slug
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    className="flex-1 px-3 py-2 rounded-l-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-xs font-mono text-gray-600 dark:text-gray-300 rounded-r-xl">
                    .campusos.edu
                  </span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs uppercase font-bold text-gray-400">Branding & Theme Tokens</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Primary Brand Color
                  </label>
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Secondary Color
                  </label>
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                    className="w-full h-10 rounded-xl cursor-pointer bg-transparent border-none"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Drag & drop institution logo PNG/SVG (Max 5MB)
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-xs uppercase font-bold text-gray-400">Academic Calendar Setup</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Academic Year Title
                </label>
                <input
                  type="text"
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Terms Per Year
                </label>
                <select
                  value={formData.termCount}
                  onChange={(e) => setFormData({ ...formData, termCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={2}>2 Semester System</option>
                  <option value={3}>3 Trimester System</option>
                  <option value={4}>4 Quarter System</option>
                </select>
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-800">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-extrabold shadow-lg hover:bg-indigo-700 transition"
            >
              <span>{step === 3 ? 'Complete Setup' : 'Continue'}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="py-8 text-center space-y-3 animate-fade-in">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Institution Onboarding Complete!
          </h3>
          <p className="text-xs text-gray-500">
            Domain: <span className="font-mono text-indigo-500">{formData.subdomain}.campusos.edu</span> • Tenant ID generated cleanly.
          </p>
        </div>
      )}
    </div>
  );
}
