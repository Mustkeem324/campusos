import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, Lock, Key, Workflow, RefreshCw, Box, Database, FileText, Server, AlertTriangle, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import type { BlueprintTopic } from './BlueprintData';

export function ThesisDetail() {
  return (
    <div className="space-y-6 text-[#101828]">
      <p className="text-[17px] leading-relaxed">
        Higher education institutions are complex ecosystems. Yet, most universities operate on a fragmented collection of point solutions—an LMS for learning, an ERP for finance, a CRM for admissions, and spreadsheets for everything else. This fragmentation guarantees duplicate data, conflicting permissions, and a frustrated student experience.
      </p>
      <p className="text-[17px] leading-relaxed">
        CampusOS fundamentally rejects the point-solution model. It is designed as a true <strong>University Operating System</strong>. A workflow-first platform where academics, finance, HR, and campus operations share the exact same foundation. When a student registers for a course, the billing engine knows instantly. When a faculty member takes leave, the timetable engine adjusts automatically.
      </p>
      <div className="bg-[#F5F7FB] border border-[#DFE6F0] p-6 rounded-xl mt-8">
        <h4 className="font-semibold text-[14px] uppercase tracking-wider text-[#5F6C7B] mb-4">Student Lifecycle (System of Record)</h4>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#1754E8] text-white flex items-center justify-center text-xs font-bold">1</span> Enquiry & Admissions</div>
          <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#1754E8] text-white flex items-center justify-center text-xs font-bold">2</span> Enrollment & Fee Payment</div>
          <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#1754E8] text-white flex items-center justify-center text-xs font-bold">3</span> Academics & Learning</div>
          <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#1754E8] text-white flex items-center justify-center text-xs font-bold">4</span> Examinations & Results</div>
          <div className="flex items-center gap-3"><span className="w-6 h-6 rounded-full bg-[#1754E8] text-white flex items-center justify-center text-xs font-bold">5</span> Graduation & Alumni</div>
        </div>
      </div>
    </div>
  );
}

export function ProblemDetail() {
  return (
    <div className="space-y-6 text-[#101828]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h4 className="font-bold text-lg mb-3">The Fragmented Campus</h4>
          <ul className="space-y-3 text-[15px] text-[#5F6C7B]">
            <li className="flex gap-2"><AlertTriangle className="text-[#D92D20] shrink-0 w-5 h-5" /> Duplicate student records across systems</li>
            <li className="flex gap-2"><AlertTriangle className="text-[#D92D20] shrink-0 w-5 h-5" /> Manual spreadsheets to bridge gaps</li>
            <li className="flex gap-2"><AlertTriangle className="text-[#D92D20] shrink-0 w-5 h-5" /> Inconsistent role permissions</li>
            <li className="flex gap-2"><AlertTriangle className="text-[#D92D20] shrink-0 w-5 h-5" /> Delayed reporting and reconciliation</li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-lg mb-3">The CampusOS Solution</h4>
          <ul className="space-y-3 text-[15px] text-[#5F6C7B]">
            <li className="flex gap-2"><CheckCircle2 className="text-[#078A57] shrink-0 w-5 h-5" /> Single source of truth database</li>
            <li className="flex gap-2"><CheckCircle2 className="text-[#078A57] shrink-0 w-5 h-5" /> Unified workflows replacing spreadsheets</li>
            <li className="flex gap-2"><CheckCircle2 className="text-[#078A57] shrink-0 w-5 h-5" /> Centralized identity and access management</li>
            <li className="flex gap-2"><CheckCircle2 className="text-[#078A57] shrink-0 w-5 h-5" /> Real-time institutional analytics</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function SharedCoreDetail() {
  return (
    <div className="space-y-6 text-[#101828]">
      <p className="text-[17px] leading-relaxed mb-6">
        Every CampusOS module inherits from a highly resilient, shared platform core. This means security, auditing, and notifications are solved once and enforced everywhere.
      </p>
      
      <div className="bg-[#0F1A30] text-white p-8 rounded-2xl border border-[#17243D]">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Lock className="text-[#1754E8] w-6 h-6" />
            <h5 className="font-semibold text-sm">Identity & Auth</h5>
            <p className="text-xs text-[#B9C3D4]">SSO, JWT Sessions, MFA enforcement.</p>
          </div>
          <div className="space-y-2">
            <Key className="text-[#1754E8] w-6 h-6" />
            <h5 className="font-semibold text-sm">Roles & Permissions</h5>
            <p className="text-xs text-[#B9C3D4]">Multi-tenant RBAC and ABAC access.</p>
          </div>
          <div className="space-y-2">
            <ShieldCheck className="text-[#1754E8] w-6 h-6" />
            <h5 className="font-semibold text-sm">Audit Logging</h5>
            <p className="text-xs text-[#B9C3D4]">Immutable ledger of all mutations.</p>
          </div>
          <div className="space-y-2">
            <Workflow className="text-[#1754E8] w-6 h-6" />
            <h5 className="font-semibold text-sm">Workflow Engine</h5>
            <p className="text-xs text-[#B9C3D4]">Cross-module state transitions.</p>
          </div>
          <div className="space-y-2">
            <FileText className="text-[#1754E8] w-6 h-6" />
            <h5 className="font-semibold text-sm">File Storage</h5>
            <p className="text-xs text-[#B9C3D4]">Secure, signed-URL document store.</p>
          </div>
          <div className="space-y-2">
            <RefreshCw className="text-[#1754E8] w-6 h-6" />
            <h5 className="font-semibold text-sm">Notifications</h5>
            <p className="text-xs text-[#B9C3D4]">Unified email, SMS, and in-app alerts.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ContextAccessDetail() {
  return (
    <div className="space-y-6 text-[#101828]">
      <p className="text-[17px] leading-relaxed">
        Access in a university is rarely binary. A user might be an administrator in the Engineering department but a standard faculty member in the Science department. CampusOS resolves access dynamically.
      </p>
      <div className="border border-[#DFE6F0] rounded-xl overflow-hidden mt-6">
        <table className="w-full text-sm text-left">
          <thead className="bg-[#F5F7FB] border-b border-[#DFE6F0] text-[#5F6C7B]">
            <tr>
              <th className="px-4 py-3 font-semibold">Context Level</th>
              <th className="px-4 py-3 font-semibold">Example Rule</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFE6F0]">
            <tr>
              <td className="px-4 py-3 font-medium">Tenant (Institution)</td>
              <td className="px-4 py-3 text-[#5F6C7B]">Data is strictly isolated to the subscribed institution ID.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Campus / Department</td>
              <td className="px-4 py-3 text-[#5F6C7B]">HOD can only view grades for their specific department.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Course Offering</td>
              <td className="px-4 py-3 text-[#5F6C7B]">Faculty can only submit attendance for their assigned sections.</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">Record Ownership</td>
              <td className="px-4 py-3 text-[#5F6C7B]">Students can only view their own private transcripts.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm font-semibold mt-4 text-[#1754E8]">Permissions are enforced in the interface, API, service layer and database.</p>
    </div>
  );
}

export function SystemsDetail() {
  return (
    <div className="space-y-6 text-[#101828]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { name: 'Academics', desc: 'Curriculum, timetabling, and attendance.' },
          { name: 'Admissions', desc: 'Lead management, forms, and merit lists.' },
          { name: 'Finance', desc: 'Fee structures, invoices, and payment gateways.' },
          { name: 'Learning (LMS)', desc: 'Course material, assignments, and live classes.' },
          { name: 'Examinations', desc: 'Grading scales, seating, and transcripts.' },
          { name: 'People & HR', desc: 'Faculty onboarding, payroll, and leave.' },
          { name: 'Operations', desc: 'Hostel, transport, and facility management.' },
          { name: 'Communication', desc: 'Notices, forums, and chat.' }
        ].map(sys => (
          <div key={sys.name} className="border border-[#DFE6F0] p-4 rounded-lg flex items-start gap-3 hover:border-[#1754E8] transition-colors">
            <Box className="w-5 h-5 text-[#1754E8] shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-[15px]">{sys.name}</h5>
              <p className="text-[13px] text-[#5F6C7B] mt-1">{sys.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PlatformAIDetail() {
  return (
    <div className="space-y-6 text-[#101828]">
      <p className="text-[17px] leading-relaxed">
        AI in CampusOS is not a disjointed chatbot; it is deeply embedded into authorized workflows. It inherits the exact same permission context as the user making the request.
      </p>
      
      <div className="flex flex-col gap-4 mt-6">
        <div className="flex items-center gap-4 bg-[#F5F7FB] p-4 rounded-lg border border-[#DFE6F0]">
          <div className="w-8 h-8 rounded-full bg-white border border-[#C9D4E2] flex items-center justify-center font-bold text-xs shrink-0">1</div>
          <div className="text-[14px]"><strong>User Request</strong> is intercepted by the AI Orchestrator.</div>
        </div>
        <div className="flex items-center gap-4 bg-[#F5F7FB] p-4 rounded-lg border border-[#DFE6F0]">
          <div className="w-8 h-8 rounded-full bg-white border border-[#C9D4E2] flex items-center justify-center font-bold text-xs shrink-0">2</div>
          <div className="text-[14px]"><strong>Permission Context</strong> evaluates what data the user is authorized to read.</div>
        </div>
        <div className="flex items-center gap-4 bg-[#F5F7FB] p-4 rounded-lg border border-[#DFE6F0]">
          <div className="w-8 h-8 rounded-full bg-white border border-[#C9D4E2] flex items-center justify-center font-bold text-xs shrink-0">3</div>
          <div className="text-[14px]"><strong>Approved Data Sources</strong> are securely passed to the LLM via RAG architecture.</div>
        </div>
        <div className="flex items-center gap-4 bg-[#EDF3FF] p-4 rounded-lg border border-[#1754E8]">
          <div className="w-8 h-8 rounded-full bg-[#1754E8] text-white flex items-center justify-center font-bold text-xs shrink-0">4</div>
          <div className="text-[14px] text-[#103FC2]"><strong>Audit & Response:</strong> Action is logged, sources are cited, and consequential actions wait for human approval.</div>
        </div>
      </div>
    </div>
  );
}

export function AIPrinciplesDetail() {
  return (
    <div className="space-y-4 text-[#101828]">
      <h3 className="font-bold text-[20px] mb-4">Our AI Operating Principles</h3>
      <ol className="list-decimal pl-5 space-y-3 text-[15px] text-[#5F6C7B]">
        <li><strong className="text-[#101828]">AI must remain permission-aware.</strong> An AI assistant can never bypass RBAC.</li>
        <li><strong className="text-[#101828]">AI must explain where answers came from.</strong> Citations are mandatory.</li>
        <li><strong className="text-[#101828]">Humans remain accountable.</strong> AI suggestions are not institutional decisions.</li>
        <li><strong className="text-[#101828]">Sensitive data is minimized.</strong> PII is stripped where unnecessary.</li>
        <li><strong className="text-[#101828]">Institutions control enablement.</strong> Universities opt-in to AI features globally.</li>
        <li><strong className="text-[#101828]">Automated actions remain auditable.</strong> Every AI modification writes to the standard audit ledger.</li>
      </ol>
    </div>
  );
}

export function StackDetail() {
  return (
    <div className="space-y-6 text-[#101828]">
      <p className="text-[15px] text-[#5F6C7B] mb-6">Based on the active repository implementation, CampusOS uses the following verified enterprise stack:</p>
      
      <div className="space-y-6">
        <div>
          <h4 className="font-bold text-[14px] uppercase tracking-wider text-[#101828] mb-3 flex items-center gap-2"><LayoutGrid className="w-4 h-4" /> Frontend</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>Next.js 14</strong> (App Router)</div>
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>React 18</strong></div>
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>Tailwind CSS</strong></div>
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>Lucide Icons</strong></div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-[14px] uppercase tracking-wider text-[#101828] mb-3 flex items-center gap-2"><Database className="w-4 h-4" /> Backend & Data</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>Node.js</strong> Edge/Serverless APIs</div>
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>PostgreSQL</strong> Primary DB</div>
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>Prisma ORM</strong></div>
            <div className="border border-[#DFE6F0] p-3 rounded bg-white"><strong>Bcrypt</strong> Cryptography</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ComplianceDetail() {
  const [region, setRegion] = useState<'india' | 'us' | 'global'>('india');

  return (
    <div className="space-y-6 text-[#101828]">
      <p className="text-[17px] leading-relaxed italic text-[#5F6C7B]">
        &quot;Designed to support institution-configured readiness.&quot;
      </p>

      <div className="flex gap-2 border-b border-[#DFE6F0] pb-px">
        <button onClick={() => setRegion('india')} className={`px-4 py-2 text-sm font-semibold ${region === 'india' ? 'text-[#1754E8] border-b-2 border-[#1754E8]' : 'text-[#5F6C7B] hover:text-[#101828]'}`}>India</button>
        <button onClick={() => setRegion('us')} className={`px-4 py-2 text-sm font-semibold ${region === 'us' ? 'text-[#1754E8] border-b-2 border-[#1754E8]' : 'text-[#5F6C7B] hover:text-[#101828]'}`}>United States</button>
        <button onClick={() => setRegion('global')} className={`px-4 py-2 text-sm font-semibold ${region === 'global' ? 'text-[#1754E8] border-b-2 border-[#1754E8]' : 'text-[#5F6C7B] hover:text-[#101828]'}`}>Global</button>
      </div>

      <div className="bg-[#F5F7FB] p-5 rounded-lg border border-[#DFE6F0]">
        {region === 'india' && (
          <ul className="space-y-3 text-[14px]">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> Academic regulatory workflows (UGC/AICTE patterns)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> Outcome-Based Education tracking</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> DPDP Privacy and consent workflows</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> Automated Grievance Redressal</li>
          </ul>
        )}
        {region === 'us' && (
          <ul className="space-y-3 text-[14px]">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> FERPA-aligned student-record privacy workflows</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> Record-access requests (Data Rights)</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> ADA Accessibility support</li>
          </ul>
        )}
        {region === 'global' && (
          <ul className="space-y-3 text-[14px]">
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> GDPR-aligned Data Subject Requests</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> Subprocessor transparency lists</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="text-[#078A57] w-4 h-4" /> Institution-defined retention policies</li>
          </ul>
        )}
      </div>
    </div>
  );
}

// Fallback for smaller/simpler topics
export function GenericDetail({ topic }: { topic: BlueprintTopic }) {
  return (
    <div className="space-y-4 text-[#101828]">
      <p className="text-[17px] leading-relaxed">{topic.description}</p>
      <div className="bg-[#F5F7FB] border border-[#DFE6F0] p-4 rounded-lg mt-6 text-sm text-[#5F6C7B]">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-[#101828]">Implementation Status:</span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${
            topic.implementationStatus === 'IMPLEMENTED' ? 'bg-[#078A57]/10 text-[#078A57]' :
            topic.implementationStatus === 'PARTIAL' ? 'bg-[#C86600]/10 text-[#C86600]' :
            topic.implementationStatus === 'IN_DEVELOPMENT' ? 'bg-[#1754E8]/10 text-[#1754E8]' :
            'bg-[#E2E8F0] text-[#5F6C7B]'
          }`}>{topic.implementationStatus.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
}

export function renderTopicDetail(topic: BlueprintTopic) {
  switch (topic.id) {
    case 'thesis': return <ThesisDetail />;
    case 'institutional-problem': return <ProblemDetail />;
    case 'shared-core': return <SharedCoreDetail />;
    case 'context-access': return <ContextAccessDetail />;
    case 'platform-systems': return <SystemsDetail />;
    case 'platform-ai': return <PlatformAIDetail />;
    case 'ai-principles': return <AIPrinciplesDetail />;
    case 'technology-stack': return <StackDetail />;
    case 'compliance': return <ComplianceDetail />;
    default: return <GenericDetail topic={topic} />;
  }
}
