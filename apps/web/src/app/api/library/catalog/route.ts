import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import {
  catalogEntity,
  getLibraryState,
  isLibraryManager,
  LIBRARY_CATALOG_ACTION,
  libraryError,
  type LibraryCatalogMeta,
  type LibraryCopyMeta,
  type LibraryResourceType,
} from '@/lib/library-workspace';

export const dynamic = 'force-dynamic';

const MAX_EBOOK_BYTES = 25 * 1024 * 1024;
const acceptedEbookTypes = new Set(['application/pdf', 'application/epub+zip']);

const catalogSchema = z.object({
  itemId: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(240),
  isbn: z.string().trim().max(40).optional(),
  author: z.string().trim().min(2).max(240),
  category: z.string().trim().min(2).max(120),
  publisher: z.string().trim().max(160).optional(),
  edition: z.string().trim().max(80).optional(),
  language: z.string().trim().min(2).max(60).default('English'),
  description: z.string().trim().max(4000).optional(),
  resourceType: z.enum(['PHYSICAL', 'EBOOK', 'HYBRID']),
  totalCopies: z.coerce.number().int().min(0).max(10000).default(0),
  shelfLocation: z.string().trim().max(120).optional(),
  barcodePrefix: z.string().trim().max(50).optional(),
  digitalSeats: z.coerce.number().int().min(0).max(10000).default(0),
  digitalLoanDays: z.coerce.number().int().min(1).max(180).default(7),
  externalUrl: z.string().trim().url().optional().or(z.literal('')),
  allowDownload: z.coerce.boolean().default(false),
  tags: z.string().trim().max(1000).optional(),
  vendor: z.string().trim().max(160).optional(),
  unitCost: z.coerce.number().min(0).max(100000000).optional(),
  currency: z.string().trim().max(3).optional(),
});

function verifyEbook(file: File) {
  if (file.size <= 0 || file.size > MAX_EBOOK_BYTES) throw new Error('LIBRARY_EBOOK_SIZE');
  if (!acceptedEbookTypes.has(file.type)) throw new Error('LIBRARY_EBOOK_TYPE');
}

async function toPrivateFile(file: File) {
  verifyEbook(file);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (file.type === 'application/pdf' && bytes.subarray(0, 5).toString('ascii') !== '%PDF-') throw new Error('LIBRARY_EBOOK_SIGNATURE');
  if (file.type === 'application/epub+zip' && !(bytes[0] === 0x50 && bytes[1] === 0x4b)) throw new Error('LIBRARY_EBOOK_SIGNATURE');
  return `data:${file.type};base64,${bytes.toString('base64')}`;
}

function copyList(total: number, prefix: string, shelfLocation?: string, previous: LibraryCopyMeta[] = []) {
  const kept = previous.slice(0, total);
  const result = [...kept];
  for (let index = kept.length; index < total; index += 1) {
    const serial = String(index + 1).padStart(4, '0');
    result.push({
      barcode: `${prefix}-${serial}`,
      accessionNumber: `${prefix}-${serial}`,
      shelfLocation,
    });
  }
  return result;
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    if (!isLibraryManager(context.activeRole)) throw new Error('LIBRARY_FORBIDDEN');
    const form = await request.formData();
    const raw = Object.fromEntries([...form.entries()].filter(([, value]) => typeof value === 'string'));
    const input = catalogSchema.parse(raw);
    if ((input.resourceType === 'PHYSICAL' || input.resourceType === 'HYBRID') && input.totalCopies < 1) {
      return NextResponse.json({ error: 'Physical and hybrid titles need at least one physical copy.' }, { status: 422 });
    }
    if (input.resourceType === 'EBOOK' && input.digitalSeats < 1) {
      return NextResponse.json({ error: 'E-books need at least one licensed digital seat.' }, { status: 422 });
    }
    if (input.externalUrl && !input.externalUrl.startsWith('https://')) {
      return NextResponse.json({ error: 'External e-book access must use HTTPS.' }, { status: 422 });
    }

    const state = await getLibraryState(context.tenantId);
    const existingMeta = input.itemId ? state.catalogMap.get(catalogEntity(input.itemId)) : undefined;
    const ebook = form.get('ebook');
    let fileId = existingMeta?.digital?.fileId;
    let mimeType = existingMeta?.digital?.mimeType;
    if (ebook instanceof File && ebook.size > 0) {
      const fileUrl = await toPrivateFile(ebook);
      const stored = await prisma.file.create({ data: { tenantId: context.tenantId, fileName: ebook.name, fileUrl, mimeType: ebook.type }, select: { id: true } });
      fileId = stored.id;
      mimeType = ebook.type;
    }

    const item = input.itemId
      ? await prisma.libraryItem.update({ where: { id: input.itemId }, data: { title: input.title, isbn: input.isbn || null }, select: { id: true } })
      : await prisma.libraryItem.create({ data: { tenantId: context.tenantId, title: input.title, isbn: input.isbn || null }, select: { id: true } });

    const prefix = (input.barcodePrefix || input.isbn?.replace(/[^0-9A-Za-z]/g, '').slice(-8) || item.id.slice(0, 8)).toUpperCase();
    const resourceType = input.resourceType as LibraryResourceType;
    const meta: LibraryCatalogMeta = {
      version: 2,
      author: input.author,
      category: input.category,
      publisher: input.publisher || undefined,
      edition: input.edition || undefined,
      language: input.language,
      description: input.description || undefined,
      resourceType,
      physicalCopies: resourceType === 'EBOOK' ? [] : copyList(input.totalCopies, prefix, input.shelfLocation, existingMeta?.physicalCopies),
      digital: resourceType === 'PHYSICAL' ? undefined : {
        fileId,
        externalUrl: input.externalUrl || existingMeta?.digital?.externalUrl,
        mimeType,
        seats: input.digitalSeats,
        loanDays: input.digitalLoanDays,
        allowDownload: input.allowDownload,
      },
      acquisition: {
        vendor: input.vendor || existingMeta?.acquisition?.vendor,
        purchasedAt: existingMeta?.acquisition?.purchasedAt ?? new Date().toISOString(),
        unitCost: input.unitCost,
        currency: input.currency?.toUpperCase() || existingMeta?.acquisition?.currency,
      },
      tags: input.tags ? input.tags.split(',').map((tag) => tag.trim()).filter(Boolean).slice(0, 20) : existingMeta?.tags ?? [],
    };

    if (resourceType !== 'PHYSICAL' && !meta.digital?.fileId && !meta.digital?.externalUrl) {
      return NextResponse.json({ error: 'Provide a licensed PDF/EPUB file or approved HTTPS e-book URL.' }, { status: 422 });
    }

    await prisma.auditLog.create({
      data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_CATALOG_ACTION, entity: catalogEntity(item.id), diffJson: JSON.stringify(meta) },
    });

    return NextResponse.json({ success: true, itemId: item.id }, { status: input.itemId ? 200 : 201 });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Please check the catalogue details.', details: error.errors }, { status: 400 });
    const code = error instanceof Error ? error.message : '';
    if (code === 'LIBRARY_EBOOK_SIZE') return NextResponse.json({ error: 'E-book files must be 25 MB or smaller.' }, { status: 413 });
    if (code === 'LIBRARY_EBOOK_TYPE') return NextResponse.json({ error: 'Only PDF and EPUB e-books are supported.' }, { status: 415 });
    if (code === 'LIBRARY_EBOOK_SIGNATURE') return NextResponse.json({ error: 'The uploaded e-book content does not match its declared file type.' }, { status: 422 });
    const failure = libraryError(error);
    return NextResponse.json({ error: failure.error }, { status: failure.status });
  }
}
