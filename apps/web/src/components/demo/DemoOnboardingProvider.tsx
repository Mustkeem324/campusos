'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  CalendarDays, 
  ReceiptText, 
  GraduationCap, 
  Users,
  ShieldCheck,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export interface TourStep {
  stepNumber: number;
  title: string;
  description: string;
  targetSelector?: string;
  highlightText?: string;
}

const ADMIN_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: 'Institution Operational Overview',
    description: 'Monitor student enrollment, faculty counts, course offerings, and total fee collections across all departments in real time.',
    highlightText: 'Operational Overview Dashboard'
  },
  {
    stepNumber: 2,
    title: 'Action Required Feed',
    description: 'Review pending admission approvals, exception requests, and institutional items requiring immediate admin action.',
    highlightText: 'Action Required Panel'
  },
  {
    stepNumber: 3,
    title: 'Sidebar Module Navigation',
    description: 'Use the left navigation menu to access Academics, Finance, HR & Payroll, Library, Hostel, Transport, and System Settings.',
    highlightText: 'Navigation Sidebar'
  },
  {
    stepNumber: 4,
    title: 'Global Search & Command Palette',
    description: 'Press Cmd+K or click the search bar to search for any student, faculty, course, invoice, or policy document instantly.',
    highlightText: 'Global Search (Cmd+K)'
  },
  {
    stepNumber: 5,
    title: 'Governed Data Warehouse & Reports',
    description: 'Open certified institutional metrics, digital twin scenario planning, and audit telemetry logs.',
    highlightText: 'Analytics & Data Warehouse'
  },
  {
    stepNumber: 6,
    title: 'Fictional Demo Environment Notice',
    description: 'All records, names, and activities shown in this workspace are fictional and isolated within the CDU tenant boundary.',
    highlightText: 'Tenant Isolation Guarantee'
  }
];

const FACULTY_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: 'Today\'s Teaching Schedule',
    description: 'View your daily lecture schedule, assigned lecture halls, and live online learning stages.',
    highlightText: 'Class Timetable'
  },
  {
    stepNumber: 2,
    title: 'Classroom Attendance Entry',
    description: 'Mark daily attendance via mobile or biometric kiosk and automatically flag students below 75%.',
    highlightText: '+ Mark Attendance'
  },
  {
    stepNumber: 3,
    title: 'Assignment Submissions & Grading',
    description: 'Review student lab reports and essays with rubrics, blind grading, and direct mark entry.',
    highlightText: 'Grade Submissions'
  },
  {
    stepNumber: 4,
    title: 'Student At-Risk Interventions',
    description: 'Receive proactive alerts for students struggling with attendance or assignment scores.',
    highlightText: 'At-Risk Early Warnings'
  },
  {
    stepNumber: 5,
    title: 'Course Discussion Forum',
    description: 'Post syllabus announcements, answer student questions, and publish lecture materials.',
    highlightText: 'Community Workspace'
  },
  {
    stepNumber: 6,
    title: 'Faculty AI Teaching Assistant',
    description: 'Use AI to generate custom quiz questions, lesson outlines, and rubric feedback automatically.',
    highlightText: 'Faculty AI Copilot'
  }
];

const STUDENT_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: 'Today\'s Class Schedule & Live Stage',
    description: 'Check your daily lecture timetable and join online classes with 1-click video stages.',
    highlightText: 'Schedule & Live Stage'
  },
  {
    stepNumber: 2,
    title: 'Learning & Assignment Submissions',
    description: 'Access course lessons, download syllabus PDFs, and submit homework before deadlines.',
    highlightText: 'My Learning'
  },
  {
    stepNumber: 3,
    title: 'Attendance & Verified Results',
    description: 'Track your attendance percentage (must stay $\\ge$75%) and view published SGPA/CGPA grade sheets.',
    highlightText: 'Academic Results & Attendance'
  },
  {
    stepNumber: 4,
    title: 'Fee Invoices & Digital Receipts',
    description: 'View semester tuition dues, scholarship credits, and download official tax receipts.',
    highlightText: 'Fees & Receipts'
  },
  {
    stepNumber: 5,
    title: 'Student Benefits & Developer Pack',
    description: 'Claim over $3,500/year in free developer tools (GitHub, JetBrains, AWS) and software licenses.',
    highlightText: 'Student Benefits Hub'
  },
  {
    stepNumber: 6,
    title: 'Ask CampusOS AI Assistant',
    description: 'Ask plain-English questions about your timetable, homework, library books, and exam policies.',
    highlightText: 'Student AI Assistant'
  }
];

const PARENT_STEPS: TourStep[] = [
  {
    stepNumber: 1,
    title: 'Linked Student Overview (Rohan Verma)',
    description: 'View real-time academic standing, attendance, and fee status for your ward, Rohan Verma.',
    highlightText: 'Linked Student Profile'
  },
  {
    stepNumber: 2,
    title: 'Daily Attendance Monitoring',
    description: 'Track daily class presence and receive instant SMS/App alerts if attendance drops below threshold.',
    highlightText: 'Attendance Monitor'
  },
  {
    stepNumber: 3,
    title: 'Published Academic Results',
    description: 'View official semester grade cards, SGPA scores, and course completion progress.',
    highlightText: 'Published Results'
  },
  {
    stepNumber: 4,
    title: 'Fee Invoices & Online Payment',
    description: 'Review outstanding tuition/hostel invoices and pay online securely via UPI or Card.',
    highlightText: 'Fee Payment Gateway'
  },
  {
    stepNumber: 5,
    title: 'University Notices & Circulars',
    description: 'Stay updated with official institutional announcements, holiday calendars, and exam dates.',
    highlightText: 'Notices & Circulars'
  },
  {
    stepNumber: 6,
    title: 'Faculty Contact & Support',
    description: 'Schedule parent-teacher meetings or request support from the Dean of Student Affairs.',
    highlightText: 'Support & Meetings'
  }
];

export function DemoOnboardingProvider({ children }: { children: React.ReactNode }) {
  const { currentSession } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const role = currentSession?.role || 'STUDENT';
  const userId = currentSession?.id || 'demo';
  const storageKey = `campusos_tour_completed_${role}_${userId}`;

  const steps = 
    role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN' ? ADMIN_STEPS :
    role === 'FACULTY' || role === 'HOD' ? FACULTY_STEPS :
    role === 'PARENT' ? PARENT_STEPS :
    STUDENT_STEPS;

  const currentStep = steps[currentStepIndex] || steps[0];

  useEffect(() => {
    if (!currentSession) return;
    const completed = localStorage.getItem(storageKey);
    if (!completed) {
      setIsOpen(true);
    }
  }, [currentSession, storageKey]);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(storageKey, 'true');
    setIsOpen(false);
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
  };

  return (
    <>
      {children}

      {/* Guided Tour Modal Overlay */}
      {isOpen && currentSession && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative border border-[#DEE5EF] text-[#101B33]">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#DEE5EF] pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#EEF3FF] text-[#1854E8] flex items-center justify-center font-bold text-xs">
                  {currentStep.stepNumber}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#1854E8] bg-[#EEF3FF] px-2.5 py-1 rounded border border-[#C6D7FE]">
                  {role.replace('_', ' ')} Tour • Step {currentStep.stepNumber} of {steps.length}
                </span>
              </div>

              <button
                onClick={handleFinish}
                className="text-[#5F6B7A] hover:text-[#101B33] p-1.5 rounded-lg hover:bg-[#F5F7FB] transition-colors"
                title="Skip Onboarding Tour"
              >
                <X size={18} />
              </button>
            </div>

            {/* Step Content */}
            <div className="mb-6">
              <div className="text-xs font-bold text-[#078A57] bg-[#e6f4ed] px-2.5 py-1 rounded inline-block mb-3">
                Focus Area: {currentStep.highlightText}
              </div>
              <h3 id="tour-title" className="text-xl font-bold text-[#101B33] mb-2 leading-snug">
                {currentStep.title}
              </h3>
              <p className="text-sm text-[#5F6B7A] leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            {/* Step Progress Dots */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {steps.map((s, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all ${
                    idx === currentStepIndex 
                      ? 'w-8 bg-[#1854E8]' 
                      : idx < currentStepIndex 
                      ? 'w-2 bg-[#078A57]' 
                      : 'w-2 bg-[#DEE5EF]'
                  }`}
                />
              ))}
            </div>

            {/* Bottom Action Controls */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#DEE5EF]">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl border border-[#DEE5EF] text-xs font-bold text-[#5F6B7A] hover:bg-[#F5F7FB] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleFinish}
                  className="text-xs text-[#5F6B7A] hover:text-[#101B33] font-semibold px-3 py-2"
                >
                  Skip All
                </button>

                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1854E8] hover:bg-[#1140B8] text-white text-xs font-bold transition-colors shadow-md"
                >
                  {currentStepIndex === steps.length - 1 ? (
                    <>Finish Tour <CheckCircle2 size={16} /></>
                  ) : (
                    <>Next Step <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
