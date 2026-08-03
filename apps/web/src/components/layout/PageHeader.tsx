import React from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-6">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center text-sm text-text-muted">
          {breadcrumbs.map((bc, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRight size={14} className="mx-2 shrink-0" />}
              {bc.href ? (
                <Link href={bc.href} className="hover:text-text-primary transition">
                  {bc.label}
                </Link>
              ) : (
                <span className="text-text-secondary">{bc.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
          {description && <p className="text-text-secondary mt-1 text-[15px]">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}
