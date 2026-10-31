import type { Metadata } from 'next';
import '../admin.css';
import AdminRoot from '@/components/admin/AdminRoot';

export const metadata: Metadata = { title: 'Admin — Encore Une 3ème Fourchette', robots: { index: false, follow: false } };

export default function AdminPage() { return <AdminRoot />; }
