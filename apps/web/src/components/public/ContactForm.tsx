'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

type InquiryType = 'SALES' | 'IMPLEMENTATION' | 'SECURITY' | 'PARTNERSHIP' | 'SUPPORT' | 'OTHER';

const inquiryOptions: readonly { value: InquiryType; label: string; description: string }[] = [
  { value: 'SALES', label: 'Platform evaluation', description: 'Product scope, pricing and institutional fit' },
  { value: 'IMPLEMENTATION', label: 'Implementation', description: 'Migration, integrations, rollout and adoption' },
  { value: 'SECURITY', label: 'Security and procurement', description: 'Architecture, privacy, controls and vendor review' },
  { value: 'PARTNERSHIP', label: 'Partnership', description: 'Technology, delivery or advisory collaboration' },
  { value: 'SUPPORT', label: 'Existing customer support', description: 'Account or operational assistance' },
  { value: 'OTHER', label: 'Other enquiry', description: 'Anything not covered above' },
] as const;

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-[#C9D3E1] bg-white px-4 py-3 text-sm text-[#101828] outline-none transition placeholder:text-[#98A2B3] focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10';

export function ContactForm() {
  const searchParams = useSearchParams();
  const requestedIntent = searchParams.get('intent')?.toLowerCase();
  const initialType = useMemo<InquiryType>(() => {
    if (requestedIntent === 'support') return 'SUPPORT';
    if (requestedIntent === 'security') return 'SECURITY';
    if (requestedIntent === 'implementation') return 'IMPLEMENTATION';
    if (requestedIntent === 'partnership') return 'PARTNERSHIP';
    return 'SALES';
  }, [requestedIntent]);

  const [inquiryType, setInquiryType] = useState<InquiryType>(initialType);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      phone: String(form.get('phone') || ''),
      institution: String(form.get('institution') || ''),
      role: String(form.get('role') || ''),
      country: String(form.get('country') || ''),
      inquiryType,
      message: String(form.get('message') || ''),
      consent: form.get('consent') === 'on',
      website: String(form.get('website') || ''),
    };

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({})) as { error?: string; message?: string };

      if (!response.ok) throw new Error(result.error || 'Unable to send your message.');

      setStatus('success');
      setMessage(result.message || 'Your message has been sent.');
      event.currentTarget.reset();
      setInquiryType(initialType);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to send your message right now.');
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(520px,1.28fr)] lg:items-start">
      <aside className="space-y-5 lg:sticky lg:top-28">
        <div className="rounded-[28px] bg-[#101D38] p-7 text-white shadow-[0_24px_70px_rgba(16,29,56,0.18)] sm:p-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9EBBEE]">Before you send</p>
          <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">Give us enough context to route your enquiry correctly</h2>
          <div className="mt-7 space-y-4">
            {[
              { icon: Building2, title: 'Institution context', text: 'Tell us the institution name and your role in the evaluation or support request.' },
              { icon: MessageSquareText, title: 'Specific objective', text: 'Describe the workflows, problem, timeline or decision you need help with.' },
              { icon: ShieldCheck, title: 'Do not send sensitive records', text: 'Avoid passwords, student records, payment data or confidential credentials in this public form.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-[#8FB4FF]" aria-hidden="true" />
                <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs leading-5 text-[#C3CEE0]">{text}</p></div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[#D8E2EF] bg-[#F7F9FC] p-6">
          <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#1754E8]" aria-hidden="true" /><p className="text-sm font-bold text-[#101D38]">Email delivery</p></div>
          <p className="mt-3 text-sm leading-6 text-[#667085]">Messages are sent through the configured CampusOS SMTP service. The form reports a clear service error if mail delivery is not configured.</p>
        </div>
      </aside>

      <form onSubmit={handleSubmit} className="rounded-[30px] border border-[#D8E2EF] bg-white p-5 shadow-[0_22px_65px_rgba(16,29,56,0.08)] sm:p-8">
        <div className="flex items-start gap-4 border-b border-[#E5EAF1] pb-6">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8]"><MessageSquareText className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 className="text-xl font-extrabold tracking-[-0.025em] text-[#101D38]">Send an enquiry</h2><p className="mt-1 text-sm leading-6 text-[#667085]">Required fields are marked with an asterisk.</p></div>
        </div>

        {message && (
          <div role="status" aria-live="polite" className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm ${status === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {status === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />}
            <p className="leading-6 font-semibold">{message}</p>
          </div>
        )}

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-[#344054]">Full name *<div className="relative"><UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" aria-hidden="true" /><input name="name" required minLength={2} maxLength={100} className={`${fieldClass} pl-11`} placeholder="Your name" /></div></label>
          <label className="text-sm font-bold text-[#344054]">Work email *<div className="relative"><Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" aria-hidden="true" /><input name="email" required type="email" className={`${fieldClass} pl-11`} placeholder="name@institution.edu" /></div></label>
          <label className="text-sm font-bold text-[#344054]">Institution *<div className="relative"><Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" aria-hidden="true" /><input name="institution" required minLength={2} maxLength={180} className={`${fieldClass} pl-11`} placeholder="Institution name" /></div></label>
          <label className="text-sm font-bold text-[#344054]">Role / title<input name="role" maxLength={120} className={fieldClass} placeholder="Registrar, CIO, faculty…" /></label>
          <label className="text-sm font-bold text-[#344054]">Phone<div className="relative"><Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" aria-hidden="true" /><input name="phone" maxLength={40} className={`${fieldClass} pl-11`} placeholder="Optional" /></div></label>
          <label className="text-sm font-bold text-[#344054]">Country / region<div className="relative"><Globe2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" aria-hidden="true" /><input name="country" maxLength={100} className={`${fieldClass} pl-11`} placeholder="India, United States…" /></div></label>
        </div>

        <fieldset className="mt-7">
          <legend className="text-sm font-bold text-[#344054]">What do you need help with? *</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {inquiryOptions.map((option) => (
              <label key={option.value} className={`cursor-pointer rounded-2xl border p-4 transition ${inquiryType === option.value ? 'border-[#1754E8] bg-[#F2F6FF] shadow-[0_8px_20px_rgba(23,84,232,0.08)]' : 'border-[#D8E2EF] bg-white hover:border-[#AFC3DE]'}`}>
                <input type="radio" name="inquiryType" value={option.value} checked={inquiryType === option.value} onChange={() => setInquiryType(option.value)} className="sr-only" />
                <p className="text-sm font-extrabold text-[#101D38]">{option.label}</p><p className="mt-1 text-xs leading-5 text-[#667085]">{option.description}</p>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-7 block text-sm font-bold text-[#344054]">Message *<textarea name="message" required minLength={20} maxLength={5000} rows={7} className={`${fieldClass} resize-y`} placeholder="Describe your current environment, priority workflows, problem, timeline, or question." /></label>

        <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>

        <label className="mt-6 flex items-start gap-3 rounded-2xl bg-[#F7F9FC] p-4 text-xs leading-5 text-[#667085]">
          <input name="consent" type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-[#B8C4D3] text-[#1754E8] focus:ring-[#1754E8]" />
          <span>I confirm that I am authorised to submit this enquiry and agree that CampusOS may use the information provided to respond to this request. *</span>
        </label>

        <button type="submit" disabled={status === 'sending'} className="group mt-7 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">
          {status === 'sending' ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Sending securely…</> : <>Send enquiry <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" /></>}
        </button>
      </form>
    </div>
  );
}
