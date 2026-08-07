import type { Metadata } from 'next';

import { LibraryOPACConsole } from '../../../components/campus/LibraryOPACConsole';

export const metadata: Metadata = {
  title: 'Library & E-Library | CampusOS',
  description: 'Institution-scoped physical circulation, reservations and licensed digital-library access.',
};

export default function Page() {
  return <LibraryOPACConsole />;
}
