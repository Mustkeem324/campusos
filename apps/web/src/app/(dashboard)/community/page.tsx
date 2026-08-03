import React from 'react';
import { CommunityFeed } from '../../../components/community/CommunityFeed';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Hub | CampusOS',
  description: 'Connect and engage with your campus community',
};

export default function CommunityPage() {
  return (
    <CommunityFeed />
  );
}
