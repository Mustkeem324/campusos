# CampusOS Communications-1

Implementation specification for subscription popups, contact storage, verified email workflows, delivery reliability, and campaign advertisements.

You are a Principal SaaS Product Engineer, Senior Next.js Engineer,
Email Deliverability Engineer, Database Architect, UX Designer,
Privacy Engineer, Accessibility Engineer and Independent QA Reviewer.

## PROJECT

CampusOS is an existing multi-tenant higher-education operating system.

Repository:

`Mustkeem324/campusos`

Build a professional communication and promotion system containing:

1. Newsletter subscription popup
2. Double opt-in email verification
3. Contact-us form
4. Contact submission storage
5. Transactional email delivery
6. Delivery retry and bounce handling
7. Verified subscriber management
8. Advertisement and announcement popup
9. Admin campaign controls
10. Accessibility, privacy and analytics controls

Do not rebuild CampusOS.

Do not modify unrelated dashboards, authentication, LMS, finance, academic calculations or role permissions.

Do not add fake advertisement data to production.

---

## PHASE NAME

**CAMPUSOS COMMUNICATIONS-1**

**SUBSCRIPTION, CONTACT, EMAIL VERIFICATION, CAMPAIGN POPUPS AND DELIVERY RELIABILITY**

---

## PRIMARY OBJECTIVE

Implement a polished, production-oriented system where:

- A visitor can subscribe through a popup.
- The email is validated on the server.
- A verification email is sent.
- The subscriber becomes active only after clicking the verification link.
- Invalid or permanently bounced emails are suppressed.
- Temporary delivery failures are retried safely.
- Duplicate subscriptions are handled correctly.
- A user can submit a Contact Us form.
- Contact messages are securely stored.
- The support team can receive an email notification.
- The user receives a safe confirmation email.
- Administrators can display advertisement, announcement or promotional popups.
- Popups are responsive, dismissible and frequency limited.
- Users do not see the same popup repeatedly.
- No sensitive data is exposed in the browser or logs.

---

## FIRST PHASE: READ-ONLY AUDIT

Do not immediately write code.

First inspect:

- Existing public homepage
- Public layout
- Header and footer
- Existing modal or dialog components
- Existing toast system
- Existing forms
- Existing database schema
- Existing Prisma client
- Existing notification system
- Existing SMTP or email provider
- Existing environment-variable validation
- Existing tenant model
- Existing user preference system
- Existing audit log
- Existing API protection
- Existing rate limiting
- Existing admin settings
- Existing translation system
- Existing tests
- Existing production build

Report:

1. Existing reusable modal components
2. Existing email service
3. Existing database models
4. Existing contact forms
5. Existing campaign or announcement features
6. Existing rate-limit utilities
7. Existing validation utilities
8. Existing admin permissions
9. Required new models
10. Proposed write scope

Do not duplicate working functionality.

---

## STRICT WRITE SCOPE

Before changing code, create:

`docs/communications/write-scope.json`

Use:

```json
{
  "phase": "Subscription and Campaign Popups",
  "baselineCommit": "",
  "allowedWritePaths": [],
  "allowedTestPaths": [],
  "readOnlyDependencies": [],
  "protectedPaths": [],
  "blockedChanges": []
}
```

Do not silently modify:

- Authentication behavior
- Existing role dashboards
- Grade calculations
- Fee calculations
- LMS permissions
- Tenant isolation
- Global design system
- Package versions
- Lock files
- Production environment values

---

## FEATURE 1 — NEWSLETTER SUBSCRIPTION POPUP

Add a premium newsletter or product-update popup.

The popup may appear on:

- Public homepage
- Product pages
- Pricing page
- Institution registration page

Do not show it inside critical authenticated workflows unless explicitly configured.

Popup content:

- Clear title
- Short benefit-oriented description
- Email field
- Optional first name
- Subscribe button
- Privacy note
- Close button
- “Do not show again” option where appropriate

Example content:

**Title:** Stay informed about CampusOS

**Description:** Receive product updates, implementation guides and important CampusOS announcements.

**Email placeholder:** `you@institution.edu`

**Primary action:** Subscribe for updates

**Success message:** Check your inbox to verify your email address.

Do not claim that the subscription is active before verification.

---

## POPUP DISPLAY RULES

Do not display the subscription popup immediately on every page load.

Use configurable triggers such as:

- After 8–15 seconds
- After meaningful page scroll
- On exit intent for desktop
- After visiting more than one public page
- Through an explicit Subscribe button

Do not use exit intent on mobile.

Apply frequency caps:

- Once per browser session
- Once every configurable number of days after dismissal
- Never after verified subscription
- Never while another blocking modal is open
- Never during form submission
- Never during login or payment confirmation
- Never repeatedly after a validation error

Store only non-sensitive popup state in a cookie or local preference.

Example:

```json
{
  "campaignId": "newsletter-2026",
  "dismissedAt": "...",
  "nextEligibleAt": "..."
}
```

Do not store the email address in localStorage.

---

## SUBSCRIPTION FORM

Required fields:

- Email address
- Optional first name
- Consent checkbox where required by configured tenant policy

Validation:

- Trim surrounding whitespace
- Convert domain portion appropriately
- Validate length
- Validate email format
- Reject control characters
- Reject malformed Unicode
- Reject obvious disposable-address domains only when a maintained policy exists
- Do not claim mailbox validity based only on syntax
- Rate limit repeated attempts

Do not use browser validation as the only validation.

Validate again on the server.

---

## DOUBLE OPT-IN WORKFLOW

Subscription states:

- `PENDING_VERIFICATION`
- `VERIFIED`
- `UNSUBSCRIBED`
- `SUPPRESSED`
- `BOUNCED`
- `COMPLAINED`
- `EXPIRED`

Workflow:

1. Visitor submits email.
2. Server validates input.
3. Server creates or updates a pending subscription.
4. Generate a cryptographically secure verification token.
5. Store only a hash of the verification token.
6. Send a verification email.
7. Show a generic success response.
8. User clicks verification link.
9. Server validates token, purpose and expiry.
10. Mark subscriber VERIFIED.
11. Record verified timestamp.
12. Invalidate the token.
13. Show a verified-success page.
14. Do not allow token reuse.

Verification token requirements:

- Single use
- Time limited
- Purpose bound
- Subscriber bound
- Tenant or campaign bound
- Stored as a hash
- Compared safely
- Not logged
- Not exposed after use

---

## DUPLICATE EMAIL HANDLING

If email is already VERIFIED, show:

> This email is already subscribed.

Do not reveal unnecessary account or user details.

If email is PENDING_VERIFICATION:

- Do not create unlimited duplicate rows.
- Allow resending after a cooldown.
- Revoke or supersede the previous verification token.
- Enforce resend limits.

If email is UNSUBSCRIBED:

- Require a new explicit subscription action.
- Send a new verification email.
- Do not silently reactivate.

If email is SUPPRESSED or COMPLAINED:

- Do not send automatically.
- Show a safe generic message.
- Provide an internal review workflow where appropriate.

---

## EMAIL VALIDITY AND DELIVERY STATUS

Do not label an email as fully valid merely because the format is correct.

Track separate concepts:

- Syntax valid
- Verification pending
- User verified
- Delivery accepted
- Hard bounced
- Soft bounced
- Complained
- Suppressed

The UI may show:

- Pending verification
- Verified
- Delivery issue
- Unsubscribed
- Suppressed

Do not show internal provider details to the public user.

---

## EMAIL FAILURE HANDLING

Do not delete an email after the first send failure.

### Temporary failure

Examples:

- Timeout
- Provider unavailable
- Temporary mailbox issue
- Rate limit
- Temporary DNS issue

Action:

- Keep the subscription pending.
- Retry through a bounded queue.
- Use exponential backoff.
- Stop after configured maximum attempts.
- Record safe failure metadata.
- Allow manual resend where appropriate.

### Permanent failure

Examples:

- Confirmed hard bounce
- Invalid recipient response
- Domain does not accept mail
- Provider-confirmed permanent rejection

Action:

- Mark email BOUNCED or SUPPRESSED.
- Stop further automatic email delivery.
- Record the provider event ID.
- Do not repeatedly retry.
- Do not immediately physically delete the audit record.
- Allow retention cleanup according to policy.

### Complaint

Action:

- Mark COMPLAINED.
- Suppress immediately.
- Do not resubscribe automatically.
- Record the event safely.

---

## EMAIL PROVIDER ABSTRACTION

Create a provider-independent interface.

```ts
interface EmailProvider {
  sendVerificationEmail(input: VerificationEmailInput): Promise<SendResult>;
  sendContactConfirmation(input: ContactConfirmationInput): Promise<SendResult>;
  sendSupportNotification(input: SupportNotificationInput): Promise<SendResult>;
}
```

`SendResult` may contain:

- `providerMessageId`
- `accepted`
- `temporaryFailure`
- `permanentFailure`
- `safeErrorCode`

Do not expose provider secrets to client code.

Do not hard-code one provider directly inside React components.

Support the existing SMTP configuration when available.

---

## EMAIL QUEUE

Do not block the user interface indefinitely while waiting for email delivery.

Preferred workflow:

```text
Form request
→ validate
→ store database state
→ queue email job
→ return safe response
→ process email
→ record delivery result
```

When no queue infrastructure exists:

- Use the safest existing server-side mechanism.
- Keep provider abstraction.
- Avoid pretending that delivery is guaranteed.
- Document serverless execution limitations.

Every job must be idempotent.

Prevent duplicate emails after retries.

---

## VERIFICATION EMAIL

The verification email should include:

- CampusOS branding
- Clear explanation
- Verify email button
- Plain-text verification URL fallback
- Expiration information
- Ignore-this-email guidance
- Support information
- No misleading urgency
- No sensitive user data

Subject example:

`Verify your CampusOS subscription`

Button:

`Verify email address`

Do not include the verification token in logs or analytics.

---

## UNSUBSCRIBE

Every marketing or promotional email must contain an unsubscribe mechanism.

Unsubscribe workflow:

- Signed or random single-purpose token
- No login required
- Immediate unsubscribe
- Confirmation page
- No dark patterns
- No forced survey
- Optional reason after successful unsubscribe
- Prevent token use for other actions

Do not continue sending marketing messages after unsubscribe.

Transactional security messages must remain separate from marketing preferences.

---

## FEATURE 2 — CONTACT US FORM

Create a professional Contact Us form.

Fields:

- Full name
- Work or institution email
- Institution name
- Phone number optional
- Contact category
- Subject
- Message
- Preferred contact method
- Consent or privacy acknowledgement where configured

Contact categories:

- Product enquiry
- Institution onboarding
- Technical support
- Partnership
- Billing enquiry
- Security report
- General enquiry

Do not mix sensitive security reports into ordinary public display or marketing workflows.

---

## CONTACT VALIDATION

Validate:

- Name length
- Email format
- Phone format where supplied
- Subject length
- Message minimum and maximum length
- Category allowlist
- Preferred-contact allowlist
- Hidden bot field
- Submission timing
- Rate limit
- Duplicate message detection

Reject:

- HTML injection
- Script content
- Excessive URLs
- Extremely large payloads
- Unsupported fields
- Control characters
- Obvious automated spam

Do not use raw HTML from the user in email templates.

---

## CONTACT STORAGE

Store every accepted contact request with:

- Stable ID
- Tenant ID when applicable
- Full name
- Email
- Institution
- Phone where supplied
- Category
- Subject
- Message
- Preferred contact method
- Status
- Created timestamp
- Updated timestamp
- Assigned staff user
- Source page
- Consent timestamp where required
- Request ID
- Safe spam score
- Email-notification status

Suggested statuses:

- `NEW`
- `ACKNOWLEDGED`
- `IN_REVIEW`
- `WAITING_FOR_CUSTOMER`
- `RESOLVED`
- `CLOSED`
- `SPAM`
- `ARCHIVED`

Do not store:

- Raw passwords
- Authentication tokens
- Payment card data
- Unnecessary browser fingerprinting
- Full request headers
- Sensitive cookies

---

## CONTACT SUBMISSION WORKFLOW

1. User submits form.
2. Validate server-side.
3. Check rate limit and spam controls.
4. Store contact request.
5. Return a confirmation reference.
6. Queue support-team notification email.
7. Queue user confirmation email.
8. If notification email fails, keep the database contact request.
9. Retry temporary email failures.
10. Do not delete the contact record because email sending failed.
11. Show a safe message to the user.

Success message:

> Thank you. Your message has been received. Reference: CS-XXXXXX.

When email notification fails:

> Your message has been saved successfully. Email confirmation may be delayed.

Do not tell the user their message failed when it was safely stored.

---

## CONTACT EMAIL VERIFICATION

For ordinary contact forms, do not block saving solely because the sender has not yet verified the email.

Track:

- Email syntax valid
- Confirmation email sent
- Confirmation email delivered
- Email ownership verified where needed

For sensitive or high-risk workflows, require verification before processing.

Examples:

- Security-report follow-up
- Account ownership request
- Data-access request
- Administrative account change

---

## FEATURE 3 — ADVERTISEMENT AND ANNOUNCEMENT POPUPS

Build a controlled popup campaign system.

Campaign types:

- Product announcement
- Webinar
- New feature
- Institution onboarding
- Scheduled maintenance
- Important service notice
- Newsletter invitation
- Promotional offer
- Educational resource

Do not use one generic hard-coded advertisement component.

Create a typed campaign definition.

```ts
type PopupCampaign = {
  id: string;
  tenantId?: string;
  type: CampaignType;
  title: string;
  description: string;
  imageUrl?: string;
  primaryAction?: CampaignAction;
  secondaryAction?: CampaignAction;
  startsAt: Date;
  endsAt?: Date;
  enabled: boolean;
  priority: number;
  audience: CampaignAudience;
  frequencyPolicy: FrequencyPolicy;
  localeContent: LocalisedCampaignContent;
};
```

---

## CAMPAIGN AUDIENCE

Allow safe audience targeting based on authorised context.

Examples:

- Public visitors
- Unauthenticated institution representatives
- Verified subscribers
- Selected tenant
- Student role
- Faculty role
- Administrator role
- Specific enabled module
- Specific locale

Do not target using sensitive academic, medical, financial or disciplinary data.

Do not expose campaign-audience rules to unauthorised users.

Authenticated campaigns must remain tenant scoped.

---

## ADVERTISEMENT POPUP UI

Create a polished CampusOS design.

Desktop layout:

- Optional image or illustration
- Category label
- Clear title
- Maximum two short paragraphs
- One primary action
- One optional secondary action
- Visible close button
- Subtle campaign indicator
- No excessive screen coverage

Mobile layout:

- Bottom sheet or compact modal
- Image optional
- Text remains readable
- Buttons stack vertically when needed
- Close button remains visible
- Minimum 44px touch targets
- No body overflow
- Mobile keyboard does not cover form input

CampusOS styling:

- White surface
- Dark navy heading
- CampusOS blue primary action
- Soft grey background
- Thin neutral border
- Restrained shadow
- Rounded corners
- No gradients
- No neon
- No flashing animation
- No fake countdown
- No dark pattern

---

## POPUP EXAMPLE

**Category:** New CampusOS Resource

**Title:** Build a better digital campus

**Description:** Explore implementation guides, product updates and practical resources for modern higher-education teams.

**Primary action:** Explore resources

**Secondary action:** Subscribe for updates

**Dismiss:** Not now

Do not use misleading wording such as:

- Last chance when it is not true
- Only one spot left without evidence
- Click now or lose access
- System alert for a marketing campaign

Clearly distinguish advertisements from critical service alerts.

---

## CAMPAIGN PRIORITY

Only one interruptive popup may be visible at a time.

Priority order:

1. Critical service or safety notice
2. Required consent
3. Important account action
4. Institutional announcement
5. Product announcement
6. Newsletter
7. Promotional advertisement

A marketing advertisement must never cover:

- MFA challenge
- Password reset
- Payment confirmation
- Assessment submission
- Live-class controls
- Emergency notice
- Form error recovery

---

## CAMPAIGN FREQUENCY

Support:

- Once per session
- Once per user
- Once per campaign
- Once every configured number of days
- Maximum impression count
- Stop after conversion
- Stop after verified subscription
- Stop after campaign expiration

Do not depend only on localStorage for authenticated users.

For authenticated campaigns, use server-side user campaign state where appropriate.

---

## CAMPAIGN ACTIONS

Every campaign action must lead to:

- A valid internal route
- A validated external URL
- A subscription form
- A contact form
- A resource download
- A real dialog

Do not use:

- `href="#"`
- Empty click handlers
- Placeholder actions
- Unvalidated external URLs

External links must use safe protocols and appropriate new-window protections.

---

## ADMIN CAMPAIGN CONSOLE

Only implement when an existing authorised administration area is available.

Allow authorised users to:

- Create campaign
- Save draft
- Preview
- Schedule
- Enable
- Pause
- Expire
- Duplicate
- Archive
- Set audience
- Set frequency
- Add translations
- Review impressions
- Review conversions

Campaign statuses:

- `DRAFT`
- `SCHEDULED`
- `ACTIVE`
- `PAUSED`
- `EXPIRED`
- `ARCHIVED`

Do not allow Students or unauthorised Faculty to create campaigns.

---

## CAMPAIGN CONTENT SAFETY

Validate campaign content.

Do not allow arbitrary script or unsafe HTML.

Prefer structured content fields:

- Title
- Description
- Image reference
- Button label
- Action URL

When rich text is required:

- Use a sanitised allowlist.
- Reject scripts.
- Reject event handlers.
- Reject unsafe embeds.
- Reject unsupported protocols.

---

## DATABASE DESIGN

Audit existing models first.

Potential conceptual models:

- `NewsletterSubscriber`
- `SubscriptionVerificationToken`
- `EmailDelivery`
- `EmailSuppression`
- `ContactSubmission`
- `PopupCampaign`
- `PopupCampaignTranslation`
- `PopupImpression`
- `PopupConversion`
- `PopupDismissal`

Do not create duplicate models when existing notification, campaign or contact models can be extended safely.

Every applicable record must include tenant scope.

---

## SUGGESTED SUBSCRIBER MODEL

Conceptual fields:

- `id`
- `tenantId` nullable for global public newsletter
- `emailNormalized`
- `emailDisplay`
- `firstName`
- `status`
- `source`
- `locale`
- `consentVersion`
- `consentAt`
- `verifiedAt`
- `unsubscribedAt`
- `suppressedAt`
- `bounceType`
- `lastEmailStatus`
- `createdAt`
- `updatedAt`

Use an appropriate unique constraint based on:

- Tenant or global campaign context
- Normalised email

Do not globally merge subscriptions across unrelated tenants without a clear product requirement.

---

## EMAIL NORMALISATION

Use conservative normalisation.

Safe default:

- Trim spaces
- Lowercase the domain part
- Preserve the local part unless the product has a reviewed rule

Do not automatically:

- Remove dots
- Remove plus tags
- Rewrite provider-specific addresses

Different providers may treat these differently.

---

## BOUNCE WEBHOOK

When the email provider supports delivery webhooks:

- Verify webhook signature.
- Verify timestamp.
- Prevent replay.
- Validate event schema.
- Store event ID.
- Process idempotently.
- Map provider message ID to EmailDelivery.
- Update subscriber status safely.
- Suppress hard bounce and complaint.
- Record soft bounce without immediate deletion.
- Avoid logging full webhook payloads containing private data.

Webhook events may include:

- Delivered
- Deferred
- Soft bounced
- Hard bounced
- Complained
- Rejected
- Opened where tracking is permitted
- Clicked where tracking is permitted

Do not enable invasive tracking by default.

---

## PRIVACY

Collect only necessary data.

Provide:

- Clear subscription purpose
- Unsubscribe
- Contact privacy notice
- Retention policy support
- Data deletion workflow
- Consent evidence where configured

Do not pre-check marketing consent.

Do not combine product-service consent and marketing consent into one hidden checkbox.

Do not subscribe contact-form users to marketing automatically.

---

## RATE LIMITS

Apply server-side rate limits.

Subscription:

- Per IP
- Per normalised email
- Resend cooldown
- Daily maximum

Contact:

- Per IP
- Per email
- Per session
- Per tenant
- Payload-size limit

Campaign analytics:

- Prevent repeated impression spam
- Idempotent conversion events
- Do not trust client-provided tenant ID

Return safe responses without exposing internal thresholds.

---

## BOT AND SPAM PROTECTION

Use layered controls:

- Hidden honeypot
- Minimum form-completion time
- Maximum completion time where useful
- Rate limits
- Duplicate detection
- URL count limit
- Message length
- Safe spam scoring
- Optional challenge integration boundary

Do not block legitimate accessibility tools using aggressive browser fingerprinting.

Do not rely only on CAPTCHA.

---

## SECURITY

Protect against:

- SQL or ORM injection
- XSS
- HTML email injection
- Header injection
- Open redirect
- CSRF for cookie-authenticated mutations
- Mass assignment
- Cross-tenant access
- Token replay
- Token guessing
- Enumeration
- Webhook forgery
- Unbounded payload
- Email bombing
- Campaign-spam abuse

Never accept these fields directly from public client input:

- `status`
- `verifiedAt`
- `tenantId`
- `isAdmin`
- `campaignPriority`
- `suppressionStatus`
- `providerMessageId`
- `assignedTo`

Map allowed input fields explicitly.

---

## API DESIGN

Potential endpoints:

```text
POST /api/public/subscriptions
GET  /api/public/subscriptions/verify
POST /api/public/subscriptions/resend
POST /api/public/subscriptions/unsubscribe
POST /api/public/contact
GET  /api/public/campaigns/active
POST /api/public/campaigns/:id/impression
POST /api/public/campaigns/:id/dismiss
POST /api/public/campaigns/:id/conversion
POST /api/webhooks/email-provider
```

Admin endpoints:

```text
GET    /api/admin/subscribers
GET    /api/admin/contacts
PATCH  /api/admin/contacts/:id
GET    /api/admin/campaigns
POST   /api/admin/campaigns
PATCH  /api/admin/campaigns/:id
```

Use actual project routing conventions.

Do not create public mutation endpoints without validation and rate limits.

---

## SAFE API RESPONSES

Subscription response:

```json
{
  "success": true,
  "message": "Check your inbox to verify your email address."
}
```

Do not reveal unnecessarily whether an email belongs to a registered CampusOS account.

Contact response:

```json
{
  "success": true,
  "reference": "CS-XXXXXX",
  "message": "Your message has been received."
}
```

Do not expose:

- Internal database ID
- Provider response
- Stack trace
- SMTP hostname
- Email token
- Suppression reason details
- Spam score

---

## TRANSLATION

Integrate with the CampusOS translation architecture.

Translate:

- Popup content
- Form labels
- Validation errors
- Success messages
- Subscription email
- Verification page
- Unsubscribe page
- Contact confirmation
- Advertisement controls

Initial supported locales:

- English
- Hindi
- Urdu
- Arabic
- Marathi
- Telugu
- Kannada

Urdu and Arabic must render RTL correctly.

Campaign content must support locale-specific versions.

Fallback safely to English when an approved translation is unavailable.

---

## ACCESSIBILITY

Every popup must support:

- Correct dialog semantics
- Accessible title
- Accessible description
- Focus trap
- Escape to close when dismissal is permitted
- Focus return
- Visible close button
- Keyboard operation
- Screen-reader announcements
- Reduced motion
- Minimum 44px touch targets
- Correct error associations
- Correct RTL behavior

Do not open the popup repeatedly after a screen-reader user closes it.

Do not autofocus in a way that unexpectedly interrupts reading immediately after page load.

---

## LOADING AND ERROR STATES

### Submitting

- Disable duplicate submission
- Show progress
- Preserve entered email
- Do not block close unless required

### Success

- Show verification instruction
- Allow closing
- Do not show subscription form again immediately

### Validation error

- Show field-specific message
- Keep entered value
- Move focus appropriately

### Email provider failure

- When the subscription was stored successfully, explain that verification email delivery may be delayed.
- Offer resend only after cooldown.
- Do not create repeated rows.

### Contact email failure

- Keep the stored contact request.
- Show that the message was received.
- Do not falsely claim confirmation delivery.

---

## ANALYTICS

Record minimal campaign events:

- Impression
- Dismissal
- Primary action
- Secondary action
- Subscription submitted
- Subscription verified
- Contact submitted

Use stable event IDs.

Avoid duplicate events.

Do not store sensitive form contents in analytics.

Do not store complete email addresses in general analytics events.

Use server-side aggregation where practical.

---

## TESTING

### Unit tests

- Email normalisation
- Email validation
- Token generation
- Token hashing
- Token expiration
- Token single use
- Subscription-state transitions
- Duplicate subscription
- Retry policy
- Hard-bounce suppression
- Soft-bounce retry
- Campaign eligibility
- Campaign frequency cap
- Contact validation
- Spam detection
- Locale fallback

### Authorisation tests

- Public user cannot create an admin campaign
- Student cannot edit a campaign
- Cross-tenant campaign access fails
- Cross-tenant contact access fails
- Public client cannot set subscriber status
- Public client cannot mark an email verified
- Public client cannot assign a contact case

### Integration tests

- New subscription
- Verification email queued
- Verification link works
- Token reuse fails
- Expired token fails safely
- Duplicate pending subscription resends after cooldown
- Verified subscriber is not duplicated
- Unsubscribe works
- Contact submission is stored
- Contact remains stored when email delivery fails
- Temporary email failure retries
- Hard bounce suppresses future delivery
- Signed webhook works
- Invalid webhook is rejected

### Browser tests

- Subscription popup appears according to rules
- Popup does not reappear after dismissal
- Popup does not appear after verification
- Email validation is accessible
- Verification-success page works
- Contact form works
- Advertisement opens correct action
- Advertisement can be dismissed
- Campaign frequency cap works
- RTL popup works
- Mobile bottom sheet works
- No horizontal overflow
- No console error
- No hydration error

---

## RESPONSIVE TESTS

Test at:

- 320px
- 375px
- 430px
- 768px
- 1024px
- 1366px
- 1440px
- 1920px

Verify:

- Popup remains inside viewport
- Close control remains visible
- Form fields remain readable
- Buttons do not overlap
- Mobile keyboard does not hide active input
- Advertisement image does not dominate the screen
- Long translated text wraps
- Urdu and Arabic layout remains correct

---

## IMPLEMENTATION ORDER

### Phase 1

- Audit
- Subscriber model
- Contact model
- Email-provider abstraction
- Subscription API
- Verification flow
- Contact API
- Basic public popup UI

### Phase 2

- Email job queue
- Retry logic
- Delivery records
- Provider webhook
- Bounce and complaint suppression
- Unsubscribe

### Phase 3

- Advertisement campaign model
- Eligibility engine
- Frequency rules
- Popup campaign UI
- Impression and conversion events

### Phase 4

- Admin contact inbox
- Admin subscriber list
- Admin campaign editor
- Scheduling
- Audience controls
- Translation

### Phase 5

- Accessibility audit
- RTL validation
- Deliverability review
- Privacy review
- Performance
- Production deployment

---

## FIRST IMPLEMENTATION CYCLE

Implement only:

1. Read-only audit
2. Write-scope document
3. Newsletter subscriber data model
4. Contact submission data model
5. Provider-independent email service
6. Subscription API
7. Hashed verification token
8. Verification page
9. Contact API
10. Subscription popup
11. Contact success message
12. Server-side validation
13. Rate limits
14. English UI
15. Hindi UI where translation infrastructure already exists
16. Loading, success and error states
17. Unit tests
18. Integration tests
19. Typecheck
20. Lint
21. Production build

Do not implement the full campaign admin console in the first cycle.

Do not change unrelated product code.

---

## SECOND IMPLEMENTATION CYCLE

Implement:

- Delivery records
- Retry queue
- Soft bounce handling
- Hard bounce suppression
- Complaint suppression
- Webhook verification
- Unsubscribe workflow
- Resend verification
- Email status visibility for admins

---

## THIRD IMPLEMENTATION CYCLE

Implement:

- Advertisement campaigns
- Campaign scheduling
- Audience eligibility
- Frequency caps
- Dismissal storage
- Conversion tracking
- Premium desktop and mobile popup UI
- Urdu and Arabic RTL
- Remaining supported translations

---

## SELF-IMPROVEMENT LOOP

Operate using:

```text
OBSERVE
→ ANALYSE
→ PLAN
→ IMPLEMENT
→ TEST
→ REVIEW
→ KEEP OR ROLLBACK
→ DOCUMENT
→ LOCK
```

In every cycle:

1. Inspect existing functionality.
2. Identify one complete vertical slice.
3. Define allowed files.
4. Implement the smallest reliable change.
5. Test success and failure paths.
6. Simulate temporary email failure.
7. Simulate permanent email failure.
8. Inspect database state.
9. Inspect browser behavior.
10. Inspect Git diff.
11. Keep only when data is not lost.
12. Roll back regressions.
13. Record the next resume point.

---

## CRITICAL ACCEPTANCE CRITERIA

This phase is complete only when:

1. Subscription popup works.
2. Popup is accessible.
3. Popup frequency is controlled.
4. Email input is server validated.
5. Duplicate emails are handled.
6. Verification email is sent or safely queued.
7. Subscriber stays pending before verification.
8. Verification token is hashed.
9. Verification token expires.
10. Verification token is single use.
11. Verified subscriber is marked correctly.
12. Temporary email failure does not delete the subscriber.
13. Temporary failure retries are bounded.
14. Permanent bounce stops future sends.
15. Complaint suppresses future sends.
16. Contact message is stored.
17. Contact record survives email delivery failure.
18. User receives a safe reference number.
19. Advertisement popup is visually polished.
20. Advertisement popup is clearly distinguishable from a system alert.
21. Campaign frequency cap works.
22. Campaign expiration works.
23. Cross-tenant access is rejected.
24. Public users cannot set protected fields.
25. No secret appears in client code.
26. No email token appears in logs.
27. Unsubscribe works.
28. English UI works.
29. RTL UI works when enabled.
30. Mobile UI works.
31. No horizontal overflow exists.
32. Typecheck passes.
33. Lint passes.
34. Tests pass.
35. Production build passes.
36. No unrelated code is changed.

---

## FINAL REPORT

Provide:

- Baseline commit
- Existing services reused
- Models added
- Migration added
- Subscription states
- Verification-token design
- Email provider integration
- Retry behavior
- Bounce behavior
- Suppression behavior
- Contact-storage behavior
- Popup display rules
- Campaign frequency rules
- Exact files changed
- APIs added
- Rate limits added
- Tests added
- Temporary-failure test result
- Permanent-failure test result
- Accessibility result
- RTL result
- Typecheck result
- Lint result
- Test result
- Production-build result
- Known limitations
- Exact next resume point

Do not claim guaranteed email delivery.

Do not delete subscriber or contact records merely because one email attempt failed.

Do not claim an email is valid until verification succeeds.

## START NOW

Begin with the read-only audit, then implement the subscription and contact vertical slice without changing unrelated CampusOS code.
