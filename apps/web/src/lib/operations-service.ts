export interface PurchaseOrder {
  poNumber: string;
  vendorName: string;
  totalAmount: number; // e.g. $15,000
  itemQuantity: number;
}

export interface GoodsReceivedNote {
  grnNumber: string;
  poNumber: string;
  receivedQuantity: number;
  acceptedQuantity: number;
  inspectedBy: string;
}

export interface VendorInvoice {
  invoiceNumber: string;
  poNumber: string;
  billedAmount: number;
}

export interface PhysicalAsset {
  assetId: string;
  assetName: string;
  purchaseCost: number; // e.g. $10,000
  salvageValue: number;  // e.g. $1,000
  usefulLifeYears: number; // e.g. 5 years
  purchaseYear: number;
}

export interface DepreciationYear {
  year: number;
  beginningValue: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  endingBookValue: number;
}

// 1. 3-Way Match Verification Engine (PO vs GRN vs Invoice) (Phase 13 Exit Criteria 1)
export function verifyThreeWayMatch(
  po: PurchaseOrder,
  grn: GoodsReceivedNote,
  invoice: VendorInvoice
): { matched: boolean; discrepancies: string[] } {
  const discrepancies: string[] = [];

  // Check 1: PO Number Consistency
  if (grn.poNumber !== po.poNumber) discrepancies.push(`GRN PO Number mismatch (${grn.poNumber} vs ${po.poNumber})`);
  if (invoice.poNumber !== po.poNumber) discrepancies.push(`Invoice PO Number mismatch (${invoice.poNumber} vs ${po.poNumber})`);

  // Check 2: Quantity Match (GRN accepted vs PO ordered)
  if (grn.acceptedQuantity < po.itemQuantity) {
    discrepancies.push(`Quantity Shortage: Received ${grn.acceptedQuantity} units out of ${po.itemQuantity} ordered`);
  }

  // Check 3: Billed Amount Match (Invoice vs PO Total Amount)
  if (invoice.billedAmount !== po.totalAmount) {
    discrepancies.push(`Price Discrepancy: Invoice billed $${invoice.billedAmount} vs PO sanctioned $${po.totalAmount}`);
  }

  return {
    matched: discrepancies.length === 0,
    discrepancies,
  };
}

// 2. Straight-Line Asset Depreciation Schedule Generator (Phase 13 Exit Criteria 2)
export function generateAssetDepreciationSchedule(asset: PhysicalAsset): DepreciationYear[] {
  const annualDepreciation = (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeYears;
  const schedule: DepreciationYear[] = [];

  let currentBookValue = asset.purchaseCost;
  let accumulatedDepreciation = 0;

  for (let yr = 1; yr <= asset.usefulLifeYears; yr++) {
    const beginningValue = currentBookValue;
    accumulatedDepreciation += annualDepreciation;
    currentBookValue = asset.purchaseCost - accumulatedDepreciation;

    schedule.push({
      year: asset.purchaseYear + (yr - 1),
      beginningValue: Math.round(beginningValue),
      depreciationExpense: Math.round(annualDepreciation),
      accumulatedDepreciation: Math.round(accumulatedDepreciation),
      endingBookValue: Math.round(Math.max(asset.salvageValue, currentBookValue)),
    });
  }

  return schedule;
}
