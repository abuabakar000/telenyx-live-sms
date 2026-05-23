import { NextResponse } from 'next/server';
import { TelnyxService } from '@/services/TelnyxService';
import { MessagingService } from '@/services/MessagingService';

export async function POST(request: Request) {
  const signature = request.headers.get('telnyx-signature-ed25519') || '';
  const timestamp = request.headers.get('telnyx-timestamp') || '';
  const rawBody = await request.text();

  // Validate the Telnyx signature
  // We'll skip verification in local development IF the mock secret is used,
  // allowing developers to test webhooks easily using simple mock tools.
  const config = await TelnyxService.getConfig();
  let isValid = false;

  if (config.webhookSecret === 'MOCK_WEBHOOK_SIGNING_SECRET') {
    console.log('Skipping Telnyx webhook signature verification for MOCK_WEBHOOK_SIGNING_SECRET in local development.');
    isValid = true;
  } else {
    isValid = await TelnyxService.verifyWebhookSignature(rawBody, signature, timestamp);
  }

  if (!isValid) {
    console.error('Invalid Telnyx webhook signature. Signature verification failed.');
    return new NextResponse('Unauthorized: Invalid Signature', { status: 401 });
  }

  try {
    const body = JSON.parse(rawBody);
    const eventType = body.data?.event_type;
    const payload = body.data?.payload;

    if (!eventType || !payload) {
      return NextResponse.json({ error: 'Invalid payload structure' }, { status: 400 });
    }

    const telnyxId = payload.id;

    if (eventType === 'message.received') {
      const fromPhone = payload.from?.phone_number;
      const text = payload.text;

      if (!fromPhone || !text) {
        return NextResponse.json({ error: 'Missing required incoming message parameters' }, { status: 400 });
      }

      await MessagingService.handleIncomingSMS(fromPhone, text, telnyxId);
      console.log(`Successfully processed inbound SMS from ${fromPhone}`);
    } else if (
      eventType === 'message.sent' ||
      eventType === 'message.delivered' ||
      eventType === 'message.failed'
    ) {
      const errors = payload.errors;
      await MessagingService.handleDeliveryStatusUpdate(telnyxId, eventType, errors);
      console.log(`Successfully processed delivery status update "${eventType}" for message ${telnyxId}`);
    } else {
      console.log(`Ignored unhandled Telnyx event type: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing Telnyx webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
