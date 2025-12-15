// Mock Knock.app notification service
// In production, this would integrate with the real Knock API

export interface NotificationData {
  userId: number;
  type: string;
  title: string;
  message: string;
  metadata?: any;
}

export const sendNotification = async (data: NotificationData) => {
  try {
    // Mock notification - in production, this would call Knock API
    console.log('Sending notification:', data);

    // Store notification in database for in-app display
    const { query } = await import('../db');

    await query(`
      INSERT INTO notifications (user_id, notification_type, title, message, metadata)
      VALUES ($1, $2, $3, $4, $5)
    `, [data.userId, data.type, data.title, data.message, JSON.stringify(data.metadata || {})]);

    return {
      success: true,
      notification_id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  } catch (error) {
    console.error('Failed to send notification:', error);
    return {
      success: false,
      error: 'Failed to send notification'
    };
  }
};

export const sendVerificationNotification = async (userId: number, status: 'approved' | 'rejected') => {
  return sendNotification({
    userId,
    type: 'verification_update',
    title: `Verification ${status}`,
    message: `Your creator account has been ${status}.`,
    metadata: { status }
  });
};

export const sendNewSubscriberNotification = async (creatorId: number, fanUsername: string) => {
  return sendNotification({
    userId: creatorId,
    type: 'new_subscriber',
    title: 'New Subscriber',
    message: `${fanUsername} subscribed to your content!`,
    metadata: { fan_username: fanUsername }
  });
};

export const sendPPVUnlockNotification = async (creatorId: number, postTitle: string, amount: number) => {
  return sendNotification({
    userId: creatorId,
    type: 'ppv_unlock',
    title: 'PPV Content Unlocked',
    message: `Someone unlocked "${postTitle}" for $${amount}`,
    metadata: { post_title: postTitle, amount }
  });
};
