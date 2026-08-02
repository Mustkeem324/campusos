export interface StaffSalaryStructure {
  staffId: string;
  staffName: string;
  designation: string;
  accountNumber: string;
  ifscCode: string;
  basePay: number; // e.g. $5,000
}

export interface PayslipDetail {
  payslipId: string;
  staffId: string;
  staffName: string;
  monthYear: string;
  basePay: number;
  hra: number; // 40% of Base Pay
  da: number;  // 50% of Base Pay
  grossSalary: number;
  pfDeduction: number;  // 12% of Base Pay
  tdsWithholding: number; // 10% of Gross
  totalDeductions: number;
  netPay: number;
}

// 1. Calculate Monthly Payroll & Tax Withholding (Phase 14 Exit Criteria 1)
export function processStaffMonthlyPayroll(
  staff: StaffSalaryStructure,
  monthYear = 'February 2026'
): PayslipDetail {
  const hra = Math.round(staff.basePay * 0.4);
  const da = Math.round(staff.basePay * 0.5);
  const grossSalary = staff.basePay + hra + da;

  const pfDeduction = Math.round(staff.basePay * 0.12);
  const tdsWithholding = Math.round(grossSalary * 0.10);
  const totalDeductions = pfDeduction + tdsWithholding;

  const netPay = grossSalary - totalDeductions;

  return {
    payslipId: `PAY-${Date.now()}-${staff.staffId}`,
    staffId: staff.staffId,
    staffName: staff.staffName,
    monthYear,
    basePay: staff.basePay,
    hra,
    da,
    grossSalary,
    pfDeduction,
    tdsWithholding,
    totalDeductions,
    netPay,
  };
}

// 2. Generate NACH / NEFT Bank Disbursement File (Phase 14 Exit Criteria 2)
export function generateNACHBankFile(payslips: PayslipDetail[], staffList: StaffSalaryStructure[]): string {
  let csv = 'Account Number,IFSC Code,Staff Name,Net Disbursement Amount,Payment Reference\n';

  for (const p of payslips) {
    const s = staffList.find((st) => st.staffId === p.staffId);
    if (s) {
      csv += `${s.accountNumber},${s.ifscCode},"${p.staffName}",${p.netPay},SALARY-${p.monthYear.replace(' ', '-')}\n`;
    }
  }

  return csv;
}
