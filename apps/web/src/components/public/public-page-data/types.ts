export type PublicPageKind =
  | 'platform'
  | 'solution'
  | 'solutions'
  | 'role'
  | 'roles'
  | 'resource'
  | 'resources'
  | 'security'
  | 'pricing';

export type PublicPageSeed = {
  href: string;
  title: string;
  kind: PublicPageKind;
  summary: string;
  focus: readonly [string, string, string, string];
};

export type PublicPageProfile = PublicPageSeed & {
  eyebrow: string;
  audiences: readonly string[];
  outcomes: readonly string[];
  workflow: readonly { title: string; description: string }[];
  governance: readonly string[];
  note: string;
};
