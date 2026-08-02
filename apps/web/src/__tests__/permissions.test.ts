import { describe, it, expect } from 'vitest';
import { can } from '../lib/permissions';

describe('CampusOS RBAC & Permission Engine', () => {
  it('should grant SUPER_ADMIN full bypass access (*:manage:all)', () => {
    expect(can('SUPER_ADMIN', 'users', 'delete', 'all')).toBe(true);
    expect(can('SUPER_ADMIN', 'finance', 'manage', 'institution')).toBe(true);
  });

  it('should allow FACULTY to mark attendance for their own section', () => {
    expect(can('FACULTY', 'attendance', 'mark', 'own_section')).toBe(true);
    expect(can('FACULTY', 'assignments', 'manage', 'own_section')).toBe(true);
  });

  it('should prevent FACULTY from managing global institution fee structures', () => {
    expect(can('FACULTY', 'fees', 'manage', 'institution')).toBe(false);
  });

  it('should allow STUDENT to view own attendance and grades', () => {
    expect(can('STUDENT', 'attendance', 'read', 'own')).toBe(true);
    expect(can('STUDENT', 'grades', 'read', 'own')).toBe(true);
  });

  it('should prevent STUDENT from marking attendance or approving exam locks', () => {
    expect(can('STUDENT', 'attendance', 'mark', 'own_section')).toBe(false);
    expect(can('STUDENT', 'marks', 'approve', 'department')).toBe(false);
  });
});
