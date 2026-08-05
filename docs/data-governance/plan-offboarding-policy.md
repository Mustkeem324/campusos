# CampusOS Plan Offboarding and Data Handover Policy

## Purpose

This policy defines the intended product and operational behavior when an institution ends or does not renew a CampusOS plan.

It is a product policy template and must be aligned with the signed contract, applicable law, institutional records requirements, backup architecture and approved legal holds.

## Core rule

When a plan ends:

1. Ongoing production access and normal hosted service stop on the agreed end date unless a written extension is active.
2. CampusOS prepares the institution’s approved digital data handover.
3. The institution or main campus receives and verifies the transfer.
4. CampusOS deletes accessible service copies after verified handover, subject only to documented legal holds or required backup-expiry limitations.
5. Optional physical delivery is provided only at separately approved cost.

Ending a plan does not authorize CampusOS to keep the institution’s production environment running indefinitely.

## Handover scope

The approved transfer may include:

- Active operational database export
- Uploaded files within the approved scope
- Latest agreed backup snapshot where included in the contract
- CSV, JSON, PDF or other agreed formats
- Record-count report
- File manifest
- Integrity checksums
- Data dictionary or field mapping where available
- Known exclusions and unresolved exceptions

The export scope must be approved before preparation begins.

## Secure digital delivery

Digital transfer should use an approved secure method such as:

- Signed and expiring encrypted download
- Institution-approved managed transfer endpoint
- Approved SFTP configuration
- Encrypted physical media when separately ordered

Permanent public download links are prohibited.

Encryption keys must not be sent through the same channel as the transfer package.

## Transfer verification

The institution or main campus should verify:

- Export identity
- File count
- Record count
- Checksum results
- File readability
- Required date range
- Required record categories
- Attachment availability
- Known exclusions

Acceptance, rejection or exceptions should be recorded by authorized officers.

## Service access after plan end

Unless a written extension exists:

- Application access stops at the agreed end date.
- New business processing stops.
- New non-essential writes are rejected.
- CampusOS does not continue providing the institution’s normal production environment.
- Transfer and deletion operations may continue through a restricted operational process.

## Deletion after verified handover

After transfer acceptance and applicable approvals, CampusOS should delete or disable access to:

- Active tenant records
- Temporary export packages
- Search indexes
- Application caches
- Accessible replicas
- Staging copies created for the transfer
- Derived files that are no longer required

Encrypted backups may expire through the documented backup-retention cycle when immediate selective deletion is not technically safe. Deleted records must not be restored to active use without reapplying the deletion state.

A final deletion record should disclose:

- Systems checked
- Active-data deletion status
- Export-package deletion status
- Replica status
- Backup expiry date
- Legal-hold exclusions
- Verification date

## Legal holds

A legal hold must:

- Be authorized
- Identify the reason
- Identify affected records
- Have a review date
- Prevent deletion only for in-scope records
- Be released by an authorized role

A legal hold must not be used to retain unrelated institutional data indefinitely.

## Physical transfer

Physical transfer is optional and chargeable.

Potential chargeable items include:

- Encrypted storage media
- Media preparation and verification
- Printed archival preparation
- Tamper-evident packaging
- Chain-of-custody documentation
- Courier fees
- Insurance
- Special handling
- Return or secure disposal of transfer media

No physical work should begin until the institution approves:

- Scope
- Media type
- Delivery address
- Authorized recipient
- Security method
- Estimated cost
- Delivery schedule

## Physical security requirements

Physical transfer should use:

- Full-device encryption for digital media
- Recorded media serial number
- Tamper-evident packaging
- Sender and receiver identification
- Release and receipt timestamps
- Checksum verification after receipt
- Secure return or wiping of reusable media

## Charges

Standard digital handover inclusions must be defined in the plan or contract.

Physical media, printed records, special-format conversion, large-scale manual preparation, courier, insurance and expedited services may be separately charged.

Every charge must be disclosed and approved before the work starts.

## No automatic one-year hosting

CampusOS does not automatically continue full server hosting for one year after a plan ends.

Any temporary restricted retention must be:

- Contractually defined
- Limited to a specific purpose
- Separated from normal production use
- Access restricted
- Time limited
- Audited
- Deleted at expiry

## Responsibilities

### CampusOS

- Prepare the approved export
- Protect transfer confidentiality
- Provide manifest and checksum information
- Record handover status
- Restrict access during exit
- Delete retained copies according to the approved process
- Disclose backup-expiry limitations

### Institution

- Nominate authorized officers
- Approve export scope
- Provide secure delivery details
- Verify transferred data
- Report exceptions promptly
- Protect received copies
- Approve optional physical-transfer charges

## Required product states

Recommended exit workflow:

```text
NOTICE_RECEIVED
→ ACCESS_END_SCHEDULED
→ EXPORT_SCOPE_APPROVED
→ EXPORT_PREPARING
→ EXPORT_READY
→ TRANSFER_IN_PROGRESS
→ INSTITUTION_VALIDATING
→ ACCEPTED_OR_EXCEPTION_RECORDED
→ ACTIVE_DATA_DELETION
→ BACKUP_EXPIRY_TRACKING
→ DELETION_CONFIRMED
→ CLOSED
```

## Important limitation

This policy does not replace institution-specific legal, financial, academic, employment or regulatory retention requirements. Those requirements must be reviewed before final deletion.
