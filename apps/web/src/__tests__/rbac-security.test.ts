import { describe, it, expect } from 'vitest';
import { can } from '../lib/permissions';

describe('Phase 1 RBAC Endpoint Protection Suite', () => {
  it('should strictly deny STUDENT role access to faculty and admin endpoints', () => {
    // Attendance marking
    expect(can('STUDENT', 'attendance', 'mark', 'own_section')).toBe(false);
    expect(can('STUDENT', 'attendance', 'mark', 'institution')).toBe(false);

    // Marks entry & approval
    expect(can('STUDENT', 'marks', 'submit', 'own_section')).toBe(false);
    expect(can('STUDENT', 'marks', 'approve', 'department')).toBe(false);

    // User management & Tenant settings
    expect(can('STUDENT', 'users', 'manage', 'institution')).toBe(false);
    expect(can('STUDENT', 'academics', 'manage', 'institution')).toBe(false);
  });

  it('should allow ACCOUNTANT to manage fee structures but forbid marking attendance', () => {
    expect(can('ACCOUNTANT', 'fees', 'manage', 'institution')).toBe(true);
    expect(can('ACCOUNTANT', 'invoices', 'create', 'institution')).toBe(true);
    expect(can('ACCOUNTANT', 'attendance', 'mark', 'own_section')).toBe(false);
  });
});
