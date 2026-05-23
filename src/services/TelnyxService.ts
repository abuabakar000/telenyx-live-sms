import crypto from 'crypto';
import db from '@/lib/db';

export interface TelnyxConfig {
  apiKey: string;
  fromNumber: string;
  webhookSecret: string;
}

export class TelnyxService {
  /**
   * Resolves configuration, preferring Database settings, falling back to environment variables.
   */
  static async getConfig(): Promise<TelnyxConfig> {
    const settings = await db.systemSetting.findMany();
    const configMap = new Map<string, string>(settings.map((s: any) => [s.key, s.value]));

    const apiKey = (configMap.get('telnyx_api_key') || process.env.TELNYX_API_KEY || '') as string;
    const fromNumber = (configMap.get('telnyx_phone_number') || process.env.TELNYX_PHONE_NUMBER || '') as string;
    const webhookSecret = (configMap.get('telnyx_webhook_secret') || process.env.TELNYX_WEBHOOK_SECRET || '') as string;

    return { apiKey, fromNumber, webhookSecret };
  }

  /**
   * Sends an outbound SMS via Telnyx REST API
   * @returns Telnyx Message ID on success
   */
  static async sendSMS(to: string, body: string): Promise<string> {
    const config = await this.getConfig();

    if (!config.apiKey || !config.fromNumber) {
      throw new Error('Telnyx is not configured. Please set the API Key and Phone Number in Settings.');
    }

    try {
      const response = await fetch('https://api.telnyx.com/v2/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          from: config.fromNumber,
          to,
          text: body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.errors?.[0]?.detail || response.statusText;
        throw new Error(`Telnyx API Error: ${errorMsg}`);
      }

      const telnyxId = data.data?.id;
      if (!telnyxId) {
        throw new Error('Telnyx API did not return a message ID.');
      }

      return telnyxId;
    } catch (error: any) {
      console.error('Error sending SMS via Telnyx:', error);
      throw error;
    }
  }

  /**
   * Verifies the cryptographic signature of an incoming Telnyx webhook request
   * @param rawBody Raw request body string
   * @param signature The 'telnyx-signature-ed25519' header value
   * @param timestamp The 'telnyx-timestamp' header value
   */
  static async verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string
  ): Promise<boolean> {
    try {
      const config = await this.getConfig();
      if (!config.webhookSecret) {
        console.warn('Telnyx Webhook Secret is not configured. Signature verification skipped or failing.');
        return false;
      }

      // Check if signature or timestamp is missing
      if (!signature || !timestamp) {
        return false;
      }

      // Webhook payload verification concatenates the timestamp and the raw JSON body
      const payload = `${timestamp}${rawBody}`;
      
      const signatureBuffer = Buffer.from(signature, 'base64');
      const publicKeyBuffer = config.webhookSecret.length === 64
        ? Buffer.from(config.webhookSecret, 'hex')
        : Buffer.from(config.webhookSecret, 'base64');

      const cryptoKey = crypto.createPublicKey({
        key: publicKeyBuffer,
        format: 'raw',
        type: 'public',
        asymmetricKeyType: 'ed25519',
      } as any);

      return crypto.verify(
        undefined, // ed25519 doesn't require hash algorithm
        Buffer.from(payload),
        cryptoKey,
        signatureBuffer
      );
    } catch (error) {
      console.error('Telnyx webhook signature verification failed:', error);
      return false;
    }
  }
}
