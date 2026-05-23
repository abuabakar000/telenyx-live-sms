import db from '@/lib/db';
import { MessagingService } from './MessagingService';
import { PusherService } from './PusherService';

export class CampaignService {
  static async getCampaigns() {
    return db.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        recipients: {
          include: { contact: true }
        }
      }
    });
  }

  static async getCampaignById(id: string) {
    return db.campaign.findUnique({
      where: { id },
      include: {
        recipients: {
          include: { contact: true }
        }
      }
    });
  }

  /**
   * Creates a campaign and queues all recipients based on selected tags.
   * Resolves target list and fires background executor immediately.
   */
  static async createCampaign(name: string, body: string, tagIds: string[]) {
    // 1. Find all target contacts
    const where: any = {};
    if (tagIds && tagIds.length > 0) {
      where.tagIds = { hasSome: tagIds };
    }

    const contacts = await db.contact.findMany({ where });

    if (contacts.length === 0) {
      throw new Error('No contacts found matching the selected tags.');
    }

    // 2. Create Campaign record
    const campaign = await db.campaign.create({
      data: {
        name,
        body,
        status: 'sending',
        totalCount: contacts.length,
        sentCount: 0,
        failedCount: 0,
      },
    });

    // 3. Create CampaignRecipient records
    await Promise.all(
      contacts.map((contact: any) =>
        db.campaignRecipient.create({
          data: {
            campaignId: campaign.id,
            contactId: contact.id,
            status: 'queued',
          },
        })
      )
    );

    // 4. Trigger execution in the background so the Server Action returns immediately!
    this.executeCampaign(campaign.id).catch((err) => {
      console.error(`Background campaign ${campaign.id} execution failed:`, err);
    });

    return campaign;
  }

  /**
   * Asynchronously executes a queued campaign with progressive delay and Pusher status reports
   */
  private static async executeCampaign(campaignId: string) {
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipients: {
          include: { contact: true },
        },
      },
    });

    if (!campaign) return;

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of campaign.recipients) {
      const contact = recipient.contact;
      
      // Resolve macros (e.g. {{name}} to Contact name)
      const resolvedBody = campaign.body.replace(/\{\{\s*name\s*\}\}/gi, contact.name);

      try {
        // Send SMS via our existing MessagingService
        await MessagingService.sendSMS(contact.id, resolvedBody);
        
        sentCount++;
        
        // Update recipient state
        await db.campaignRecipient.update({
          where: { id: recipient.id },
          data: { status: 'sent' },
        });
      } catch (err: any) {
        console.error(`Failed to send campaign SMS to ${contact.name} (${contact.phoneNumber}):`, err);
        failedCount++;
        
        await db.campaignRecipient.update({
          where: { id: recipient.id },
          data: { 
            status: 'failed',
            errorMsg: err.message || 'Transmission error'
          },
        });
      }

      // Update Campaign metrics in DB
      await db.campaign.update({
        where: { id: campaignId },
        data: {
          sentCount,
          failedCount,
        },
      });

      // Broadcast progress via Pusher
      const progressPercent = Math.round(((sentCount + failedCount) / campaign.totalCount) * 100);
      await PusherService.trigger('campaigns', 'campaign-progress', {
        campaignId,
        sentCount,
        failedCount,
        totalCount: campaign.totalCount,
        progressPercent,
        status: progressPercent === 100 ? 'completed' : 'sending',
        lastRecipientName: contact.name,
        lastRecipientStatus: progressPercent === 100 ? 'done' : 'sending',
      });

      // safe progressive sending delay (300ms throttle)
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Complete campaign state
    await db.campaign.update({
      where: { id: campaignId },
      data: {
        status: failedCount === campaign.totalCount ? 'failed' : 'completed',
      },
    });
  }
}
