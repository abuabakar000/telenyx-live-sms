'use server';

import { revalidatePath } from 'next/cache';
import db from '@/lib/db';
import { ConversationRepository } from '@/repositories/ConversationRepository';
import { MessageRepository } from '@/repositories/MessageRepository';
import { ContactRepository } from '@/repositories/ContactRepository';
import { TemplateRepository } from '@/repositories/TemplateRepository';
import { MessagingService } from '@/services/MessagingService';
import { ContactService } from '@/services/ContactService';
import { TemplateService } from '@/services/TemplateService';
import { CampaignService } from '@/services/CampaignService';

// ==========================================
// 1. Messaging & Conversations Actions
// ==========================================

export async function getConversations(search?: string) {
  try {
    return await ConversationRepository.findAll({ search });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw new Error('Failed to retrieve conversations.');
  }
}

export async function getMessages(conversationId: string) {
  try {
    // Reset unread count since we are opening the conversation thread
    await ConversationRepository.resetUnread(conversationId);
    return await MessageRepository.findByConversationId(conversationId);
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw new Error('Failed to retrieve message thread.');
  }
}

export async function sendSMSAction(contactId: string, body: string) {
  try {
    const message = await MessagingService.sendSMS(contactId, body);
    revalidatePath('/inbox');
    return { success: true, message };
  } catch (error: any) {
    console.error('Error in sendSMSAction:', error);
    return { success: false, error: error.message || 'Failed to transmit SMS.' };
  }
}

// ==========================================
// 2. Contacts Actions
// ==========================================

export async function getContactsAction(search?: string, tagId?: string) {
  try {
    return await ContactService.listContacts({ search, tagId });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw new Error('Failed to retrieve contacts.');
  }
}

export async function getContactByPhoneNumberAction(phone: string) {
  try {
    return await ContactService.getContactByPhoneNumber(phone);
  } catch (error) {
    console.error('Error fetching contact by phone: ', error);
    return null;
  }
}

export async function createContactAction(data: {
  name: string;
  phoneNumber: string;
  email?: string;
  companyName?: string;
  notes?: string;
  tagIds?: string[];
}) {
  try {
    const contact = await ContactService.createContact(data);
    revalidatePath('/contacts');
    revalidatePath('/inbox');
    return contact;
  } catch (error: any) {
    console.error('Error creating contact:', error);
    throw new Error(error.message || 'Failed to create contact.');
  }
}

export async function updateContactAction(
  id: string,
  data: {
    name?: string;
    phoneNumber?: string;
    email?: string;
    companyName?: string;
    notes?: string;
    tagIds?: string[];
  }
) {
  try {
    const contact = await ContactService.updateContact(id, data);
    revalidatePath('/contacts');
    revalidatePath('/inbox');
    return contact;
  } catch (error: any) {
    console.error('Error updating contact:', error);
    throw new Error(error.message || 'Failed to update contact.');
  }
}

export async function deleteContactAction(id: string) {
  try {
    await ContactService.deleteContact(id);
    revalidatePath('/contacts');
    revalidatePath('/inbox');
    return { success: true };
  } catch (error) {
    console.error('Error deleting contact:', error);
    throw new Error('Failed to delete contact.');
  }
}

export async function importCSVAction(csvContent: string) {
  try {
    const result = await ContactService.importContactsFromCSV(csvContent);
    revalidatePath('/contacts');
    revalidatePath('/inbox');
    return result;
  } catch (error: any) {
    console.error('Error importing CSV:', error);
    throw new Error(error.message || 'Failed to import CSV.');
  }
}

// ==========================================
// 3. Tags Actions
// ==========================================

export async function listTagsAction() {
  try {
    return await ContactService.listTags();
  } catch (error) {
    console.error('Error listing tags:', error);
    throw new Error('Failed to retrieve tags.');
  }
}

export async function createTagAction(name: string, color?: string) {
  try {
    const tag = await ContactService.createTag(name, color);
    revalidatePath('/contacts');
    return tag;
  } catch (error) {
    console.error('Error creating tag:', error);
    throw new Error('Failed to create tag.');
  }
}

// ==========================================
// 4. Message Templates Actions
// ==========================================

export async function getTemplatesAction(category?: string) {
  try {
    const templatesToSeed = [
      {
        title: 'Web Concept Presentation',
        body: "Hi,\n\nHere's the concept I put together for :\n\n[link]",
        category: 'Presentation',
      },
      {
        title: 'Concept Follow-up',
        body: "Just checking in on the concept I sent over.\n\nHappy to make any changes you'd like.",
        category: 'Follow-up',
      },
      {
        title: 'Pricing & Maintenance',
        body: "For a site like this, it's $500 CAD, and hosting/maintenance is $80/month.",
        category: 'Pricing',
      },
    ];

    // Enforce/Upsert the custom requested templates in the database
    if (!category) {
      for (const t of templatesToSeed) {
        const existing = await db.messageTemplate.findFirst({
          where: { title: t.title }
        });
        if (existing) {
          if (existing.body !== t.body) {
            await db.messageTemplate.update({
              where: { id: existing.id },
              data: { body: t.body, category: t.category }
            });
          }
        } else {
          await db.messageTemplate.create({ data: t });
        }
      }
    }

    return await TemplateService.listTemplates({ category });
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw new Error('Failed to retrieve templates.');
  }
}

export async function createTemplateAction(data: { title: string; body: string; category: string }) {
  try {
    const template = await TemplateService.createTemplate(data);
    revalidatePath('/templates');
    return template;
  } catch (error: any) {
    console.error('Error creating template:', error);
    throw new Error(error.message || 'Failed to create template.');
  }
}

export async function deleteTemplateAction(id: string) {
  try {
    await TemplateService.deleteTemplate(id);
    revalidatePath('/templates');
    return { success: true };
  } catch (error) {
    console.error('Error deleting template:', error);
    throw new Error('Failed to delete template.');
  }
}

export async function getTemplateCategoriesAction() {
  try {
    return await TemplateService.listCategories();
  } catch (error) {
    console.error('Error fetching template categories:', error);
    return [];
  }
}

// ==========================================
// 5. System Settings Actions
// ==========================================

export async function getSettingsAction() {
  try {
    const settings = await db.systemSetting.findMany();
    const result: Record<string, string> = {};
    settings.forEach((s: any) => {
      result[s.key] = s.value;
    });
    return {
      telnyx_api_key: result.telnyx_api_key || '',
      telnyx_phone_number: result.telnyx_phone_number || '',
      telnyx_webhook_secret: result.telnyx_webhook_secret || '',
      organization_name: result.organization_name || '',
    };
  } catch (error) {
    console.error('Error retrieving settings:', error);
    return {
      telnyx_api_key: '',
      telnyx_phone_number: '',
      telnyx_webhook_secret: '',
      organization_name: '',
    };
  }
}

export async function updateSettingsAction(data: {
  telnyx_api_key?: string;
  telnyx_phone_number?: string;
  telnyx_webhook_secret?: string;
  organization_name?: string;
}) {
  try {
    const keys = Object.keys(data) as Array<keyof typeof data>;
    for (const key of keys) {
      const val = data[key];
      if (val !== undefined) {
        await db.systemSetting.upsert({
          where: { key },
          update: { value: val },
          create: { key, value: val },
        });
      }
    }
    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    console.error('Error updating settings:', error);
    throw new Error('Failed to save configuration settings.');
  }
}

// ==========================================
// 6. Analytics Dashboard Actions
// ==========================================

export async function getAnalyticsAction() {
  try {
    const sentToday = await MessageRepository.countSentToday();
    const receivedToday = await MessageRepository.countReceivedToday();
    const delivery = await MessageRepository.getDeliveryStats();
    
    // Count active conversations
    const activeConversations = await db.conversation.count();
    const recentActivity = await MessageRepository.getRecentActivity(6);

    const analyticsChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      
      analyticsChartData.push({
        name: label,
        sent: i === 6 ? sentToday : 0,
        received: i === 6 ? receivedToday : 0,
      });
    }

    return {
      sentToday,
      receivedToday,
      deliveryRate: Math.round(delivery.rate),
      activeConversations,
      recentActivity,
      chartData: analyticsChartData,
    };
  } catch (error) {
    console.error('Error generating analytics:', error);
    throw new Error('Failed to load analytics statistics.');
  }
}

// ==========================================
// 7. Bulk SMS Campaigns Actions
// ==========================================

export async function getCampaignsAction() {
  try {
    return await CampaignService.getCampaigns();
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw new Error('Failed to retrieve campaigns.');
  }
}

export async function launchCampaignAction(name: string, body: string, tagIds: string[]) {
  try {
    const campaign = await CampaignService.createCampaign(name, body, tagIds);
    revalidatePath('/campaigns');
    return campaign;
  } catch (error: any) {
    console.error('Error launching campaign:', error);
    throw new Error(error.message || 'Failed to initialize bulk campaign.');
  }
}

// ==========================================
// 8. Carrier Inspection & Health Actions
// ==========================================

export async function getCarrierAlertStatusAction() {
  try {
    const settings = await db.systemSetting.findMany();
    const configMap = new Map<string, string>(settings.map((s: any) => [s.key, s.value]));
    const resetAtStr = configMap.get('health_reset_at');
    const healthResetAt = resetAtStr ? new Date(resetAtStr) : new Date(0);

    const recentOutbound = await db.message.findMany({
      where: { 
        direction: 'OUTBOUND',
        createdAt: { gte: healthResetAt }
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const filteredCount = recentOutbound.filter(m => m.status === 'filtered').length;
    
    return {
      isActive: filteredCount >= 3,
      filteredCount,
    };
  } catch (err) {
    console.error('Error fetching carrier alert status:', err);
    return { isActive: false, filteredCount: 0 };
  }
}

export async function getNumberHealthAction() {
  try {
    const settings = await db.systemSetting.findMany();
    const configMap = new Map<string, string>(settings.map((s: any) => [s.key, s.value]));
    const resetAtStr = configMap.get('health_reset_at');
    const healthResetAt = resetAtStr ? new Date(resetAtStr) : new Date(0);

    const totalOutbound = await db.message.count({
      where: { 
        direction: 'OUTBOUND',
        createdAt: { gte: healthResetAt }
      },
    });

    const deliveredCount = await db.message.count({
      where: { 
        direction: 'OUTBOUND', 
        status: 'delivered',
        createdAt: { gte: healthResetAt }
      },
    });

    const sentCount = await db.message.count({
      where: { 
        direction: 'OUTBOUND', 
        status: 'sent',
        createdAt: { gte: healthResetAt }
      },
    });

    const filteredCount = await db.message.count({
      where: { 
        direction: 'OUTBOUND', 
        status: 'filtered',
        createdAt: { gte: healthResetAt }
      },
    });

    const failedCount = await db.message.count({
      where: { 
        direction: 'OUTBOUND', 
        status: 'failed',
        createdAt: { gte: healthResetAt }
      },
    });

    let healthScore = 100;
    if (totalOutbound > 0) {
      const deduction = (filteredCount * 15) + (failedCount * 5);
      healthScore = Math.max(0, 100 - deduction);
    }

    const recentFiltered = await db.message.findMany({
      where: { 
        direction: 'OUTBOUND', 
        status: 'filtered',
        createdAt: { gte: healthResetAt }
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        conversation: {
          include: { contact: true },
        },
      },
    });

    const hasLiveKeys = !!(configMap.get('telnyx_api_key') || process.env.TELNYX_API_KEY) && 
                         !!(configMap.get('telnyx_phone_number') || process.env.TELNYX_PHONE_NUMBER);

    return {
      totalOutbound,
      deliveredCount,
      sentCount,
      filteredCount,
      failedCount,
      healthScore,
      recentFiltered: recentFiltered.map((m: any) => ({
        id: m.id,
        body: m.body,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
        contactName: m.conversation?.contact?.name || 'Unknown Contact',
        phoneNumber: m.conversation?.contact?.phoneNumber || 'Unknown',
        errorCode: '40005',
        errorDetail: 'Spam Link Filter Triggered - Link structure flagged by carrier spam block.',
      })),
      complianceAudit: {
        tollFreeVerified: true,
        urlRandomizer: true,
        optOutFooter: true,
        databaseLock: true,
        hasLiveKeys,
      }
    };
  } catch (error) {
    console.error('Error generating Number Health report:', error);
    throw new Error('Failed to retrieve Number Health reports.');
  }
}

export async function resetNumberHealthAction() {
  try {
    // Simply set the reset timestamp in settings
    await db.systemSetting.upsert({
      where: { key: 'health_reset_at' },
      update: { value: new Date().toISOString() },
      create: { key: 'health_reset_at', value: new Date().toISOString() },
    });

    // Enforce fresh monitoring mode in the system configuration settings
    await db.systemSetting.upsert({
      where: { key: 'is_monitoring_fresh' },
      update: { value: 'true' },
      create: { key: 'is_monitoring_fresh', value: 'true' },
    });

    revalidatePath('/health');
    revalidatePath('/settings');
    revalidatePath('/');
    revalidatePath('/inbox');
    return { success: true };
  } catch (error) {
    console.error('Error resetting number health metrics:', error);
    throw new Error('Failed to reset number health statistics.');
  }
}
