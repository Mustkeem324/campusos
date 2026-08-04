import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  EyeOff,
  FileLock2,
  FileText,
  KeyRound,
  LockKeyhole,
  ServerCog,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

type CapabilityStatus = 'available' | 'in-progress' | 'planned';

type SecurityCapability = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: CapabilityStatus;
};

const statusConfig: Record<
  CapabilityStatus,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  available: {
    label: 'Available',
    className:
      'border-[#B7E4D3] bg-[#EAF8F3] text-[#067A4E]',
    icon: CheckCircle2,
  },
  'in-progress': {
    label: 'In progress',
    className:
      'border-[#F4D3A8] bg-[#FFF7E8] text-[#B85900]',
    icon: Clock3,
  },
  planned: {
    label: 'Planned',
    className:
      'border-[#D8E0EB] bg-[#F2F5F9] text-[#5F6C7B]',
    icon: Clock3,
  },
};

const securityCapabilities: readonly SecurityCapability[] = [
  {
    id: 'tenant-isolation',
    title: 'Tenant isolation',
    icon: Database,
    status: 'available',
    description:
      'Logical separation helps keep each institution’s records and operational context isolated.',
  },
  {
    id: 'data-protection',
    title: 'Data protection',
    icon: LockKeyhole,
    status: 'available',
    description:
      'Protection controls are applied to sensitive institutional data throughout configured workflows.',
  },
  {
    id: 'access-control',
    title: 'Role and attribute controls',
    icon: UsersRound,
    status: 'available',
    description:
      'Permissions can be evaluated using institutional roles, responsibilities and contextual attributes.',
  },
  {
    id: 'multi-factor-authentication',
    title: 'Multi-factor authentication',
    icon: KeyRound,
    status: 'available',
    description:
      'Institutions can require an additional verification step for selected users and sensitive roles.',
  },
  {
    id: 'audit-history',
    title: 'Auditable activity history',
    icon: FileText,
    status: 'available',
    description:
      'Important write operations retain actor, time, workflow and change information for review.',
  },
  {
    id: 'secure-files',
    title: 'Controlled file access',
    icon: FileLock2,
    status: 'available',
    description:
      'Private file storage and time-limited access links help protect institutional documents.',
  },
  {
    id: 'backup-recovery',
    title: 'Backup and recovery',
    icon: ServerCog,
    status: 'in-progress',
    description:
      'Recovery procedures and automated restoration capabilities are being expanded and verified.',
  },
  {
    id: 'privacy-controls',
    title: 'Institutional privacy controls',
    icon: EyeOff,
    status: 'planned',
    description:
      'Additional configuration for retention, consent and privacy-request workflows is planned.',
  },
] as const;

function StatusBadge({ status }: { status: CapabilityStatus }) {
  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <span
      className={[
        'inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5',
        'text-[11px] font-bold uppercase tracking-[0.08em]',
        config.className,
      ].join(' ')}
    >
      <StatusIcon
        className="h-3.5 w-3.5"
        strokeWidth={2.4}
        aria-hidden="true"
      />
      {config.label}
    </span>
  );
}

function SecurityCapabilityCard({
  capability,
}: {
  capability: SecurityCapability;
}) {
  const Icon = capability.icon;

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[#DEE5EF] bg-white p-5 shadow-[0_8px_26px_rgba(16,24,40,0.045)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-[#BDD0F4] hover:shadow-[0_16px_38px_rgba(16,42,91,0.08)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#D8E3F5] bg-[#EEF4FF] text-[#1754E8]">
          <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
        </div>

        <StatusBadge status={capability.status} />
      </div>

      <h3 className="mt-5 text-[17px] font-semibold leading-6 text-[#101828]">
        {capability.title}
      </h3>

      <p className="mt-2 text-[14px] leading-6 text-[#5F6C7B]">
        {capability.description}
      </p>
    </article>
  );
}

export function SecuritySection() {
  return (
    <section
      className="bg-[#F7F9FC] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="security-section-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.55fr)] lg:gap-16 xl:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[#C9DAF8] bg-[#EAF1FF] text-[#1754E8] shadow-sm">
              <ShieldCheck
                className="h-7 w-7"
                strokeWidth={2}
                aria-hidden="true"
              />
            </div>

            <p className="mt-6 text-xs font-bold uppercase tracking-[0.13em] text-[#1754E8]">
              Security architecture
            </p>

            <h2
              id="security-section-heading"
              className="mt-4 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[46px] lg:leading-[1.12]"
            >
              Security controls designed for institutional operations
            </h2>

            <p className="mt-6 max-w-[510px] text-base leading-7 text-[#5F6C7B] sm:text-[17px] sm:leading-8">
              CampusOS helps institutions manage access to sensitive academic,
              financial and operational information using configurable
              identity, authorization and review controls.
            </p>

            <div className="mt-8 rounded-2xl border border-[#D8E3F2] bg-white p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]"
                  aria-hidden="true"
                />

                <div>
                  <h3 className="text-sm font-semibold text-[#101828]">
                    Evidence-aware security information
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-[#5F6C7B]">
                    Capability statuses indicate current product availability.
                    They do not represent independent certification unless
                    separately documented.
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/security"
              className="group mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-[15px] font-semibold text-white shadow-[0_10px_26px_rgba(23,84,232,0.22)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F9FC]"
            >
              Visit the Security Centre

              <ArrowRight
                className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div>
            <div className="flex flex-col gap-4 border-b border-[#DDE4EE] pb-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1754E8]">
                  Platform capabilities
                </p>

                <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-[#101828]">
                  Security and governance controls
                </h3>
              </div>

              <p className="max-w-[350px] text-sm leading-6 text-[#667085] sm:text-right">
                Availability can vary by deployment, institution configuration
                and implementation stage.
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
              {securityCapabilities.map((capability) => (
                <SecurityCapabilityCard
                  key={capability.id}
                  capability={capability}
                />
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-[#D5E0F0] bg-[#101D38] px-6 py-7 sm:flex-row sm:items-center sm:justify-between lg:px-8">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  Review the CampusOS security approach
                </h3>

                <p className="mt-2 max-w-[650px] text-sm leading-6 text-[#BBC7D9]">
                  Explore access control, tenant separation, auditability,
                  infrastructure responsibilities and security documentation.
                </p>
              </div>

              <Link
                href="/security"
                className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white px-5 py-3 text-sm font-semibold text-[#101828] transition-colors hover:bg-[#EEF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
              >
                Explore security

                <ArrowRight
                  className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}