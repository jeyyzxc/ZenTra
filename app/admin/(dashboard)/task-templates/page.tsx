import { redirect } from 'next/navigation';

export default function TaskTemplatesPage() {
  redirect('/admin/command-center?workspace=workflow');
}
