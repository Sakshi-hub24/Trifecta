import { redirect } from 'next/navigation';

export default function Home() {
  // Always redirect to signin page
  redirect('/auth/signin');
}
