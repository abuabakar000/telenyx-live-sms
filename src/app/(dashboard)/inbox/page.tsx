import React from 'react';
import InboxClient from '@/components/dashboard/InboxClient';
import { getConversations, listTagsAction, getTemplatesAction, getCarrierAlertStatusAction } from '@/app/actions';

export const revalidate = 0; // Disable static rendering for live CRM views

export default async function InboxPage() {
  const initialConversations = await getConversations();
  const initialTags = await listTagsAction();
  const initialTemplates = await getTemplatesAction();
  const initialCarrierAlert = await getCarrierAlertStatusAction();

  // Safely serialize dates to strings before forwarding to Client Components
  const serializedConversations = JSON.parse(JSON.stringify(initialConversations));
  const serializedTags = JSON.parse(JSON.stringify(initialTags));
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
