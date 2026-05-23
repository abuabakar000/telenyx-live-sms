import { useEffect } from 'react';
import Pusher from 'pusher-js';

const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || 'mock_pusher_key';
const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';

let pusherClient: Pusher | null = null;

function getPusherClient() {
  if (pusherClient) return pusherClient;

  if (!pusherKey || pusherKey === 'mock_pusher_key') {
    console.warn('Pusher client key is not configured. Real-time websocket sync is disabled.');
    return null;
  }

  try {
    pusherClient = new Pusher(pusherKey, {
      cluster: pusherCluster,
      forceTLS: true,
    });
    return pusherClient;
  } catch (error) {
    console.error('Failed to initialize Pusher client:', error);
    return null;
  }
}

export function usePusher(
  channelName: string,
  eventName: string,
  callback: (data: any) => void
) {
  useEffect(() => {
    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe(channelName);
    channel.bind(eventName, callback);

    return () => {
      channel.unbind(eventName, callback);
    };
  }, [channelName, eventName, callback]);
}
