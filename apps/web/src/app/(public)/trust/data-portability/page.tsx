import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArchiveRestore,
  ArrowRight,
  CheckCircle2,
  DatabaseBackup,
  FileCheck2,
  HardDriveDownload,
  LockKeyhole,
  PackageCheck,
  ReceiptIndianRupee,
  ServerOff,
  ShieldCheck,
  Trash2,
  Truck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Data Portability and Plan Exit | CampusOS',
  description: 'How CampusOS handles service access, digital data handover, optional physical transfer and deletion after a plan ends.',
};

const lifecycle = [
  {
    title: 'Plan ends and application access stops',
    description: 'At the agreed plan or contract end date, normal CampusOS application access and ongoing hosting stop unless a written extension is active.',
    icon: ServerOff,
  },
  {
    title: 'Institution export is prepared',
    description: 'CampusOS prepares the approved active data export, files and the latest agreed backup snapshot in documented formats.',
    icon: DatabaseBackup,
  },
  {
    title: 'Transfer is verified',
    description: 'The institution or main campus receives the package, checks record counts, file readability and checksums, and records acceptance or exceptions.',
    icon: FileCheck2,
  },
  {
    title: 'CampusOS copies enter deletion',
    description: 'After verified handover and subject to any required legal hold, active data, temporary exports and accessible service copies are deleted. Backup copies expire through the documented backup cycle.',
    icon: Trash2,
  },
];

const includedDigitalItems = [
  'Approved active database export in practical open formats',
  'Uploaded files included in the approved export scope',
  'Latest agreed backup snapshot where included in the contract',
  'Record-count report, file manifest and integrity checksums',
  'Data dictionary or field mapping where available',
  'Secure, expiring digital transfer method',
];

const physicalItems = [
  'Encrypted storage media where requested and technically appropriate',
  'Media preparation, encryption and verification',
  'Tamper-evident packaging and chain-of-custody documentation',
  'Approved courier, insurance and delivery handling',
  'Physical printed records or archival media preparation when separately agreed',
];

export default function DataPortabilityPage() {
  return (
    <div className="bg-white">
      <section className="border-b border-[#DEE5EF] bg-[#101D38] text-white">
        <div className="mx-auto grid max-w-[1280px] gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#45658F] bg-[#162A4A] px-4 py-2 text-sm font-semibold text-[#DCE8FB]">
              <ShieldCheck className="h-4 w-4 text-[#8CB2FF]" aria-hidden="true" />
              Data portability and plan exit
            </div>
            <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Your institution keeps its data when the plan ends
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[#C5D1E2] sm:text-xl">
              CampusOS should stop ongoing service access, prepare the approved digital handover, verify transfer to the institution or main campus, and then delete CampusOS-held copies according to the agreed deletion and backup-expiry process.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/contact?category=data-portability" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3 text-sm font-bold text-white hover:bg-[#2A65EB]">
                Discuss an exit plan
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/legal/dpa" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#4A648A] px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
                Review data terms
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-[#334C72] bg-[#132542] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.25)] sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1D3963] text-[#A9C5FF]">
              <LockKeyhole className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-bold">Core plan-exit rule</h2>
            <p className="mt-4 text-base leading-7 text-[#CBD6E5]">
              Ending the plan does not mean CampusOS continues running the institution’s production service. The institution receives the approved data handover, and CampusOS removes retained service copies after transfer verification and required controls.
            </p>
            <div className="mt-6 rounded-2xl border border-[#35527A] bg-[#0E1B31] p-4">
              <p className="text-sm font-bold text-white">Physical transfer is optional and chargeable</p>
              <p className="mt-2 text-sm leading-6 text-[#AEBED4]">
                Encrypted drives, printed archives, packaging, courier, insurance and chain-of-custody services require a separate written estimate and approval.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1754E8]">Exit lifecycle</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#101D38] sm:text-4xl">A controlled handover, not indefinite server retention</h2>
            <p className="mt-4 text-base leading-7 text-[#5F6B7A]">
              Exact dates, export scope and backup expiry are defined in the institution’s contract and approved exit plan. CampusOS should not keep the service active merely because a subscription has ended.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {lifecycle.map((step, index) => {
              const Icon = step.icon;
              return (
                <article key={step.title} className="rounded-2xl border border-[#DEE5EF] bg-[#F9FBFD] p-6 sm:p-7">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C9D8F0] bg-white text-[#1754E8]">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">Step {index + 1}</p>
                      <h3 className="mt-2 text-xl font-bold text-[#101D38]">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#667085]">{step.description}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-[#DEE5EF] bg-[#F7F9FC] py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1220px] gap-6 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <article className="rounded-3xl border border-[#D8E2EF] bg-white p-7 shadow-[0_14px_38px_rgba(16,29,56,0.06)] sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1754E8]">
              <HardDriveDownload className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-[#101D38]">Standard digital handover</h2>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              The exact included scope depends on the signed plan, but a controlled digital export should normally include the approved operational records and files required for institutional continuity.
            </p>
            <ul className="mt-6 space-y-3">
              {includedDigitalItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#475467]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-3xl border border-[#D8E2EF] bg-white p-7 shadow-[0_14px_38px_rgba(16,29,56,0.06)] sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFF3E8] text-[#C65D00]">
              <Truck className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-[#101D38]">Optional physical handover</h2>
            <p className="mt-3 text-sm leading-6 text-[#667085]">
              Physical delivery is not included automatically. It is provided only after the institution approves the scope, security method, delivery address and separate cost estimate.
            </p>
            <ul className="mt-6 space-y-3">
              {physicalItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#475467]">
                  <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#C65D00]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#F0D5A8] bg-[#FFF8E8] p-4">
              <ReceiptIndianRupee className="mt-0.5 h-5 w-5 shrink-0 text-[#9A5B00]" aria-hidden="true" />
              <p className="text-sm leading-6 text-[#704300]">Charges must be disclosed and approved before physical preparation or dispatch begins.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-[1220px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1754E8]">Deletion after handover</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#101D38] sm:text-4xl">Transfer first, verify second, delete third</h2>
              <p className="mt-5 text-base leading-7 text-[#5F6B7A]">
                CampusOS should not delete the institution’s only accessible copy before handover is verified. After acceptance, the exit process removes active records, temporary export packages, search indexes and accessible replicas. Encrypted backups then expire through the documented backup-retention schedule unless a specific legal hold applies.
              </p>
              <p className="mt-4 text-sm leading-6 text-[#667085]">
                A legal or regulatory hold must be limited to the affected data. It should not become a reason to keep unrelated institutional records indefinitely.
              </p>
            </div>

            <div className="rounded-3xl border border-[#C9D8F0] bg-[#EEF3FF] p-7 sm:p-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-[#1754E8]">
                <ArchiveRestore className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-[#101D38]">What CampusOS should provide</h3>
              <ul className="mt-5 space-y-3 text-sm leading-6 text-[#475467]">
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />Handover manifest and checksum report</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />Institution acceptance or exception record</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />Deletion status and backup-expiry disclosure</li>
                <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" />Final deletion confirmation when the process completes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
