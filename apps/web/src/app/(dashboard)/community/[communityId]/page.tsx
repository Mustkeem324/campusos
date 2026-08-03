import { CommunityChatWorkspace } from '../../../../components/community/CommunityChatWorkspace';

export default function CommunityDetailPage({ params }: { params: { communityId: string } }) {
  return <CommunityChatWorkspace initialCommunityId={params.communityId} />;
}
