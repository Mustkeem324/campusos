import { ThreeDEyesCamera } from '@/components/examinations/ThreeDEyesCamera';

export default async function ThreeDEyesPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <ThreeDEyesCamera initialToken={token} />;
}
