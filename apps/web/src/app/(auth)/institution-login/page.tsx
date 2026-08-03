'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Building2, Server, KeyRound, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function InstitutionLoginPage() {
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subdomain) return;
    
    setError('');
    setLoading(true);

    try {
      // Mock validation of subdomain
      if (subdomain.toLowerCase() === 'invalid') {
        throw new Error('Institution workspace not found. Please check your workspace URL.');
      }
      
      // In a real app, redirect to tenant subdomain or set tenant cookie
      setTimeout(() => {
        router.push(`/login?workspace=${subdomain}`);
      }, 800);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left Side: 55% Navy Support Panel */}
      <div className="hidden lg:flex w-[55%] bg-[#0B132B] flex-col justify-between p-12 text-white">
        <div>
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-xl">
              C
            </div>
            <span className="font-bold text-2xl tracking-tight">CampusOS <span className="text-blue-400">Admin</span></span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6">
            Manage your institution at scale.
          </h1>
          <p className="text-lg text-blue-200 mb-12 max-w-xl">
            Access your dedicated tenant workspace. Configure roles, manage integrations, and oversee all campus operations from the control center.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <Building2 className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Dedicated Workspace</h3>
                <p className="text-blue-200 text-sm mt-1">Isolated tenant data architecture ensuring complete privacy and compliance.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <KeyRound className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Identity & Access</h3>
                <p className="text-blue-200 text-sm mt-1">Configure SSO, SAML, and granular RBAC policies for your entire organization.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Server className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Infrastructure Control</h3>
                <p className="text-blue-200 text-sm mt-1">Monitor usage, view audit logs, and manage storage limits and API quotas.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-blue-300">
          <CheckCircle2 className="w-5 h-5 text-blue-400" />
          <span>System Status: All services operational</span>
        </div>
      </div>

      {/* Right Side: 45% White Form Area */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">CampusOS Admin</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Institution Login</h2>
            <p className="text-gray-600">Enter your institution&apos;s workspace URL to continue.</p>
          </div>

          <form onSubmit={handleContinue} className="space-y-6">
            {error && (
              <div className="p-4 rounded bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="subdomain" className="block text-sm font-semibold text-gray-900 mb-2">
                Workspace URL
              </label>
              <div className="flex items-stretch rounded border border-gray-300 focus-within:ring-2 focus-within:ring-blue-600 focus-within:border-blue-600 transition-colors bg-white overflow-hidden">
                <input
                  id="subdomain"
                  type="text"
                  required
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="w-full px-4 py-3 bg-transparent text-gray-900 outline-none font-medium"
                  placeholder="university-name"
                />
                <div className="flex items-center px-4 bg-gray-50 border-l border-gray-300 text-gray-500 text-sm font-medium whitespace-nowrap">
                  .campusos.com
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !subdomain}
              className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Continue to Workspace <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-200 flex flex-col gap-4 text-center text-sm">
            <p className="text-gray-600">
              Student or Faculty?{' '}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-800">
                Go to standard login
              </Link>
            </p>
            <p className="text-gray-600">
              New to CampusOS?{' '}
              <Link href="/signup/institution" className="font-semibold text-blue-600 hover:text-blue-800">
                Register your institution
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
