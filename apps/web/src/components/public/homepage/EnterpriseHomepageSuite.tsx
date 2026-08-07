import Link from 'next/link';
import {
  Activity,
  AdmissionIcon,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileCheck2,
  FileText,
  GraduationCap,
  HeartHandshake,
  IdCard,
  KeyRound,
  Landmark,
  Layers3,
  LineChart,
  Link2,
  LockKeyhole,
  MessagesSquare,
  Network,
  PanelsTopLeft,
  PieChart,
  PlugZap,
  ScrollText,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TableProperties,
  UsersRound,
  Workflow,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const platformModules: ReadonlyArray<{
  title: string;
  description: string;
  capabilities: readonly string[];
  href: string;
  icon: LucideIcon;
  span?: string;
}> = [
  { title: 'Academics', description: 'Academic structure, curriculum and day-to-day teaching operations in one controlled record layer.', capabilities: ['Curriculum', 'Courses', 'Attendance'], href: '/platform/academics', icon: BookOpenCheck, span: 'lg:col-span-2' },
  { title: 'Admissions', description: 'Move applicants from enquiry through verification, selection and enrolment without losing ownership.', capabilities: ['Applications', 'Verification', 'Enrolment'], href: '/platform/admissions', icon: UsersRound },
  { title: 'Student Lifecycle', description: 'Maintain the student journey across records, services, learning, communication and progression.', capabilities: ['Student record', 'Services', 'Progression'], href: '/platform/student-information-system', icon: GraduationCap },
  { title: 'Finance', description: 'Institution-controlled fee structures, collections, reconciliation and payment verification.', capabilities: ['Fee structures', 'Collections', 'Reconciliation'], href: '/platform/finance', icon: CircleDollarSign },
  { title: 'HR & People', description: 'People records, workforce workflows and accountable service administration.', capabilities: ['Workforce', 'Roles', 'Employee services'], href: '/platform/people', icon: IdCard },
  { title: 'Campus Operations', description: 'Connect campus services and operational teams to the same institution-aware workflow layer.', capabilities: ['Facilities', 'Transport', 'Hostel'], href: '/platform/campus-operations', icon: Building2, span: 'lg:col-span-2' },
  { title: 'Examinations', description: 'Assessment, examination and authorised result publication with evidence and auditability.', capabilities: ['Assessments', 'Results', 'Publication'], href: '/platform/examinations', icon: ClipboardCheck },
  { title: 'Communication', description: 'Branch, batch, section and course communication with membership-aware access.', capabilities: ['Communities', 'Messaging', 'Moderation'], href: '/platform/community', icon: MessagesSquare },
  { title: 'Documents', description: 'Connect institutional records, evidence and downloadable student-facing documents.', capabilities: ['Records', 'Evidence', 'Verification'], href: '/platform/student-services', icon: FileCheck2 },
  { title: 'Analytics', description: 'Turn authorised operational activity into role-relevant signals and reports.', capabilities: ['Dashboards', 'Filters', 'Exports'], href: '/platform/analytics', icon: BarChart3 },
  { title: 'Compliance', description: 'Support accountable permissions, approvals, evidence and audit history without unsupported certification claims.', capabilities: ['Permissions', 'Evidence', 'Audit'], href: '/security', icon: ShieldCheck },
  { title: 'Administration', description: 'Coordinate institution, campus and role configuration from a governed administrative layer.', capabilities: ['Institution scope', 'Roles', 'Policies'], href: '/platform/multi-campus', icon: Layers3 },
];

const lifecycle = ['Applicant', 'Admission', 'Student record', 'Academic registration', 'Fee management', 'Attendance', 'Examination', 'Result', 'Graduation'] as const;

const responsibilityContext = ['Institution', 'Role', 'Department', 'Permission', 'Approval', 'Audit history'] as const;

const roles = [
  { title: 'Management', description: 'Institution-wide operating context, approvals and executive signals.', items: ['Institution KPIs', 'Escalations', 'Audit visibility'], icon: Landmark },
  { title: 'Administrators', description: 'Records, workflows, controls and cross-functional coordination.', items: ['Work queues', 'Approvals', 'Configuration'], icon: PanelsTopLeft },
  { title: 'Faculty', description: 'Teaching, assignments, LMS, attendance, communication and assessments.', items: ['Courses', 'Assignments', 'Learning'], icon: BookOpenCheck },
  { title: 'Finance Team', description: 'Fees, invoices, collections, payment verification and reconciliation.', items: ['Collections', 'Verification', 'Reporting'], icon: CircleDollarSign },
  { title: 'HR Team', description: 'People operations and role-aware employee workflows.', items: ['People records', 'Requests', 'Approvals'], icon: IdCard },
  { title: 'Admissions Team', description: 'Applicant workflows from enquiry to confirmed enrolment.', items: ['Applications', 'Review', 'Enrolment'], icon: SearchCheck },
  { title: 'Students', description: 'Learning, assignments, results, fees, communities and student help.', items: ['Learning', 'Services', 'Progress'], icon: GraduationCap },
  { title: 'Parents', description: 'Relationship-scoped academic, attendance and financial visibility.', items: ['Attendance', 'Results', 'Fees'], icon: HeartHandshake },
  { title: 'Campus Operations', description: 'Service delivery across facilities, support and campus operations.', items: ['Facilities', 'Support', 'Operations'], icon: Building2 },
] as const;

const analyticsAreas = [
  { title: 'Enrollment trends', icon: LineChart },
  { title: 'Attendance', icon: Activity },
  { title: 'Fee collection', icon: CircleDollarSign },
  { title: 'Application funnel', icon: BarChart3 },
  { title: 'Faculty workload', icon: UsersRound },
  { title: 'Academic performance', icon: PieChart },
  { title: 'Department performance', icon: TableProperties },
] as const;

const integrationCategories = [
  { title: 'Payment systems', icon: CircleDollarSign },
  { title: 'Identity providers', icon: KeyRound },
  { title: 'Communication services', icon: MessagesSquare },
  { title: 'Government systems', icon: Landmark },
  { title: 'Learning platforms', icon: BookOpenCheck },
  { title: 'Accounting systems', icon: TableProperties },
  { title: 'External APIs', icon: PlugZap },
] as const;

const whyCampusOS = [
  ['Institution-aware', 'Structure data and workflows around the institution operating them.'],
  ['Role-aware', 'Show people the work, records and decisions relevant to their responsibility.'],
  ['Workflow-first', 'Model requests, reviews, approvals, handoffs and evidence as accountable work.'],
  ['Connected data', 'Keep academic and administrative context connected across lifecycle stages.'],
  ['Auditable operations', 'Preserve action history, ownership and evidence around important workflows.'],
  ['Configurable structure', 'Support campuses, schools, departments, programmes, batches and courses.'],
  ['Modern experience', 'Responsive interfaces designed for institutional teams, students and parents.'],
  ['Unified platform', 'Reduce context switching between disconnected academic and administrative tools.'],
] as const;

const faqs = [
  ['What is CampusOS?', 'CampusOS is a higher-education operating platform that connects academic, administrative, financial and student-service workflows while preserving institution and role context.'],
  ['Who is CampusOS for?', 'CampusOS is designed for higher-education institutions and the teams, faculty, students and guardians working within their authorised responsibilities.'],
  ['Can CampusOS support multiple campuses?', 'The platform includes institution-aware and multi-campus concepts. The exact structure is configured around an institution’s implementation requirements.'],
  ['Can roles and permissions be customized?', 'CampusOS uses role-aware access and permission boundaries. The available configuration depends on the institution’s selected modules and implementation scope.'],
  ['Does CampusOS integrate with existing systems?', 'CampusOS exposes integration-oriented architecture and approved interfaces. Specific integrations depend on the systems, credentials and implementation agreed with the institution.'],
  ['Can workflows be configured?', 'CampusOS is designed around governed requests, reviews, approvals, evidence and audit history. Workflow configuration depends on the institutional process being implemented.'],
  ['How does implementation work?', 'The implementation journey typically covers discovery, configuration, approved integrations, role-based launch and continuous improvement.'],
  ['How is institutional data protected?', 'CampusOS uses institution-level context, role-aware access, permission boundaries, secure authentication and audit trails. It does not claim certifications that have not been independently established.'],
] as const;

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] ${dark ? 'border-white/15 bg-white/5 text-[#B9C9E4]' : 'border-[#CAD7E7] bg-white text-[#1754E8]'}`}>{children}</span>;
}

function SectionHeading({ eyebrow, title, copy, center = false, dark = false }: { eyebrow: string; title: string; copy: string; center?: boolean; dark?: boolean }) {
  return (
    <header className={center ? 'mx-auto max-w-[820px] text-center' : 'max-w-[780px]'}>
      <Eyebrow dark={dark}>{eyebrow}</Eyebrow>
      <h2 className={`mt-5 text-balance text-3xl font-black tracking-[-0.045em] sm:text-4xl lg:text-[48px] lg:leading-[1.08] ${dark ? 'text-white' : 'text-[#101828]'}`}>{title}</h2>
      <p className={`mt-5 text-pretty text-[15px] leading-7 sm:text-[17px] sm:leading-8 ${dark ? 'text-[#B8C5D9]' : 'text-[#667085]'}`}>{copy}</p>
    </header>
  );
}

function TrustSection() {
  const signals = [
    ['Tenant boundary', 'Institution-scoped'],
    ['Workspace access', 'Role verified'],
    ['Critical workflow', 'Audit backed'],
    ['Platform status', 'Live health endpoint'],
  ] as const;
  return (
    <section className="border-b border-[#E0E6EF] bg-white px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="home-trust-heading">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] xl:items-end">
          <div>
            <p id="home-trust-heading" className="text-xs font-black uppercase tracking-[0.14em] text-[#1754E8]">Operational trust</p>
            <h2 className="mt-3 max-w-[650px] text-2xl font-black tracking-[-0.035em] text-[#101828] sm:text-3xl">Built for institutions where responsibility cannot be simplified.</h2>
            <p className="mt-3 max-w-[700px] text-sm leading-6 text-[#667085]">Public pages avoid invented university names, fabricated adoption numbers and unsupported certification claims. Signed-in workspaces use authorised institution data where available.</p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-[14px] border border-[#D9E2ED] bg-[#D9E2ED] sm:grid-cols-2 xl:grid-cols-4">
            {signals.map(([label, value]) => (
              <div key={label} className="bg-[#F9FBFD] px-5 py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8A95A6]">{label}</p>
                <p className="mt-2 text-sm font-black text-[#101D38]">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PlatformOverviewSection() {
  return (
    <section className="bg-[#F6F8FB] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="platform-suite-heading">
      <div className="mx-auto max-w-[1480px]">
        <SectionHeading eyebrow="Platform overview" title="One operating layer. Every institutional workflow." copy="CampusOS brings major academic and administrative areas into a consistent institution-aware operating model without pretending every team does the same work." />
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {platformModules.map(({ title, description, capabilities, href, icon: Icon, span }) => (
            <article key={title} className={`group flex min-h-[255px] flex-col rounded-[16px] border border-[#D9E2ED] bg-white p-5 shadow-[0_8px_24px_rgba(16,29,56,0.035)] transition duration-200 hover:-translate-y-0.5 hover:border-[#B7C9E0] hover:shadow-[0_16px_34px_rgba(16,29,56,0.07)] ${span ?? ''}`}>
              <div className="flex items-start justify-between gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-[#D5E1F2] bg-[#F3F7FD] text-[#1754E8]"><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <ArrowRight className="h-4 w-4 text-[#A3AEC0] transition group-hover:translate-x-0.5 group-hover:text-[#1754E8]" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-black tracking-[-0.025em] text-[#101828]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#667085]">{description}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {capabilities.map((item) => <span key={item} className="rounded-md border border-[#E0E6EE] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#536175]">{item}</span>)}
              </div>
              <Link href={href} className="mt-auto pt-5 text-xs font-black text-[#1754E8]">Explore {title.toLowerCase()} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ConnectedWorkflowSection() {
  return (
    <section className="border-y border-[#DEE6F0] bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="connected-workflow-heading">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] xl:items-center">
          <SectionHeading eyebrow="Connected lifecycle" title="Keep institutional context as work moves forward." copy="An applicant should not become a disconnected record at every stage. CampusOS is designed to carry institution, role, department, permission, approval and audit context through the student lifecycle." />
          <div className="rounded-[18px] border border-[#CFDBEA] bg-[#F8FAFD] p-4 shadow-[0_16px_44px_rgba(16,29,56,0.06)] sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              {lifecycle.map((item, index) => (
                <div key={item} className="flex items-center gap-2">
                  <span className={`inline-flex min-h-9 items-center rounded-lg border px-3 text-[11px] font-black ${index === 0 || index === lifecycle.length - 1 ? 'border-[#B8CCEF] bg-[#EDF3FF] text-[#1754E8]' : 'border-[#D9E2ED] bg-white text-[#344054]'}`}>{item}</span>
                  {index < lifecycle.length - 1 && <ChevronRight className="h-4 w-4 text-[#A3AEC0]" aria-hidden="true" />}
                </div>
              ))}
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {responsibilityContext.map((item) => <div key={item} className="flex items-center gap-3 rounded-[11px] border border-[#DCE4EE] bg-white p-3.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#087A55]" aria-hidden="true" /><span className="text-xs font-extrabold text-[#3F4B5D]">{item}</span></div>)}
            </div>
            <div className="mt-6 flex items-start gap-3 border-t border-[#DCE4EE] pt-5"><Database className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]" aria-hidden="true" /><p className="text-sm leading-6 text-[#667085]">The goal is not a decorative journey map. Each stage represents a governed institutional handoff that can retain ownership, evidence and authorised context.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoleAwareSection() {
  return (
    <section className="bg-[#F6F8FB] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="role-aware-heading">
      <div className="mx-auto max-w-[1480px]">
        <SectionHeading eyebrow="Role-aware experience" title="One platform. Different responsibilities." copy="CampusOS workspaces are organised around what a person is authorised to do—not around one generic dashboard copied across the institution." center />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map(({ title, description, items, icon: Icon }, index) => (
            <article key={title} className={`rounded-[16px] border p-5 ${index === 0 ? 'border-[#284C7C] bg-[#101D38] text-white shadow-[0_18px_42px_rgba(16,29,56,0.16)]' : 'border-[#D9E2ED] bg-white text-[#101828]'}`}>
              <span className={`flex h-11 w-11 items-center justify-center rounded-[11px] ${index === 0 ? 'bg-[#1754E8] text-white' : 'border border-[#D5E1F2] bg-[#F3F7FD] text-[#1754E8]'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
              <h3 className="mt-5 text-lg font-black">{title}</h3>
              <p className={`mt-2 text-sm leading-6 ${index === 0 ? 'text-[#C2CEE0]' : 'text-[#667085]'}`}>{description}</p>
              <div className="mt-5 flex flex-wrap gap-2">{items.map((item) => <span key={item} className={`rounded-md border px-2.5 py-1 text-[10px] font-bold ${index === 0 ? 'border-white/15 bg-white/5 text-[#D7E1F1]' : 'border-[#E0E6EE] bg-[#F8FAFC] text-[#536175]'}`}>{item}</span>)}</div>
            </article>
          ))}
        </div>
        <div className="mt-8 flex justify-center"><Link href="/roles" className="group inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#C2D1E3] bg-white px-5 text-sm font-black text-[#101D38] transition hover:border-[#8EACD1] hover:text-[#1754E8]">Explore role workspaces <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link></div>
      </div>
    </section>
  );
}

function ProductPreviewSection() {
  const rows = [
    ['Admissions review', 'Admissions', 'Needs review'],
    ['Fee verification', 'Finance', 'In progress'],
    ['Result publication', 'Examination', 'Approval chain'],
    ['Course community', 'Faculty', 'Active'],
  ] as const;
  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="product-preview-heading">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] xl:items-center">
          <div>
            <SectionHeading eyebrow="Product UI preview" title="A serious operating workspace, not a wall of disconnected widgets." copy="The signed-in CampusOS homepage already resolves role-aware data. Public product previews stay illustrative and avoid inventing customer statistics." />
            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {['Verified institution context', 'Role-scoped work queue', 'Real application/database health', 'Responsive desktop and mobile UI'].map((item) => <div key={item} className="flex items-center gap-3 rounded-[11px] border border-[#DCE4EE] bg-[#FAFBFD] p-3.5"><ShieldCheck className="h-4 w-4 shrink-0 text-[#1754E8]" aria-hidden="true" /><span className="text-xs font-extrabold text-[#3F4B5D]">{item}</span></div>)}
            </div>
          </div>
          <div className="overflow-hidden rounded-[18px] border border-[#C8D4E3] bg-white shadow-[0_22px_60px_rgba(16,29,56,0.10)]">
            <div className="flex flex-col gap-4 border-b border-[#253E62] bg-[#101D38] px-5 py-5 text-white sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#9EB7DE]">Today overview</p><h3 className="mt-1 text-lg font-black">Institution operating workspace</h3></div>
              <span className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[10px] font-black text-[#D4DDEA]"><span className="h-2 w-2 rounded-full bg-[#4ADE80]" />Authorised live context</span>
            </div>
            <div className="bg-[#F6F8FB] p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {['Attention', 'Work queue', 'System health'].map((label, index) => <div key={label} className="rounded-[12px] border border-[#D9E2ED] bg-white p-4"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A95A6]">{label}</p><p className="mt-2 text-sm font-black text-[#101D38]">{index === 0 ? 'Role scoped' : index === 1 ? 'Prioritised' : 'Operational'}</p><p className="mt-1 text-[11px] leading-5 text-[#7A8698]">Values load from authorised application data.</p></div>)}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(260px,.85fr)]">
                <div className="rounded-[13px] border border-[#D9E2ED] bg-white p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black text-[#101828]">Operational activity</p><p className="mt-1 text-[10px] text-[#8A95A6]">Illustrative interface · live values are not fabricated</p></div><span className="rounded-md border border-[#D9E2ED] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#667085]">30 days</span></div>
                  <div className="mt-6 flex h-32 items-end gap-2 border-b border-l border-[#D8E1EC] px-3 pb-2" aria-label="Illustrative activity chart without fabricated values">
                    {[42, 62, 50, 75, 58, 84, 66, 91, 74, 88, 70, 96].map((height, index) => <span key={index} className="min-w-0 flex-1 rounded-t-sm bg-[#DCE7F8]" style={{ height: `${height}%` }} />)}
                  </div>
                  <div className="mt-3 flex items-center gap-4 text-[10px] font-bold text-[#7A8698]"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#1754E8]" />Activity structure</span><span>Illustrative only</span></div>
                </div>
                <div className="rounded-[13px] border border-[#D9E2ED] bg-white p-4 sm:p-5">
                  <p className="text-xs font-black text-[#101828]">Needs your attention</p>
                  <div className="mt-4 space-y-2.5">{rows.map(([task, owner, status]) => <div key={task} className="rounded-[9px] border border-[#E1E7EF] bg-[#FAFBFD] p-3"><div className="flex items-start justify-between gap-3"><p className="text-[11px] font-extrabold text-[#344054]">{task}</p><ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#98A2B3]" aria-hidden="true" /></div><div className="mt-2 flex flex-wrap gap-2 text-[9px] font-bold text-[#7A8698]"><span>{owner}</span><span>•</span><span>{status}</span></div></div>)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  const levels = ['Institution', 'Campus', 'School', 'Department', 'Program', 'Course', 'Batch', 'Student'] as const;
  return (
    <section className="border-y border-[#DEE6F0] bg-[#F6F8FB] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="institution-architecture-heading">
      <div className="mx-auto max-w-[1480px]">
        <SectionHeading eyebrow="Institution architecture" title="Configured around your institution — not the other way around." copy="CampusOS is designed to represent nested institutional structures while preserving role, permission, workflow and policy context." center />
        <div className="mx-auto mt-12 max-w-[1180px] rounded-[18px] border border-[#CFDBEA] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.055)] sm:p-7">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {levels.map((level, index) => <div key={level} className="flex items-center gap-2.5"><span className={`inline-flex min-h-11 items-center rounded-[10px] border px-4 text-xs font-black ${index === 0 ? 'border-[#1754E8] bg-[#1754E8] text-white' : 'border-[#D5DFEB] bg-[#F8FAFC] text-[#344054]'}`}>{level}</span>{index < levels.length - 1 && <ChevronRight className="h-4 w-4 text-[#A3AEC0]" aria-hidden="true" />}</div>)}
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{['Multiple campuses', 'Academic structures', 'Roles & permissions', 'Custom policies'].map((item) => <div key={item} className="flex items-center gap-3 rounded-[11px] border border-[#DDE5EF] bg-[#F9FBFD] p-3.5"><Network className="h-4 w-4 text-[#1754E8]" aria-hidden="true" /><span className="text-xs font-extrabold text-[#465467]">{item}</span></div>)}</div>
        </div>
      </div>
    </section>
  );
}

function ApprovalEngineSection() {
  const steps = [
    ['Student request', 'Student', 'Submitted'],
    ['Department review', 'Department', 'In review'],
    ['Faculty approval', 'Faculty', 'Approved'],
    ['Finance verification', 'Finance', 'Verified'],
    ['Registrar approval', 'Registrar', 'Completed'],
  ] as const;
  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="approval-engine-heading">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)] xl:items-center">
          <SectionHeading eyebrow="Workflow + approval engine" title="Make responsibility visible at every handoff." copy="Requests, reviews, approvals, escalations, evidence and audit history can be represented as explicit institutional work rather than hidden email chains." />
          <div className="rounded-[18px] border border-[#CFDBEA] bg-[#F8FAFD] p-4 sm:p-6">
            <div className="space-y-2.5">{steps.map(([step, owner, status], index) => <div key={step} className="grid gap-3 rounded-[11px] border border-[#DCE4EE] bg-white p-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"><span className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black ${index === steps.length - 1 ? 'bg-[#E7F7F0] text-[#087A55]' : 'bg-[#EDF3FF] text-[#1754E8]'}`}>{String(index + 1).padStart(2, '0')}</span><div><p className="text-xs font-black text-[#101828]">{step}</p><p className="mt-1 text-[10px] text-[#8A95A6]">Owner: {owner} · timestamp · comments · evidence</p></div><span className="w-fit rounded-md border border-[#DCE4EE] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-bold text-[#536175]">{status}</span></div>)}</div>
            <div className="mt-5 flex items-start gap-3 border-t border-[#DCE4EE] pt-5"><ScrollText className="mt-0.5 h-5 w-5 text-[#1754E8]" aria-hidden="true" /><p className="text-sm leading-6 text-[#667085]">The same pattern supports student services, finance verification, academic governance and other institution-configured approval workflows.</p></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalyticsSection() {
  return (
    <section className="bg-[#F6F8FB] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="analytics-section-heading">
      <div className="mx-auto max-w-[1480px]">
        <SectionHeading eyebrow="Analytics & reporting" title="Turn institutional activity into actionable intelligence." copy="Use role-relevant filters, date ranges and exports to understand authorised institutional activity without turning the dashboard into visual noise." />
        <div className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]">
          <div className="rounded-[18px] border border-[#CFDBEA] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-[#E2E8F0] pb-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-black text-[#101828]">Institutional analytics workspace</p><p className="mt-1 text-[11px] text-[#8A95A6]">Illustrative UI shell · real values remain institution scoped</p></div><div className="flex flex-wrap gap-2">{['Campus', 'Department', 'Date range', 'Export'].map((filter) => <span key={filter} className="rounded-md border border-[#D9E2ED] bg-[#F8FAFC] px-2.5 py-1.5 text-[10px] font-bold text-[#536175]">{filter}</span>)}</div></div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{analyticsAreas.slice(0, 4).map(({ title, icon: Icon }) => <div key={title} className="rounded-[11px] border border-[#DDE5EF] bg-[#FAFBFD] p-3.5"><Icon className="h-4 w-4 text-[#1754E8]" aria-hidden="true" /><p className="mt-3 text-xs font-black text-[#344054]">{title}</p><p className="mt-1 text-[10px] leading-4 text-[#8A95A6]">Authorised data view</p></div>)}</div>
            <div className="mt-5 rounded-[13px] border border-[#DDE5EF] bg-[#FBFCFE] p-4"><div className="flex h-44 items-end gap-2 border-b border-l border-[#D7E1EC] px-3 pb-2" aria-label="Illustrative analytics structure without fabricated statistics">{[30, 46, 41, 63, 58, 72, 68, 80, 76, 87, 82, 94].map((height, index) => <span key={index} className="min-w-0 flex-1 rounded-t-sm bg-[#BFD1EF]" style={{ height: `${height}%` }} />)}</div></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">{analyticsAreas.slice(4).map(({ title, icon: Icon }) => <div key={title} className="rounded-[14px] border border-[#D9E2ED] bg-white p-5"><span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span><h3 className="mt-4 text-sm font-black text-[#101828]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#7A8698]">Designed to be filtered by the relevant campus, department, period and authorised scope.</p></div>)}</div>
        </div>
      </div>
    </section>
  );
}

function SecurityGovernanceSection() {
  const controls = ['Role-based access', 'Institution data isolation', 'Audit logs', 'Permission boundaries', 'Secure authentication', 'Approval history', 'Data governance', 'Controlled integrations'] as const;
  return (
    <section className="bg-[#0E1A31] px-4 py-20 text-white sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="security-governance-heading">
      <div className="mx-auto max-w-[1480px]">
        <div className="grid gap-10 xl:grid-cols-[minmax(0,.78fr)_minmax(0,1.22fr)] xl:items-center">
          <div><SectionHeading eyebrow="Security & governance" title="Controls should follow responsibility, not decoration." copy="CampusOS surfaces institution-aware access, permission boundaries, audit history and controlled integration concepts. No certification claim is made here unless independently established elsewhere." dark /><Link href="/security" className="group mt-7 inline-flex min-h-11 items-center gap-2 rounded-[9px] bg-white px-5 text-sm font-black text-[#101D38] transition hover:bg-[#EFF4FB]">Explore security <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link></div>
          <div className="grid gap-3 sm:grid-cols-2">{controls.map((control, index) => <div key={control} className="flex min-h-24 items-start gap-3 rounded-[13px] border border-white/10 bg-white/[0.035] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#1754E8] text-white">{index % 2 === 0 ? <ShieldCheck className="h-4 w-4" aria-hidden="true" /> : <LockKeyhole className="h-4 w-4" aria-hidden="true" />}</span><div><p className="text-xs font-black text-white">{control}</p><p className="mt-2 text-[11px] leading-5 text-[#AEBED6]">Applied within the institution and role context supported by the relevant CampusOS workflow.</p></div></div>)}</div>
        </div>
      </div>
    </section>
  );
}

function IntegrationSection() {
  return (
    <section className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="integration-heading">
      <div className="mx-auto max-w-[1480px]">
        <SectionHeading eyebrow="Integration layer" title="Connect CampusOS with your institutional ecosystem." copy="Integration categories describe where CampusOS can connect through approved implementation work. They are not claims of commercial partnerships with external providers." center />
        <div className="mx-auto mt-12 grid max-w-[1180px] gap-4 lg:grid-cols-[minmax(0,1fr)_320px_minmax(0,1fr)] lg:items-center">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{integrationCategories.slice(0, 3).map(({ title, icon: Icon }) => <IntegrationCard key={title} title={title} Icon={Icon} />)}</div>
          <div className="flex min-h-72 flex-col items-center justify-center rounded-[18px] border border-[#B8CCEF] bg-[#F4F7FD] p-7 text-center shadow-[0_16px_44px_rgba(16,29,56,0.07)]"><span className="flex h-16 w-16 items-center justify-center rounded-[16px] bg-[#1754E8] text-white shadow-[0_12px_24px_rgba(23,84,232,0.24)]"><Network className="h-7 w-7" aria-hidden="true" /></span><h3 className="mt-5 text-xl font-black tracking-[-0.03em] text-[#101D38]">CampusOS</h3><p className="mt-2 text-xs leading-5 text-[#667085]">Institution-aware operating and integration layer</p><div className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#1754E8]"><Link2 className="h-3.5 w-3.5" aria-hidden="true" />Controlled interfaces</div></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">{integrationCategories.slice(3).map(({ title, icon: Icon }) => <IntegrationCard key={title} title={title} Icon={Icon} />)}</div>
        </div>
        <div className="mt-8 flex justify-center"><Link href="/platform/integrations" className="group inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#C4D3E5] bg-white px-5 text-sm font-black text-[#101D38] transition hover:border-[#8EACD1] hover:text-[#1754E8]">Explore integration architecture <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link></div>
      </div>
    </section>
  );
}

function IntegrationCard({ title, Icon }: { title: string; Icon: LucideIcon }) {
  return <div className="flex items-center gap-3 rounded-[12px] border border-[#D9E2ED] bg-[#FAFBFD] p-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] border border-[#D5E1F2] bg-white text-[#1754E8]"><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span><span className="text-xs font-black text-[#344054]">{title}</span></div>;
}

function WhyCampusOSSection() {
  return (
    <section className="border-y border-[#DEE6F0] bg-[#F6F8FB] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="why-campusos-heading">
      <div className="mx-auto max-w-[1480px]">
        <SectionHeading eyebrow="Why CampusOS" title="Designed around accountable institutional work." copy="The differentiation is not a single dashboard or AI feature. It is the combination of institution context, role context, connected records and governed workflows." />
        <div className="mt-10 grid gap-px overflow-hidden rounded-[16px] border border-[#D7E1EC] bg-[#D7E1EC] sm:grid-cols-2 lg:grid-cols-4">{whyCampusOS.map(([title, copy]) => <article key={title} className="bg-white p-5"><CheckCircle2 className="h-5 w-5 text-[#087A55]" aria-hidden="true" /><h3 className="mt-4 text-sm font-black text-[#101828]">{title}</h3><p className="mt-2 text-xs leading-5 text-[#667085]">{copy}</p></article>)}</div>
      </div>
    </section>
  );
}

function CaseStudyReadySection() {
  return (
    <section className="bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8" aria-labelledby="case-study-ready-heading">
      <div className="mx-auto max-w-[1480px] rounded-[18px] border border-[#D3DEEB] bg-[#F8FAFD] p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"><div><Eyebrow>Verified evidence</Eyebrow><h2 id="case-study-ready-heading" className="mt-5 text-2xl font-black tracking-[-0.035em] text-[#101828] sm:text-3xl">Case studies should be earned, not fabricated.</h2><p className="mt-4 max-w-[800px] text-sm leading-7 text-[#667085]">This space is intentionally prepared for verified institutional outcomes when real, publishable customer evidence is available. CampusOS does not invent university names, quotes, awards or adoption statistics.</p></div><Link href="/resources" className="group inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-[#BFCFE2] bg-white px-5 text-sm font-black text-[#101D38] transition hover:border-[#8EACD1] hover:text-[#1754E8]">Explore resources <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link></div>
      </div>
    </section>
  );
}

function FaqSection() {
  return (
    <section className="border-t border-[#E0E6EF] bg-[#F6F8FB] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" aria-labelledby="homepage-faq-heading">
      <div className="mx-auto max-w-[1180px]">
        <SectionHeading eyebrow="FAQ" title="Questions institutions ask before they evaluate CampusOS." copy="Clear answers about scope, structure, integration, workflows and data protection without unsupported promises." center />
        <div className="mt-10 grid gap-3 lg:grid-cols-2">{faqs.map(([question, answer]) => <details key={question} className="group rounded-[13px] border border-[#D8E1EC] bg-white p-5 open:border-[#B8CCEF]"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-black text-[#101828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"><span>{question}</span><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#D8E1EC] text-[#1754E8] transition group-open:rotate-90"><ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></span></summary><p className="mt-4 border-t border-[#EDF1F5] pt-4 text-sm leading-6 text-[#667085]">{answer}</p></details>)}</div>
      </div>
    </section>
  );
}

export function EnterpriseHomepageSuite() {
  return (
    <>
      <TrustSection />
      <PlatformOverviewSection />
      <ConnectedWorkflowSection />
      <RoleAwareSection />
      <ProductPreviewSection />
      <ArchitectureSection />
      <ApprovalEngineSection />
      <AnalyticsSection />
      <SecurityGovernanceSection />
      <IntegrationSection />
      <WhyCampusOSSection />
      <CaseStudyReadySection />
      <FaqSection />
    </>
  );
}
