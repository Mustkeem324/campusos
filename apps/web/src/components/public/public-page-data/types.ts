export type PublicPageKind =
  | 'platform'
  | 'solution'
  | 'solutions'
  | 'role'
  | 'roles'
  | 'resource'
  | 'resources'
  | 'security'
  | 'pricing'
  | 'company'
  | 'contact';

export type PublicPageSeed = {
  href: string;
  title: string;
  kind: PublicPageKind;
  summary: string;
  focus: readonly [string, string, string, string];
};

export type PublicPageAction = {
  label: string;
  href: string;
};

export type PublicPageWorkflowStep = {
  number: string;
  title: string;
  description: string;
};

export type PublicPageQuestion = {
  question: string;
  answer: string;
};

export type PublicPageRelatedLink = {
  label: string;
  href: string;
  description: string;
};

export type PublicPageProfile = PublicPageSeed & {
  eyebrow: string;
  categoryLabel: string;
  audiences: readonly string[];
  outcomes: readonly string[];
  workflow: readonly PublicPageWorkflowStep[];
  governance: readonly string[];
  questions: readonly PublicPageQuestion[];
  note: string;
  primaryAction: PublicPageAction;
  secondaryAction: PublicPageAction;
  related: readonly PublicPageRelatedLink[];
};
