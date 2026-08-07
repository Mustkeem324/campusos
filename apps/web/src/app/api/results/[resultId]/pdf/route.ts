import { requireActiveUserContext } from '@/lib/active-user-context';
import { buildOfficialResultPdf } from '@/lib/official-result-pdf';
import { loadOfficialResultForViewer, ResultPublicationError } from '@/lib/result-publication';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { resultId: string } }) {
  try {
    const context = await requireActiveUserContext();
    const result = await loadOfficialResultForViewer(context, params.resultId);
    if (result.publication.integrity !== 'VERIFIED') {
      return Response.json(
        { error: 'An official PDF can only be issued after the result has completed the authorization chain and passed integrity verification.' },
        { status: 409 },
      );
    }

    const pdf = buildOfficialResultPdf(result);
    const filename = `${safeFilename(result.student.rollNumber)}-${safeFilename(result.examination.term)}-official-result.pdf`;
    return new Response(pdf, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error: unknown) {
    if (error instanceof ResultPublicationError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    console.error('[OFFICIAL_RESULT_PDF]', error);
    return Response.json({ error: 'The official result PDF could not be generated.' }, { status: 500 });
  }
}

function safeFilename(value: string) {
  return value.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'result';
}
