import { describe, it, expect } from 'vitest';
import { verifyThreeWayMatch, PurchaseOrder, GoodsReceivedNote, VendorInvoice } from '../lib/operations-service';

describe('Phase 13 Procurement 3-Way Match Verification Test Suite', () => {
  it('should pass 3-way match verification when PO, GRN, and Invoice amounts match', () => {
    const po: PurchaseOrder = { poNumber: 'PO-101', vendorName: 'Dell', totalAmount: 10000, itemQuantity: 10 };
    const grn: GoodsReceivedNote = { grnNumber: 'GRN-101', poNumber: 'PO-101', receivedQuantity: 10, acceptedQuantity: 10, inspectedBy: 'John' };
    const invoice: VendorInvoice = { invoiceNumber: 'INV-101', poNumber: 'PO-101', billedAmount: 10000 };

    const res = verifyThreeWayMatch(po, grn, invoice);

    expect(res.matched).toBe(true);
    expect(res.discrepancies.length).toBe(0);
  });

  it('should detect quantity shortage and price discrepancies', () => {
    const po: PurchaseOrder = { poNumber: 'PO-101', vendorName: 'Dell', totalAmount: 10000, itemQuantity: 10 };
    const grn: GoodsReceivedNote = { grnNumber: 'GRN-101', poNumber: 'PO-101', receivedQuantity: 8, acceptedQuantity: 8, inspectedBy: 'John' }; // Shortage!
    const invoice: VendorInvoice = { invoiceNumber: 'INV-101', poNumber: 'PO-101', billedAmount: 12000 }; // Billed extra!

    const res = verifyThreeWayMatch(po, grn, invoice);

    expect(res.matched).toBe(false);
    expect(res.discrepancies.length).toBe(2);
    expect(res.discrepancies[0]).toContain('Quantity Shortage');
    expect(res.discrepancies[1]).toContain('Price Discrepancy');
  });
});
