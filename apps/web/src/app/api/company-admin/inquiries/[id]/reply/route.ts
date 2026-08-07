import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireCompanySuperAdmin, writeCompanyAdminEvent } from '@/lib/company-admin';
import { getCompanyContactInquiry } from '@/lib/company-admin-contact';
import { sendContactReplyMail } from '@/lib/contact-mail';
import { prisma } from '@/lib/db';

const replySchema = z.object({
  subject: z.string().trim().min(2).max(250),
  message: z.string().trim().min(2).max(10_000),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const actor = await requireCompanySuperAdmin().catch(() => null);
  if (!actor) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const parsed = replySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Review the reply before sending.', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const inquiry = await getCompanyContactInquiry(params.id);
    if (!inquiry) return NextResponse.json({ error: 'Enquiry not found.' }, { status: 404 });
    if (inquiry.status === 'SPAM') return NextResponse.json({ error: 'Spam enquiries cannot be replied to until reopened.' }, { status: 409 });

    const messageId = randomUUID();
    const queuedSubject = parsed.data.subject.includes(inquiry.reference)
      ? parsed.data.subject
      : `${parsed.data.subject} [${inquiry.reference}]`;

    await prisma.$executeRaw`
      INSERT INTO campusos_control.platform_contact_messages
        (id, inquiry_id, direction, author_user_id, sender_email, recipient_email,
         subject, body_text, delivery_status, created_at)
      VALUES
        (${messageId}::uuid, ${inquiry.id}::uuid, 'OUTBOUND', ${actor.id}::uuid,
         ${actor.email}, ${inquiry.email}, ${queuedSubject}, ${parsed.data.message}, 'QUEUED', now())
    `;

    try {
      const sent = await sendContactReplyMail({
        to: inquiry.email,
        customerName: inquiry.name,
        reference: inquiry.reference,
        subject: parsed.data.subject,
        message: parsed.data.message,
      });

      await prisma.$transaction([
        prisma.$executeRaw`
          UPDATE campusos_control.platform_contact_messages
          SET subject = ${sent.subject}, delivery_status = 'SENT', provider_message_id = ${sent.messageId}
          WHERE id = ${messageId}::uuid
        `,
        prisma.$executeRaw`
          UPDATE campusos_control.platform_contact_inquiries
          SET status = 'WAITING_CUSTOMER',
              assigned_to = COALESCE(assigned_to, ${actor.id}::uuid),
              first_response_at = COALESCE(first_response_at, now()),
              resolved_at = NULL,
              last_message_at = now(),
              updated_at = now()
          WHERE id = ${inquiry.id}::uuid
        `,
      ]);

      await writeCompanyAdminEvent({
        actorUserId: actor.id,
        eventType: 'CONTACT_REPLY_SENT',
        summary: `Reply sent for enquiry ${inquiry.reference}.`,
        detail: {
          inquiryId: inquiry.id,
          reference: inquiry.reference,
          recipient: inquiry.email,
          providerMessageId: sent.messageId,
        },
      });

      return NextResponse.json({ success: true, message: 'Reply sent successfully.' });
    } catch (mailError) {
      await prisma.$executeRaw`
        UPDATE campusos_control.platform_contact_messages
        SET delivery_status = 'FAILED'
        WHERE id = ${messageId}::uuid
      `;
      console.error('Company contact reply delivery failed:', mailError);
      return NextResponse.json(
        { error: 'The reply was saved, but email delivery failed. Check the SMTP configuration and try again.' },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error('Company contact reply failed:', error);
    return NextResponse.json({ error: 'Unable to send this reply.' }, { status: 500 });
  }
}
