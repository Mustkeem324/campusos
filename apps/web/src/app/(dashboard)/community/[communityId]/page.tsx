import { CommunityChatWorkspace } from '../../../../components/community/CommunityChatWorkspace';

export default async function CommunityDetailPage({ params: paramsPromise }: { params: Promise<{ communityId: string }>; }) {
  const params = await paramsPromise;

  return <CommunityChatWorkspace initialCommunityId={params.communityId} />;
}
