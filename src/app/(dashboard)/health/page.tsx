import React from 'react';
import HealthClient from '@/components/dashboard/HealthClient';
import { getNumberHealthAction } from '@/app/actions';

export const revalidate = 0; // Live logs must bypass caching

export default async function HealthPage() {
  const initialReport = await getNumberHealthAction();
  return <HealthClient initialReport={initialReport} />;
}
