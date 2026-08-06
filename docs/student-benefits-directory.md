# Student Benefits Directory

The public `/student-benefits` page is a curated discovery layer for official student programmes.

## Content rules

- Link only to provider-owned pages or the official GitHub Education pack.
- Do not add an aggregate annual savings value unless every price, duration, currency and regional condition is independently verified.
- Label each entry as free access, promotional credit, paid student discount or institution-controlled access.
- State when availability depends on country, age, institution or third-party verification.
- Do not claim that a CampusOS account automatically proves eligibility to another company.
- Do not collect provider passwords, payment details, MFA codes or recovery codes.
- Review every entry periodically because partner offers and renewal terms change.

## Current implementation

The directory stores its reviewed catalogue in `apps/web/src/lib/student-benefits.ts` and records a `lastVerified` date for every entry. Search and filtering logic is unit tested in `apps/web/src/lib/student-benefits.test.ts`.

Saved benefits are stored only in the visitor's browser. CampusOS does not submit third-party applications on the user's behalf.
