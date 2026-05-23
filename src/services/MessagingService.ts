import db from '@/lib/db';
import { MessageRepository } from '@/repositories/MessageRepository';
import { ConversationRepository } from '@/repositories/ConversationRepository';
import { ContactRepository } from '@/repositories/ContactRepository';
import { TelnyxService } from './TelnyxService';
import { PusherService } from './PusherService';
import { ContactService } from './ContactService';

export class MessagingService {
  /**
   * Sends an SMS outbound, updating DB, triggering real-time Pusher, calling Telnyx API
   */
  static async sendSMS(contactId: string, body: string) {
    const contact = await ContactRepository.findById(contactId);
    if (!contact) throw new Error('Contact not found.');
    if (contact.optedOut) throw new Error('Recipient has opted out of SMS messages from Inex Labs.');

    // 1. Compliance URL Masking & CTIA Footers
    let modifiedBody = body;
    const hasLink = /((https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/i.test(body);

    if (hasLink) {
      // A. Dynamic URL Randomizer
      modifiedBody = body.replace(
        /((https?:\/\/)?(preview\.inexlabs\.com\/[-a-zA-Z0-9()@:%_\+.~#?&//=]*|[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)))/gi,
        (url) => {
          if (url.includes('@')) return url; // Skip email addresses
          const separator = url.includes('?') ? '&' : '?';
          const randomVal = Math.floor(100 + Math.random() * 900);
          return `${url}${separator}v=${randomVal}`;
        }
      );

      // B. CTIA Compliance Footer auto-append (Conversational Human Style)
      const hasStopWording = /stop/i.test(modifiedBody);
      if (!hasStopWording) {
        modifiedBody = `${modifiedBody.trim()} To stop, reply STOP.`;
      }
    }

    // 2. Get or create conversation
    let conversation = await ConversationRepository.findByContactId(contactId);
    if (!conversation) {
      conversation = await ConversationRepository.create(contactId);
    }

    // 3. Create message in DB as "sending"
    const message = await MessageRepository.create({
      conversationId: conversation.id,
      direction: 'OUTBOUND',
      body: modifiedBody,
      status: 'sending',
      telnyxId: null,
    });

    // 4. Update conversation last message and reset unread count (user is currently viewing/interacting)
    const updatedConversation = await ConversationRepository.update(conversation.id, {
      lastMessage: modifiedBody,
      lastMessageAt: new Date(),
      unreadCount: 0,
    });

    // 5. Trigger optimistic UI updates via Pusher
    await PusherService.trigger('conversations', 'message-sent', {
      message,
      conversation: updatedConversation,
    });

    // 6. Fire off the Telnyx API in the background or synchronously
    try {
      const telnyxId = await TelnyxService.sendSMS(contact.phoneNumber, modifiedBody);

      // Update message status to 'sent' and save Telnyx ID
      const updatedMessage = await db.message.update({
        where: { id: message.id },
        data: {
          telnyxId,
          status: 'sent',
        },
      });

      // Broadcast status update
      await PusherService.trigger('conversations', 'message-status-updated', {
        message: updatedMessage,
      });

      return updatedMessage;
    } catch (err: any) {
      console.error('Failed to send Telnyx SMS:', err);

      // Update message status to 'failed'
      const updatedMessage = await MessageRepository.updateStatus(message.id, 'failed');

      // Broadcast status update
      await PusherService.trigger('conversations', 'message-status-updated', {
        message: updatedMessage,
      });

      throw err;
    }
  }

  /**
   * Processes an incoming webhook SMS from Telnyx
   */
  static async handleIncomingSMS(fromPhoneNumber: string, body: string, telnyxId: string) {
    const cleanPhone = ContactService.cleanPhoneNumber(fromPhoneNumber);

    // 1. Find or create contact
    let contact = await ContactRepository.findByPhoneNumber(cleanPhone);
    if (!contact) {
      contact = await ContactRepository.create({
        name: `New Contact (${cleanPhone})`,
        phoneNumber: cleanPhone,
        notes: 'Automatically created from incoming SMS.',
      });
    }

    if (!contact) {
      throw new Error('Failed to resolve or provision lead contact.');
    }

    const trimmedBody = body.trim();
    const isOptOutKeyword = /^(stop|unsubscribe|cancel|quit|optout|opt-out)$/i.test(trimmedBody);
    const isOptInKeyword = /^(start|unstop)$/i.test(trimmedBody);

    if (isOptOutKeyword && !contact.optedOut) {
      contact = await db.contact.update({
        where: { id: contact.id },
        data: { optedOut: true },
        include: { tags: true },
      });
      console.log(`Compliance Trigger: Contact ${cleanPhone} opted out via keyword "${trimmedBody}"`);
    } else if (isOptInKeyword && contact.optedOut) {
      contact = await db.contact.update({
        where: { id: contact.id },
        data: { optedOut: false },
        include: { tags: true },
      });
      console.log(`Compliance Trigger: Contact ${cleanPhone} opted back in via keyword "${trimmedBody}"`);
    }

    // 2. Find or create conversation
    let conversation = await ConversationRepository.findByContactId(contact.id);
    if (!conversation) {
      conversation = await ConversationRepository.create(contact.id);
    }

    // 3. Create INBOUND message
    const message = await MessageRepository.create({
      conversationId: conversation.id,
      direction: 'INBOUND',
      body,
      telnyxId,
      status: 'received',
    });

    // 4. Increment conversation unread count and update last message
    const updatedConversation = await ConversationRepository.incrementUnread(conversation.id, body);

    // 5. Broadcast real-time message received event
    await PusherService.trigger('conversations', 'message-received', {
      message,
      conversation: updatedConversation,
    });

    // 6. Handle compliance auto-replies in background
    if (isOptOutKeyword) {
      const confirmText = "Inex Labs: You have successfully opted out. No further messages will be sent.";
      
      // Save opt-out auto-reply in DB as OUTBOUND message
      const replyMsg = await MessageRepository.create({
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        body: confirmText,
        status: 'sending',
        telnyxId: null,
      });

      // Update conversation last message
      const finalConversation = await ConversationRepository.update(conversation.id, {
        lastMessage: confirmText,
        lastMessageAt: new Date(),
        unreadCount: updatedConversation.unreadCount, // keep the unread badge active for the user
      });

      // Broadcast auto-reply message sending event
      await PusherService.trigger('conversations', 'message-sent', {
        message: replyMsg,
        conversation: finalConversation,
      });

      // Transmit the confirmation SMS via Telnyx gateway
      try {
        const outTelnyxId = await TelnyxService.sendSMS(contact.phoneNumber, confirmText);
        const savedReplyMsg = await db.message.update({
          where: { id: replyMsg.id },
          data: { telnyxId: outTelnyxId, status: 'delivered' }
        });
        await PusherService.trigger('conversations', 'message-status-updated', {
          message: savedReplyMsg,
        });
      } catch (err) {
        console.error('Failed to transmit opt-out confirmation SMS:', err);
        const failedReply = await MessageRepository.updateStatus(replyMsg.id, 'failed');
        await PusherService.trigger('conversations', 'message-status-updated', {
          message: failedReply,
        });
      }
    } else if (isOptInKeyword) {
      const confirmText = "Inex Labs: You have successfully opted back in. You may start receiving messages again. Reply STOP to opt out.";
      
      // Save opt-in auto-reply in DB
      const replyMsg = await MessageRepository.create({
        conversationId: conversation.id,
        direction: 'OUTBOUND',
        body: confirmText,
        status: 'sending',
        telnyxId: null,
      });

      // Update conversation last message
      const finalConversation = await ConversationRepository.update(conversation.id, {
        lastMessage: confirmText,
        lastMessageAt: new Date(),
        unreadCount: updatedConversation.unreadCount,
      });

      // Broadcast auto-reply
      await PusherService.trigger('conversations', 'message-sent', {
        message: replyMsg,
        conversation: finalConversation,
      });

      // Transmit via Telnyx
      try {
        const outTelnyxId = await TelnyxService.sendSMS(contact.phoneNumber, confirmText);
        const savedReplyMsg = await db.message.update({
          where: { id: replyMsg.id },
          data: { telnyxId: outTelnyxId, status: 'delivered' }
        });
        await PusherService.trigger('conversations', 'message-status-updated', {
          message: savedReplyMsg,
        });
      } catch (err) {
        console.error('Failed to transmit opt-in confirmation SMS:', err);
        const failedReply = await MessageRepository.updateStatus(replyMsg.id, 'failed');
        await PusherService.trigger('conversations', 'message-status-updated', {
          message: failedReply,
        });
      }
    }

    return { message, conversation: updatedConversation };
  }

  /**
   * Processes a delivery status update webhook from Telnyx (e.g. delivered, failed)
   */
  static async handleDeliveryStatusUpdate(telnyxId: string, telnyxStatus: string, webhookErrors?: any[]) {
    let status = 'sent';
    if (telnyxStatus === 'message.delivered' || telnyxStatus === 'delivered') {
      status = 'delivered';
    } else if (telnyxStatus === 'message.failed' || telnyxStatus === 'failed') {
      status = 'failed';
      // Check if carrier spam filtering blocked the message
      if (webhookErrors && Array.isArray(webhookErrors)) {
        const carrierFilterCodes = ['40005', '40006', '40060', '40003'];
        const hasFilterError = webhookErrors.some(err => 
          carrierFilterCodes.includes(String(err.code)) || 
          (err.title && /filter/i.test(err.title)) ||
          (err.detail && /filter/i.test(err.detail))
        );
        if (hasFilterError) {
          status = 'filtered';
          console.log(`Carrier Filtering Detected for Telnyx SMS ${telnyxId}`);
        }
      }
    }

    const message = await MessageRepository.findByTelnyxId(telnyxId);
    if (!message) {
      console.warn(`Message with Telnyx ID "${telnyxId}" not found in DB. Skipping status update.`);
      return null;
    }

    const updatedMessage = await MessageRepository.updateStatus(message.id, status);

    // Broadcast real-time status update
    await PusherService.trigger('conversations', 'message-status-updated', {
      message: updatedMessage,
    });

    return updatedMessage;
  }
}
