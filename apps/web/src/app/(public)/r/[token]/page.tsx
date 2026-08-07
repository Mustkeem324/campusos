import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function CompactResultVerificationPage({ params }: { params: { token: string } }) {
  redirect(`/verify/result/${encodeURIComponent(params.token)}`);
}
