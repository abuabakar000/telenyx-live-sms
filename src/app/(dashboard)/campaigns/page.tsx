import React from 'react';
import CampaignsClient from '@/components/dashboard/CampaignsClient';
import { getCampaignsAction, getTemplatesAction, getContactsAction, listTagsAction } from '@/app/actions';

export const revalidate = 0; // Live SMS campaign Wizards should bypass caching

export default async function CampaignsPage() {
  const campaigns = await getCampaignsAction();
  const tags = await listTagsAction();
  const templates = await getTemplatesAction();
  const contacts = await getContactsAction();

  // Safely serialize database date values to string formats for forwarding
  const serializedCampaigns = JSON.parse(JSON.stringify(campaigns));
  const serializedTags = JSON.parse(JSON.stringify(tags));
  const serializedTemplates = JSON.parse(JSON.stringify(templates));
  const serializedContacts = JSON.parse(JSON.stringify(contacts));

  return (
    <CampaignsClient
      initialCampaigns={serializedCampaigns}
      allTags={serializedTags}
      allTemplates={serializedTemplates}
      contactsList={serializedContacts}
    />
  );
}
