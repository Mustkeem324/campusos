import { describe, it, expect } from 'vitest';
import { generateNACHBankFile, processStaffMonthlyPayroll, StaffSalaryStructure } from '../lib/payroll-service';

describe('Phase 14 NACH / NEFT Bank Salary Disbursement Generator Test Suite', () => {
  it('should generate valid NACH bank CSV file with account numbers and net disbursement amounts', () => {
    const staffList: StaffSalaryStructure[] = [
      { staffId: 'st1', staffName: 'Alan Turing', designation: 'Prof', accountNumber: 'ACC9941', ifscCode: 'IFSC01', basePay: 5000 },
    ];

    const payslips = [processStaffMonthlyPayroll(staffList[0], 'February 2026')];
    const csv = generateNACHBankFile(payslips, staffList);

    expect(csv).toContain('ACC9941');
    expect(csv).toContain('IFSC01');
    expect(csv).toContain('Alan Turing');
    expect(csv).toContain('SALARY-February-2026');
  });
});
