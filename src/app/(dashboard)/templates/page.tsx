import React from 'react';
import TemplatesClient from '@/components/dashboard/TemplatesClient';
import { getTemplatesAction, getTemplateCategoriesAction } from '@/app/actions';

export const revalidate = 0; // Live templates directory views should not cache statically

export default async function TemplatesPage() {
  const templates = await getTemplatesAction();
  const categories = await getTemplateCategoriesAction();

  // Safely serialize database date values to string formats for forwarding
  const serializedTemplates = JSON.parse(JSON.stringify(templates));
  
  // Ensure "all" is aggregated at server layer
  const finalCategories = Array.from(new Set(['all', ...(categories as string[])]));

  return (
    <TemplatesClient
      initialTemplates={serializedTemplates}
      categories={finalCategories}
    />
  );
}
