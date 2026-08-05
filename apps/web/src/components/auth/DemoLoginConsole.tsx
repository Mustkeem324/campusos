'use client';

import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Info,
  Loader2,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';

interface DemoLoginConsoleProps {
  demoLoading: string | null;
  onDemoLogin: (persona: string) => void;
}

const personas = [
  {
    id: 'ADMIN',
    title: 'Institution Admin',
    name: 'Kavya Menon',
    email: 'admin@nexus-campus.local',
    description: 'Manage institutional configuration, users, academic operations, finance and governance.',
    icon: ShieldCheck,
    capabilities: ['Institution overview', 'Academic configuration', 'Finance and collections', 'Users and permissions'],
  },
  {
    id: 'FACULTY',
    title: 'Faculty',
    name: 'Dr. Priya Sharma',
    email: 'faculty@nexus-campus.local',
    description: 'Review teaching schedules, attendance, assignments, gradebook and student progress.',
    icon: GraduationCap,
    capabilities: ['Teaching schedule', 'Class attendance', 'Assignments and grading', 'Student progress'],
  },
  {
    id: 'STUDENT',
    title: 'Student',
    name: 'Rohan Verma',
    email: 'student@nexus-campus.local',
    description: 'Access classes, learning tasks, attendance, results, fees and campus services.',
    icon: UserCheck,
    capabilities: ['Timetable', 'Learning and submissions', 'Results and attendance', 'Fees and services'],
  },
  {
    id: 'PARENT',
    title: 'Parent',
    name: 'Anita Verma',
    email: 'parent@nexus-campus.local',
    description: 'View authorised attendance, finance, results and notices for a linked synthetic student.',
    icon: Users,
    capabilities: ['Linked student overview', 'Attendance tracker', 'Published results', 'Invoices and dues'],
  },
] as const;

export function DemoLoginConsole({ demoLoading, onDemoLogin }: DemoLoginConsoleProps) {
  return (
    <div className="w-full space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
          Synthetic Campus Workspace
        </div>
        <h3 className="text-xl font-extrabold tracking-[-0.025em] text-[#101B33]">Explore CampusOS by role</h3>
        <p className="mt-2 text-xs leading-5 text-[#5F6B7A]">
          Open one of the primary Nexus Institute accounts. The complete Phase 5 seed includes 17 role accounts and 100 synthetic students.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-[#C6D7FE] bg-[#EEF3FF] p-3 text-xs leading-5 text-[#101B33]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1854E8]" aria-hidden="true" />
        <p>
          <strong className="font-extrabold">Sample environment:</strong> all names, marks, invoices, payments and campus records are synthetic and are not connected to real people.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {personas.map((persona) => {
          const Icon = persona.icon;
          const isLoading = demoLoading === persona.id;

          return (
            <article key={persona.id} className="flex flex-col justify-between rounded-2xl border border-[#DEE5EF] bg-white p-5 shadow-sm transition hover:border-[#1854E8]/50 hover:shadow-[0_14px_34px_rgba(16,29,56,0.08)]">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1854E8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate text-base font-extrabold text-[#101B33]">{persona.title}</h4>
                    <p className="truncate text-xs font-bold text-[#1854E8]">{persona.name}</p>
                  </div>
                </div>

                <p className="mb-3 truncate rounded-lg border border-[#DEE5EF] bg-[#F5F7FB] px-2.5 py-1.5 font-mono text-[11px] text-[#5F6B7A]" title={persona.email}>
                  {persona.email}
                </p>

                <p className="mb-4 text-xs leading-5 text-[#5F6B7A]">{persona.description}</p>

                <div className="mb-5 space-y-1.5 text-[11px] font-semibold text-[#101B33]">
                  {persona.capabilities.map((capability) => (
                    <div key={capability} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#078A57]" aria-hidden="true" />
                      <span>{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={demoLoading !== null}
                onClick={() => onDemoLogin(persona.id)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1854E8] px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#1140B8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1854E8]/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Opening workspace…
                  </>
                ) : (
                  <>
                    Continue as {persona.title}
                    <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
