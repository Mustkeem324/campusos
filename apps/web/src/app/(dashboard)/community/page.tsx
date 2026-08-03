import React from 'react';
import { CommunityChatWorkspace } from '../../../components/community/CommunityChatWorkspace';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Hub | CampusOS',
  description: 'Connect and engage with your campus community',
};

export default function CommunityPage() {
  return (
    <CommunityChatWorkspace />
  );
}
