export interface CampusFinancialSummary {
  campusId: string;
  campusName: string;
  currency: string;
  tuitionCollectedLocal: number;
}

export interface CurrencyConversionRate {
  [key: string]: number; // Base USD rates
}

const EXCHANGE_RATES: CurrencyConversionRate = {
  USD: 1.0,
  INR: 83.0,
  EUR: 0.92,
  AED: 3.67,
};

// 1. Multi-Campus Consolidated Financial Query (Phase 17 Exit Criteria 1)
export function calculateConsolidatedGroupFinancials(
  campuses: CampusFinancialSummary[],
  targetCurrency = 'USD'
): { totalGroupRevenueTargetCurrency: number; breakdown: { campusName: string; amountInTargetCurrency: number }[] } {
  let totalGroupRevenueTargetCurrency = 0;
  const breakdown: { campusName: string; amountInTargetCurrency: number }[] = [];

  for (const c of campuses) {
    // Convert local currency to USD, then to target currency
    const rateToUSD = 1 / (EXCHANGE_RATES[c.currency] || 1.0);
    const amountInUSD = c.tuitionCollectedLocal * rateToUSD;
    const amountInTargetCurrency = Math.round(amountInUSD * (EXCHANGE_RATES[targetCurrency] || 1.0));

    totalGroupRevenueTargetCurrency += amountInTargetCurrency;
    breakdown.push({
      campusName: c.campusName,
      amountInTargetCurrency,
    });
  }

  return { totalGroupRevenueTargetCurrency, breakdown };
}

// 2. Cross-Campus Elective Enrollment with Currency Conversion (Phase 17 Exit Criteria 2)
export function enrollCrossCampusElective(input: {
  studentId: string;
  homeCampusId: string;
  hostCampusId: string;
  courseCode: string;
  feeAmountLocal: number;
  localCurrency: string;
  studentBillingCurrency: string;
}): { success: boolean; billedAmount: number; currency: string; enrollmentId: string } {
  const rateToUSD = 1 / (EXCHANGE_RATES[input.localCurrency] || 1.0);
  const amountInUSD = input.feeAmountLocal * rateToUSD;
  const billedAmount = Math.round(amountInUSD * (EXCHANGE_RATES[input.studentBillingCurrency] || 1.0));

  const enrollmentId = `ENR_CROSS_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    success: true,
    billedAmount,
    currency: input.studentBillingCurrency,
    enrollmentId,
  };
}

// 3. ECTS to US / Indian Credit System Conversion
export function convertECTSToUSCredits(ectsCredits: number): number {
  // Standard conversion: 2 ECTS = 1 US Semester Credit
  return ectsCredits / 2.0;
}
