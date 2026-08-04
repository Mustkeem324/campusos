'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Headphones,
  LayoutDashboard,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';
import { DemoLoginConsole } from '@/components/auth/DemoLoginConsole';
import { useAuthStore } from '../../../lib/auth-store';
import type { UserSession } from '../../../lib/types';

type AuthUser = UserSession;

type AuthResponse = {
  error?: string;
  mfaRequired?: boolean;
  userId?: string;
  user?: AuthUser;
};

const platformBenefits = [
  {
    id: 'role-aware',
    title: 'Role-aware access',
    description:
      'Users enter workspaces aligned with their assigned institutional responsibilities.',
    icon: ShieldCheck,
  },
  {
    id: 'connected-workflows',
    title: 'Connected workflows',
    description:
      'Academic, administrative and student-service activities stay connected.',
    icon: LayoutDashboard,
  },
  {
    id: 'institution-context',
    title: 'Institutional context',
    description:
      'Tenant and permission context remains part of authorised application access.',
    icon: Building2,
  },
] as const;

async function readAuthResponse(
  response: Response,
): Promise<AuthResponse> {
  const payload: unknown = await response
    .json()
    .catch(() => ({}));

  if (!payload || typeof payload !== 'object') {
    return {};
  }

  return payload as AuthResponse;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function PlatformPreview() {
  return (
    <div
      className="overflow-hidden rounded-3xl border border-white/10 bg-[#142441] shadow-[0_28px_70px_rgba(0,0,0,0.24)]"
      aria-label="Illustrative CampusOS workspace"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1754E8] text-white">
            <LayoutDashboard
              className="h-4.5 w-4.5"
              aria-hidden="true"
            />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              Institutional overview
            </p>

            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#91A3BE]">
              Illustrative CampusOS workspace
            </p>
          </div>
        </div>

        <span className="rounded-full border border-[#315583] bg-[#1B3153] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#AFCBFA]">
          Role-aware
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Priority work', 'Assigned'],
            ['Approvals', 'Review'],
            ['Reports', 'Available'],
          ].map(([label, status]) => (
            <div
              key={label}
              className="rounded-xl border border-white/10 bg-[#101D38] p-3"
            >
              <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-[#91A3BE]">
                {label}
              </p>

              <p className="mt-3 text-xs font-semibold text-white">
                {status}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-xl border border-white/10 bg-[#101D38] p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-white">
              Responsible actions
            </p>

            <CheckCircle2
              className="h-4 w-4 text-[#61D6AB]"
              aria-hidden="true"
            />
          </div>

          <div className="mt-4 space-y-3">
            {[
              'Review assigned institutional records',
              'Complete authorised workflow actions',
              'Track decisions and current status',
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-lg bg-white/[0.05] px-3 py-2.5"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-[#6A9CFF]"
                  aria-hidden="true"
                />

                <span className="text-[10px] font-medium text-[#C5D0E0]">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-5 py-3 text-center text-[9px] text-[#8293AD]">
        Fictional interface shown for product illustration
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] =
    useState<string | null>(null);

  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] =
    useState('');

  function validateCredentials() {
    const normalizedEmail = email.trim();

    let valid = true;

    setEmailError('');
    setPasswordError('');

    if (!normalizedEmail) {
      setEmailError('Enter your email address.');
      valid = false;
    } else if (!isValidEmail(normalizedEmail)) {
      setEmailError('Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      setPasswordError('Enter your password.');
      valid = false;
    }

    return valid;
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    if (!validateCredentials()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          rememberMe,
        }),
      });

      const payload = await readAuthResponse(response);

      if (!response.ok) {
        throw new Error(
          payload.error ||
            'Unable to sign in with these credentials.',
        );
      }

      if (payload.mfaRequired) {
        if (!payload.userId) {
          throw new Error(
            'Multi-factor authentication could not be started.',
          );
        }

        sessionStorage.setItem(
          'mfaUserId',
          payload.userId,
        );

        router.push('/mfa');
        return;
      }

      if (!payload.user) {
        throw new Error(
          'The authentication response did not include a valid user session.',
        );
      }

      setSession(payload.user);
      router.replace('/dashboard');
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'An unexpected error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(persona: string) {
    setError('');
    setDemoLoading(persona);

    try {
      const response = await fetch(
        '/api/auth/demo-login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ persona }),
        },
      );

      const payload = await readAuthResponse(response);

      if (!response.ok) {
        throw new Error(
          payload.error ||
            'Demo login is temporarily unavailable.',
        );
      }

      if (!payload.user) {
        throw new Error(
          'The demo session could not be created.',
        );
      }

      setSession(payload.user);
      router.replace('/dashboard');
    } catch (caughtError: unknown) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The demo session could not be started.',
      );
    } finally {
      setDemoLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F7FB]">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.95fr)_minmax(500px,1.05fr)]">
        {/* Product and trust panel */}
        <aside className="hidden min-h-screen flex-col bg-[#101D38] px-8 py-10 text-white lg:flex xl:px-12 xl:py-12">
          <Link
            href="/"
            aria-label="CampusOS homepage"
            className="flex w-fit items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CB2FF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
          >
            <Logo
              className="h-10 w-10"
              showText={false}
            />

            <span className="text-2xl font-bold tracking-[-0.035em]">
              CampusOS
            </span>
          </Link>

          <div className="mt-14 max-w-[650px]">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 text-[11px] font-bold uppercase tracking-[0.11em] text-[#AFC7EE]">
              <Sparkles
                className="h-3.5 w-3.5"
                aria-hidden="true"
              />
              Connected higher-education operations
            </div>

            <h1 className="mt-7 text-balance text-4xl font-bold leading-[1.08] tracking-[-0.045em] xl:text-[52px]">
              One secure entry point for your CampusOS workspace
            </h1>

            <p className="mt-6 max-w-[580px] text-base leading-8 text-[#B9C6D9]">
              Access the academic, administrative and
              student-service workflows assigned to your
              institutional role.
            </p>
          </div>

          <div className="mt-10 grid gap-5 xl:grid-cols-3">
            {platformBenefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#172B4C] text-[#8CB2FF]">
                    <Icon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-4 text-sm font-semibold text-white">
                    {benefit.title}
                  </h2>

                  <p className="mt-2 text-xs leading-5 text-[#9FADC1]">
                    {benefit.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-10 max-w-[620px]">
            <PlatformPreview />
          </div>

          <div className="mt-auto flex items-start gap-3 border-t border-white/10 pt-7">
            <Headphones
              className="mt-0.5 h-5 w-5 shrink-0 text-[#8CB2FF]"
              aria-hidden="true"
            />

            <p className="text-xs leading-5 text-[#AAB8CC]">
              Need help accessing your account? Contact your
              institution’s authorised IT support team or email{' '}
              <a
                href="mailto:support@campusos.com"
                className="font-semibold text-white underline decoration-white/35 underline-offset-4 hover:decoration-white"
              >
                support@campusos.com
              </a>
              .
            </p>
          </div>
        </aside>

        {/* Authentication panel */}
        <section className="relative flex min-h-screen flex-col bg-white">
          <header className="flex min-h-16 items-center justify-between border-b border-[#E1E7EF] px-4 sm:px-6 lg:border-b-0 lg:px-10 lg:pt-8">
            <Link
              href="/"
              aria-label="CampusOS homepage"
              className="flex items-center gap-2.5 rounded-lg lg:hidden"
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
              href="/"
              className="group ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-[#5F6C7B] transition-colors hover:bg-[#F2F4F7] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform motion-safe:group-hover:-translate-x-0.5"
                aria-hidden="true"
              />
              Back to website
            </Link>
          </header>

          <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 sm:py-14 lg:px-10 xl:px-14">
            <div className="w-full max-w-[520px]">
              <header>
                <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1754E8]">
                  <LockKeyhole
                    className="h-3.5 w-3.5"
                    aria-hidden="true"
                  />
                  Secure account access
                </div>

                <h2 className="mt-6 text-3xl font-bold tracking-[-0.035em] text-[#101828] sm:text-[38px]">
                  Welcome back
                </h2>

                <p className="mt-3 text-sm leading-6 text-[#667085] sm:text-base">
                  Sign in using the credentials provided by your
                  institution.
                </p>
              </header>

              <div className="mt-8 rounded-3xl border border-[#D8E1EC] bg-white p-5 shadow-[0_18px_52px_rgba(16,42,91,0.08)] sm:p-7">
                <section aria-labelledby="demo-login-heading">
                  <div className="mb-5 flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                      <UsersRound
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    </div>

                    <div>
                      <h3
                        id="demo-login-heading"
                        className="text-sm font-bold text-[#101828]"
                      >
                        Explore the demonstration environment
                      </h3>

                      <p className="mt-1 text-xs leading-5 text-[#667085]">
                        Use a fictional role persona to preview
                        CampusOS without production data.
                      </p>
                    </div>
                  </div>

                  <DemoLoginConsole
                    demoLoading={demoLoading}
                    onDemoLogin={handleDemoLogin}
                  />
                </section>

                <div
                  className="my-8 flex items-center gap-4"
                  role="separator"
                  aria-label="Or sign in manually"
                >
                  <span className="h-px flex-1 bg-[#E1E7EF]" />

                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A95A6]">
                    Or sign in manually
                  </span>

                  <span className="h-px flex-1 bg-[#E1E7EF]" />
                </div>

                {error && (
                  <div
                    role="alert"
                    aria-live="assertive"
                    className="mb-6 flex items-start gap-3 rounded-2xl border border-[#F2B8B2] bg-[#FFF1F0] p-4 text-sm text-[#A9271C]"
                  >
                    <AlertCircle
                      className="mt-0.5 h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="font-semibold">
                        Sign-in unsuccessful
                      </p>

                      <p className="mt-1 leading-6">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleLogin}
                  noValidate
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-[#344054]"
                    >
                      Email address
                    </label>

                    <div className="relative mt-2">
                      <Mail
                        className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#98A2B3]"
                        aria-hidden="true"
                      />

                      <input
                        id="email"
                        name="email"
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setEmailError('');
                          setError('');
                        }}
                        aria-invalid={Boolean(emailError)}
                        aria-describedby={
                          emailError
                            ? 'email-error'
                            : undefined
                        }
                        placeholder="name@institution.edu"
                        className={[
                          'min-h-12 w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-[#101828]',
                          'placeholder:text-[#98A2B3]',
                          'transition-[border-color,box-shadow]',
                          'focus:outline-none focus:ring-4',
                          emailError
                            ? 'border-[#E77B72] focus:border-[#C43224] focus:ring-[#C43224]/10'
                            : 'border-[#C9D3E1] hover:border-[#AEBCCD] focus:border-[#1754E8] focus:ring-[#1754E8]/10',
                        ].join(' ')}
                      />
                    </div>

                    {emailError && (
                      <p
                        id="email-error"
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#C43224]"
                      >
                        <AlertCircle
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <label
                        htmlFor="password"
                        className="text-sm font-semibold text-[#344054]"
                      >
                        Password
                      </label>

                      <Link
                        href="/forgot-password"
                        className="rounded text-xs font-semibold text-[#1754E8] hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <div className="relative mt-2">
                      <LockKeyhole
                        className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-[#98A2B3]"
                        aria-hidden="true"
                      />

                      <input
                        id="password"
                        name="password"
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setPasswordError('');
                          setError('');
                        }}
                        aria-invalid={Boolean(
                          passwordError,
                        )}
                        aria-describedby={
                          passwordError
                            ? 'password-error'
                            : undefined
                        }
                        placeholder="Enter your password"
                        className={[
                          'min-h-12 w-full rounded-xl border bg-white py-3 pl-11 pr-12 text-sm text-[#101828]',
                          'placeholder:text-[#98A2B3]',
                          'transition-[border-color,box-shadow]',
                          'focus:outline-none focus:ring-4',
                          passwordError
                            ? 'border-[#E77B72] focus:border-[#C43224] focus:ring-[#C43224]/10'
                            : 'border-[#C9D3E1] hover:border-[#AEBCCD] focus:border-[#1754E8] focus:ring-[#1754E8]/10',
                        ].join(' ')}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current,
                          )
                        }
                        aria-label={
                          showPassword
                            ? 'Hide password'
                            : 'Show password'
                        }
                        aria-pressed={showPassword}
                        className="absolute right-2 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#667085] transition-colors hover:bg-[#F2F4F7] hover:text-[#101828] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
                      >
                        {showPassword ? (
                          <EyeOff
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        ) : (
                          <Eye
                            className="h-5 w-5"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    </div>

                    {passwordError && (
                      <p
                        id="password-error"
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#C43224]"
                      >
                        <AlertCircle
                          className="h-3.5 w-3.5"
                          aria-hidden="true"
                        />
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <label className="flex w-fit cursor-pointer items-start gap-3">
                    <input
                      id="rememberMe"
                      name="rememberMe"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(
                          event.target.checked,
                        )
                      }
                      className="mt-0.5 h-4.5 w-4.5 rounded border-[#B8C5D6] text-[#1754E8] focus:ring-[#1754E8]"
                    />

                    <span className="text-sm leading-5 text-[#475467]">
                      Keep me signed in on this device
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || Boolean(demoLoading)}
                    className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(23,84,232,0.23)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          className="h-5 w-5 animate-spin"
                          aria-hidden="true"
                        />
                        Signing in
                      </>
                    ) : (
                      <>
                        Sign in to CampusOS

                        <ArrowRight
                          className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="mt-7 rounded-2xl border border-[#DDE4EE] bg-[#F8FAFD] p-5">
                <div className="flex items-start gap-3">
                  <Building2
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]"
                    aria-hidden="true"
                  />

                  <div>
                    <h3 className="text-sm font-semibold text-[#101828]">
                      Registering a new institution?
                    </h3>

                    <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                      Submit an institutional registration
                      request for verification and product
                      evaluation.
                    </p>

                    <Link
                      href="/signup/institution"
                      className="group mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg text-xs font-semibold text-[#1754E8] hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
                    >
                      Start institution registration

                      <ArrowRight
                        className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </div>
              </div>

              <p className="mt-6 text-center text-xs leading-5 text-[#7C889A]">
                By signing in, you confirm that you are
                authorised to access this institutional
                workspace. Access activity may be recorded
                according to institutional policies.
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-medium text-[#667085]">
                <Link
                  href="/legal/privacy"
                  className="hover:text-[#1754E8]"
                >
                  Privacy
                </Link>

                <Link
                  href="/legal/terms"
                  className="hover:text-[#1754E8]"
                >
                  Terms
                </Link>

                <Link
                  href="/security"
                  className="hover:text-[#1754E8]"
                >
                  Security
                </Link>

                <Link
                  href="/institution-login"
                  className="hover:text-[#1754E8]"
                >
                  Institution administrator
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}