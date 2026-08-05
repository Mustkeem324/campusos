export type CareerWorkplaceType = 'REMOTE' | 'HYBRID' | 'ONSITE';
export type CareerEmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type CareerOpeningStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'PAUSED' | 'CLOSED' | 'FILLED' | 'ARCHIVED';

export type CareerOpening = {
  id: string;
  referenceCode: string;
  slug: string;
  title: string;
  summary: string;
  department: string;
  team: string;
  location: string;
  workplaceType: CareerWorkplaceType;
  employmentType: CareerEmploymentType;
  experienceLevel: string;
  status: CareerOpeningStatus;
  responsibilities: string[];
  requiredQualifications: string[];
  preferredQualifications: string[];
  skills: string[];
  benefits: string[];
  postedAt?: string;
  closesAt?: string;
  isDemo?: boolean;
};

export type CareerOpeningFilter = {
  query?: string;
  department?: string;
  location?: string;
  workplaceType?: CareerWorkplaceType | 'ALL';
  employmentType?: CareerEmploymentType | 'ALL';
};
