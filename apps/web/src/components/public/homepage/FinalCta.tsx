import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  Blocks,
  CalendarDays,
  Clock3,
  CreditCard,
  FileText,
  Globe2,
  GraduationCap,
  Landmark,
  MessageCircle,
  PieChart,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

type Benefit = {
  title: string;
  description: string;
  icon: React.ElementType;
  iconClassName: string;
  iconContainerClassName: string;
};

type PlatformStat = {
  value: string;
  label: string;
  icon: React.ElementType;
  iconClassName: string;
};

const benefits: Benefit[] = [
  {
    title: 'Secure & Governed',
    description: 'Enterprise-grade access and operational controls',
    icon: ShieldCheck,
    iconClassName: 'text-[#50E2B0]',
    iconContainerClassName: 'bg-[#0D2942]',
  },
  {
    title: 'Role-Based Access',
    description: 'Focused workspaces for every campus stakeholder',
    icon: UsersRound,
    iconClassName: 'text-[#5795FF]',
    iconContainerClassName: 'bg-[#0B2455]',
  },
  {
    title: 'Real-Time Insights',
    description: 'Make informed decisions with connected dashboards',
    icon: BarChart3,
    iconClassName: 'text-[#8B79FF]',
    iconContainerClassName: 'bg-[#171E50]',
  },
  {
    title: 'All-in-One Platform',
    description: 'Integrated modules for connected campus operations',
    icon: Blocks,
    iconClassName: 'text-[#FFAD41]',
    iconContainerClassName: 'bg-[#20233F]',
  },
];

/**
 * Replace these sample metrics with verified CampusOS values before publishing.
 */
const platformStats: PlatformStat[] = [
  {
    value: '500+',
    label: 'Institutions',
    icon: Landmark,
    iconClassName: 'text-[#7196FF]',
  },
  {
    value: '1M+',
    label: 'Users',
    icon: UsersRound,
    iconClassName: 'text-[#4FDEB2]',
  },
  {
    value: '20+',
    label: 'Countries',
    icon: Globe2,
    iconClassName: 'text-[#448BFF]',
  },
];

function FloatingIcon({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: React.ElementType;
  className: string;
  iconClassName: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`absolute z-10 hidden h-[74px] w-[74px] items-center justify-center rounded-full border bg-[#071839]/95 shadow-[0_16px_40px_rgba(0,0,0,0.3)] xl:flex ${className}`}
    >
      <Icon className={`h-8 w-8 ${iconClassName}`} strokeWidth={2.2} />
    </div>
  );
}

function BenefitItem({
  benefit,
  showDivider,
}: {
  benefit: Benefit;
  showDivider: boolean;
}) {
  const Icon = benefit.icon;

  return (
    <div
      className={`relative flex min-w-0 items-start gap-4 px-2 py-3 lg:px-6 ${
        showDivider
          ? 'lg:after:absolute lg:after:right-0 lg:after:top-4 lg:after:h-14 lg:after:w-px lg:after:bg-white/15'
          : ''
      }`}
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 ${benefit.iconContainerClassName}`}
      >
        <Icon
          className={`h-7 w-7 ${benefit.iconClassName}`}
          strokeWidth={2.1}
          aria-hidden="true"
        />
      </div>

      <div className="min-w-0 pt-0.5">
        <h3 className="text-base font-semibold text-white">
          {benefit.title}
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-[#AEBBD0]">
          {benefit.description}
        </p>
      </div>
    </div>
  );
}

function PlatformMetric({
  stat,
  showDivider,
}: {
  stat: PlatformStat;
  showDivider: boolean;
}) {
  const Icon = stat.icon;

  return (
    <div
      className={`relative flex items-center justify-center gap-4 px-5 py-4 ${
        showDivider
          ? 'lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:h-16 lg:after:w-px lg:after:-translate-y-1/2 lg:after:bg-white/15'
          : ''
      }`}
    >
      <Icon
        className={`h-10 w-10 shrink-0 ${stat.iconClassName}`}
        strokeWidth={2}
        aria-hidden="true"
      />

      <div>
        <div className="text-3xl font-bold tracking-tight text-white">
          {stat.value}
        </div>
        <div className="mt-1 text-sm text-[#B7C2D5]">{stat.label}</div>
      </div>
    </div>
  );
}

function BackgroundArtwork() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]">
      {/* Subtle centre glow */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 35%, rgba(25, 84, 232, 0.30), transparent 43%)',
        }}
      />

      {/* Dotted background */}
      <div
        className="absolute left-1/2 top-[110px] h-[480px] w-[82%] -translate-x-1/2 opacity-[0.22]"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(58, 119, 255, 0.85) 1.5px, transparent 1.7px)',
          backgroundSize: '13px 13px',
          maskImage:
            'radial-gradient(ellipse at center, black 5%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 5%, transparent 75%)',
        }}
      />

      {/* Left orbital rings */}
      <div className="absolute -left-[185px] top-[48px] h-[610px] w-[610px] rounded-full border border-[#1F63D8]/65" />
      <div className="absolute -left-[110px] top-[92px] h-[520px] w-[520px] rounded-full border border-[#1B4EA8]/55" />

      {/* Right orbital rings */}
      <div className="absolute -right-[185px] top-[48px] h-[610px] w-[610px] rounded-full border border-[#1F63D8]/65" />
      <div className="absolute -right-[110px] top-[92px] h-[520px] w-[520px] rounded-full border border-[#1B4EA8]/55" />

      {/* Small orbit points */}
      <span className="absolute left-[2.8%] top-[13%] h-2 w-2 rounded-full bg-[#3B82F6]" />
      <span className="absolute right-[2.8%] top-[13%] h-2 w-2 rounded-full bg-[#3B82F6]" />
      <span className="absolute left-[2.5%] bottom-[31%] h-2 w-2 rounded-full bg-[#2864D8]" />
      <span className="absolute right-[2.5%] bottom-[31%] h-2 w-2 rounded-full bg-[#2864D8]" />
    </div>
  );
}

export function FinalCta() {
  return (
    <section
      className="overflow-hidden bg-[#020A1E] px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="final-cta-heading"
    >
      <div className="mx-auto max-w-[1420px]">
        <div className="relative isolate overflow-hidden rounded-[30px] border border-[#2956A5]/70 bg-[#051331] px-5 py-12 shadow-[0_30px_100px_rgba(0,0,0,0.4)] sm:px-8 sm:py-16 lg:px-16 lg:py-20">
          <BackgroundArtwork />

          {/* Floating left icons */}
          <FloatingIcon
            icon={GraduationCap}
            className="left-[4.5%] top-[18%] border-[#2474ED]/80"
            iconClassName="text-[#438EFF]"
          />

          <FloatingIcon
            icon={UsersRound}
            className="left-[2.8%] top-[43%] border-[#1EBE9E]/70"
            iconClassName="text-[#50DBAF]"
          />

          <FloatingIcon
            icon={FileText}
            className="left-[4.9%] top-[65%] border-[#765BE8]/70"
            iconClassName="text-[#9A83FF]"
          />

          {/* Floating right icons */}
          <FloatingIcon
            icon={Landmark}
            className="right-[4.5%] top-[18%] border-[#CC8B2D]/75"
            iconClassName="text-[#FFB13F]"
          />

          <FloatingIcon
            icon={CreditCard}
            className="right-[2.8%] top-[43%] border-[#269BC8]/75"
            iconClassName="text-[#48C8F1]"
          />

          <FloatingIcon
            icon={PieChart}
            className="right-[4.9%] top-[65%] border-[#9257DE]/75"
            iconClassName="text-[#C66AFF]"
          />

          <div className="relative z-20">
            <div className="mx-auto max-w-[940px] text-center">
              <div className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-[#6487DB]/70 bg-[#0A1A40]/90 px-5 py-2.5 text-sm font-medium text-[#E4EBF8] shadow-[0_12px_30px_rgba(0,0,0,0.18)] sm:text-base">
                <ShieldCheck
                  className="h-5 w-5 text-[#438EFF]"
                  strokeWidth={2.2}
                  aria-hidden="true"
                />
                Trusted institutional technology
              </div>

              <h2
                id="final-cta-heading"
                className="mt-8 text-balance text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-[68px]"
              >
                Ready to modernise
                <span className="mt-1 block text-[#4B8EFF]">
                  your institution?
                </span>
              </h2>

              <p className="mx-auto mt-7 max-w-[760px] text-pretty text-base leading-7 text-[#B9C5D9] sm:text-lg sm:leading-8 lg:text-[20px]">
                See how CampusOS can connect academics, administration,
                finance and student services in one secure institutional
                platform.
              </p>

              <div className="mt-10 flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/demo"
                  className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#4C90FF] bg-[#1754E8] px-8 py-4 text-base font-semibold text-white shadow-[0_15px_40px_rgba(23,84,232,0.35)] transition-[background-color,transform,box-shadow] hover:-translate-y-0.5 hover:bg-[#0F46D4] hover:shadow-[0_18px_46px_rgba(23,84,232,0.44)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#83AEFF] focus-visible:ring-offset-4 focus-visible:ring-offset-[#051331]"
                >
                  <CalendarDays
                    className="h-5 w-5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Book a Demo
                  <ArrowRight
                    className="h-5 w-5 transition-transform motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>

                <Link
                  href="/contact"
                  className="group inline-flex min-h-14 items-center justify-center gap-3 rounded-xl border border-[#8A9AB8] bg-[#07132F]/70 px-8 py-4 text-base font-semibold text-white transition-[background-color,border-color,transform] hover:-translate-y-0.5 hover:border-white/70 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-4 focus-visible:ring-offset-[#051331]"
                >
                  <MessageCircle
                    className="h-5 w-5"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  Contact Sales
                  <ArrowRight
                    className="h-5 w-5 transition-transform motion-safe:group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            </div>

            <div
              className="mx-auto mt-14 grid max-w-[1240px] gap-3 border-y border-white/10 py-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4"
              aria-label="CampusOS platform benefits"
            >
              {benefits.map((benefit, index) => (
                <BenefitItem
                  key={benefit.title}
                  benefit={benefit}
                  showDivider={index < benefits.length - 1}
                />
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-[1240px] overflow-hidden rounded-2xl border border-[#254477] bg-[#071631]/90 shadow-[0_18px_50px_rgba(0,0,0,0.2)]">
              <div className="grid lg:grid-cols-[1.65fr_repeat(3,1fr)]">
                <div className="relative flex items-center gap-4 px-6 py-6 lg:after:absolute lg:after:right-0 lg:after:top-1/2 lg:after:h-16 lg:after:w-px lg:after:-translate-y-1/2 lg:after:bg-white/15">
                  <Clock3
                    className="h-10 w-10 shrink-0 text-[#9A9CFF]"
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <p className="text-sm leading-6 text-[#C4CDDD] sm:text-base">
                    Speak with our team to arrange a personalised product
                    consultation for your institution.
                  </p>
                </div>

                {platformStats.map((stat, index) => (
                  <PlatformMetric
                    key={stat.label}
                    stat={stat}
                    showDivider={index < platformStats.length - 1}
                  />
                ))}
              </div>
            </div>

            <p className="mx-auto mt-5 max-w-[760px] text-center text-xs leading-5 text-[#74849F]">
              Platform capabilities and availability may vary by institution,
              region and configured modules.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}