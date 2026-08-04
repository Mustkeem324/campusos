'use client';

import type {
  ElementType,
  FormEvent,
  InputHTMLAttributes,
  SelectHTMLAttributes,
} from 'react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Database,
  FileCheck2,
  FileText,
  GraduationCap,
  Library,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Transport,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

type DeploymentType = 'saas' | 'onprem';

type SignupFormData = {
  legalName: string;
  institutionType: string;
  country: string;
  city: string;
  officialEmail: string;
  campuses: string;
  students: string;
  currentErp: string;
  contactFirstName: string;
  contactLastName: string;
  contactRole: string;
  contactPhone: string;
  modules: string[];
  deploymentType: DeploymentType;
  consent: boolean;
};

type FieldName = keyof SignupFormData;

type FieldErrors = Partial<Record<FieldName, string>>;

type StepDefinition = {
  id: number;
  name: string;
  shortName: string;
  description: string;
  icon: ElementType;
};

type ModuleOption = {
  id: string;
  name: string;
  description: string;
  icon: ElementType;
};

type DeploymentOption = {
  id: DeploymentType;
  name: string;
  description: string;
  note: string;
  icon: ElementType;
  recommended?: boolean;
};

const TOTAL_STEPS = 6;

const steps: readonly StepDefinition[] = [
  {
    id: 1,
    name: 'Institution details',
    shortName: 'Details',
    description: 'Tell us about your institution.',
    icon: Building2,
  },
  {
    id: 2,
    name: 'Organisation profile',
    shortName: 'Profile',
    description: 'Share your scale and current systems.',
    icon: UsersRound,
  },
  {
    id: 3,
    name: 'Primary contact',
    shortName: 'Contact',
    description: 'Identify the authorised implementation contact.',
    icon: BriefcaseBusiness,
  },
  {
    id: 4,
    name: 'Platform requirements',
    shortName: 'Modules',
    description: 'Select the capabilities you want to explore.',
    icon: Settings2,
  },
  {
    id: 5,
    name: 'Deployment preference',
    shortName: 'Deployment',
    description: 'Choose an initial deployment preference.',
    icon: Cloud,
  },
  {
    id: 6,
    name: 'Review and submit',
    shortName: 'Review',
    description: 'Confirm the supplied information.',
    icon: FileCheck2,
  },
];

const moduleOptions: readonly ModuleOption[] = [
  {
    id: 'academics',
    name: 'Academics and Grading',
    description:
      'Curriculum, timetables, attendance, assessments and results.',
    icon: GraduationCap,
  },
  {
    id: 'admissions',
    name: 'Admissions and CRM',
    description:
      'Applicant enquiries, applications, review and enrolment.',
    icon: UserRound,
  },
  {
    id: 'finance',
    name: 'Finance and Billing',
    description:
      'Fee structures, invoicing, payments and reconciliation.',
    icon: WalletCards,
  },
  {
    id: 'hr',
    name: 'People and HR',
    description:
      'Employee records, attendance, leave and payroll workflows.',
    icon: UsersRound,
  },
  {
    id: 'library',
    name: 'Library Services',
    description:
      'Catalogue, circulation, memberships and digital resources.',
    icon: Library,
  },
  {
    id: 'hostel',
    name: 'Hostel and Transport',
    description:
      'Accommodation, allocation, fleet and transport operations.',
    icon: Transport,
  },
];

const deploymentOptions: readonly DeploymentOption[] = [
  {
    id: 'saas',
    name: 'CampusOS Cloud',
    description:
      'A managed CampusOS environment with platform operations handled by the CampusOS team.',
    note:
      'Recommended for institutions seeking a managed deployment model.',
    icon: Cloud,
    recommended: true,
  },
  {
    id: 'onprem',
    name: 'Institution-Controlled Deployment',
    description:
      'Deploy within an approved institution-controlled cloud or infrastructure environment.',
    note:
      'Availability is subject to technical, security and commercial assessment.',
    icon: Server,
  },
];

const initialFormData: SignupFormData = {
  legalName: '',
  institutionType: '',
  country: '',
  city: '',
  officialEmail: '',
  campuses: '1',
  students: '',
  currentErp: '',
  contactFirstName: '',
  contactLastName: '',
  contactRole: '',
  contactPhone: '',
  modules: [],
  deploymentType: 'saas',
  consent: false,
};

const inputClassName = [
  'min-h-12 w-full rounded-xl border bg-white px-4 py-3 text-sm',
  'text-[#101828] placeholder:text-[#98A2B3]',
  'transition-[border-color,box-shadow]',
  'hover:border-[#B8C5D6]',
  'focus:border-[#1754E8] focus:outline-none',
  'focus:ring-4 focus:ring-[#1754E8]/10',
  'disabled:cursor-not-allowed disabled:bg-[#F2F4F7]',
].join(' ');

function getStepProgress(currentStep: number) {
  return Math.round((currentStep / TOTAL_STEPS) * 100);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function FieldShell({
  id,
  label,
  required,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  const descriptionId = `${id}-description`;
  const errorId = `${id}-error`;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-[#344054]"
      >
        {label}

        {required && (
          <span
            className="ml-1 text-[#C43224]"
            aria-hidden="true"
          >
            *
          </span>
        )}
      </label>

      {hint && (
        <p
          id={descriptionId}
          className="mt-1 text-xs leading-5 text-[#667085]"
        >
          {hint}
        </p>
      )}

      <div className="mt-2">{children}</div>

      {error && (
        <p
          id={errorId}
          className="mt-2 flex items-start gap-1.5 text-xs font-medium text-[#C43224]"
        >
          <AlertCircle
            className="mt-0.5 h-3.5 w-3.5 shrink-0"
            aria-hidden="true"
          />

          {error}
        </p>
      )}
    </div>
  );
}

function TextInput({
  id,
  error,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  error?: string;
  hint?: string;
}) {
  const describedBy = [
    hint ? `${id}-description` : '',
    error ? `${id}-error` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <input
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy || undefined}
      className={[
        inputClassName,
        error
          ? 'border-[#E77B72] focus:border-[#C43224] focus:ring-[#C43224]/10'
          : 'border-[#C9D3E1]',
      ].join(' ')}
      {...props}
    />
  );
}

function SelectInput({
  id,
  error,
  hint,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  const describedBy = [
    hint ? `${id}-description` : '',
    error ? `${id}-error` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <select
      id={id}
      aria-invalid={Boolean(error)}
      aria-describedby={describedBy || undefined}
      className={[
        inputClassName,
        'appearance-none pr-10',
        error
          ? 'border-[#E77B72] focus:border-[#C43224] focus:ring-[#C43224]/10'
          : 'border-[#C9D3E1]',
      ].join(' ')}
      {...props}
    >
      {children}
    </select>
  );
}

function DesktopStepper({
  currentStep,
  maxVisitedStep,
  onSelect,
}: {
  currentStep: number;
  maxVisitedStep: number;
  onSelect: (step: number) => void;
}) {
  return (
    <nav
      aria-label="Registration progress"
      className="hidden lg:block"
    >
      <ol className="relative space-y-2">
        <div
          className="absolute bottom-6 left-[21px] top-6 w-px bg-white/15"
          aria-hidden="true"
        />

        {steps.map((step) => {
          const Icon = step.icon;
          const active = currentStep === step.id;
          const completed = currentStep > step.id;
          const available = step.id <= maxVisitedStep;

          return (
            <li key={step.id} className="relative">
              <button
                type="button"
                disabled={!available}
                onClick={() => onSelect(step.id)}
                aria-current={active ? 'step' : undefined}
                className={[
                  'group flex w-full items-start gap-4 rounded-2xl p-3 text-left',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2',
                  'focus-visible:ring-[#8CB2FF]',
                  active
                    ? 'bg-white/[0.09]'
                    : available
                      ? 'hover:bg-white/[0.06]'
                      : 'cursor-default opacity-55',
                ].join(' ')}
              >
                <span
                  className={[
                    'relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
                    active
                      ? 'border-[#82AAFF] bg-[#1754E8] text-white'
                      : completed
                        ? 'border-[#3DAA84] bg-[#153A31] text-[#6DDEB7]'
                        : 'border-white/15 bg-[#172746] text-[#AFC0DA]',
                  ].join(' ')}
                >
                  {completed ? (
                    <Check
                      className="h-5 w-5"
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                  ) : (
                    <Icon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  )}
                </span>

                <span className="min-w-0 pt-0.5">
                  <span
                    className={[
                      'block text-sm font-semibold',
                      active || completed
                        ? 'text-white'
                        : 'text-[#B7C4D8]',
                    ].join(' ')}
                  >
                    {step.name}
                  </span>

                  <span className="mt-1 block text-xs leading-5 text-[#8FA0B8]">
                    {step.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function MobileProgress({
  currentStep,
}: {
  currentStep: number;
}) {
  const current = steps[currentStep - 1];
  const Icon = current.icon;
  const progress = getStepProgress(currentStep);

  return (
    <div className="border-b border-[#DDE4EE] bg-white px-5 py-4 lg:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#667085]">
              Step {currentStep} of {TOTAL_STEPS}
            </p>

            <p className="truncate text-sm font-bold text-[#101828]">
              {current.name}
            </p>
          </div>
        </div>

        <span className="text-sm font-bold text-[#1754E8]">
          {progress}%
        </span>
      </div>

      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[#E8EDF4]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        aria-label="Registration progress"
      >
        <div
          className="h-full rounded-full bg-[#1754E8] transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
}: {
  icon: ElementType;
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C9DAF8] bg-[#EDF3FF] text-[#1754E8]">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-[0.11em] text-[#1754E8]">
        {eyebrow}
      </p>

      <h2 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[#101828] sm:text-3xl">
        {title}
      </h2>

      <p className="mt-3 max-w-[680px] text-sm leading-6 text-[#667085] sm:text-[15px]">
        {description}
      </p>
    </header>
  );
}

function ModuleCard({
  module,
  selected,
  onChange,
}: {
  module: ModuleOption;
  selected: boolean;
  onChange: (checked: boolean) => void;
}) {
  const Icon = module.icon;

  return (
    <label
      className={[
        'group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5',
        'transition-[border-color,background-color,box-shadow,transform]',
        'hover:-translate-y-0.5',
        selected
          ? 'border-[#1754E8] bg-[#F3F7FF] shadow-[0_10px_28px_rgba(23,84,232,0.10)]'
          : 'border-[#DDE4EE] bg-white hover:border-[#B8CCEF] hover:shadow-[0_10px_26px_rgba(16,24,40,0.06)]',
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />

      <span
        className={[
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          selected
            ? 'bg-[#1754E8] text-white'
            : 'bg-[#EDF3FF] text-[#1754E8]',
        ].join(' ')}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-[#101828]">
          {module.name}
        </span>

        <span className="mt-1.5 block text-xs leading-5 text-[#667085]">
          {module.description}
        </span>
      </span>

      <span
        className={[
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
          selected
            ? 'border-[#1754E8] bg-[#1754E8] text-white'
            : 'border-[#C9D3E1] bg-white text-transparent',
        ].join(' ')}
        aria-hidden="true"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={2.7} />
      </span>

      <span className="absolute inset-0 rounded-2xl ring-[#1754E8] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2" />
    </label>
  );
}

function DeploymentCard({
  option,
  selected,
  onSelect,
}: {
  option: DeploymentOption;
  selected: boolean;
  onSelect: () => void;
}) {
  const Icon = option.icon;

  return (
    <label
      className={[
        'relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 sm:p-6',
        'transition-[border-color,background-color,box-shadow]',
        selected
          ? 'border-[#1754E8] bg-[#F3F7FF] shadow-[0_12px_32px_rgba(23,84,232,0.10)]'
          : 'border-[#DDE4EE] bg-white hover:border-[#B8CCEF]',
      ].join(' ')}
    >
      <input
        type="radio"
        name="deploymentType"
        value={option.id}
        checked={selected}
        onChange={onSelect}
        className="peer sr-only"
      />

      <span
        className={[
          'flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl',
          selected
            ? 'bg-[#1754E8] text-white'
            : 'bg-[#EDF3FF] text-[#1754E8]',
        ].join(' ')}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-base font-bold text-[#101828]">
            {option.name}
          </span>

          {option.recommended && (
            <span className="rounded-full border border-[#BFD1F7] bg-[#EDF3FF] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#1754E8]">
              Recommended
            </span>
          )}
        </span>

        <span className="mt-2 block text-sm leading-6 text-[#5F6C7B]">
          {option.description}
        </span>

        <span className="mt-2 block text-xs leading-5 text-[#7C889A]">
          {option.note}
        </span>
      </span>

      <span
        className={[
          'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
          selected
            ? 'border-[#1754E8]'
            : 'border-[#C9D3E1]',
        ].join(' ')}
        aria-hidden="true"
      >
        {selected && (
          <span className="h-2.5 w-2.5 rounded-full bg-[#1754E8]" />
        )}
      </span>

      <span className="absolute inset-0 rounded-2xl ring-[#1754E8] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2" />
    </label>
  );
}

function ReviewSection({
  title,
  icon: Icon,
  onEdit,
  children,
}: {
  title: string;
  icon: ElementType;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#DDE4EE] bg-white p-5">
      <div className="flex items-center justify-between gap-4 border-b border-[#E5EAF1] pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>

          <h3 className="text-sm font-bold text-[#101828]">
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="min-h-9 rounded-lg px-3 text-xs font-semibold text-[#1754E8] transition-colors hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
        >
          Edit
        </button>
      </div>

      <div className="pt-4">{children}</div>
    </section>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#7C889A]">
        {label}
      </dt>

      <dd className="mt-1.5 break-words text-sm font-semibold text-[#101828]">
        {value || 'Not provided'}
      </dd>
    </div>
  );
}

export default function InstitutionSignupWizard() {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [maxVisitedStep, setMaxVisitedStep] = useState(1);
  const [formData, setFormData] =
    useState<SignupFormData>(initialFormData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submissionError, setSubmissionError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentStepConfig = steps[currentStep - 1];

  const selectedModuleNames = useMemo(
    () =>
      moduleOptions
        .filter((module) =>
          formData.modules.includes(module.id),
        )
        .map((module) => module.name),
    [formData.modules],
  );

  const selectedDeployment = deploymentOptions.find(
    (option) => option.id === formData.deploymentType,
  );

  function updateForm<K extends FieldName>(
    field: K,
    value: SignupFormData[K],
  ) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => {
      if (!previous[field]) {
        return previous;
      }

      const next = { ...previous };
      delete next[field];
      return next;
    });

    setSubmissionError('');
  }

  function toggleModule(moduleId: string, selected: boolean) {
    const nextModules = selected
      ? Array.from(new Set([...formData.modules, moduleId]))
      : formData.modules.filter((id) => id !== moduleId);

    updateForm('modules', nextModules);
  }

  function validateStep(step: number) {
    const nextErrors: FieldErrors = {};

    if (step === 1) {
      if (!formData.legalName.trim()) {
        nextErrors.legalName =
          'Enter the legal name of your institution.';
      }

      if (!formData.institutionType) {
        nextErrors.institutionType =
          'Select an institution type.';
      }

      if (!formData.officialEmail.trim()) {
        nextErrors.officialEmail =
          'Enter an official institutional email address.';
      } else if (!isValidEmail(formData.officialEmail)) {
        nextErrors.officialEmail =
          'Enter a valid email address.';
      }

      if (!formData.country.trim()) {
        nextErrors.country = 'Enter the institution country.';
      }

      if (!formData.city.trim()) {
        nextErrors.city = 'Enter the institution city.';
      }
    }

    if (step === 2) {
      const campuses = Number(formData.campuses);

      if (
        !Number.isInteger(campuses) ||
        campuses < 1
      ) {
        nextErrors.campuses =
          'Enter a valid number of campuses.';
      }

      if (!formData.students) {
        nextErrors.students =
          'Select an approximate student range.';
      }
    }

    if (step === 3) {
      if (!formData.contactFirstName.trim()) {
        nextErrors.contactFirstName =
          'Enter the contact first name.';
      }

      if (!formData.contactLastName.trim()) {
        nextErrors.contactLastName =
          'Enter the contact last name.';
      }

      if (!formData.contactRole.trim()) {
        nextErrors.contactRole =
          'Enter the contact job title or role.';
      }

      if (!formData.contactPhone.trim()) {
        nextErrors.contactPhone =
          'Enter a contact phone number.';
      }
    }

    if (step === 4 && formData.modules.length === 0) {
      nextErrors.modules =
        'Select at least one CampusOS module.';
    }

    if (step === 5 && !formData.deploymentType) {
      nextErrors.deploymentType =
        'Select a deployment preference.';
    }

    if (step === 6 && !formData.consent) {
      nextErrors.consent =
        'Confirm that you are authorised and accept the applicable terms.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function goToStep(step: number) {
    if (step > maxVisitedStep) {
      return;
    }

    setCurrentStep(step);
    setSubmissionError('');
  }

  function nextStep() {
    if (!validateStep(currentStep)) {
      return;
    }

    const next = Math.min(currentStep + 1, TOTAL_STEPS);

    setCurrentStep(next);
    setMaxVisitedStep((previous) =>
      Math.max(previous, next),
    );
  }

  function previousStep() {
    setErrors({});
    setSubmissionError('');
    setCurrentStep((previous) =>
      Math.max(previous - 1, 1),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentStep < TOTAL_STEPS) {
      nextStep();
      return;
    }

    if (!validateStep(TOTAL_STEPS)) {
      return;
    }

    setLoading(true);
    setSubmissionError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const payload = (await response
        .json()
        .catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ||
            'We could not submit the registration. Please review the information and try again.',
        );
      }

      router.push(
        `/verify-email?email=${encodeURIComponent(
          formData.officialEmail,
        )}`,
      );
    } catch (caughtError: unknown) {
      setSubmissionError(
        caughtError instanceof Error
          ? caughtError.message
          : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    headingRef.current?.focus();
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [currentStep]);

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      <div className="grid min-h-screen lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[400px_minmax(0,1fr)]">
        <aside className="hidden bg-[#101D38] px-8 py-10 text-white lg:flex lg:flex-col xl:px-10">
          <Link
            href="/"
            aria-label="CampusOS homepage"
            className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CB2FF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
          >
            <Logo
              className="h-9 w-9"
              showText={false}
            />

            <span className="text-xl font-bold tracking-[-0.03em]">
              CampusOS
            </span>
          </Link>

          <div className="mt-12">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#AFC7EE]">
              <Sparkles
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              Institution onboarding
            </div>

            <h1 className="mt-6 text-3xl font-bold leading-tight tracking-[-0.035em]">
              Configure CampusOS around your institution
            </h1>

            <p className="mt-4 text-sm leading-7 text-[#B9C6D9]">
              Share your institutional requirements so the
              CampusOS team can prepare an appropriate product,
              deployment and implementation discussion.
            </p>
          </div>

          <div className="mt-10 flex-1">
            <DesktopStepper
              currentStep={currentStep}
              maxVisitedStep={maxVisitedStep}
              onSelect={goToStep}
            />
          </div>

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck
                className="h-5 w-5 text-[#66D9B0]"
                aria-hidden="true"
              />

              <p className="text-sm font-semibold">
                Responsible information handling
              </p>
            </div>

            <p className="mt-3 text-xs leading-5 text-[#AFC0D6]">
              Submit only information you are authorised to
              provide on behalf of your institution.
            </p>
          </div>

          <p className="mt-6 text-xs text-[#8FA0B8]">
            Already registered?{' '}
            <Link
              href="/login"
              className="font-semibold text-white hover:underline"
            >
              Sign in
            </Link>
          </p>
        </aside>

        <section className="flex min-w-0 flex-col">
          <header className="border-b border-[#DDE4EE] bg-white px-4 py-4 sm:px-6 lg:hidden">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                aria-label="CampusOS homepage"
                className="flex items-center gap-2.5"
              >
                <Logo
                  className="h-8 w-8"
                  showText={false}
                />

                <span className="text-lg font-bold tracking-[-0.03em] text-[#101828]">
                  CampusOS
                </span>
              </Link>

              <Link
                href="/login"
                className="text-sm font-semibold text-[#1754E8]"
              >
                Sign in
              </Link>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-[1040px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-10 xl:px-10 xl:py-12">
            <div className="mb-7 hidden items-center justify-between lg:flex">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.11em] text-[#1754E8]">
                  Institution registration
                </p>

                <p className="mt-2 text-sm text-[#667085]">
                  Step {currentStep} of {TOTAL_STEPS}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#667085]">
                <LockKeyhole
                  className="h-4 w-4"
                  aria-hidden="true"
                />
                Secure form submission
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              noValidate
              className="overflow-hidden rounded-3xl border border-[#D7E0EB] bg-white shadow-[0_22px_60px_rgba(16,42,91,0.10)]"
            >
              <MobileProgress currentStep={currentStep} />

              <div className="p-5 sm:p-8 lg:p-10">
                {submissionError && (
                  <div
                    role="alert"
                    className="mb-7 flex items-start gap-3 rounded-2xl border border-[#F2B8B2] bg-[#FFF1F0] p-4 text-sm text-[#A9271C]"
                  >
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="font-semibold">
                        Registration could not be submitted
                      </p>

                      <p className="mt-1 leading-6">
                        {submissionError}
                      </p>
                    </div>
                  </div>
                )}

                <div
                  key={currentStep}
                  className="animate-in fade-in slide-in-from-right-3 duration-300"
                >
                  <h2
                    ref={headingRef}
                    tabIndex={-1}
                    className="sr-only focus:not-sr-only"
                  >
                    {currentStepConfig.name}
                  </h2>

                  {currentStep === 1 && (
                    <div>
                      <SectionHeading
                        icon={Building2}
                        eyebrow="Step 1 · Institution"
                        title="Tell us about your institution"
                        description="Use official institutional information. This helps us understand the correct organisation and regional context."
                      />

                      <div className="mt-8 space-y-6">
                        <FieldShell
                          id="legalName"
                          label="Legal institution name"
                          required
                          hint="Enter the institution’s registered or officially recognised name."
                          error={errors.legalName}
                        >
                          <TextInput
                            id="legalName"
                            type="text"
                            autoComplete="organization"
                            value={formData.legalName}
                            onChange={(event) =>
                              updateForm(
                                'legalName',
                                event.target.value,
                              )
                            }
                            placeholder="Example University"
                            error={errors.legalName}
                            hint="true"
                          />
                        </FieldShell>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <FieldShell
                            id="institutionType"
                            label="Institution type"
                            required
                            error={errors.institutionType}
                          >
                            <SelectInput
                              id="institutionType"
                              value={formData.institutionType}
                              onChange={(event) =>
                                updateForm(
                                  'institutionType',
                                  event.target.value,
                                )
                              }
                              error={errors.institutionType}
                            >
                              <option value="">
                                Select institution type
                              </option>
                              <option value="public-university">
                                Public university
                              </option>
                              <option value="private-university">
                                Private university
                              </option>
                              <option value="autonomous-college">
                                Autonomous college
                              </option>
                              <option value="affiliated-college">
                                Affiliated college
                              </option>
                              <option value="engineering-institution">
                                Engineering institution
                              </option>
                              <option value="medical-institution">
                                Medical institution
                              </option>
                              <option value="online-provider">
                                Online education provider
                              </option>
                              <option value="other">
                                Other higher-education institution
                              </option>
                            </SelectInput>
                          </FieldShell>

                          <FieldShell
                            id="officialEmail"
                            label="Official email address"
                            required
                            hint="Use an institution-controlled email address."
                            error={errors.officialEmail}
                          >
                            <div className="relative">
                              <Mail
                                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]"
                                aria-hidden="true"
                              />

                              <TextInput
                                id="officialEmail"
                                type="email"
                                autoComplete="email"
                                value={formData.officialEmail}
                                onChange={(event) =>
                                  updateForm(
                                    'officialEmail',
                                    event.target.value,
                                  )
                                }
                                placeholder="admin@institution.edu"
                                error={errors.officialEmail}
                                hint="true"
                                className=""
                                style={{
                                  paddingLeft: '2.75rem',
                                }}
                              />
                            </div>
                          </FieldShell>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <FieldShell
                            id="country"
                            label="Country"
                            required
                            error={errors.country}
                          >
                            <TextInput
                              id="country"
                              type="text"
                              autoComplete="country-name"
                              value={formData.country}
                              onChange={(event) =>
                                updateForm(
                                  'country',
                                  event.target.value,
                                )
                              }
                              placeholder="Country"
                              error={errors.country}
                            />
                          </FieldShell>

                          <FieldShell
                            id="city"
                            label="City"
                            required
                            error={errors.city}
                          >
                            <div className="relative">
                              <MapPin
                                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]"
                                aria-hidden="true"
                              />

                              <TextInput
                                id="city"
                                type="text"
                                autoComplete="address-level2"
                                value={formData.city}
                                onChange={(event) =>
                                  updateForm(
                                    'city',
                                    event.target.value,
                                  )
                                }
                                placeholder="City"
                                error={errors.city}
                                style={{
                                  paddingLeft: '2.75rem',
                                }}
                              />
                            </div>
                          </FieldShell>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div>
                      <SectionHeading
                        icon={UsersRound}
                        eyebrow="Step 2 · Profile"
                        title="Help us understand your scale"
                        description="These details help shape an appropriate implementation, migration and deployment discussion."
                      />

                      <div className="mt-8 space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <FieldShell
                            id="campuses"
                            label="Number of campuses"
                            required
                            error={errors.campuses}
                          >
                            <TextInput
                              id="campuses"
                              type="number"
                              min={1}
                              step={1}
                              inputMode="numeric"
                              value={formData.campuses}
                              onChange={(event) =>
                                updateForm(
                                  'campuses',
                                  event.target.value,
                                )
                              }
                              error={errors.campuses}
                            />
                          </FieldShell>

                          <FieldShell
                            id="students"
                            label="Approximate active students"
                            required
                            error={errors.students}
                          >
                            <SelectInput
                              id="students"
                              value={formData.students}
                              onChange={(event) =>
                                updateForm(
                                  'students',
                                  event.target.value,
                                )
                              }
                              error={errors.students}
                            >
                              <option value="">
                                Select student range
                              </option>
                              <option value="1-500">
                                1–500 students
                              </option>
                              <option value="501-2000">
                                501–2,000 students
                              </option>
                              <option value="2001-10000">
                                2,001–10,000 students
                              </option>
                              <option value="10001-25000">
                                10,001–25,000 students
                              </option>
                              <option value="25000+">
                                More than 25,000 students
                              </option>
                            </SelectInput>
                          </FieldShell>
                        </div>

                        <FieldShell
                          id="currentErp"
                          label="Current ERP or student-information system"
                          hint="Optional. Enter the primary system currently used by your institution."
                        >
                          <div className="relative">
                            <Database
                              className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]"
                              aria-hidden="true"
                            />

                            <TextInput
                              id="currentErp"
                              type="text"
                              value={formData.currentErp}
                              onChange={(event) =>
                                updateForm(
                                  'currentErp',
                                  event.target.value,
                                )
                              }
                              placeholder="Current ERP, SIS or none"
                              hint="true"
                              style={{
                                paddingLeft: '2.75rem',
                              }}
                            />
                          </div>
                        </FieldShell>

                        <div className="rounded-2xl border border-[#C9DAF8] bg-[#F4F8FF] p-5">
                          <div className="flex items-start gap-3">
                            <BookOpenCheck
                              className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]"
                              aria-hidden="true"
                            />

                            <div>
                              <p className="text-sm font-semibold text-[#101828]">
                                Migration scope is reviewed separately
                              </p>

                              <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                                Providing a current-system name
                                does not initiate migration. Data
                                scope, quality and ownership are
                                reviewed during discovery.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div>
                      <SectionHeading
                        icon={BriefcaseBusiness}
                        eyebrow="Step 3 · Contact"
                        title="Identify the primary institutional contact"
                        description="This person should be authorised to discuss product evaluation, implementation requirements and account verification."
                      />

                      <div className="mt-8 space-y-6">
                        <div className="grid gap-6 sm:grid-cols-2">
                          <FieldShell
                            id="contactFirstName"
                            label="First name"
                            required
                            error={errors.contactFirstName}
                          >
                            <TextInput
                              id="contactFirstName"
                              type="text"
                              autoComplete="given-name"
                              value={formData.contactFirstName}
                              onChange={(event) =>
                                updateForm(
                                  'contactFirstName',
                                  event.target.value,
                                )
                              }
                              error={errors.contactFirstName}
                            />
                          </FieldShell>

                          <FieldShell
                            id="contactLastName"
                            label="Last name"
                            required
                            error={errors.contactLastName}
                          >
                            <TextInput
                              id="contactLastName"
                              type="text"
                              autoComplete="family-name"
                              value={formData.contactLastName}
                              onChange={(event) =>
                                updateForm(
                                  'contactLastName',
                                  event.target.value,
                                )
                              }
                              error={errors.contactLastName}
                            />
                          </FieldShell>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2">
                          <FieldShell
                            id="contactRole"
                            label="Job title or institutional role"
                            required
                            error={errors.contactRole}
                          >
                            <TextInput
                              id="contactRole"
                              type="text"
                              autoComplete="organization-title"
                              value={formData.contactRole}
                              onChange={(event) =>
                                updateForm(
                                  'contactRole',
                                  event.target.value,
                                )
                              }
                              placeholder="IT Director, Registrar, Dean"
                              error={errors.contactRole}
                            />
                          </FieldShell>

                          <FieldShell
                            id="contactPhone"
                            label="Phone number"
                            required
                            hint="Include the country or area code."
                            error={errors.contactPhone}
                          >
                            <div className="relative">
                              <Phone
                                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]"
                                aria-hidden="true"
                              />

                              <TextInput
                                id="contactPhone"
                                type="tel"
                                autoComplete="tel"
                                inputMode="tel"
                                value={formData.contactPhone}
                                onChange={(event) =>
                                  updateForm(
                                    'contactPhone',
                                    event.target.value,
                                  )
                                }
                                placeholder="+91 98765 43210"
                                error={errors.contactPhone}
                                hint="true"
                                style={{
                                  paddingLeft: '2.75rem',
                                }}
                              />
                            </div>
                          </FieldShell>
                        </div>

                        <div className="flex items-start gap-3 rounded-2xl border border-[#D8E3F2] bg-[#F8FAFD] p-5">
                          <ShieldCheck
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]"
                            aria-hidden="true"
                          />

                          <p className="text-xs leading-5 text-[#667085]">
                            Account credentials should only be
                            issued after institutional and email
                            verification. Do not submit personal
                            credentials in this form.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && (
                    <div>
                      <SectionHeading
                        icon={Settings2}
                        eyebrow="Step 4 · Requirements"
                        title="Select the modules relevant to your institution"
                        description="Choose one or more areas for the initial CampusOS evaluation. Final scope can be refined during discovery."
                      />

                      <fieldset className="mt-8">
                        <legend className="sr-only">
                          CampusOS modules
                        </legend>

                        <div className="grid gap-4 sm:grid-cols-2">
                          {moduleOptions.map((module) => (
                            <ModuleCard
                              key={module.id}
                              module={module}
                              selected={formData.modules.includes(
                                module.id,
                              )}
                              onChange={(checked) =>
                                toggleModule(
                                  module.id,
                                  checked,
                                )
                              }
                            />
                          ))}
                        </div>

                        {errors.modules && (
                          <p className="mt-4 flex items-center gap-2 text-xs font-medium text-[#C43224]">
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {errors.modules}
                          </p>
                        )}
                      </fieldset>

                      <div className="mt-6 rounded-2xl border border-[#D8E3F2] bg-[#F8FAFD] p-5">
                        <p className="text-sm font-semibold text-[#101828]">
                          Selected modules: {formData.modules.length}
                        </p>

                        <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                          Module selection indicates evaluation
                          interest and does not represent a final
                          subscription or implementation scope.
                        </p>
                      </div>
                    </div>
                  )}

                  {currentStep === 5 && (
                    <div>
                      <SectionHeading
                        icon={Cloud}
                        eyebrow="Step 5 · Deployment"
                        title="Choose an initial deployment preference"
                        description="This preference helps guide the technical conversation. Final architecture is subject to review and agreement."
                      />

                      <fieldset className="mt-8 space-y-4">
                        <legend className="sr-only">
                          Deployment preference
                        </legend>

                        {deploymentOptions.map((option) => (
                          <DeploymentCard
                            key={option.id}
                            option={option}
                            selected={
                              formData.deploymentType ===
                              option.id
                            }
                            onSelect={() =>
                              updateForm(
                                'deploymentType',
                                option.id,
                              )
                            }
                          />
                        ))}

                        {errors.deploymentType && (
                          <p className="flex items-center gap-2 text-xs font-medium text-[#C43224]">
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {errors.deploymentType}
                          </p>
                        )}
                      </fieldset>

                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-[#DDE4EE] bg-[#F8FAFD] p-5">
                          <LockKeyhole
                            className="h-5 w-5 text-[#1754E8]"
                            aria-hidden="true"
                          />

                          <p className="mt-3 text-sm font-semibold text-[#101828]">
                            Security review
                          </p>

                          <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                            Identity, data, integration and
                            infrastructure requirements are
                            reviewed for the selected deployment.
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[#DDE4EE] bg-[#F8FAFD] p-5">
                          <FileText
                            className="h-5 w-5 text-[#1754E8]"
                            aria-hidden="true"
                          />

                          <p className="mt-3 text-sm font-semibold text-[#101828]">
                            Documented scope
                          </p>

                          <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                            Responsibilities and technical
                            boundaries should be captured in the
                            implementation documentation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 6 && (
                    <div>
                      <SectionHeading
                        icon={FileCheck2}
                        eyebrow="Step 6 · Review"
                        title="Review your registration"
                        description="Confirm the information below before submitting it for institutional verification."
                      />

                      <div className="mt-8 space-y-4">
                        <ReviewSection
                          title="Institution"
                          icon={Building2}
                          onEdit={() => {
                            setCurrentStep(1);
                            setMaxVisitedStep(TOTAL_STEPS);
                          }}
                        >
                          <dl className="grid gap-5 sm:grid-cols-2">
                            <SummaryItem
                              label="Legal name"
                              value={formData.legalName}
                            />

                            <SummaryItem
                              label="Institution type"
                              value={formData.institutionType}
                            />

                            <SummaryItem
                              label="Location"
                              value={[
                                formData.city,
                                formData.country,
                              ]
                                .filter(Boolean)
                                .join(', ')}
                            />

                            <SummaryItem
                              label="Official email"
                              value={formData.officialEmail}
                            />
                          </dl>
                        </ReviewSection>

                        <ReviewSection
                          title="Organisation profile"
                          icon={UsersRound}
                          onEdit={() => {
                            setCurrentStep(2);
                            setMaxVisitedStep(TOTAL_STEPS);
                          }}
                        >
                          <dl className="grid gap-5 sm:grid-cols-2">
                            <SummaryItem
                              label="Campuses"
                              value={formData.campuses}
                            />

                            <SummaryItem
                              label="Student range"
                              value={formData.students}
                            />

                            <SummaryItem
                              label="Current system"
                              value={
                                formData.currentErp ||
                                'No system specified'
                              }
                            />
                          </dl>
                        </ReviewSection>

                        <ReviewSection
                          title="Primary contact"
                          icon={BriefcaseBusiness}
                          onEdit={() => {
                            setCurrentStep(3);
                            setMaxVisitedStep(TOTAL_STEPS);
                          }}
                        >
                          <dl className="grid gap-5 sm:grid-cols-2">
                            <SummaryItem
                              label="Contact name"
                              value={`${formData.contactFirstName} ${formData.contactLastName}`.trim()}
                            />

                            <SummaryItem
                              label="Role"
                              value={formData.contactRole}
                            />

                            <SummaryItem
                              label="Phone"
                              value={formData.contactPhone}
                            />
                          </dl>
                        </ReviewSection>

                        <ReviewSection
                          title="Requirements and deployment"
                          icon={Settings2}
                          onEdit={() => {
                            setCurrentStep(4);
                            setMaxVisitedStep(TOTAL_STEPS);
                          }}
                        >
                          <dl className="grid gap-5 sm:grid-cols-2">
                            <SummaryItem
                              label="Selected modules"
                              value={
                                selectedModuleNames.join(', ') ||
                                'No modules selected'
                              }
                            />

                            <SummaryItem
                              label="Deployment preference"
                              value={
                                selectedDeployment?.name || ''
                              }
                            />
                          </dl>
                        </ReviewSection>

                        <label
                          className={[
                            'relative flex cursor-pointer items-start gap-3 rounded-2xl border p-5',
                            errors.consent
                              ? 'border-[#E77B72] bg-[#FFF6F5]'
                              : 'border-[#DDE4EE] bg-[#F8FAFD] hover:border-[#B8CCEF]',
                          ].join(' ')}
                        >
                          <input
                            type="checkbox"
                            checked={formData.consent}
                            onChange={(event) =>
                              updateForm(
                                'consent',
                                event.target.checked,
                              )
                            }
                            aria-invalid={Boolean(
                              errors.consent,
                            )}
                            aria-describedby={
                              errors.consent
                                ? 'consent-error'
                                : undefined
                            }
                            className="mt-0.5 h-5 w-5 shrink-0 rounded border-[#B8C5D6] text-[#1754E8] focus:ring-[#1754E8]"
                          />

                          <span className="text-sm leading-6 text-[#475467]">
                            I confirm that I am authorised to
                            submit this registration on behalf of
                            the institution. I have reviewed the{' '}
                            <Link
                              href="/legal/terms"
                              target="_blank"
                              className="font-semibold text-[#1754E8] hover:underline"
                            >
                              Terms
                            </Link>
                            ,{' '}
                            <Link
                              href="/legal/privacy"
                              target="_blank"
                              className="font-semibold text-[#1754E8] hover:underline"
                            >
                              Privacy Notice
                            </Link>{' '}
                            and{' '}
                            <Link
                              href="/legal/dpa"
                              target="_blank"
                              className="font-semibold text-[#1754E8] hover:underline"
                            >
                              Data Processing information
                            </Link>
                            .
                          </span>
                        </label>

                        {errors.consent && (
                          <p
                            id="consent-error"
                            className="flex items-center gap-2 text-xs font-medium text-[#C43224]"
                          >
                            <AlertCircle
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                            {errors.consent}
                          </p>
                        )}

                        <div className="flex items-start gap-3 rounded-2xl border border-[#C9DAF8] bg-[#F3F7FF] p-5">
                          <ShieldCheck
                            className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]"
                            aria-hidden="true"
                          />

                          <p className="text-xs leading-5 text-[#5F6C7B]">
                            Submission creates an institutional
                            registration request. It does not
                            automatically activate production
                            services, create users or initiate data
                            migration.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#DDE4EE] bg-[#F8FAFD] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={previousStep}
                      disabled={loading}
                      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#C9D3E1] bg-white px-5 py-3 text-sm font-semibold text-[#344054] transition-colors hover:bg-[#F2F4F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      <ChevronLeft
                        className="h-4 w-4"
                        aria-hidden="true"
                      />
                      Back
                    </button>
                  )}
                </div>

                {currentStep < TOTAL_STEPS ? (
                  <button
                    type="submit"
                    className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,84,232,0.22)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 sm:w-auto"
                  >
                    Continue

                    <ChevronRight
                      className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={
                      !formData.consent || loading
                    }
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#078A57] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,138,87,0.20)] transition-colors hover:bg-[#067348] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#078A57] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55 sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          className="h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />
                        Submitting registration
                      </>
                    ) : (
                      <>
                        Submit registration
                        <ArrowRight
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            <p className="mx-auto mt-6 max-w-[760px] text-center text-xs leading-5 text-[#7C889A]">
              Registration requests are subject to institutional
              verification, product availability and commercial
              review. Do not submit passwords, payment-card
              information or sensitive student records.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}