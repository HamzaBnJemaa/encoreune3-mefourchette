import type { Metadata } from 'next';
import '../admin.css';
import CourierRoot from '@/components/admin/CourierRoot';

export const metadata: Metadata = { title: 'Livreur — Encore Une 3ème Fourchette', robots: { index: false, follow: false } };

export default function CourierPage() { return <CourierRoot />; }
