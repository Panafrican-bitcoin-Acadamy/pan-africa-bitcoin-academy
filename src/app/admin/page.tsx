import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  // Redirect admin root to the main admin dashboard
  redirect('/admin/applications');
}

