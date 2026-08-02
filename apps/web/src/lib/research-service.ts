export interface ResearchGrant {
  id: string;
  title: string;
  piFacultyId: string;
  piFacultyName: string;
  agency: 'DST' | 'SERB' | 'ICSSR' | 'DBT' | 'INDUSTRY';
  sanctionedAmount: number;
  releasedAmount: number;
  spentAmount: number;
  status: 'PROPOSAL_SUBMITTED' | 'SANCTIONED' | 'UTILIZATION_CERT_ISSUED';
}

export interface PublicationRecord {
  doi: string;
  title: string;
  journal: string;
  year: number;
  citations: number;
}

export interface UtilizationCertificate {
  ucId: string;
  grantId: string;
  sanctionedAmount: number;
  spentAmount: number;
  unspentBalance: number;
  issuedAt: Date;
}

// 1. Calculate Faculty h-index and i10-index from citation array
export function calculateFacultyHIndex(citations: number[]): { hIndex: number; i10Index: number } {
  // Sort citations descending
  const sorted = [...citations].sort((a, b) => b - a);

  let hIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] >= i + 1) {
      hIndex = i + 1;
    } else {
      break;
    }
  }

  const i10Index = sorted.filter((c) => c >= 10).length;

  return { hIndex, i10Index };
}

// 2. Grant Proposal to Utilization Certificate (UC) Engine (Phase 12 Exit Criteria 1)
export function generateUtilizationCertificate(grant: ResearchGrant): UtilizationCertificate {
  grant.status = 'UTILIZATION_CERT_ISSUED';

  const unspentBalance = Math.max(0, grant.releasedAmount - grant.spentAmount);

  return {
    ucId: `UC-2026-${grant.id.toUpperCase()}`,
    grantId: grant.id,
    sanctionedAmount: grant.sanctionedAmount,
    spentAmount: grant.spentAmount,
    unspentBalance,
    issuedAt: new Date(),
  };
}

// 3. Patent Royalty Distribution Calculator (70% Inventor, 20% Institution, 10% IP Cell)
export function calculateRoyaltyDistribution(totalRoyalty: number): {
  inventorShare: number;
  institutionShare: number;
  ipCellShare: number;
} {
  const inventorShare = Math.round(totalRoyalty * 0.7);
  const institutionShare = Math.round(totalRoyalty * 0.2);
  const ipCellShare = totalRoyalty - inventorShare - institutionShare;

  return { inventorShare, institutionShare, ipCellShare };
}
