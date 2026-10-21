import { redirect } from 'next/navigation';

/** Legacy /admin entry point; the workspace lives at /dashboard. */
export default function AdminIndexPage() {
  redirect('/dashboard');
}
