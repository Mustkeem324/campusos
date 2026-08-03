'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2, Building, ShieldCheck, HeadphonesIcon, Users, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../../lib/auth-store';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  
  const router = useRouter();
  const { setSession } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to login.');
      }

      if (data.mfaRequired) {
        sessionStorage.setItem('mfaUserId', data.userId);
        router.push('/mfa');
        return;
      }

      setSession(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (persona: string) => {
    setError('');
    setDemoLoading(persona);

    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Demo login is temporarily unavailable. Please try again.');
      }

      setSession(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDemoLoading(null);
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
            <span className="font-bold text-2xl tracking-tight">CampusOS</span>
          </div>

          <h1 className="text-4xl font-bold leading-tight mb-6">
            The unified operating system for modern education.
          </h1>
          <p className="text-lg text-blue-200 mb-12 max-w-xl">
            Empower your institution with a secure, scalable, and intuitive platform designed to manage academics, admissions, and campus life.
          </p>

          <div className="space-y-6 mb-12">
            <div className="flex items-start gap-4">
              <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Enterprise-grade Security</h3>
                <p className="text-blue-200 text-sm mt-1">SOC2 Type II certified with end-to-end encryption for all student data.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Building className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white">Multi-Campus Ready</h3>
                <p className="text-blue-200 text-sm mt-1">Manage multiple branches, colleges, and departments from a single dashboard.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-white">99.99% Uptime Guarantee</h3>
                <p className="text-blue-200 text-sm mt-1">Reliable infrastructure built to handle peak admission and registration seasons.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Small UI Preview (Simplified using basic shapes, no gradients) */}
        <div className="w-full max-w-lg bg-[#152243] border border-[#233563] rounded-lg p-4 shadow-2xl mb-12 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#233563] pb-3">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#233563]"></div>
              <div className="w-3 h-3 rounded-full bg-[#233563]"></div>
              <div className="w-3 h-3 rounded-full bg-[#233563]"></div>
            </div>
            <div className="h-4 w-24 bg-[#233563] rounded"></div>
          </div>
          <div className="flex gap-4">
            <div className="w-1/4 h-24 bg-[#233563] rounded"></div>
            <div className="w-3/4 flex flex-col gap-2">
              <div className="h-4 w-full bg-[#233563] rounded"></div>
              <div className="h-4 w-5/6 bg-[#233563] rounded"></div>
              <div className="h-4 w-4/6 bg-[#233563] rounded"></div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-sm text-blue-300">
          <HeadphonesIcon className="w-5 h-5" />
          <span>Need help? Contact your institution&apos;s IT support desk or email <a href="mailto:support@campusos.com" className="text-white underline hover:text-blue-200">support@campusos.com</a></span>
        </div>
      </div>

      {/* Right Side: 45% White Form Area */}
      <div className="w-full lg:w-[45%] flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16 relative">
        {/* Back to Home Link */}
        <div className="absolute top-8 left-8 sm:top-12 sm:left-12">
          <Link href="/" className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-2 transition-colors">
            ← Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md mt-12 sm:mt-0">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-white">
              C
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900">CampusOS</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-gray-600">Please enter your credentials to access your account.</p>
          </div>

          {/* Demo Login Cards */}
          <div className="mb-10 w-full">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Quick Demo Login</h3>
              <p className="text-sm text-gray-600 mt-1">Explore CampusOS using a fictional demonstration institution. Select a role to open its complete workspace.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ADMIN */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">Admin</h4>
                    <p className="text-xs text-gray-500 font-medium">Aarav Mehta</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono mb-2 truncate" title="admin.demo@campusos.local">admin.demo@campusos.local</p>
                <p className="text-xs text-gray-600 mb-4 flex-grow">Explore institution management, academics, finance, operations, users and reports.</p>
                <button 
                  type="button" 
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('ADMIN')}
                  className="w-full py-2.5 px-4 text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {demoLoading === 'ADMIN' ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Opening Admin workspace...</>
                  ) : 'Continue as Admin'}
                </button>
              </div>

              {/* FACULTY */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">Faculty</h4>
                    <p className="text-xs text-gray-500 font-medium">Dr. Priya Sharma</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono mb-2 truncate" title="faculty.demo@campusos.local">faculty.demo@campusos.local</p>
                <p className="text-xs text-gray-600 mb-4 flex-grow">Explore courses, timetable, attendance, assignments, grading and student progress.</p>
                <button 
                  type="button" 
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('FACULTY')}
                  className="w-full py-2.5 px-4 text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {demoLoading === 'FACULTY' ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Opening Faculty workspace...</>
                  ) : 'Continue as Faculty'}
                </button>
              </div>

              {/* STUDENT */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">Student</h4>
                    <p className="text-xs text-gray-500 font-medium">Rohan Verma</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono mb-2 truncate" title="student.demo@campusos.local">student.demo@campusos.local</p>
                <p className="text-xs text-gray-600 mb-4 flex-grow">Explore learning, attendance, timetable, assignments, results, fees and services.</p>
                <button 
                  type="button" 
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('STUDENT')}
                  className="w-full py-2.5 px-4 text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {demoLoading === 'STUDENT' ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Opening Student workspace...</>
                  ) : 'Continue as Student'}
                </button>
              </div>

              {/* PARENT */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 leading-tight">Parent</h4>
                    <p className="text-xs text-gray-500 font-medium">Anita Verma</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-mono mb-2 truncate" title="parent.demo@campusos.local">parent.demo@campusos.local</p>
                <p className="text-xs text-gray-600 mb-4 flex-grow">Explore linked-student attendance, fees, results, notices and academic progress.</p>
                <button 
                  type="button" 
                  disabled={demoLoading !== null}
                  onClick={() => handleDemoLogin('PARENT')}
                  className="w-full py-2.5 px-4 text-sm font-bold bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-lg border border-gray-200 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {demoLoading === 'PARENT' ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Opening Parent workspace...</>
                  ) : 'Continue as Parent'}
                </button>
              </div>
            </div>
            
            <div className="mt-8 flex items-center justify-center">
              <div className="h-px bg-gray-200 flex-grow"></div>
              <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Or sign in manually</span>
              <div className="h-px bg-gray-200 flex-grow"></div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-4 rounded bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div>{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
                placeholder="name@university.edu"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900">
                  Password
                </label>
                <Link href="/forgot-password" className="text-sm font-medium text-blue-600 hover:text-blue-800">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-600"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/signup/institution" className="font-semibold text-blue-600 hover:text-blue-800">
                Sign up here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Institution Admin?{' '}
              <Link href="/institution-login" className="font-semibold text-blue-600 hover:text-blue-800">
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
