'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, AlertCircle, Clock, BookOpen } from 'lucide-react';

const roles = [
  { id: 'leadership', label: 'Leadership' },
  { id: 'admin', label: 'Administrator' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'student', label: 'Student' },
  { id: 'parent', label: 'Parent' },
  { id: 'finance', label: 'Finance' }
];

export function RoleExperienceSection() {
  const [activeRole, setActiveRole] = useState('student');

  return (
    <section className="bg-[#101B33] py-24 md:py-32 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 xl:px-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-white mb-8">
            Tailored experiences for every role
          </h2>
          
          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2 max-w-[800px] mx-auto">
            {roles.map(role => (
              <button
                key={role.id}
                onClick={() => setActiveRole(role.id)}
                className={`h-[44px] px-5 rounded-lg text-[15px] font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#1854E8] ${
                  activeRole === role.id 
                    ? 'bg-white text-[#101B33]' 
                    : 'bg-transparent text-[#BEC7D7] hover:bg-white/10 hover:text-white border border-transparent hover:border-white/20'
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>
        </div>

        {/* Role Content Box */}
        <div className="bg-[#182642] border border-[#2A3B5C] rounded-2xl p-6 md:p-10 lg:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-5 flex flex-col">
              {activeRole === 'student' && (
                <>
                  <h3 className="text-3xl font-bold text-white mb-4">Student Workspace</h3>
                  <p className="text-[16px] text-[#BEC7D7] leading-[1.6] mb-8">
                    Empower students with a unified portal to track attendance, submit assignments, pay fees, and access course materials securely from any device.
                  </p>
                  <div className="flex flex-col gap-4 mb-10">
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Live timetable and online classes
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Real-time attendance tracking
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Assessment and results portal
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Fee payment gateway
                    </div>
                  </div>
                  <Link 
                    href="/roles/students" 
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-white hover:text-[#BEC7D7] transition-colors"
                  >
                    Explore student experience <ArrowRight size={18} />
                  </Link>
                </>
              )}

              {activeRole === 'faculty' && (
                <>
                  <h3 className="text-3xl font-bold text-white mb-4">Faculty Portal</h3>
                  <p className="text-[16px] text-[#BEC7D7] leading-[1.6] mb-8">
                    Equip educators with the tools they need to manage classrooms, grade assessments, and track student outcomes without administrative overhead.
                  </p>
                  <div className="flex flex-col gap-4 mb-10">
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Fast attendance entry
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Assignment grading rubric
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Student at-risk alerts
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Leave and payroll access
                    </div>
                  </div>
                  <Link 
                    href="/roles/faculty" 
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-white hover:text-[#BEC7D7] transition-colors"
                  >
                    Explore faculty experience <ArrowRight size={18} />
                  </Link>
                </>
              )}

              {/* Fallback for other roles for now */}
              {['leadership', 'admin', 'parent', 'finance'].includes(activeRole) && (
                <>
                  <h3 className="text-3xl font-bold text-white mb-4 capitalize">{activeRole} Portal</h3>
                  <p className="text-[16px] text-[#BEC7D7] leading-[1.6] mb-8">
                    Purpose-built tools and dashboards designed specifically for the workflows, permissions, and data requirements of {activeRole}s.
                  </p>
                  <div className="flex flex-col gap-4 mb-10">
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Role-specific analytics
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Secure data isolation
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Custom approval workflows
                    </div>
                    <div className="flex items-center gap-3 text-[15px] text-white">
                      <CheckCircle2 size={18} className="text-[#078A57]" /> Actionable alerts
                    </div>
                  </div>
                  <Link 
                    href={`/roles/${activeRole}s`} 
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-white hover:text-[#BEC7D7] transition-colors"
                  >
                    Explore {activeRole} experience <ArrowRight size={18} />
                  </Link>
                </>
              )}
            </div>

            {/* Right Preview */}
            <div className="lg:col-span-7 flex justify-center lg:justify-end">
              <div className="w-full max-w-[700px] bg-white rounded-xl shadow-2xl overflow-hidden border border-[#DEE5EF] flex flex-col">
                <div className="h-12 border-b border-[#DEE5EF] bg-white flex items-center px-4 justify-between">
                  <div className="font-semibold text-[14px] text-[#101828]">
                    {activeRole === 'student' ? 'Student Dashboard' : activeRole === 'faculty' ? 'Faculty Portal' : 'Dashboard'}
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#DEE5EF]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#DEE5EF]"></div>
                    <div className="w-3 h-3 rounded-full bg-[#DEE5EF]"></div>
                  </div>
                </div>

                <div className="p-5 bg-[#F5F7FB] flex-1">
                  {activeRole === 'student' && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-[#DEE5EF]">
                          <div className="text-[11px] text-[#5F6B7A] mb-1">Overall Attendance</div>
                          <div className="text-[18px] font-bold text-[#101828]">88.5%</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#DEE5EF]">
                          <div className="text-[11px] text-[#5F6B7A] mb-1">Fee Status</div>
                          <div className="text-[12px] font-bold text-[#078A57] bg-[#e6f4ed] inline-block px-1.5 py-0.5 rounded mt-1">Paid</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#DEE5EF] hidden md:block">
                          <div className="text-[11px] text-[#5F6B7A] mb-1">Upcoming Exam</div>
                          <div className="text-[13px] font-bold text-[#101828]">In 12 Days</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#DEE5EF] hidden md:block">
                          <div className="text-[11px] text-[#5F6B7A] mb-1">Library Dues</div>
                          <div className="text-[13px] font-bold text-[#101828]">₹0</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg border border-[#DEE5EF]">
                          <h4 className="text-[13px] font-semibold mb-3">Today&apos;s Timetable</h4>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-3 p-2 bg-[#F5F7FB] rounded border-l-2 border-[#1854E8]">
                              <Clock size={14} className="text-[#5F6B7A]" />
                              <div>
                                <div className="text-[12px] font-semibold">10:00 AM - Physics Lab</div>
                                <div className="text-[10px] text-[#5F6B7A]">Prof. Sharma • Room 302</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-2 bg-[#EEF3FF] rounded border-l-2 border-[#1854E8]">
                              <BookOpen size={14} className="text-[#1854E8]" />
                              <div>
                                <div className="text-[12px] font-semibold">11:30 AM - Calculus I <span className="bg-[#1854E8] text-white text-[9px] px-1 rounded ml-1">Live</span></div>
                                <div className="text-[10px] text-[#5F6B7A]">Prof. Gupta • Online</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-[#DEE5EF]">
                          <h4 className="text-[13px] font-semibold mb-3">Pending Assignments</h4>
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between p-2 border border-[#DEE5EF] rounded">
                              <div>
                                <div className="text-[12px] font-semibold">Physics Lab Report</div>
                                <div className="text-[10px] text-[#D66A00]">Due Tomorrow</div>
                              </div>
                              <button className="text-[11px] bg-[#1854E8] text-white px-2 py-1 rounded">Submit</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeRole === 'faculty' && (
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border border-[#DEE5EF]">
                          <div className="text-[11px] text-[#5F6B7A] mb-1">Today&apos;s Classes</div>
                          <div className="text-[18px] font-bold text-[#101828]">4</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#DEE5EF]">
                          <div className="text-[11px] text-[#5F6B7A] mb-1">Pending Grading</div>
                          <div className="text-[18px] font-bold text-[#D66A00]">28</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-[#DEE5EF] col-span-2">
                          <div className="text-[11px] text-[#5F6B7A] mb-1">Next Class</div>
                          <div className="text-[13px] font-bold text-[#101828]">10:00 AM - Data Structures (B.Tech Y2)</div>
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-lg border border-[#DEE5EF]">
                        <h4 className="text-[13px] font-semibold mb-3 flex items-center justify-between">
                          <span>Mark Attendance - Data Structures</span>
                          <span className="text-[#1854E8] text-[11px]">Select All Present</span>
                        </h4>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between p-2 border border-[#DEE5EF] rounded bg-[#F5F7FB]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#DEE5EF]"></div>
                              <span className="text-[12px] font-semibold">Aarav Patel (CS001)</span>
                            </div>
                            <div className="flex gap-1">
                              <span className="bg-[#078A57] text-white text-[10px] px-2 py-1 rounded">P</span>
                              <span className="bg-white border border-[#DEE5EF] text-[#5F6B7A] text-[10px] px-2 py-1 rounded">A</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 border border-[#DEE5EF] rounded">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#DEE5EF]"></div>
                              <span className="text-[12px] font-semibold">Diya Sharma (CS002)</span>
                            </div>
                            <div className="flex gap-1">
                              <span className="bg-white border border-[#DEE5EF] text-[#5F6B7A] text-[10px] px-2 py-1 rounded">P</span>
                              <span className="bg-[#D92D20] text-white text-[10px] px-2 py-1 rounded">A</span>
                            </div>
                          </div>
                        </div>
                        <button className="w-full mt-3 bg-[#1854E8] text-white text-[12px] font-semibold py-2 rounded">Submit Attendance</button>
                      </div>
                    </div>
                  )}

                  {['leadership', 'admin', 'parent', 'finance'].includes(activeRole) && (
                    <div className="flex flex-col gap-4">
                      <div className="bg-white p-6 rounded-lg border border-[#DEE5EF] flex items-center justify-center min-h-[250px]">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-full bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center mx-auto mb-3">
                            <CheckCircle2 size={24} />
                          </div>
                          <div className="text-[14px] font-semibold text-[#101828] mb-1">{activeRole} Dashboard Preview</div>
                          <div className="text-[12px] text-[#5F6B7A]">Interactive preview loading...</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
