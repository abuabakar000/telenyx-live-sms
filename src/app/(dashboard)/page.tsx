import React from 'react';
import InboxClient from '@/components/dashboard/InboxClient';
import { getConversations, listTagsAction, getTemplatesAction, getCarrierAlertStatusAction } from '@/app/actions';

export const revalidate = 0; // Live inbox views should bypass caching

export default async function InboxPage() {
  const initialConversations = await getConversations();
  const initialTags = await listTagsAction();
  const initialTemplates = await getTemplatesAction();
  const initialCarrierAlert = await getCarrierAlertStatusAction();

  // Safely serialize database date values to string formats for forwarding
  const serializedConversations = JSON.parse(JSON.stringify(initialConversations));
  const serializedTags = JSON.parse(JSON.stringify(serializedConversations.length > 0 ? initialTags : [])); // handled inside action
  const serializedTemplates = JSON.parse(JSON.stringify(initialTemplates));

  return (
    <InboxClient
      initialConversations={serializedConversations}
      initialTags={serializedTags}
      initialTemplates={serializedTemplates}
      initialCarrierAlert={initialCarrierAlert}
    />
  );
}
