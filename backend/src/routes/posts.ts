import express from 'express';
import multer from 'multer';
import path from 'path';
import { query } from '../db';
import { authenticate, AuthRequest, requireCreator } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  }
});

// Create post
router.post('/', authenticate, requireCreator, upload.single('media'), async (req: AuthRequest, res) => {
  try {
    const { title, content, access_type, ppv_price } = req.body;

    // Verify creator is approved
    const creatorCheck = await query(
      'SELECT verification_status FROM creator_profiles WHERE user_id = $1',
      [req.user!.id]
    );

    if (creatorCheck.rows.length === 0 || creatorCheck.rows[0].verification_status !== 'approved') {
      return res.status(403).json({ error: 'Only approved creators can post' });
    }

    let media_url = null;
    let media_type = null;

    if (req.file) {
      media_url = `/uploads/${req.file.filename}`;
      media_type = req.file.mimetype.startsWith('video') ? 'video' : 'image';
    }

    const result = await query(`
      INSERT INTO posts (creator_id, title, content, media_url, media_type, access_type, ppv_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [req.user!.id, title, content, media_url, media_type, access_type, ppv_price || null]);

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get posts (with access control)
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { creator_id } = req.query;

    let queryText = `
      SELECT
        p.*,
        u.username as creator_username,
        cp.display_name as creator_display_name,
        cp.avatar_url as creator_avatar
      FROM posts p
      JOIN users u ON p.creator_id = u.id
      JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE p.is_active = true
    `;

    const params: any[] = [];

    if (creator_id) {
      params.push(creator_id);
      queryText += ` AND p.creator_id = $${params.length}`;
    }

    queryText += ' ORDER BY p.created_at DESC';

    const result = await query(queryText, params);

    // Filter posts based on access rights
    const posts = await Promise.all(result.rows.map(async (post) => {
      // Public posts - everyone can see
      if (post.access_type === 'public') {
        return post;
      }

      // Subscriber-only posts
      if (post.access_type === 'subscriber') {
        const subCheck = await query(
          'SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3',
          [req.user!.id, post.creator_id, 'active']
        );

        if (subCheck.rows.length > 0 || req.user!.id === post.creator_id) {
          return post;
        }

        // Hide content for non-subscribers
        return {
          ...post,
          content: null,
          media_url: null,
          locked: true,
          unlock_type: 'subscription'
        };
      }

      // PPV posts
      if (post.access_type === 'ppv') {
        const unlockCheck = await query(
          'SELECT id FROM ppv_unlocks WHERE fan_id = $1 AND post_id = $2',
          [req.user!.id, post.id]
        );

        if (unlockCheck.rows.length > 0 || req.user!.id === post.creator_id) {
          return post;
        }

        // Hide content for users who haven't unlocked
        return {
          ...post,
          content: null,
          media_url: null,
          locked: true,
          unlock_type: 'ppv',
          ppv_price: post.ppv_price
        };
      }

      return post;
    }));

    res.json({ posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get single post
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT
        p.*,
        u.username as creator_username,
        cp.display_name as creator_display_name
      FROM posts p
      JOIN users u ON p.creator_id = u.id
      JOIN creator_profiles cp ON u.id = cp.user_id
      WHERE p.id = $1 AND p.is_active = true
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const post = result.rows[0];

    // Check access rights
    if (post.access_type === 'subscriber') {
      const subCheck = await query(
        'SELECT id FROM subscriptions WHERE fan_id = $1 AND creator_id = $2 AND status = $3',
        [req.user!.id, post.creator_id, 'active']
      );

      if (subCheck.rows.length === 0 && req.user!.id !== post.creator_id) {
        return res.status(403).json({ error: 'Subscription required', unlock_type: 'subscription' });
      }
    }

    if (post.access_type === 'ppv') {
      const unlockCheck = await query(
        'SELECT id FROM ppv_unlocks WHERE fan_id = $1 AND post_id = $2',
        [req.user!.id, post.id]
      );

      if (unlockCheck.rows.length === 0 && req.user!.id !== post.creator_id) {
        return res.status(403).json({
          error: 'PPV unlock required',
          unlock_type: 'ppv',
          ppv_price: post.ppv_price
        });
      }
    }

    res.json({ post });
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Delete post
router.delete('/:id', authenticate, requireCreator, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'UPDATE posts SET is_active = false WHERE id = $1 AND creator_id = $2 RETURNING id',
      [id, req.user!.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
