import React from 'react';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, ArrowRight, Search, Bell, Settings, Clock, AlertCircle } from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

export function HeroSection() {
  return (
    <section className="bg-[#F7F9FD] pt-16 pb-16 md:pt-20 md:pb-20 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-14 xl:gap-20 items-center">
          
          {/* LEFT COLUMN: ~42% (5/12) */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <span className="text-[12px] md:text-[13px] font-semibold text-[#1854E8] tracking-[0.08em] uppercase mb-4 block">
              CONNECTED TECHNOLOGY FOR HIGHER EDUCATION
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-[58px] xl:text-[64px] font-bold text-[#101B33] leading-[1.1] mb-6 max-w-[580px]">
              Run your entire institution from one connected platform
            </h1>
            <p className="text-[17px] md:text-[18px] text-[#5F6B7A] leading-[1.6] mb-8 max-w-[560px]">
              CampusOS connects academics, admissions, finance, people, campus operations, communication, analytics and student services in one secure university operating system.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link 
                href="/demo" 
                className="h-[50px] w-full sm:w-auto sm:px-8 rounded-lg bg-[#1854E8] hover:bg-[#123FC0] text-white font-semibold flex items-center justify-center transition-colors shadow-sm"
              >
                Book a personalised demo
              </Link>
              <Link 
                href="/platform/academics" 
                className="h-[50px] w-full sm:w-auto sm:px-8 rounded-lg bg-white border border-[#C9D3E1] text-[#1854E8] font-semibold hover:bg-[#F5F7FB] flex items-center justify-center transition-colors shadow-sm"
              >
                Explore the platform
              </Link>
            </div>
            
            <div className="mb-10">
              <Link href="/login" className="text-[#1854E8] font-semibold hover:text-[#123FC0] flex items-center gap-1.5 transition-colors">
                Student or staff sign in <ArrowRight size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-[13px] font-medium text-[#5F6B7A]">
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#078A57]" /> Secure multi-tenant architecture</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#078A57]" /> Role-based access</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#078A57]" /> English and Hindi support</span>
              <span className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#078A57]" /> Mobile-ready</span>
            </div>
          </div>

          {/* RIGHT COLUMN: ~58% (7/12) - DASHBOARD PREVIEW */}
          <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
            <div className="w-full max-w-[860px] aspect-[16/10] bg-white rounded-2xl border border-[#DEE5EF] shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden flex flex-col relative">
              
              {/* Header */}
              <div className="h-14 border-b border-[#DEE5EF] flex items-center justify-between px-6 bg-white z-10 shrink-0">
                <div><div className="font-semibold text-[15px] text-[#101828]">Good morning, Dr. Priya.</div><div className="text-[10px] font-medium uppercase tracking-wider text-[#8A95A6]">Demonstration workspace</div></div>
                <div className="flex items-center gap-4 text-[#5F6B7A]">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F7FB] rounded-md border border-[#DEE5EF] text-[13px] font-medium">
                    Today
                  </div>
                  <Search size={18} className="cursor-pointer hover:text-[#101828]" />
                  <Bell size={18} className="cursor-pointer hover:text-[#101828]" />
                  <Settings size={18} className="cursor-pointer hover:text-[#101828]" />
                  <div className="w-8 h-8 rounded-full bg-[#1854E8] text-white flex items-center justify-center font-bold text-sm ml-2">P</div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex flex-1 overflow-hidden bg-[#F5F7FB]">
                {/* Sidebar */}
                <div className="w-[200px] bg-white border-r border-[#DEE5EF] flex flex-col p-4 shrink-0 hidden sm:flex">
                  <div className="flex items-center mb-8 px-2">
                    <Logo className="w-5 h-5" showText={true} />
                  </div>
                  
                  <nav className="flex flex-col gap-1 text-[13px] font-medium text-[#5F6B7A]">
                    <div className="px-3 py-2 bg-[#EEF3FF] text-[#1854E8] rounded-md">Overview</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">Academics</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">Admissions</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">Finance</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">Operations</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">People & HR</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">Communication</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">Analytics</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">AI Assistant</div>
                    <div className="px-3 py-2 hover:bg-[#F5F7FB] rounded-md">Settings</div>
                  </nav>
                </div>

                {/* Dashboard grid */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-[#DEE5EF] p-4 shadow-sm">
                      <div className="text-[12px] font-medium text-[#5F6B7A] mb-2">Today's Classes</div>
                      <div className="text-[20px] font-bold text-[#101828]">6 Sessions</div>
                    </div>
                    <div className="bg-white rounded-xl border border-[#DEE5EF] p-4 shadow-sm">
                      <div className="text-[12px] font-medium text-[#5F6B7A] mb-2">Attendance Rate</div>
                      <div className="flex items-end gap-2">
                        <div className="text-[20px] font-bold text-[#101828]">94.2%</div>
                        <div className="text-[11px] font-semibold text-[#078A57] bg-[#e6f4ed] px-1.5 py-0.5 rounded mb-1">+1.2%</div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-[#DEE5EF] p-4 shadow-sm hidden md:block">
                      <div className="text-[12px] font-medium text-[#5F6B7A] mb-2">Fee Collection</div>
                      <div className="text-[20px] font-bold text-[#101828]">₹2.4Cr</div>
                    </div>
                    <div className="bg-white rounded-xl border border-[#DEE5EF] p-4 shadow-sm hidden md:block">
                      <div className="text-[12px] font-medium text-[#5F6B7A] mb-2">Admissions</div>
                      <div className="flex items-end gap-2">
                        <div className="text-[20px] font-bold text-[#101828]">1,240</div>
                        <div className="text-[11px] font-semibold text-[#D66A00] bg-[#fdf0e6] px-1.5 py-0.5 rounded mb-1">Open</div>
                      </div>
                    </div>
                  </div>

                  {/* Main content grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 min-h-0">
                    <div className="col-span-2 flex flex-col gap-6">
                      <div className="bg-white rounded-xl border border-[#DEE5EF] p-5 shadow-sm flex-1">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-[14px] text-[#101828]">Today's Schedule</h3>
                          <span className="text-[#1854E8] text-[12px] font-medium cursor-pointer">View full timetable</span>
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex gap-3 items-start">
                            <div className="w-[45px] pt-1 text-[11px] font-semibold text-[#5F6B7A] text-right">09:00</div>
                            <div className="flex-1 bg-[#F5F7FB] border-l-2 border-[#1854E8] rounded px-3 py-2">
                              <div className="text-[13px] font-semibold text-[#101828]">CS-301 Data Structures</div>
                              <div className="text-[11px] text-[#5F6B7A]">Lab 4 • B.Tech Y2</div>
                            </div>
                          </div>
                          <div className="flex gap-3 items-start">
                            <div className="w-[45px] pt-1 text-[11px] font-semibold text-[#5F6B7A] text-right">11:00</div>
                            <div className="flex-1 bg-[#EEF3FF] border-l-2 border-[#1854E8] rounded px-3 py-2">
                              <div className="text-[13px] font-semibold text-[#101828] flex items-center justify-between">
                                CS-305 Algorithms <span className="bg-[#1854E8] text-white text-[10px] px-1.5 py-0.5 rounded">Live Now</span>
                              </div>
                              <div className="text-[11px] text-[#5F6B7A]">Lecture Hall A • B.Tech Y2</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div className="bg-[#101B33] rounded-xl border border-[#101B33] p-4 shadow-sm text-white">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={16} className="text-[#BEC7D7]" />
                          <h3 className="font-semibold text-[13px]">Action Required</h3>
                        </div>
                        <div className="text-[12px] text-[#BEC7D7] mb-3">3 students have attendance below 75% in your CS-301 course.</div>
                        <button className="w-full bg-white text-[#101B33] text-[12px] font-semibold rounded py-1.5">Review Alerts</button>
                      </div>
                      
                      <div className="bg-white rounded-xl border border-[#DEE5EF] p-4 shadow-sm flex-1">
                        <h3 className="font-semibold text-[13px] text-[#101828] mb-3">Open Requests</h3>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-[#5F6B7A]">Leave Approvals</span>
                            <span className="font-semibold text-[#101828]">4</span>
                          </div>
                          <div className="flex items-center justify-between text-[12px]">
                            <span className="text-[#5F6B7A]">Grade Changes</span>
                            <span className="font-semibold text-[#101828]">1</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
