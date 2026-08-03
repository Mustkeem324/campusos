export interface DemoSeedConfig {
  tenantName: string;
  tenantCode: string;
  tenantDomain: string;
  students: number;
  faculty: number;
  employees: number;
  parents: number;
  departments: number;
  programmes: number;
  courses: number;
  campuses: number;
  academicYears: number;
  sections: number;
  seed: number;
  reset: boolean;
  validateOnly: boolean;
  dryRun: boolean;
  allowDemoSeed: boolean;
}

export function parseSeedConfig(args: string[] = process.argv.slice(2)): DemoSeedConfig {
  const getArgValue = (flag: string): string | undefined => {
    const found = args.find(a => a.startsWith(`--${flag}=`));
    if (found) return found.split('=')[1];
    return undefined;
  };

  const hasFlag = (flag: string): boolean => {
    return args.includes(`--${flag}`);
  };

  const parseNum = (val: string | undefined, envVal: string | undefined, fallback: number): number => {
    if (val !== undefined) return parseInt(val, 10);
    if (envVal !== undefined) return parseInt(envVal, 10);
    return fallback;
  };

  const parseBool = (flag: string, envVal: string | undefined, fallback: boolean): boolean => {
    if (hasFlag(flag)) return true;
    if (getArgValue(flag) === 'true') return true;
    if (getArgValue(flag) === 'false') return false;
    if (envVal === 'true') return true;
    if (envVal === 'false') return false;
    return fallback;
  };

  return {
    tenantName: getArgValue('tenant-name') || process.env.DEMO_SEED_TENANT_NAME || 'CampusOS Demo University',
    tenantCode: getArgValue('tenant-code') || process.env.DEMO_SEED_TENANT_CODE || 'CDU',
    tenantDomain: getArgValue('tenant-domain') || process.env.DEMO_SEED_TENANT_DOMAIN || 'demo-campusos-v2',
    students: parseNum(getArgValue('students'), process.env.DEMO_SEED_STUDENTS, 100),
    faculty: parseNum(getArgValue('faculty'), process.env.DEMO_SEED_FACULTY, 20),
    employees: parseNum(getArgValue('employees'), process.env.DEMO_SEED_EMPLOYEES, 10),
    parents: parseNum(getArgValue('parents'), process.env.DEMO_SEED_PARENTS, 90),
    departments: parseNum(getArgValue('departments'), process.env.DEMO_SEED_DEPARTMENTS, 6),
    programmes: parseNum(getArgValue('programmes'), process.env.DEMO_SEED_PROGRAMMES, 10),
    courses: parseNum(getArgValue('courses'), process.env.DEMO_SEED_COURSES, 30),
    campuses: parseNum(getArgValue('campuses'), process.env.DEMO_SEED_CAMPUSES, 2),
    academicYears: parseNum(getArgValue('academic-years'), process.env.DEMO_SEED_ACADEMIC_YEARS, 4),
    sections: parseNum(getArgValue('sections'), process.env.DEMO_SEED_SECTIONS, 20),
    seed: parseNum(getArgValue('seed'), process.env.DEMO_SEED_VALUE, 20260804),
    reset: parseBool('reset', process.env.DEMO_SEED_RESET, false),
    validateOnly: parseBool('validate-only', process.env.DEMO_SEED_VALIDATE_ONLY, false),
    dryRun: parseBool('dry-run', process.env.DEMO_SEED_DRY_RUN, false),
    allowDemoSeed: parseBool('allow-demo-seed', process.env.DEMO_SEED_ALLOW, false),
  };
}
