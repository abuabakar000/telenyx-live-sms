import React from 'react';
import ContactsClient from '@/components/dashboard/ContactsClient';
import { getContactsAction, listTagsAction } from '@/app/actions';

export const revalidate = 0; // Live CRM directory views should not cache statically

export default async function ContactsPage() {
  const contacts = await getContactsAction();
  const tags = await listTagsAction();

  // Safely serialize database date values to string formats for forwarding
  const serializedContacts = JSON.parse(JSON.stringify(contacts));
  const serializedTags = JSON.parse(JSON.stringify(tags));

  return (
    <ContactsClient
      initialContacts={serializedContacts}
      allTags={serializedTags}
    />
  );
}
