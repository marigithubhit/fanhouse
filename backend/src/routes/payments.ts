import express from 'express';
import { query, getClient } from '../db';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Generate transaction ID
const generateTransactionId = () => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Mock CCBill payment processor
const processMockPayment = async (amount: number, metadata: any) => {
  // Simulate payment processing delay
  await new Promise(resolve => setTimeout(resolve, 100));

  // Mock CCBill transaction ID
  const ccbillTransactionId = `ccbill_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Simulate 95% success rate
  const success = Math.random() > 0.05;

  return {
    success,
    transaction_id: ccbillTransactionId,
    message: success ? 'Payment processed successfully' : 'Payment failed'
  };
};

// Subscribe to creator
router.post('/subscribe', authenticate, async (req: AuthRequest, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { creator_id } = req.body;

    if (!creator_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Creator ID required' });
    }

    // Get creator subscription price
    const creatorResult = await client.query(
      'SELECT subscription_price, verification_status FROM creator_profiles WHERE user_id = $1',
      [creator_id]
    );

    if (creatorResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Creator not found' });
    }

    if (creatorResult.rows[0].verification_status !== 'approved') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Creator not approved' });
    }

    const amount = creatorResult.rows[0].subscription_price;

    // Check if already subscribed
    const existingSub = await client.query(
      'SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3',
      [req.user!.id, creator_id, 'active']
    );

    if (existingSub.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already subscribed' });
    }

    // Process mock payment
    const paymentResult = await processMockPayment(amount, {
      fan_id: req.user!.id,
      creator_id,
      type: 'subscription'
    });

    if (!paymentResult.success) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'Payment failed' });
    }

    const transactionId = generateTransactionId();

    // Create ledger entry (append-only)
    await client.query(`
      INSERT INTO ledger_entries
        (transaction_id, user_id, creator_id, transaction_type, amount, payment_provider_transaction_id, metadata, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      transactionId,
      req.user!.id,
      creator_id,
      'subscription',
      amount,
      paymentResult.transaction_id,
      JSON.stringify({ subscription_period: '30_days' }),
      'completed'
    ]);

    // Create subscription
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const subscription = await client.query(`
      INSERT INTO subscriptions (fan_id, creator_id, status, expires_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (fan_id, creator_id)
      DO UPDATE SET status = $3, started_at = CURRENT_TIMESTAMP, expires_at = $4
      RETURNING *
    `, [req.user!.id, creator_id, 'active', expiresAt]);

    await client.query('COMMIT');

    res.json({
      message: 'Subscription successful',
      subscription: subscription.rows[0],
      transaction_id: transactionId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Subscription failed' });
  } finally {
    client.release();
  }
});

// Unlock PPV post
router.post('/unlock-ppv', authenticate, async (req: AuthRequest, res) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const { post_id } = req.body;

    if (!post_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Post ID required' });
    }

    // Get post details
    const postResult = await client.query(
      'SELECT id, creator_id, access_type, ppv_price FROM posts WHERE id = $1 AND is_active = true',
      [post_id]
    );

    if (postResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = postResult.rows[0];

    if (post.access_type !== 'ppv') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Post is not PPV' });
    }

    // Check if already unlocked
    const existingUnlock = await client.query(
      'SELECT id FROM ppv_unlocks WHERE fan_id = $1 AND post_id = $2',
      [req.user!.id, post_id]
    );

    if (existingUnlock.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Already unlocked' });
    }

    const amount = post.ppv_price;

    // Process mock payment
    const paymentResult = await processMockPayment(amount, {
      fan_id: req.user!.id,
      creator_id: post.creator_id,
      post_id,
      type: 'ppv_unlock'
    });

    if (!paymentResult.success) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'Payment failed' });
    }

    const transactionId = generateTransactionId();

    // Create ledger entry (append-only)
    await client.query(`
      INSERT INTO ledger_entries
        (transaction_id, user_id, creator_id, transaction_type, amount, payment_provider_transaction_id, metadata, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      transactionId,
      req.user!.id,
      post.creator_id,
      'ppv_unlock',
      amount,
      paymentResult.transaction_id,
      JSON.stringify({ post_id }),
      'completed'
    ]);

    // Create unlock record
    const unlock = await client.query(`
      INSERT INTO ppv_unlocks (fan_id, post_id)
      VALUES ($1, $2)
      RETURNING *
    `, [req.user!.id, post_id]);

    await client.query('COMMIT');

    res.json({
      message: 'PPV unlocked successfully',
      unlock: unlock.rows[0],
      transaction_id: transactionId
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Unlock PPV error:', error);
    res.status(500).json({ error: 'Unlock failed' });
  } finally {
    client.release();
  }
});

// Get user's subscriptions
router.get('/subscriptions', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT
        s.*,
        u.username as creator_username,
        cp.display_name as creator_display_name,
        cp.avatar_url as creator_avatar
      FROM subscriptions s
      JOIN users u ON s.creator_id = u.id
      JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE s.fan_id = $1
      ORDER BY s.started_at DESC
    `, [req.user!.id]);

    res.json({ subscriptions: result.rows });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get user's transaction history
router.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT * FROM ledger_entries
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 100
    `, [req.user!.id]);

    res.json({ transactions: result.rows });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

export default router;
