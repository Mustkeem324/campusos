import { guides } from '@/components/public/site-data';

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const guide = guides.find((item) => item.slug === params.slug);
  if (!guide) return new Response('Guide not found', { status: 404 });
  const document = `<!doctype html><html><head><meta charset="utf-8"><title>${guide.title}</title></head><body><h1>${guide.title}</h1><p>${guide.summary}</p><p>Audience: ${guide.audience}</p><p>Published: ${guide.date}</p><h2>Implementation checklist</h2><ul><li>Name accountable business and technical owners.</li><li>Confirm data quality and retention decisions.</li><li>Define role boundaries and approval routes.</li></ul><p>This original CampusOS guide is operational guidance and not legal advice.</p></body></html>`;
  return new Response(document, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Disposition': `attachment; filename="${guide.slug}.html"` } });
}
