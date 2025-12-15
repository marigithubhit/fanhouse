import Ably from 'ably';

let ablyClient: Ably.Realtime | null = null;

export const getAblyClient = () => {
  if (!ablyClient && process.env.ABLY_API_KEY) {
    ablyClient = new Ably.Realtime(process.env.ABLY_API_KEY);
  }
  return ablyClient;
};

export const publishEvent = async (channelName: string, eventName: string, data: any) => {
  try {
    const client = getAblyClient();
    if (!client) {
      console.warn('Ably client not initialized - skipping event publish');
      return;
    }

    const channel = client.channels.get(channelName);
    await channel.publish(eventName, data);
    console.log(`Published event ${eventName} to channel ${channelName}`);
  } catch (error) {
    console.error('Failed to publish Ably event:', error);
  }
};

// Publish new post notification
export const notifyNewPost = async (creatorId: number, postId: number, postData: any) => {
  await publishEvent(
    `creator:${creatorId}`,
    'new-post',
    {
      post_id: postId,
      creator_id: creatorId,
      ...postData,
      timestamp: new Date().toISOString()
    }
  );
};

// Publish subscription event
export const notifySubscription = async (creatorId: number, fanId: number, fanUsername: string) => {
  await publishEvent(
    `creator:${creatorId}`,
    'new-subscriber',
    {
      fan_id: fanId,
      fan_username: fanUsername,
      timestamp: new Date().toISOString()
    }
  );
};

// Publish PPV unlock event
export const notifyPPVUnlock = async (creatorId: number, postId: number, fanId: number) => {
  await publishEvent(
    `creator:${creatorId}`,
    'ppv-unlock',
    {
      post_id: postId,
      fan_id: fanId,
      timestamp: new Date().toISOString()
    }
  );
};

// Publish admin action event
export const notifyAdminAction = async (action: string, targetId: number, data: any) => {
  await publishEvent(
    'admin-actions',
    action,
    {
      target_id: targetId,
      ...data,
      timestamp: new Date().toISOString()
    }
  );
};
