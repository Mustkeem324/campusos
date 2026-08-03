import Link from 'next/link';
import { ArrowRight, Shield, FileText, CreditCard, Lock } from 'lucide-react';

const sections = [
  {
    title: 'PRIVACY',
    icon: <Shield className="w-5 h-5 text-[#1854E8]" />,
    description: 'How we collect, use, and protect your personal data.',
    documents: [
      { title: 'Privacy Notice', href: '/legal/privacy', version: '2.1', date: 'October 15, 2026', status: 'PUBLISHED' },
      { title: 'Cookie Notice', href: '/legal/cookies', version: '1.4', date: 'September 1, 2026', status: 'PUBLISHED' },
      { title: 'Data Rights', href: '/privacy/data-request', version: '1.0', date: 'August 1, 2026', status: 'PUBLISHED' },
      { title: 'Child and Guardian Privacy', href: '/legal/child-privacy', version: '1.1', date: 'August 20, 2026', status: 'PUBLISHED' },
      { title: 'Biometric Notice', href: '/legal/biometric-notice', version: '1.0', date: 'July 15, 2026', status: 'PUBLISHED' },
      { title: 'AI Notice', href: '/legal/ai-notice', version: '1.0', date: 'July 15, 2026', status: 'PUBLISHED' },
      { title: 'Data Retention', href: '/legal/data-retention', version: '1.2', date: 'May 10, 2026', status: 'PUBLISHED' },
      { title: 'Subprocessors', href: '/legal/subprocessors', version: '3.0', date: 'October 1, 2026', status: 'PUBLISHED' },
    ]
  },
  {
    title: 'TERMS',
    icon: <FileText className="w-5 h-5 text-[#1854E8]" />,
    description: 'The rules and guidelines for using CampusOS platforms.',
    documents: [
      { title: 'User Terms', href: '/legal/user-terms', version: '2.5', date: 'October 15, 2026', status: 'PUBLISHED' },
      { title: 'Institution Terms', href: '/legal/institution-terms', version: '2.1', date: 'October 1, 2026', status: 'PUBLISHED' },
      { title: 'Acceptable Use', href: '/legal/acceptable-use', version: '1.3', date: 'March 12, 2026', status: 'PUBLISHED' },
      { title: 'Community Guidelines', href: '/legal/community-guidelines', version: '1.1', date: 'February 5, 2026', status: 'PUBLISHED' },
      { title: 'Copyright Policy', href: '/legal/copyright', version: '1.0', date: 'January 10, 2026', status: 'PUBLISHED' },
    ]
  },
  {
    title: 'PAYMENTS',
    icon: <CreditCard className="w-5 h-5 text-[#1854E8]" />,
    description: 'Policies regarding fees, refunds, and financial transactions.',
    documents: [
      { title: 'Payment Terms', href: '/legal/payment-terms', version: '2.0', date: 'September 15, 2026', status: 'PUBLISHED' },
      { title: 'Refund and Cancellation', href: '/legal/refund-and-cancellation', version: '1.8', date: 'September 1, 2026', status: 'PUBLISHED' },
      { title: 'Billing Terms', href: '/legal/billing', version: '1.5', date: 'July 20, 2026', status: 'PUBLISHED' },
      { title: 'Wallet Terms', href: '/legal/wallet-terms', version: '1.2', date: 'June 5, 2026', status: 'PUBLISHED' },
      { title: 'Failed Transaction Help', href: '/payments/failed-transaction', version: '1.0', date: 'August 1, 2026', status: 'PUBLISHED' },
      { title: 'Dispute Resolution', href: '/payments/disputes', version: '1.1', date: 'August 1, 2026', status: 'PUBLISHED' },
    ]
  },
  {
    title: 'TRUST',
    icon: <Lock className="w-5 h-5 text-[#1854E8]" />,
    description: 'Security, compliance, and accessibility commitments.',
    documents: [
      { title: 'Security Centre', href: '/security', version: '2.0', date: 'October 20, 2026', status: 'PUBLISHED' },
      { title: 'Accessibility', href: '/legal/accessibility', version: '1.4', date: 'September 10, 2026', status: 'PUBLISHED' },
      { title: 'Vulnerability Disclosure', href: '/legal/vulnerability-disclosure', version: '1.2', date: 'May 5, 2026', status: 'PUBLISHED' },
      { title: 'Availability', href: '/trust/availability', version: '1.0', date: 'August 15, 2026', status: 'PUBLISHED' },
      { title: 'Compliance Status', href: '/trust/compliance', version: '3.1', date: 'October 1, 2026', status: 'PUBLISHED' },
    ]
  }
];

export function LegalLandingPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans">
      {/* Header */}
      <div className="bg-[#101B33] text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-[#1E293B]">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Legal and Policy Centre</h1>
          <p className="text-lg text-[#94A3B8] max-w-2xl leading-relaxed">
            Review the terms, privacy notices, payment policies and institutional disclosures that apply to CampusOS services.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {sections.map((section, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
              <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-[#E2E8F0]">
                    {section.icon}
                  </div>
                  <h2 className="text-[14px] font-bold text-[#101B33] uppercase tracking-wider">{section.title}</h2>
                </div>
                <p className="text-[14px] text-[#64748B] ml-12">{section.description}</p>
              </div>
              <ul className="divide-y divide-[#F1F5F9]">
                {section.documents.map((doc, docIdx) => (
                  <li key={docIdx}>
                    <Link href={doc.href} className="block p-6 hover:bg-[#F8FAFC] transition-colors group">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-[16px] font-semibold text-[#101B33] mb-1 group-hover:text-[#1854E8] transition-colors">
                            {doc.title}
                          </h3>
                          <div className="flex items-center gap-3 text-[13px] text-[#64748B]">
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                              {doc.status}
                            </span>
                            <span>•</span>
                            <span>Version {doc.version}</span>
                            <span>•</span>
                            <span>Effective: {doc.date}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#1854E8] transition-colors" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
