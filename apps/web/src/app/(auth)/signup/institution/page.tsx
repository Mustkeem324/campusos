'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, ChevronRight, ChevronLeft, Building, Users, Briefcase, Settings2, Cloud, FileText, Loader2, Server } from 'lucide-react';

const STEPS = [
  { id: 1, name: 'Details', icon: Building },
  { id: 2, name: 'Profile', icon: Users },
  { id: 3, name: 'Contact', icon: Briefcase },
  { id: 4, name: 'Modules', icon: Settings2 },
  { id: 5, name: 'Deployment', icon: Cloud },
  { id: 6, name: 'Review', icon: FileText },
];

export default function InstitutionSignupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    legalName: '',
    institutionType: '',
    country: '',
    city: '',
    officialEmail: '',
    // Step 2
    campuses: '1',
    students: '',
    currentErp: '',
    // Step 3
    contactFirstName: '',
    contactLastName: '',
    contactRole: '',
    contactPhone: '',
    // Step 4
    modules: [] as string[],
    // Step 5
    deploymentType: 'saas',
    // Step 6
    consent: false,
  });

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleModule = (module: string) => {
    setFormData(prev => {
      if (prev.modules.includes(module)) {
        return { ...prev, modules: prev.modules.filter(m => m !== module) };
      }
      return { ...prev, modules: [...prev.modules, module] };
    });
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit registration');

      // Success, redirect to email verification
      router.push(`/verify-email?email=${encodeURIComponent(formData.officialEmail)}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-2xl">
              C
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Register Your Institution</h1>
          <p className="mt-2 text-gray-600">Join CampusOS to streamline your educational operations.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 -z-10 transition-all duration-300"
              style={{ width: `\${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
            ></div>
            
            {STEPS.map((step) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-white \${
                    isActive ? 'border-blue-600 text-blue-600' : 
                    isCompleted ? 'border-blue-600 bg-blue-600 text-white' : 
                    'border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-semibold \${isActive || isCompleted ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 sm:p-10">
            {error && (
              <div className="mb-6 p-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Step 1: Institution Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Institution Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Legal Institution Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.legalName}
                      onChange={e => updateForm('legalName', e.target.value)}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      placeholder="e.g. University of Example"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Institution Type</label>
                      <select 
                        value={formData.institutionType}
                        onChange={e => updateForm('institutionType', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white"
                      >
                        <option value="">Select type...</option>
                        <option value="university">University</option>
                        <option value="college">College</option>
                        <option value="k12">K-12 School</option>
                        <option value="vocational">Vocational / Trade School</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Official Email Domain / Address</label>
                      <input 
                        type="email" 
                        value={formData.officialEmail}
                        onChange={e => updateForm('officialEmail', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                        placeholder="admin@university.edu"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Country</label>
                      <input 
                        type="text" 
                        value={formData.country}
                        onChange={e => updateForm('country', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">City</label>
                      <input 
                        type="text" 
                        value={formData.city}
                        onChange={e => updateForm('city', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Organisation Profile */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Organisation Profile</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Number of Campuses</label>
                      <input 
                        type="number" 
                        min="1"
                        value={formData.campuses}
                        onChange={e => updateForm('campuses', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Total Students (Approx)</label>
                      <select 
                        value={formData.students}
                        onChange={e => updateForm('students', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none bg-white"
                      >
                        <option value="">Select range...</option>
                        <option value="1-500">1 - 500</option>
                        <option value="501-2000">501 - 2,000</option>
                        <option value="2001-10000">2,001 - 10,000</option>
                        <option value="10000+">10,000+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-1.5">Current ERP / SIS System</label>
                    <input 
                      type="text" 
                      value={formData.currentErp}
                      onChange={e => updateForm('currentErp', e.target.value)}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      placeholder="Leave blank if none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Primary Contact */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Primary Admin Contact</h2>
                <p className="text-sm text-gray-600 mb-6">This person will receive the initial setup credentials and verification email.</p>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">First Name</label>
                      <input 
                        type="text" 
                        value={formData.contactFirstName}
                        onChange={e => updateForm('contactFirstName', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Last Name</label>
                      <input 
                        type="text" 
                        value={formData.contactLastName}
                        onChange={e => updateForm('contactLastName', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Job Role / Title</label>
                      <input 
                        type="text" 
                        value={formData.contactRole}
                        onChange={e => updateForm('contactRole', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                        placeholder="e.g. IT Director, Dean"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-1.5">Phone Number</label>
                      <input 
                        type="tel" 
                        value={formData.contactPhone}
                        onChange={e => updateForm('contactPhone', e.target.value)}
                        className="w-full px-4 py-2.5 rounded border border-gray-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Modules */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Requirements</h2>
                <p className="text-sm text-gray-600 mb-6">Select the modules you plan to deploy. (You can change this later)</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: 'academics', name: 'Academics & Grading', desc: 'Curriculum, transcripts, and gradebooks' },
                    { id: 'admissions', name: 'Admissions & CRM', desc: 'Applicant tracking and enrollment' },
                    { id: 'finance', name: 'Finance & Billing', desc: 'Fee collection and accounting' },
                    { id: 'hr', name: 'HR & Payroll', desc: 'Staff management and payroll' },
                    { id: 'library', name: 'Library Management', desc: 'Catalog, circulation, and digital assets' },
                    { id: 'hostel', name: 'Hostel & Transport', desc: 'Accommodation and fleet management' }
                  ].map(mod => (
                    <div 
                      key={mod.id}
                      onClick={() => toggleModule(mod.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors \${
                        formData.modules.includes(mod.id) 
                          ? 'border-blue-600 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 \${
                          formData.modules.includes(mod.id) ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                        }`}>
                          {formData.modules.includes(mod.id) && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{mod.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{mod.desc}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Deployment */}
            {currentStep === 5 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Deployment Preference</h2>
                
                <div className="space-y-4">
                  <div 
                    onClick={() => updateForm('deploymentType', 'saas')}
                    className={`p-5 rounded-lg border-2 cursor-pointer transition-colors flex items-start gap-4 \${
                      formData.deploymentType === 'saas' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="p-3 bg-white rounded-full border border-gray-200 shadow-sm shrink-0">
                      <Cloud className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">CampusOS Cloud (SaaS)</h4>
                      <p className="text-sm text-gray-600 mt-1">Fully managed, secure cloud hosting. Zero infrastructure maintenance. Recommended for most institutions.</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => updateForm('deploymentType', 'onprem')}
                    className={`p-5 rounded-lg border-2 cursor-pointer transition-colors flex items-start gap-4 \${
                      formData.deploymentType === 'onprem' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="p-3 bg-white rounded-full border border-gray-200 shadow-sm shrink-0">
                      <Server className="w-6 h-6 text-gray-700" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Self-Hosted Enterprise</h4>
                      <p className="text-sm text-gray-600 mt-1">Deploy on your own AWS/Azure/GCP infrastructure or on-premise servers. Requires custom enterprise SLA.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Review & Consent */}
            {currentStep === 6 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Complete</h2>
                
                <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-gray-500 mb-1">Institution</span>
                      <span className="font-semibold text-gray-900">{formData.legalName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Primary Email</span>
                      <span className="font-semibold text-gray-900">{formData.officialEmail || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Admin Contact</span>
                      <span className="font-semibold text-gray-900">{formData.contactFirstName} {formData.contactLastName}</span>
                    </div>
                    <div>
                      <span className="block text-gray-500 mb-1">Deployment</span>
                      <span className="font-semibold text-gray-900">{formData.deploymentType === 'saas' ? 'Cloud SaaS' : 'Self-Hosted'}</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={formData.consent}
                    onChange={e => updateForm('consent', e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I confirm that I am authorized to register this institution. I agree to the CampusOS Master Subscription Agreement, Privacy Policy, and Data Processing Addendum.
                  </span>
                </label>
              </div>
            )}
          </div>
          
          <div className="px-8 py-5 sm:px-10 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1 || loading}
              className={`px-5 py-2.5 rounded font-semibold flex items-center gap-2 transition-colors \${
                currentStep === 1 ? 'opacity-0 cursor-default' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            {currentStep < 6 ? (
              <button
                onClick={nextStep}
                className="px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!formData.consent || loading}
                className="px-6 py-2.5 rounded bg-green-600 hover:bg-green-700 text-white font-bold transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Registration'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
