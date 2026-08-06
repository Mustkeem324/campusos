import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Contact CampusOS',
  robots: { index: false, follow: false },
};

export default function RetiredDemoRoute() {
  redirect('/contact?intent=sales');
}
