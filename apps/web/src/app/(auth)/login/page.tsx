import { ProductionLoginForm } from '@/components/auth/ProductionLoginForm';

const WORKSPACE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export const metadata = {
  title: 'Sign In | CampusOS',
  description: 'Secure sign in for authorised CampusOS institution accounts.',
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams: searchParamsPromise }: { searchParams: Promise<{ workspace?: string }>; }) {
  const searchParams = await searchParamsPromise;

  const candidate = searchParams?.workspace?.trim().toLowerCase() ?? '';
  const workspace = WORKSPACE_PATTERN.test(candidate) ? candidate : undefined;
  return <ProductionLoginForm workspace={workspace} />;
}
