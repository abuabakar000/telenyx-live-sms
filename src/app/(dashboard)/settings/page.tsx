import React from 'react';
import SettingsClient from '@/components/dashboard/SettingsClient';
import { getSettingsAction, getNumberHealthAction } from '@/app/actions';

export const revalidate = 0; // Live settings pane should bypass caching

export default async function SettingsPage() {
  const [initialSettings, initialHealthReport] = await Promise.all([
    getSettingsAction(),
    getNumberHealthAction()
  ]);
  return <SettingsClient initialSettings={initialSettings} initialHealthReport={initialHealthReport} />;
}
