import { describe, it, expect } from 'vitest';
import { processStaffMonthlyPayroll, StaffSalaryStructure } from '../lib/payroll-service';

describe('Phase 14 Monthly Payroll & Tax Withholding Calculation Test Suite', () => {
  it('should compute Gross Salary, PF, TDS withholding, and Net Pay accurately', () => {
    const staff: StaffSalaryStructure = {
      staffId: 'fac_01',
      staffName: 'Dr. Alan Turing',
      designation: 'Professor',
      accountNumber: '99410012',
      ifscCode: 'APEX0001',
      basePay: 6000,
    };

    // Base = 6000
    // HRA (40%) = 2400
    // DA (50%) = 3000
    // Gross = 6000 + 2400 + 3000 = 11,400
    // PF (12% of Base) = 720
    // TDS (10% of Gross) = 1140
    // Total Deductions = 720 + 1140 = 1860
    // Net Pay = 11400 - 1860 = 9540
    const payslip = processStaffMonthlyPayroll(staff, 'February 2026');

    expect(payslip.grossSalary).toBe(11400);
    expect(payslip.pfDeduction).toBe(720);
    expect(payslip.tdsWithholding).toBe(1140);
    expect(payslip.totalDeductions).toBe(1860);
    expect(payslip.netPay).toBe(9540);
  });
});
