import React from 'react';
import SettingsClient from '@/components/dashboard/SettingsClient';
import { getSettingsAction } from '@/app/actions';

export const revalidate = 0; // Live settings pane should bypass caching

export default async function SettingsPage() {
  const initialSettings = await getSettingsAction();
  return <SettingsClient initialSettings={initialSettings} />;
}
