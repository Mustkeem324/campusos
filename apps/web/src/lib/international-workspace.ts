import 'server-only';

import type { RoleType } from '@prisma/client';

import { requireActiveUserContext } from './active-user-context';
import { prisma } from './db';

/** Roles that may open the international students / global mobility workspace. */
export const INTERNATIONAL_VIEWER_ROLES = new Set<RoleType>([
  'INSTITUTION_ADMIN',
  'SUPER_ADMIN',
  'REGISTRAR',
  'ADMISSIONS_COUNSELLOR',
  'DEAN',
]);

export function canViewInternational(role: RoleType): boolean {
  return INTERNATIONAL_VIEWER_ROLES.has(role);
}

export class InternationalWorkspaceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'InternationalWorkspaceError';
    this.status = status;
  }
}

export type InternationalStudentView = {
  id: string;
  name: string;
  nationality: string;
  flag: string;
  program: string;
  visaType: string;
  visaExpiry: string;
  frroStatus: 'Registered' | 'Pending' | 'Expired';
  insuranceStatus: 'Active' | 'Expired' | 'Not Enrolled';
  email: string;
  admissionYear: number;
};

export type ExchangeProgramView = {
  id: string;
  university: string;
  country: string;
  flag: string;
  type: 'Inbound' | 'Outbound';
  semester: string;
  creditsTransferable: number;
  seatsAvailable: number;
  applicationDeadline: string;
  status: 'Open' | 'Closed' | 'In Progress';
};

export type CreditMappingView = {
  homeCourse: string;
  homeCredits: number;
  hostCourse: string;
  hostCredits: number;
  hostUniv: string;
  equivalence: 'Approved' | 'Under Review';
  notes: string;
};

export type CountryDistributionEntry = {
  country: string;
  flag: string;
  count: number;
};

export type InternationalWorkspace = {
  role: string;
  stats: {
    internationalStudents: number;
    activeVisas: number;
    exchangePrograms: number;
    creditsTransferred: number;
  };
  students: InternationalStudentView[];
  exchangePrograms: ExchangeProgramView[];
  creditMappings: CreditMappingView[];
  countryDistribution: CountryDistributionEntry[];
  mobilityStats: {
    totalCountries: number;
    outboundThisYear: number;
    inboundThisYear: number;
    partnerUniversities: number;
    activeMous: number;
    creditsTransferred: number;
  };
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDate(value: Date | null | undefined): string {
  if (!value) return '—';
  return DATE_FORMAT.format(value);
}

/** Convert an ISO-3166 alpha-2 country code into its regional-indicator flag emoji. */
export function flagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const code = countryCode.toUpperCase();
  // 'XX' is not a real ISO-3166 alpha-2 country code; treat it as unknown.
  if (!/^[A-Z]{2}$/.test(code) || code === 'XX') return '🌐';
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

function shortId(id: string): string {
  return `INT-${id.slice(0, 4).toUpperCase()}`;
}

export async function getInternationalWorkspace(): Promise<InternationalWorkspace> {
  const context = await requireActiveUserContext();
  if (!canViewInternational(context.activeRole)) {
    throw new InternationalWorkspaceError('International students workspace is not available for this role.', 403);
  }

  const [students, exchangePrograms, creditMappings] = await Promise.all([
    prisma.internationalStudent.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { fullName: 'asc' },
    }),
    prisma.exchangeProgram.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { applicationDeadline: 'asc' },
    }),
    prisma.creditMapping.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const currentYear = new Date().getFullYear();
  const activeVisas = students.filter(
    (s) => s.visaExpiry >= new Date() && s.frroStatus !== 'Expired',
  ).length;
  const creditsTransferred = creditMappings
    .filter((c) => c.equivalence === 'Approved')
    .reduce((sum, c) => sum + c.hostCredits, 0);

  const countryCounts = new Map<string, number>();
  // Map nationality -> country code once so the distribution build stays O(n).
  const countryCodeByNationality = new Map<string, string>();
  for (const student of students) {
    const country = student.nationality || 'Unknown';
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
    if (!countryCodeByNationality.has(country)) {
      countryCodeByNationality.set(country, student.countryCode);
    }
  }
  const countryDistribution = [...countryCounts.entries()]
    .map(([country, count]) => ({
      country,
      flag: flagEmoji(countryCodeByNationality.get(country) ?? ''),
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const partnerUniversities = new Set(
    exchangePrograms.map((e) => `${e.country}|${e.university}`),
  ).size;

  return {
    role: context.activeRole,
    stats: {
      internationalStudents: students.length,
      activeVisas,
      exchangePrograms: exchangePrograms.length,
      creditsTransferred,
    },
    students: students.map((s) => ({
      id: shortId(s.id),
      name: s.fullName,
      nationality: s.nationality,
      flag: flagEmoji(s.countryCode),
      program: s.program,
      visaType: s.visaType,
      visaExpiry: formatDate(s.visaExpiry),
      frroStatus: s.frroStatus as InternationalStudentView['frroStatus'],
      insuranceStatus: s.insuranceStatus as InternationalStudentView['insuranceStatus'],
      email: s.email,
      admissionYear: s.admissionYear,
    })),
    exchangePrograms: exchangePrograms.map((e) => ({
      id: shortId(e.id),
      university: e.university,
      country: e.country,
      flag: flagEmoji(e.countryCode),
      type: e.type as ExchangeProgramView['type'],
      semester: e.semester,
      creditsTransferable: e.creditsTransferable,
      seatsAvailable: e.seatsAvailable,
      applicationDeadline: formatDate(e.applicationDeadline),
      status: e.status as ExchangeProgramView['status'],
    })),
    creditMappings: creditMappings.map((c) => ({
      homeCourse: c.homeCourse,
      homeCredits: c.homeCredits,
      hostCourse: c.hostCourse,
      hostCredits: c.hostCredits,
      hostUniv: c.hostUniversity,
      equivalence: c.equivalence as CreditMappingView['equivalence'],
      notes: c.notes ?? '',
    })),
    countryDistribution,
    mobilityStats: {
      totalCountries: countryCounts.size,
      outboundThisYear: exchangePrograms.filter(
        (e) => e.type === 'Outbound' && e.applicationDeadline.getFullYear() >= currentYear,
      ).length,
      inboundThisYear: exchangePrograms.filter(
        (e) => e.type === 'Inbound' && e.applicationDeadline.getFullYear() >= currentYear,
      ).length,
      partnerUniversities,
      activeMous: partnerUniversities,
      creditsTransferred,
    },
  };
}
