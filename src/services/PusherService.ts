import Pusher from 'pusher';

export class PusherService {
  private static pusherInstance: Pusher | null = null;

  private static getPusher(): Pusher | null {
    if (this.pusherInstance) return this.pusherInstance;

    const appId = process.env.PUSHER_APP_ID;
    const key = process.env.PUSHER_KEY;
    const secret = process.env.PUSHER_SECRET;
    const cluster = process.env.PUSHER_CLUSTER || 'us2';

    if (!appId || !key || !secret || appId.includes('mock') || key.includes('mock')) {
      console.warn('Pusher credentials are not configured or are placeholder values. Real-time updates are disabled.');
      return null;
    }

    try {
      this.pusherInstance = new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      });
      return this.pusherInstance;
    } catch (error) {
      console.error('Error initializing Pusher server:', error);
      return null;
    }
  }

  /**
   * Broadcasts a real-time event
   */
  static async trigger(channel: string, event: string, data: any): Promise<void> {
    const pusher = this.getPusher();
    if (!pusher) return;

    try {
      await pusher.trigger(channel, event, data);
    } catch (error) {
      console.error(`Pusher trigger failed on channel "${channel}", event "${event}":`, error);
    }
  }
}
