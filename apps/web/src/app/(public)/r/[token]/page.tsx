import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function CompactResultVerificationPage({ params: paramsPromise }: { params: Promise<{ token: string }>; }) {
  const params = await paramsPromise;

  redirect(`/verify/result/${encodeURIComponent(params.token)}`);
}
