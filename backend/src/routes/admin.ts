import express from 'express';
import { query } from '../db';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Get all users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT id, email, username, role, created_at
      FROM public.users
      ORDER BY created_at DESC
    `);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all creators with profiles
router.get('/creators', async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.email, u.username, u.created_at,
        cp.display_name, cp.verification_status, cp.is_active,
        cp.subscription_price, cp.persona_inquiry_id
      FROM users u
      JOIN creator_profiles cp ON u.id = cp.user_id
      ORDER BY u.created_at DESC
    `);

    res.json({ creators: result.rows });
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// Approve/reject creator
router.post('/creators/:id/verify', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const result = await query(`
      UPDATE creator_profiles
      SET verification_status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    // Create notification for creator
    await query(`
      INSERT INTO notifications (user_id, notification_type, title, message)
      VALUES ($1, $2, $3, $4)
    `, [
      id,
      'verification_update',
      `Verification ${status}`,
      `Your creator account has been ${status}.`
    ]);

    res.json({
      message: `Creator ${status}`,
      creator: result.rows[0]
    });
  } catch (error) {
    console.error('Verify creator error:', error);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

// Disable/enable creator
router.post('/creators/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await query(`
      UPDATE creator_profiles
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
      RETURNING *
    `, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json({
      message: `Creator ${is_active ? 'enabled' : 'disabled'}`,
      creator: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle creator error:', error);
    res.status(500).json({ error: 'Failed to toggle creator status' });
  }
});

// Get all posts
router.get('/posts', async (req: AuthRequest, res) => {
  try {
    const result = await query(`
      SELECT
        p.*,
        u.username as creator_username,
        cp.display_name as creator_display_name
      FROM posts p
      JOIN users u ON p.creator_id = u.id
      JOIN creator_profiles cp ON u.id = cp.user_id
      ORDER BY p.created_at DESC
    `);

    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Disable/enable post
router.post('/posts/:id/toggle', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const result = await query(`
      UPDATE posts
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      message: `Post ${is_active ? 'enabled' : 'disabled'}`,
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle post error:', error);
    res.status(500).json({ error: 'Failed to toggle post status' });
  }
});

// Get all transactions
router.get('/transactions', async (req: AuthRequest, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const result = await query(`
      SELECT
        le.*,
        u.username as user_username,
        c.username as creator_username
      FROM ledger_entries le
      LEFT JOIN users u ON le.user_id = u.id
      LEFT JOIN users c ON le.creator_id = c.id
      ORDER BY le.created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await query('SELECT COUNT(*) FROM ledger_entries');

    res.json({
      transactions: result.rows,
      total: parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get platform statistics
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const stats = await Promise.all([
      query('SELECT COUNT(*) FROM users WHERE role = $1', ['fan']),
      query('SELECT COUNT(*) FROM users WHERE role = $1', ['creator']),
      query('SELECT COUNT(*) FROM creator_profiles WHERE verification_status = $1', ['approved']),
      query('SELECT COUNT(*) FROM posts WHERE is_active = true'),
      query('SELECT COUNT(*) FROM subscriptions WHERE status = $1', ['active']),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE status = $1', ['completed']),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE transaction_type = $1 AND status = $2', ['subscription', 'completed']),
      query('SELECT COALESCE(SUM(amount), 0) as total FROM ledger_entries WHERE transaction_type = $1 AND status = $2', ['ppv_unlock', 'completed']),
    ]);

    res.json({
      total_fans: parseInt(stats[0].rows[0].count),
      total_creators: parseInt(stats[1].rows[0].count),
      approved_creators: parseInt(stats[2].rows[0].count),
      total_posts: parseInt(stats[3].rows[0].count),
      active_subscriptions: parseInt(stats[4].rows[0].count),
      total_revenue: parseFloat(stats[5].rows[0].total),
      subscription_revenue: parseFloat(stats[6].rows[0].total),
      ppv_revenue: parseFloat(stats[7].rows[0].total),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
