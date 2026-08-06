import type { PublicPageSeed } from './types';

export const pricingSeeds: readonly PublicPageSeed[] = [
  {
    href: "/pricing",
    title: "Pricing Overview",
    kind: "pricing",
    summary: "Understand the factors used to scope CampusOS pricing for institutions, modules, campuses and implementation requirements.",
    focus: [
      "Institution size and active-user scope",
      "Selected modules and workflow complexity",
      "Deployment, integration and migration requirements",
      "Implementation, support and commercial terms",
    ],
  },
  {
    href: "/pricing/plans",
    title: "Plans",
    kind: "pricing",
    summary: "Compare institutional operating models based on scale, module breadth, governance and service requirements.",
    focus: [
      "Core platform and module coverage",
      "Campus and organisational complexity",
      "Reporting, workflow and integration needs",
      "Support, service and success requirements",
    ],
  },
  {
    href: "/pricing/modules",
    title: "Module Add-ons",
    kind: "pricing",
    summary: "Review optional CampusOS modules and capabilities that can extend an institutional configuration.",
    focus: [
      "Additional academic or administrative modules",
      "Advanced analytics and automation",
      "Specialised integrations and services",
      "Regional or institution-specific capabilities",
    ],
  },
  {
    href: "/pricing/implementation",
    title: "Implementation",
    kind: "pricing",
    summary: "Plan implementation scope and cost around discovery, configuration, migration, validation, training and rollout.",
    focus: [
      "Discovery and solution design",
      "Configuration and integration delivery",
      "Migration, testing and reconciliation",
      "Training, rollout and post-launch support",
    ],
  },
  {
    href: "/pricing/support",
    title: "Support Plans",
    kind: "pricing",
    summary: "Review support and service options aligned with institutional scale, coverage hours and operating requirements.",
    focus: [
      "Support channels and response targets",
      "Administrator and user assistance",
      "Operational reviews and service coordination",
      "Enhanced coverage and success services",
    ],
  },
  {
    href: "/pricing/request-quote",
    title: "Request a Quote",
    kind: "pricing",
    summary: "Provide institutional context so CampusOS can prepare a more relevant commercial and implementation proposal.",
    focus: [
      "Institution and campus profile",
      "Student, staff and user scale",
      "Required modules and integrations",
      "Timeline, procurement and support needs",
    ],
  },
  {
    href: "/pricing/procurement",
    title: "Procurement Information",
    kind: "pricing",
    summary: "Review the information commonly required for institutional evaluation, contracting and implementation approval.",
    focus: [
      "Commercial and scope documentation",
      "Security and privacy information",
      "Implementation and support responsibilities",
      "Contract, invoicing and vendor-review inputs",
    ],
  },
] as const;
