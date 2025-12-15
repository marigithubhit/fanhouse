import express from 'express';
import { query } from '../db';
import { authenticate, AuthRequest, requireCreator } from '../middleware/auth';

const router = express.Router();

// Get all approved creators
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT
        u.id, u.username,
        cp.display_name, cp.bio, cp.avatar_url, cp.cover_url, cp.subscription_price
      FROM users u
      JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE cp.verification_status = 'approved' AND cp.is_active = true
      ORDER BY u.created_at DESC
    `);

    res.json({ creators: result.rows });
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({ error: 'Failed to fetch creators' });
  }
});

// Get creator profile
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        u.id, u.username,
        cp.display_name, cp.bio, cp.avatar_url, cp.cover_url,
        cp.subscription_price, cp.verification_status, cp.is_active
      FROM users u
      JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE u.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator not found' });
    }

    res.json({ creator: result.rows[0] });
  } catch (error) {
    console.error('Get creator error:', error);
    res.status(500).json({ error: 'Failed to fetch creator' });
  }
});

// Update creator profile
router.put('/profile', authenticate, requireCreator, async (req: AuthRequest, res) => {
  try {
    const { display_name, bio, subscription_price } = req.body;

    const result = await query(`
      UPDATE creator_profiles
      SET display_name = COALESCE($1, display_name),
          bio = COALESCE($2, bio),
          subscription_price = COALESCE($3, subscription_price),
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $4
      RETURNING *
    `, [display_name, bio, subscription_price, req.user!.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error('Update creator error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Submit verification (mock Persona)
router.post('/verify', authenticate, requireCreator, async (req: AuthRequest, res) => {
  try {
    // Mock Persona verification - in production, this would integrate with Persona API
    const inquiryId = `inquiry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await query(`
      UPDATE creator_profiles
      SET persona_inquiry_id = $1,
          verification_status = 'pending',
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2
    `, [inquiryId, req.user!.id]);

    res.json({
      message: 'Verification submitted',
      inquiry_id: inquiryId,
      status: 'pending'
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ error: 'Failed to submit verification' });
  }
});

// Get verification status
router.get('/verify/status', authenticate, requireCreator, async (req: AuthRequest, res) => {
  try {
    const result = await query(
      'SELECT verification_status, persona_inquiry_id FROM creator_profiles WHERE user_id = $1',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Creator profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

export default router;
